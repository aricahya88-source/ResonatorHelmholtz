import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { BufferGeometry, Line, LineBasicMaterial, Mesh, Vector3 } from 'three';
import type { HelmholtzResult } from '../types';
import { clamp, getBottleVisualGeometry } from '../physics/visualGeometry';

interface MassSpringVibrationProps {
  result: HelmholtzResult;
  waterFillPercent: number;
  isBlowing: boolean;
}

function makeHelixGeometry(turns = 6.5, radius = 0.24, height = 1.36) {
  const points: Vector3[] = [];
  const count = 220;

  for (let i = 0; i < count; i += 1) {
    const progress = i / (count - 1);
    const angle = progress * Math.PI * 2 * turns;
    points.push(new Vector3(Math.cos(angle) * radius, -height / 2 + progress * height, Math.sin(angle) * radius));
  }

  return new BufferGeometry().setFromPoints(points);
}

export function MassSpringVibration({ result, waterFillPercent, isBlowing }: MassSpringVibrationProps) {
  const slugRef = useRef<Mesh>(null);
  const referenceRef = useRef<Mesh>(null);
  const geometry = useMemo(() => makeHelixGeometry(), []);
  const springMaterial = useMemo(
    () =>
      new LineBasicMaterial({
        color: '#fef08a',
        transparent: true,
        opacity: 0.34,
        depthTest: false,
        depthWrite: false,
      }),
    [],
  );
  const springLine = useMemo(() => {
    const line = new Line(geometry, springMaterial);
    line.renderOrder = 14;
    return line;
  }, [geometry, springMaterial]);
  const geom = useMemo(
    () => getBottleVisualGeometry(result, waterFillPercent),
    [result.neckRadiusM, result.geometricNeckLengthM, result.airVolumeM3, waterFillPercent],
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const visualRate = Math.min(Math.max(result.frequencyHz / 55, 1.35), 9.2);
    const activeScale = isBlowing ? 1 : 0.16;
    const x = Math.sin(t * visualRate * Math.PI * 2) * activeScale;
    const airVolumeMl = result.airVolumeM3 * 1_000_000;
    const volumeScale = clamp(Math.cbrt(airVolumeMl / 400), 0.62, 1.45);
    const pressureStrength = clamp(result.estimatedPeakPressurePa / 120, 0.15, 1.15);
    const slugBaseY = geom.neckCenterY;
    const visualAmplitude = clamp(0.11 + geom.neckHeight * 0.085, 0.13, 0.28) * pressureStrength;

    if (slugRef.current) {
      slugRef.current.position.y = slugBaseY + x * visualAmplitude;
      slugRef.current.scale.set(1 + Math.abs(x) * 0.16 * pressureStrength, 1, 1 + Math.abs(x) * 0.16 * pressureStrength);
    }

    springLine.position.y = geom.airCenterY;
    springLine.scale.set(
      0.74 + volumeScale * 0.11 - x * 0.08 * pressureStrength,
      clamp(geom.airHeight / 1.36, 0.28, 1.45) * (1 + x * 0.18 * pressureStrength),
      0.74 + volumeScale * 0.11 - x * 0.08 * pressureStrength,
    );
    springMaterial.opacity = isBlowing ? 0.86 : 0.34;

    if (referenceRef.current) {
      referenceRef.current.position.y = slugBaseY;
      referenceRef.current.scale.set(1, isBlowing ? 1 + Math.abs(x) * 0.52 : 0.34, 1);
    }
  });

  return (
    <group visible renderOrder={14}>
      <mesh ref={slugRef} position={[0, geom.neckCenterY, 0]} renderOrder={14}>
        <cylinderGeometry args={[Math.max(geom.visualNeckRadius * 0.74, 0.11), Math.max(geom.visualNeckRadius * 0.74, 0.11), 0.13, 56]} />
        <meshBasicMaterial
          color="#fbbf24"
          transparent
          opacity={isBlowing ? 0.82 : 0.42}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      <primitive object={springLine} />

      <mesh ref={referenceRef} position={[0, geom.neckCenterY, 0]} renderOrder={14}>
        <cylinderGeometry args={[0.032, 0.032, Math.max(geom.neckHeight * 0.64, 0.32), 20]} />
        <meshBasicMaterial
          color="#fef3c7"
          transparent
          opacity={isBlowing ? 0.66 : 0.2}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
