import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import { GridHelper, Group, Material } from 'three';
import { OrbitControls as ThreeOrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import type { HelmholtzResult } from '../types';
import { AirParticles } from './AirParticles';
import { BlowJet } from './BlowJet';
import { BottleModel } from './BottleModel';
import { MassSpringVibration } from './MassSpringVibration';
import { PressureField } from './PressureField';

interface SimulationCanvasProps {
  result: HelmholtzResult;
  waterFillPercent: number;
  isBlowing: boolean;
  activeCaption?: string;
  idleCaption?: string;
}

function CameraControls() {
  const { camera, gl } = useThree();
  const controls = useMemo(() => new ThreeOrbitControls(camera, gl.domElement), [camera, gl.domElement]);

  useEffect(() => {
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.enablePan = true;
    controls.minDistance = 2.5;
    controls.maxDistance = 8;
    controls.target.set(0, 0.45, 0);
    controls.update();

    return () => controls.dispose();
  }, [controls]);

  useFrame(() => controls.update());

  return null;
}

function Floor() {
  const grid = useMemo(() => {
    const helper = new GridHelper(8, 32, '#38bdf8', '#1e3a5f');
    const material = helper.material as Material;
    material.transparent = true;
    material.opacity = 0.34;
    return helper;
  }, []);

  return (
    <group position={[0, -1.58, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[3.15, 96]} />
        <meshStandardMaterial color="#0b1b30" roughness={0.72} metalness={0.08} transparent opacity={0.92} />
      </mesh>
      <primitive object={grid} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]}>
        <ringGeometry args={[0.74, 0.78, 96]} />
        <meshBasicMaterial color="#7dd3fc" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function Scene({ result, waterFillPercent, isBlowing }: SimulationCanvasProps) {
  const groupRef = useRef<Group>(null);

  useFrame(({ clock }) => {
    if (!groupRef.current || isBlowing) return;
    groupRef.current.rotation.y = -0.18 + Math.sin(clock.getElapsedTime() * 0.16) * 0.035;
  });

  return (
    <>
      <ambientLight intensity={0.9} />
      <directionalLight position={[3.5, 5.5, 4.5]} intensity={2.1} castShadow />
      <pointLight position={[-3, 2.5, 3.4]} intensity={0.75} />
      <spotLight position={[0, 4.5, 5]} angle={0.36} penumbra={0.7} intensity={1.2} castShadow />
      <group ref={groupRef}>
        <BottleModel result={result} waterFillPercent={waterFillPercent} isBlowing={isBlowing} />
        <AirParticles result={result} waterFillPercent={waterFillPercent} isBlowing={isBlowing} />
        <MassSpringVibration result={result} waterFillPercent={waterFillPercent} isBlowing={isBlowing} />
        <PressureField result={result} waterFillPercent={waterFillPercent} isBlowing={isBlowing} />
        <BlowJet result={result} waterFillPercent={waterFillPercent} isBlowing={isBlowing} />
      </group>
      <Floor />
      <CameraControls />
    </>
  );
}

export function SimulationCanvas(props: SimulationCanvasProps) {
  return (
    <section className="canvas-card">
      <Canvas camera={{ position: [0.4, 1.15, 5.3], fov: 42 }} dpr={[1, 2]} shadows>
        <color attach="background" args={["#07111f"]} />
        <Scene {...props} />
      </Canvas>
      <div className="canvas-caption">
        <span className={props.isBlowing ? 'live-dot active' : 'live-dot'} />
        <span>
          {props.isBlowing
            ? props.activeCaption ?? 'Massa udara di leher berosilasi; udara rongga mengembang dan terkompresi sebagai pegas.'
            : props.idleCaption ?? 'Drag untuk memutar, scroll/pinch untuk zoom, lalu tekan “Tiup Botol”.'}
        </span>
      </div>
      <div className="visual-legend">
        <span><i className="legend-dot water" />Air</span>
        <span><i className="legend-dot air" />Partikel udara</span>
        <span><i className="legend-dot mass" />Massa leher</span>
        <span><i className="legend-dot pressure" />Pegas/tekanan</span>
      </div>
    </section>
  );
}
