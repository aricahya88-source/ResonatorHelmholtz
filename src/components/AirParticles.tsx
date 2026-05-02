import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { InstancedMesh, Matrix4, Object3D, Vector3 } from 'three';
import type { HelmholtzResult } from '../types';
import { clamp, getBottleVisualGeometry } from '../physics/visualGeometry';

interface AirParticlesProps {
  result: HelmholtzResult;
  waterFillPercent: number;
  isBlowing: boolean;
}

type Particle = {
  base: Vector3;
  phase: number;
  amplitude: number;
  radialBias: number;
  axialBias: number;
  driftPhaseX: number;
  driftPhaseY: number;
  driftPhaseZ: number;
  driftSpeed: number;
  driftRadius: number;
};

function randomRange(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function sampleDisk(radius: number) {
  const theta = Math.random() * Math.PI * 2;
  const r = Math.sqrt(Math.random()) * radius;
  return {
    x: Math.cos(theta) * r,
    z: Math.sin(theta) * r,
    radialBias: radius > 0 ? r / radius : 0,
  };
}

function createParticle(base: Vector3, phase: number, amplitude: number, radialBias: number, axialBias: number): Particle {
  return {
    base,
    phase,
    amplitude,
    radialBias,
    axialBias,
    driftPhaseX: randomRange(0, Math.PI * 2),
    driftPhaseY: randomRange(0, Math.PI * 2),
    driftPhaseZ: randomRange(0, Math.PI * 2),
    driftSpeed: randomRange(0.55, 1.35),
    driftRadius: randomRange(0.018, 0.06),
  };
}

function freeDrift(particle: Particle, t: number, strength = 1) {
  const speed = particle.driftSpeed;
  return {
    x: Math.sin(t * speed + particle.driftPhaseX) * particle.driftRadius * strength,
    y: Math.sin(t * speed * 0.83 + particle.driftPhaseY) * particle.driftRadius * 0.72 * strength,
    z: Math.cos(t * speed * 1.07 + particle.driftPhaseZ) * particle.driftRadius * strength,
  };
}

function radiusAtShoulderY(y: number, shoulderBottomY: number, shoulderTopY: number, bottomRadius: number, topRadius: number) {
  const t = clamp((y - shoulderBottomY) / Math.max(shoulderTopY - shoulderBottomY, 0.001), 0, 1);
  return bottomRadius + (topRadius - bottomRadius) * t;
}

function updateMesh(
  mesh: InstancedMesh | null,
  particles: Particle[],
  dummy: Object3D,
  matrix: Matrix4,
  callback: (particle: Particle, index: number) => void,
) {
  if (!mesh) return;
  particles.forEach((particle, index) => {
    callback(particle, index);
    dummy.updateMatrix();
    matrix.copy(dummy.matrix);
    mesh.setMatrixAt(index, matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
}

export function AirParticles({ result, waterFillPercent, isBlowing }: AirParticlesProps) {
  const cavityRef = useRef<InstancedMesh>(null);
  const shoulderRef = useRef<InstancedMesh>(null);
  const neckRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const matrix = useMemo(() => new Matrix4(), []);
  const geom = useMemo(
    () => getBottleVisualGeometry(result, waterFillPercent),
    [result.neckRadiusM, result.geometricNeckLengthM, result.airVolumeM3, waterFillPercent],
  );

  const { cavityParticles, shoulderParticles, neckParticles } = useMemo(() => {
    const cavity: Particle[] = [];
    const shoulder: Particle[] = [];
    const neck: Particle[] = [];

    // Volume udara dibuat kontinu: rongga badan, bahu/transisi, dan leher.
    // Saat belum ditiup, partikel tetap bergerak bebas kecil seperti udara normal.
    // Saat ditiup, gerak massa-pegas ditambahkan di atas gerak bebas tersebut.
    const bodyInnerRadius = geom.bodyRadius * 0.74;
    const shoulderInnerBottomRadius = geom.bodyRadius * 0.66;
    const shoulderInnerTopRadius = Math.max(geom.visualNeckRadius * 0.58, 0.07);
    const neckInnerRadius = Math.max(geom.visualNeckRadius * 0.48, 0.055);

    const bodyAirBottomY = clamp(geom.waterTopY + 0.07, geom.bodyBottomY + 0.08, geom.bodyTopY - 0.08);
    const bodyAirTopY = geom.bodyTopY - 0.035;
    const bodyAirHeight = Math.max(bodyAirTopY - bodyAirBottomY, 0.02);

    const shoulderBottomY = geom.bodyTopY - 0.035;
    const shoulderTopY = geom.neckBottomY + 0.035;
    const shoulderHeight = Math.max(shoulderTopY - shoulderBottomY, 0.08);

    const neckBottomY = geom.neckBottomY + 0.02;
    const neckTopY = geom.neckTopY - 0.04;
    const neckHeight = Math.max(neckTopY - neckBottomY, 0.08);

    const bodyVolumeVisual = Math.PI * bodyInnerRadius ** 2 * bodyAirHeight;
    const shoulderVolumeVisual = Math.PI * ((shoulderInnerBottomRadius + shoulderInnerTopRadius) / 2) ** 2 * shoulderHeight;
    const neckVolumeVisual = Math.PI * neckInnerRadius ** 2 * neckHeight;

    const cavityCount = Math.round(clamp(bodyVolumeVisual * 100, 110, 270));
    const shoulderCount = Math.round(clamp(shoulderVolumeVisual * 145 + 56, 64, 120));
    const neckCount = Math.round(clamp(neckVolumeVisual * 230 + geom.neckHeight * 50 + 54, 66, 150));

    for (let i = 0; i < cavityCount; i += 1) {
      const disk = sampleDisk(bodyInnerRadius);
      const axialBias = Math.random();
      cavity.push(createParticle(
        new Vector3(disk.x, bodyAirBottomY + axialBias * bodyAirHeight, disk.z),
        randomRange(0, Math.PI * 2),
        randomRange(0.012, 0.032),
        disk.radialBias,
        axialBias,
      ));
    }

    for (let i = 0; i < shoulderCount; i += 1) {
      const axialBias = Math.random();
      const y = shoulderBottomY + axialBias * shoulderHeight;
      const radius = radiusAtShoulderY(y, shoulderBottomY, shoulderTopY, shoulderInnerBottomRadius, shoulderInnerTopRadius);
      const disk = sampleDisk(radius);
      shoulder.push(createParticle(
        new Vector3(disk.x, y, disk.z),
        randomRange(0, Math.PI * 2),
        randomRange(0.018, 0.048),
        disk.radialBias,
        axialBias,
      ));
    }

    for (let i = 0; i < neckCount; i += 1) {
      const axialBias = Math.random();
      const disk = sampleDisk(neckInnerRadius);
      neck.push(createParticle(
        new Vector3(disk.x, neckBottomY + axialBias * neckHeight, disk.z),
        randomRange(-0.08, 0.08),
        randomRange(0.16, 0.32),
        disk.radialBias,
        axialBias,
      ));
    }

    return { cavityParticles: cavity, shoulderParticles: shoulder, neckParticles: neck };
  }, [geom, result.airVolumeM3]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const visualRate = Math.min(Math.max(result.frequencyHz / 55, 1.35), 9.2);
    const omegaT = t * visualRate * Math.PI * 2;
    const activeScale = isBlowing ? 1 : 0;
    const idleMotionScale = isBlowing ? 0.55 : 1.0;
    const pressureStrength = clamp(result.estimatedPeakPressurePa / 120, 0.15, 1.2);
    const lengthStrength = clamp(geom.neckHeight / 1.15, 0.6, 1.35);

    // Model massa–pegas sederhana:
    // udara pada leher = massa bergerak bolak-balik,
    // udara pada rongga = pegas yang mengalami kompresi-ekspansi.
    // Gerak bebas tetap ada walau belum ditiup agar udara tidak tampak membeku.
    const neckMassDisplacement = Math.sin(omegaT);
    const cavityCompression = 1 - neckMassDisplacement * 0.09 * activeScale * pressureStrength;
    const cavityVerticalCompression = 1 + neckMassDisplacement * 0.026 * activeScale * pressureStrength;
    const slugTravel = neckMassDisplacement * activeScale * lengthStrength;

    updateMesh(cavityRef.current, cavityParticles, dummy, matrix, (particle, index) => {
      const yFromCenter = particle.base.y - geom.airCenterY;
      const drift = freeDrift(particle, t, idleMotionScale);
      const localFlutter = Math.sin(omegaT + particle.phase) * particle.amplitude * activeScale * pressureStrength;
      const tinySwirl = Math.cos(omegaT * 0.65 + index) * 0.012 * activeScale * (1 - particle.radialBias * 0.35);

      dummy.position.set(
        particle.base.x * cavityCompression + drift.x + tinySwirl,
        geom.airCenterY + yFromCenter * cavityVerticalCompression + drift.y + localFlutter,
        particle.base.z * cavityCompression + drift.z - tinySwirl * 0.7,
      );
      dummy.scale.setScalar(0.033 + Math.abs(neckMassDisplacement) * 0.008 * activeScale * pressureStrength);
    });

    updateMesh(shoulderRef.current, shoulderParticles, dummy, matrix, (particle, index) => {
      const transitionToNeck = particle.axialBias;
      const drift = freeDrift(particle, t, idleMotionScale * 0.75);
      const transitionCompression = 1 - neckMassDisplacement * (0.05 + transitionToNeck * 0.06) * activeScale * pressureStrength;
      const yTravel = slugTravel * (0.045 + transitionToNeck * 0.11);
      const localFlutter = Math.sin(omegaT + particle.phase + index * 0.03) * particle.amplitude * 0.65 * activeScale;

      dummy.position.set(
        particle.base.x * transitionCompression + drift.x,
        particle.base.y + drift.y + yTravel + localFlutter,
        particle.base.z * transitionCompression + drift.z,
      );
      dummy.scale.setScalar(0.037 + transitionToNeck * 0.011 + Math.abs(neckMassDisplacement) * 0.008 * activeScale);
    });

    updateMesh(neckRef.current, neckParticles, dummy, matrix, (particle, index) => {
      const drift = freeDrift(particle, t, idleMotionScale * 0.38);
      const displacement = slugTravel * particle.amplitude;
      const smallTurbulence = Math.sin(omegaT * 2 + index) * 0.009 * activeScale * (1 - particle.radialBias);

      dummy.position.set(
        particle.base.x + drift.x + smallTurbulence,
        particle.base.y + drift.y + displacement,
        particle.base.z + drift.z - smallTurbulence * 0.55,
      );
      dummy.scale.setScalar(0.047 + Math.abs(neckMassDisplacement) * 0.016 * activeScale * lengthStrength);
    });
  });

  return (
    <group renderOrder={12}>
      <instancedMesh
        key={`cavity-${cavityParticles.length}-${Math.round(geom.bodyHeight * 100)}`}
        ref={cavityRef}
        args={[undefined, undefined, cavityParticles.length]}
        renderOrder={12}
      >
        <sphereGeometry args={[1, 14, 14]} />
        <meshBasicMaterial color="#e8fbff" transparent opacity={0.62} depthTest={false} depthWrite={false} />
      </instancedMesh>

      <instancedMesh
        key={`shoulder-${shoulderParticles.length}-${Math.round(geom.shoulderHeight * 100)}`}
        ref={shoulderRef}
        args={[undefined, undefined, shoulderParticles.length]}
        renderOrder={13}
      >
        <sphereGeometry args={[1, 14, 14]} />
        <meshBasicMaterial color="#dff7ff" transparent opacity={0.72} depthTest={false} depthWrite={false} />
      </instancedMesh>

      <instancedMesh
        key={`neck-${neckParticles.length}-${Math.round(geom.neckHeight * 100)}`}
        ref={neckRef}
        args={[undefined, undefined, neckParticles.length]}
        renderOrder={14}
      >
        <sphereGeometry args={[1, 14, 14]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.86} depthTest={false} depthWrite={false} />
      </instancedMesh>
    </group>
  );
}
