import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  BadgeHelp,
  Droplets,
  Gauge,
  Music2,
  Percent,
  Play,
  Ruler,
  SlidersHorizontal,
  Target,
  Thermometer,
  Volume2,
  Waves,
} from 'lucide-react';
import { playBottleBlow } from '../audio/resonatorAudio';
import { calculateHelmholtz, formatNumber } from '../physics/helmholtz';
import type { EndCorrectionMode, HelmholtzResult, SimulationParams } from '../types';
import { SimulationCanvas } from './SimulationCanvas';

const NOTE_DURATION_SECONDS = 2;
const DEFAULT_APPLICATION_AIR_VOLUME_ML = 500;
const MAX_APPLICATION_WATER_PERCENT = 98;

type ScaleNote = {
  no: number;
  solmization: string;
  musicNote: string;
  frequencyHz: number;
};

const SCALE_NOTES: ScaleNote[] = [
  { no: 1, solmization: 'Do', musicNote: 'C4', frequencyHz: 261.63 },
  { no: 2, solmization: 'Re', musicNote: 'D4', frequencyHz: 293.66 },
  { no: 3, solmization: 'Mi', musicNote: 'E4', frequencyHz: 329.63 },
  { no: 4, solmization: 'Fa', musicNote: 'F4', frequencyHz: 349.23 },
  { no: 5, solmization: 'Sol', musicNote: 'G4', frequencyHz: 392.0 },
  { no: 6, solmization: 'La', musicNote: 'A4', frequencyHz: 440.0 },
  { no: 7, solmization: 'Si', musicNote: 'B4', frequencyHz: 493.88 },
  { no: 8, solmization: 'Do tinggi', musicNote: 'C5', frequencyHz: 523.25 },
  { no: 9, solmization: 'Re tinggi', musicNote: 'D5', frequencyHz: 587.33 },
  { no: 10, solmization: 'Mi tinggi', musicNote: 'E5', frequencyHz: 659.25 },
  { no: 11, solmization: 'Fa tinggi', musicNote: 'F5', frequencyHz: 698.46 },
  { no: 12, solmization: 'Sol tinggi', musicNote: 'G5', frequencyHz: 783.99 },
  { no: 13, solmization: 'La tinggi', musicNote: 'A5', frequencyHz: 880.0 },
  { no: 14, solmization: 'Si tinggi', musicNote: 'B5', frequencyHz: 987.77 },
  { no: 15, solmization: 'Do sangat tinggi', musicNote: 'C6', frequencyHz: 1046.5 },
];

interface ApplicationScalePanelProps {
  params: SimulationParams;
  onParamsChange: (next: SimulationParams) => void;
  result: HelmholtzResult;
}

interface AppMeasurementSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  hint?: string;
  icon?: ReactNode;
  onChange: (value: number) => void;
}

function AppMeasurementSlider({ label, value, min, max, step, unit, hint, icon, onChange }: AppMeasurementSliderProps) {
  return (
    <label className="measurement-slider compact-measurement-slider">
      <span className="measurement-slider-title">
        {icon ? <i aria-hidden="true">{icon}</i> : null}
        {label}
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <strong>
        {value} {unit}
      </strong>
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

function getClosestNote(frequencyHz: number) {
  return SCALE_NOTES.reduce((closest, note) => {
    const currentDistance = Math.abs(note.frequencyHz - frequencyHz);
    const closestDistance = Math.abs(closest.frequencyHz - frequencyHz);
    return currentDistance < closestDistance ? note : closest;
  }, SCALE_NOTES[0]);
}

function getRequiredWaterPercentForTarget(result: HelmholtzResult, params: SimulationParams, targetFrequencyHz: number) {
  const omega = 2 * Math.PI * targetFrequencyHz;
  const requiredAirVolumeM3 = result.neckAreaM2 / ((omega / result.speedOfSound) ** 2 * result.effectiveNeckLengthM);
  const totalBottleVolumeM3 = Math.max(params.bottleVolumeMl * 1e-6, 1e-6);
  const requiredWaterPercent = (1 - requiredAirVolumeM3 / totalBottleVolumeM3) * 100;

  if (!Number.isFinite(requiredWaterPercent)) return null;
  return {
    airVolumeMl: requiredAirVolumeM3 * 1_000_000,
    waterPercent: Math.min(Math.max(requiredWaterPercent, 0), MAX_APPLICATION_WATER_PERCENT),
    rawWaterPercent: requiredWaterPercent,
    isReachable: requiredWaterPercent >= 0 && requiredWaterPercent <= MAX_APPLICATION_WATER_PERCENT,
  };
}

export function ApplicationScalePanel({ params, onParamsChange, result }: ApplicationScalePanelProps) {
  const [selectedNote, setSelectedNote] = useState<ScaleNote>(SCALE_NOTES[0]);
  const [activeNoteNo, setActiveNoteNo] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const isNoteActive = activeNoteNo !== null;
  const tunedResult = useMemo(() => {
    if (!isNoteActive) return result;
    return {
      ...result,
      frequencyHz: selectedNote.frequencyHz,
      angularFrequency: selectedNote.frequencyHz * Math.PI * 2,
      estimatedPeakPressurePa: result.estimatedPeakPressurePa * Math.min(Math.max(selectedNote.frequencyHz / result.frequencyHz, 0.55), 1.95),
    };
  }, [isNoteActive, result, selectedNote.frequencyHz]);

  const closestNote = useMemo(() => getClosestNote(result.frequencyHz), [result.frequencyHz]);
  const selectedDifferenceHz = result.frequencyHz - selectedNote.frequencyHz;
  const selectedDifferencePercent = (selectedDifferenceHz / selectedNote.frequencyHz) * 100;
  const requiredTuning = useMemo(
    () => getRequiredWaterPercentForTarget(result, params, selectedNote.frequencyHz),
    [params, result, selectedNote.frequencyHz],
  );

  useEffect(() => () => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
  }, []);

  useEffect(() => {
    // Default Section 4: botol kosong dengan rongga udara 500 mL.
    // Slider tetap dapat diubah setelah menu aplikasi dibuka.
    if (params.bottleVolumeMl !== DEFAULT_APPLICATION_AIR_VOLUME_ML || params.waterFillPercent !== 0) {
      onParamsChange({
        ...params,
        bottleVolumeMl: DEFAULT_APPLICATION_AIR_VOLUME_ML,
        waterFillPercent: 0,
      });
    }
    // Dijalankan sekali saat Section 4 pertama kali dibuka.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const update = <K extends keyof SimulationParams>(key: K, value: SimulationParams[K]) => {
    onParamsChange({ ...params, [key]: value });
  };

  const tuneWaterForNote = (note: ScaleNote): number => {
    const target = getRequiredWaterPercentForTarget(result, params, note.frequencyHz);
    return target ? target.waterPercent : params.waterFillPercent;
  };

  const playNote = async (note: ScaleNote) => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);

    const targetWaterPercent = tuneWaterForNote(note);
    const nextParams = {
      ...params,
      waterFillPercent: Number(targetWaterPercent.toFixed(1)),
    };

    setSelectedNote(note);
    setActiveNoteNo(note.no);
    onParamsChange(nextParams);
    await playBottleBlow(note.frequencyHz, NOTE_DURATION_SECONDS);

    timerRef.current = window.setTimeout(() => {
      setActiveNoteNo(null);
      timerRef.current = null;
    }, NOTE_DURATION_SECONDS * 1000);
  };

  return (
    <section className="application-section">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Section 4 · Menu Aplikasi</p>
          <h2 className="icon-heading hero-icon-heading"><Music2 size={34} /> Tangga Nada Resonator Helmholtz</h2>
        </div>
        <p>
          Pilih nada target, lalu tinggi air botol akan disetel otomatis mendekati frekuensi target dan botol 3D beresonansi selama 2 detik. Default menu ini memakai botol kosong dengan rongga udara 500 mL.
        </p>
      </div>

      <div className="application-grid">
        <div className="application-left-stack">
          <SimulationCanvas
            result={tunedResult}
            waterFillPercent={params.waterFillPercent}
            isBlowing={isNoteActive}
            activeCaption={`Nada ${selectedNote.musicNote} aktif: partikel udara berosilasi mengikuti frekuensi ${formatNumber(selectedNote.frequencyHz, 2)} Hz.`}
            idleCaption="Drag untuk memutar, scroll/pinch untuk zoom, lalu klik salah satu tangga nada."
          />

          <div className="panel scale-panel">
            <div className="panel-title-group compact-title scale-title-row">
              <div>
                <p className="eyebrow">Tangga nada 2 oktaf</p>
                <h2 className="icon-heading"><Volume2 size={24} /> Pilih Do–Re–Mi</h2>
              </div>
              <small>Klik salah satu tombol. Tinggi air berubah otomatis, lalu animasi partikel aktif selama {NOTE_DURATION_SECONDS} detik.</small>
            </div>

            <div className="scale-note-grid" role="list" aria-label="Tombol tangga nada 2 oktaf">
              {SCALE_NOTES.map((note) => (
                <button
                  key={note.no}
                  type="button"
                  className={selectedNote.no === note.no ? 'scale-note-button selected' : 'scale-note-button'}
                  onClick={() => void playNote(note)}
                  aria-pressed={selectedNote.no === note.no}
                >
                  <span className="note-index">{note.no}</span>
                  <strong>{note.solmization}</strong>
                  <span>{note.musicNote}</span>
                  <small>{formatNumber(note.frequencyHz, 2)} Hz</small>
                  {activeNoteNo === note.no ? <em>Berbunyi</em> : null}
                </button>
              ))}
            </div>
          </div>
        </div>

        <aside className="panel application-control-panel">
          <div className="panel-title-group compact-title">
            <p className="eyebrow">Input botol nyata</p>
            <h2 className="icon-heading"><SlidersHorizontal size={24} /> Parameter Hasil Ukur Botol</h2>
          </div>

          <AppMeasurementSlider
            label="Jari-jari leher"
            value={params.neckRadiusMm}
            min={2}
            max={24}
            step={0.5}
            unit="mm"
            icon={<Ruler size={20} />}
            hint="Dipakai untuk A = πa². Leher lebih besar menaikkan frekuensi."
            onChange={(value) => update('neckRadiusMm', value)}
          />

          <AppMeasurementSlider
            label="Panjang leher"
            value={params.neckLengthMm}
            min={2}
            max={90}
            step={1}
            unit="mm"
            icon={<Ruler size={20} />}
            hint="Leher lebih panjang menurunkan frekuensi."
            onChange={(value) => update('neckLengthMm', value)}
          />

          <AppMeasurementSlider
            label="Volume botol total"
            value={params.bottleVolumeMl}
            min={120}
            max={1500}
            step={10}
            unit="mL"
            icon={<Gauge size={20} />}
            hint="Default 500 mL saat botol kosong; dapat diubah sesuai botol nyata."
            onChange={(value) => update('bottleVolumeMl', value)}
          />

          <AppMeasurementSlider
            label="Tinggi air"
            value={params.waterFillPercent}
            min={0}
            max={MAX_APPLICATION_WATER_PERCENT}
            step={0.1}
            unit="%"
            icon={<Droplets size={20} />}
            hint="Dapat berubah otomatis saat tombol nada diklik."
            onChange={(value) => update('waterFillPercent', value)}
          />

          <AppMeasurementSlider
            label="Suhu udara"
            value={params.temperatureC}
            min={0}
            max={40}
            step={1}
            unit="°C"
            icon={<Thermometer size={20} />}
            hint="Dipakai untuk menghitung cepat rambat bunyi."
            onChange={(value) => update('temperatureC', value)}
          />

          <label className="select-row practice-select-row">
            <span className="icon-heading"><Percent size={18} /> Koreksi ujung</span>
            <select
              value={params.endCorrectionMode}
              onChange={(event) => update('endCorrectionMode', event.target.value as EndCorrectionMode)}
            >
              <option value="orifice">Botol/orifice: L + 1,70a</option>
              <option value="unflanged">Tanpa flange: L + 1,22a</option>
              <option value="flanged">Berflange: L + 1,64a</option>
              <option value="custom">Custom</option>
            </select>
            <small>Nilai ini memengaruhi frekuensi teoritis botol.</small>
          </label>

          {params.endCorrectionMode === 'custom' ? (
            <AppMeasurementSlider
              label="Faktor koreksi custom"
              value={params.customEndCorrectionFactor}
              min={0}
              max={3}
              step={0.01}
              unit="× a"
              icon={<Percent size={20} />}
              onChange={(value) => update('customEndCorrectionFactor', value)}
            />
          ) : null}

          <div className="scale-result-card selected-note-card">
            <span className="metric-label"><Target size={17} /> Nada target terpilih</span>
            <strong>{selectedNote.solmization} · {selectedNote.musicNote}</strong>
            <small>
              {formatNumber(selectedNote.frequencyHz, 2)} Hz · tinggi air target {requiredTuning ? `${formatNumber(requiredTuning.waterPercent, 1)}%` : '—'}
            </small>
          </div>

          <div className="scale-result-grid">
            <div>
              <span className="metric-label"><Waves size={16} /> Frekuensi teoritis botol</span>
              <strong>{formatNumber(result.frequencyHz, 1)} Hz</strong>
              <small>Nada terdekat: {closestNote.solmization} ({closestNote.musicNote}).</small>
            </div>
            <div>
              <span className="metric-label"><BadgeHelp size={16} /> Selisih dari target</span>
              <strong>{selectedDifferenceHz > 0 ? '+' : ''}{formatNumber(selectedDifferenceHz, 1)} Hz</strong>
              <small>{selectedDifferencePercent > 0 ? '+' : ''}{formatNumber(selectedDifferencePercent, 1)}% terhadap {selectedNote.musicNote}.</small>
            </div>
            <div>
              <span className="metric-label"><Droplets size={16} /> Estimasi tinggi air target</span>
              <strong>{requiredTuning ? `${formatNumber(requiredTuning.waterPercent, 1)}%` : '—'}</strong>
              <small>
                {requiredTuning
                  ? requiredTuning.isReachable
                    ? `Saat tombol ${selectedNote.solmization} diklik, tinggi air disetel ke nilai ini. Volume udara ≈ ${formatNumber(requiredTuning.airVolumeMl, 0)} mL.`
                    : `Target sulit dicapai hanya dengan tinggi air; perlu ubah jari-jari/panjang leher atau volume botol.`
                  : 'Pilih nada untuk membaca estimasi.'}
              </small>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}
