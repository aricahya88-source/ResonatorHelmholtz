import { useMemo, useState } from 'react';
import { BookOpen, FlaskConical, Music2, Orbit } from 'lucide-react';
import { playBottleBlow } from './audio/resonatorAudio';
import { ApplicationScalePanel } from './components/ApplicationScalePanel';
import { ControlPanel } from './components/ControlPanel';
import { MaterialPanel } from './components/MaterialPanel';
import { MicrophonePracticePanel } from './components/MicrophonePracticePanel';
import { ResultPanel } from './components/ResultPanel';
import { SimulationCanvas } from './components/SimulationCanvas';
import { calculateHelmholtz } from './physics/helmholtz';
import type { SimulationParams } from './types';
import './styles.css';

const BLOW_DURATION_SECONDS = 5;

type AppSection = 'material' | 'practice' | 'simulation' | 'application';

const initialParams: SimulationParams = {
  neckRadiusMm: 9,
  neckLengthMm: 28,
  bottleVolumeMl: 500,
  waterFillPercent: 0,
  temperatureC: 20,
  endCorrectionMode: 'orifice',
  customEndCorrectionFactor: 1.7,
};

export default function App() {
  const [activeSection, setActiveSection] = useState<AppSection>('material');
  const [params, setParams] = useState<SimulationParams>(initialParams);
  const [isBlowing, setIsBlowing] = useState(false);
  const [measuredFrequencyHz, setMeasuredFrequencyHz] = useState<number | null>(null);
  const [useMicForAnimation, setUseMicForAnimation] = useState(false);

  const result = useMemo(() => calculateHelmholtz(params), [params]);
  const isMicDrivingAnimation = useMicForAnimation && measuredFrequencyHz !== null;
  const visualResult = useMemo(() => {
    if (!isMicDrivingAnimation || !measuredFrequencyHz) return result;
    return {
      ...result,
      frequencyHz: measuredFrequencyHz,
      angularFrequency: measuredFrequencyHz * Math.PI * 2,
    };
  }, [isMicDrivingAnimation, measuredFrequencyHz, result]);

  const handleBlow = async () => {
    if (isBlowing) return;

    setIsBlowing(true);
    await playBottleBlow(result.frequencyHz, BLOW_DURATION_SECONDS);
    window.setTimeout(() => setIsBlowing(false), BLOW_DURATION_SECONDS * 1000);
  };

  return (
    <main className="app-shell">
      <header className="hero">
        <div>
          <p className="eyebrow">React + Vite + TypeScript + React Three Fiber + Web Audio API</p>
          <h1>Resonator Helmholtz: Praktikum dan Simulasi</h1>
          <p>
            Mulai dari materi konsep dan rumus, lanjutkan ke praktikum mikrofon, simulasi 3D, serta aplikasi tangga nada berbasis resonator Helmholtz.
          </p>
        </div>
      </header>

      <nav className="section-tabs" aria-label="Pilihan menu aplikasi">
        <button
          type="button"
          className={activeSection === 'material' ? 'section-tab active' : 'section-tab'}
          onClick={() => setActiveSection('material')}
        >
          <BookOpen size={24} aria-hidden="true" />
          <span>Section 1</span>
          Materi
        </button>
        <button
          type="button"
          className={activeSection === 'practice' ? 'section-tab active' : 'section-tab'}
          onClick={() => setActiveSection('practice')}
        >
          <FlaskConical size={24} aria-hidden="true" />
          <span>Section 2</span>
          Praktikum Sederhana
        </button>
        <button
          type="button"
          className={activeSection === 'simulation' ? 'section-tab active' : 'section-tab'}
          onClick={() => setActiveSection('simulation')}
        >
          <Orbit size={24} aria-hidden="true" />
          <span>Section 3</span>
          Simulasi Resonator Helmholtz
        </button>
        <button
          type="button"
          className={activeSection === 'application' ? 'section-tab active' : 'section-tab'}
          onClick={() => setActiveSection('application')}
        >
          <Music2 size={24} aria-hidden="true" />
          <span>Section 4</span>
          Menu Aplikasi Tangga Nada
        </button>
      </nav>

      {activeSection === 'material' ? (
        <MaterialPanel />
      ) : activeSection === 'practice' ? (
        <MicrophonePracticePanel
          params={params}
          onParamsChange={setParams}
          result={result}
          useMicForAnimation={useMicForAnimation}
          onUseMicForAnimationChange={setUseMicForAnimation}
          onMeasuredFrequencyChange={setMeasuredFrequencyHz}
        />
      ) : activeSection === 'application' ? (
        <ApplicationScalePanel params={params} onParamsChange={setParams} result={result} />
      ) : (
        <section className="simulation-section">
          <div className="section-heading-row">
            <div>
              <p className="eyebrow">Section 3</p>
              <h2 className="icon-heading hero-icon-heading"><Orbit size={34} /> Simulasi Resonator Helmholtz</h2>
            </div>
            <p>
              Putar kamera, ubah parameter, tiup botol virtual, dan amati getaran massa udara di leher serta kompresi-ekspansi udara dalam rongga.
            </p>
          </div>

          <div className="layout-grid compact-layout">
            <div className="left-column">
              <SimulationCanvas
                result={visualResult}
                waterFillPercent={params.waterFillPercent}
                isBlowing={isBlowing || isMicDrivingAnimation}
              />
              <ResultPanel result={result} isBlowing={isBlowing || isMicDrivingAnimation} />
            </div>

            <div className="right-column">
              <ControlPanel
                params={params}
                onChange={setParams}
                onBlow={handleBlow}
                isBlowing={isBlowing}
                blowDurationSeconds={BLOW_DURATION_SECONDS}
              />
            </div>
          </div>
        </section>
      )}
    </main>
  );
}
