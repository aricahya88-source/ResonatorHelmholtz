import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import type { Mesh } from 'three';
import type { HelmholtzResult } from '../types';
import { clamp, getBottleVisualGeometry } from '../physics/visualGeometry';

interface PressureFieldProps {
  result: HelmholtzResult;
  waterFillPercent: number;
  isBlowing: boolean;
}

export function PressureField({ result, waterFillPercent, isBlowing }: PressureFieldProps) {
  const ringA = useRef<Mesh>(null);
  const ringB = useRef<Mesh>(null);
  const ringC = useRef<Mesh>(null);
  const throat = useRef<Mesh>(null);
  const core = useRef<Mesh>(null);
  const geom = useMemo(
    () => getBottleVisualGeometry(result, waterFillPercent),
    [result.neckRadiusM, result.geometricNeckLengthM, result.airVolumeM3, waterFillPercent],
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const rate = Math.min(Math.max(result.frequencyHz / 65, 1), 7);
    const pulse = isBlowing ? Math.sin(t * rate * Math.PI * 2) : 0;
    const pressureStrength = clamp(result.estimatedPeakPressurePa / 120, 0.15, 1.25);
    const volumeScale = clamp(Math.cbrt((result.airVolumeM3 * 1_000_000) / 400), 0.62, 1.45);
    const rings = [ringA.current, ringB.current, ringC.current];

    rings.forEach((mesh, index) => {
      if (!mesh) return;
      const scale = volumeScale * (1 + pulse * (0.07 + index * 0.024) * pressureStrength);
      mesh.scale.set(scale, scale, scale);
    });

    if (throat.current) {
      const yScale = isBlowing ? 1 + Math.abs(pulse) * 0.42 * pressureStrength : 0.12;
      throat.current.scale.set(1, yScale, 1);
    }

    if (core.current) {
      const scale = volumeScale * (1 + pulse * 0.12 * pressureStrength);
      core.current.scale.set(scale, 1 + Math.abs(pulse) * 0.18 * pressureStrength, scale);
    }
  });

  const r1 = geom.bodyRadius * 0.54;
  const r2 = geom.bodyRadius * 0.68;
  const r3 = geom.bodyRadius * 0.78;
  const y1 = geom.airBottomY + geom.airHeight * 0.18;
  const y2 = geom.airBottomY + geom.airHeight * 0.48;
  const y3 = geom.airBottomY + geom.airHeight * 0.78;

  return (
    <group visible={isBlowing} renderOrder={10}>
      <mesh ref={core} position={[0, geom.airCenterY, 0]} renderOrder={10}>
        <sphereGeometry args={[Math.max(geom.bodyRadius * 0.34, 0.24), 48, 32]} />
        <meshBasicMaterial color="#fef08a" transparent opacity={0.16} depthTest={false} depthWrite={false} />
      </mesh>
      <mesh ref={ringA} rotation={[Math.PI / 2, 0, 0]} position={[0, y1, 0]}>
        <torusGeometry args={[r1, 0.008, 8, 72]} />
        <meshBasicMaterial color="#fef08a" transparent opacity={0.42} depthTest={false} depthWrite={false} />
      </mesh>
      <mesh ref={ringB} rotation={[Math.PI / 2, 0, 0]} position={[0, y2, 0]}>
        <torusGeometry args={[r2, 0.009, 8, 72]} />
        <meshBasicMaterial color="#67e8f9" transparent opacity={0.38} depthTest={false} depthWrite={false} />
      </mesh>
      <mesh ref={ringC} rotation={[Math.PI / 2, 0, 0]} position={[0, y3, 0]}>
        <torusGeometry args={[r3, 0.01, 8, 72]} />
        <meshBasicMaterial color="#c4b5fd" transparent opacity={0.34} depthTest={false} depthWrite={false} />
      </mesh>
      <mesh ref={throat} position={[0, geom.neckCenterY, 0]}>
        <cylinderGeometry args={[Math.max(geom.visualNeckRadius * 0.32, 0.055), Math.max(geom.visualNeckRadius * 0.32, 0.055), Math.max(geom.neckHeight * 0.82, 0.34), 32]} />
        <meshBasicMaterial color="#fef9c3" transparent opacity={0.42} depthTest={false} depthWrite={false} />
      </mesh>
    </group>
  );
}
