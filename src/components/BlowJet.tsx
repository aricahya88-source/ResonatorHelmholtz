import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import { InstancedMesh, Matrix4, Object3D, Vector3 } from 'three';
import type { HelmholtzResult } from '../types';
import { clamp, getBottleVisualGeometry } from '../physics/visualGeometry';

interface BlowJetProps {
  result: HelmholtzResult;
  waterFillPercent: number;
  isBlowing: boolean;
}

type JetParticle = {
  base: Vector3;
  phase: number;
  speed: number;
};

export function BlowJet({ result, waterFillPercent, isBlowing }: BlowJetProps) {
  const meshRef = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  const matrix = useMemo(() => new Matrix4(), []);
  const geom = useMemo(
    () => getBottleVisualGeometry(result, waterFillPercent),
    [result.neckRadiusM, result.geometricNeckLengthM, result.airVolumeM3, waterFillPercent],
  );
  const mouthY = geom.neckTopY + 0.08;

  const particles = useMemo<JetParticle[]>(() => {
    return Array.from({ length: 64 }, (_, index) => ({
      base: new Vector3(-2.15 - Math.random() * 0.7, (Math.random() - 0.5) * 0.26, (Math.random() - 0.5) * 0.26),
      phase: index / 64,
      speed: 0.45 + Math.random() * 0.65,
    }));
  }, []);

  useFrame(({ clock }) => {
    const mesh = meshRef.current;
    if (!mesh) return;

    const t = clock.getElapsedTime();
    const visualRate = Math.min(Math.max(result.frequencyHz / 80, 0.8), 5.5);
    const radiusInfluence = clamp(result.neckRadiusM / 0.012, 0.55, 1.7);

    particles.forEach((particle, index) => {
      const travel = ((t * particle.speed * visualRate + particle.phase) % 1) * 2.25;
      const flutter = Math.sin(t * visualRate * 5 + index) * 0.04 * radiusInfluence;
      dummy.position.set(
        particle.base.x + travel,
        mouthY + particle.base.y + flutter,
        particle.base.z + Math.cos(t * 4 + index) * 0.025 * radiusInfluence,
      );
      dummy.scale.setScalar(isBlowing ? 0.045 * radiusInfluence : 0.0001);
      dummy.updateMatrix();
      matrix.copy(dummy.matrix);
      mesh.setMatrixAt(index, matrix);
    });

    mesh.instanceMatrix.needsUpdate = true;
  });

  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, particles.length]} renderOrder={15}>
      <sphereGeometry args={[1, 10, 10]} />
      <meshBasicMaterial color="#b7f2ff" transparent opacity={isBlowing ? 0.76 : 0} depthTest={false} depthWrite={false} />
    </instancedMesh>
  );
}
