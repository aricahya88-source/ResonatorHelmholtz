import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import type { Mesh } from 'three';
import type { HelmholtzResult } from '../types';
import { BOTTLE_GROUP_Y, clamp, getBottleVisualGeometry } from '../physics/visualGeometry';

interface BottleModelProps {
  result: HelmholtzResult;
  waterFillPercent: number;
  isBlowing: boolean;
}

export function BottleModel({ result, waterFillPercent, isBlowing }: BottleModelProps) {
  const waterSurfaceRef = useRef<Mesh>(null);
  const airVolumeRef = useRef<Mesh>(null);
  const pressureCoreRef = useRef<Mesh>(null);

  const geom = getBottleVisualGeometry(result, waterFillPercent);
  const {
    bodyRadius,
    bodyHeight,
    shoulderHeight,
    neckHeight,
    bodyBottomLocal,
    bodyTopLocal,
    visualNeckRadius,
    waterHeight,
    waterYLocal,
    waterTopLocal,
    airHeight,
    airCenterLocal,
  } = geom;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const visualRate = Math.min(Math.max(result.frequencyHz / 55, 1.35), 9.2);
    const pulse = Math.sin(t * visualRate * Math.PI * 2);
    const pressureStrength = clamp(result.estimatedPeakPressurePa / 120, 0.15, 1.15);

    if (waterSurfaceRef.current) {
      const wave = isBlowing ? 1 + pulse * 0.018 * pressureStrength : 1;
      waterSurfaceRef.current.scale.set(wave, 1, wave);
    }

    if (airVolumeRef.current) {
      const compression = isBlowing ? 1 + pulse * (0.018 + pressureStrength * 0.022) : 1;
      airVolumeRef.current.scale.set(compression, 1 - pulse * 0.012 * pressureStrength, compression);
    }

    if (pressureCoreRef.current) {
      const pressureScale = isBlowing ? 1 + pulse * 0.08 * pressureStrength : 0.92;
      pressureCoreRef.current.scale.set(pressureScale, 1 + Math.abs(pulse) * 0.08 * pressureStrength, pressureScale);
    }
  });

  return (
    <group position={[0, BOTTLE_GROUP_Y, 0]}>
      <mesh position={[0, 0, 0]} castShadow>
        <cylinderGeometry args={[bodyRadius, bodyRadius, bodyHeight, 96, 1, true]} />
        <meshPhysicalMaterial
          color="#a7d8ff"
          transparent
          opacity={0.18}
          roughness={0.04}
          metalness={0.02}
          transmission={0.55}
          thickness={0.5}
          side={2}
        />
      </mesh>

      <mesh position={[0, bodyHeight / 2 + shoulderHeight / 2 - 0.03, 0]} castShadow>
        <cylinderGeometry args={[visualNeckRadius * 1.2, bodyRadius, shoulderHeight, 96, 1, true]} />
        <meshPhysicalMaterial color="#a7d8ff" transparent opacity={0.17} roughness={0.05} transmission={0.45} side={2} />
      </mesh>

      <mesh position={[0, bodyHeight / 2 + shoulderHeight + neckHeight / 2 - 0.04, 0]} castShadow>
        <cylinderGeometry args={[visualNeckRadius, visualNeckRadius, neckHeight, 72, 1, true]} />
        <meshPhysicalMaterial color="#a7d8ff" transparent opacity={0.25} roughness={0.08} transmission={0.4} side={2} />
      </mesh>

      <mesh position={[0, bodyHeight / 2 + shoulderHeight + neckHeight - 0.04, 0]}>
        <torusGeometry args={[visualNeckRadius, 0.037, 16, 72]} />
        <meshStandardMaterial color="#d8f1ff" transparent opacity={0.78} />
      </mesh>

      <mesh position={[0, bodyBottomLocal - 0.04, 0]} receiveShadow>
        <cylinderGeometry args={[bodyRadius * 0.98, bodyRadius * 0.98, 0.08, 96]} />
        <meshStandardMaterial color="#d8f1ff" transparent opacity={0.36} roughness={0.2} />
      </mesh>

      <mesh position={[0, bodyBottomLocal - 0.08, 0]}>
        <torusGeometry args={[bodyRadius * 0.98, 0.025, 12, 96]} />
        <meshStandardMaterial color="#d9f6ff" transparent opacity={0.48} />
      </mesh>

      <mesh position={[0, bodyTopLocal + 0.02, 0]}>
        <torusGeometry args={[bodyRadius * 0.72, 0.012, 8, 96]} />
        <meshBasicMaterial color="#d8f1ff" transparent opacity={0.24} />
      </mesh>

      {airHeight > 0.05 && (
        <group>
          <mesh ref={airVolumeRef} position={[0, airCenterLocal, 0]}>
            <cylinderGeometry args={[bodyRadius * 0.86, bodyRadius * 0.86, airHeight, 72, 1, true]} />
            <meshBasicMaterial color="#f8fbff" transparent opacity={isBlowing ? 0.112 : 0.066} side={2} />
          </mesh>
          <mesh ref={pressureCoreRef} position={[0, airCenterLocal, 0]} renderOrder={11}>
            <cylinderGeometry args={[bodyRadius * 0.38, bodyRadius * 0.38, airHeight * 0.88, 72, 1, true]} />
            <meshBasicMaterial
              color="#fef08a"
              transparent
              opacity={isBlowing ? 0.22 : 0.06}
              depthTest={false}
              depthWrite={false}
              side={2}
            />
          </mesh>
        </group>
      )}

      {waterHeight > 0.02 && (
        <group>
          <mesh position={[0, waterYLocal, 0]} receiveShadow>
            <cylinderGeometry args={[bodyRadius * 0.91, bodyRadius * 0.91, waterHeight, 96]} />
            <meshPhysicalMaterial color="#2f9bff" transparent opacity={0.44} roughness={0.2} transmission={0.2} />
          </mesh>
          <mesh ref={waterSurfaceRef} position={[0, waterTopLocal + 0.012, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[bodyRadius * 0.91, 96]} />
            <meshPhysicalMaterial color="#8fd4ff" transparent opacity={0.64} roughness={0.08} transmission={0.12} />
          </mesh>
        </group>
      )}

      <mesh position={[0, waterTopLocal, 0]}>
        <torusGeometry args={[bodyRadius * 0.92, 0.01, 8, 96]} />
        <meshBasicMaterial color="#bdeaff" transparent opacity={waterHeight > 0.02 ? 0.62 : 0} />
      </mesh>
    </group>
  );
}
