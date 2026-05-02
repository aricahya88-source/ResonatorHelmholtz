import { useEffect, useMemo, type ReactNode } from 'react';
import {
  Activity,
  Calculator,
  Droplets,
  Gauge,
  Mic,
  MicOff,
  Percent,
  RadioTower,
  Ruler,
  SlidersHorizontal,
  Target,
  Thermometer,
  TrendingUp,
  Waves,
} from 'lucide-react';
import type { EndCorrectionMode, HelmholtzResult, SimulationParams } from '../types';
import { formatNumber } from '../physics/helmholtz';
import { useMicrophoneSpectrum } from '../hooks/useMicrophoneSpectrum';

const MIN_DETECTION_HZ = 80;
const MAX_DETECTION_HZ = 1500;

interface MicrophonePracticePanelProps {
  params: SimulationParams;
  onParamsChange: (next: SimulationParams) => void;
  result: HelmholtzResult;
  useMicForAnimation: boolean;
  onUseMicForAnimationChange: (value: boolean) => void;
  onMeasuredFrequencyChange: (value: number | null) => void;
}

interface MeasurementSliderProps {
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

interface SpectrumChartProps {
  spectrum: { frequencyHz: number; level: number }[];
  pickedFrequencyHz: number | null;
  peakLevel: number;
}

interface ExperimentalCorrectionResult {
  effectiveLengthM: number;
  correctionFactorA: number;
}

function MeasurementSlider({ label, value, min, max, step, unit, hint, icon, onChange }: MeasurementSliderProps) {
  return (
    <label className="measurement-slider">
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

function calculateExperimentalEndCorrection(
  measuredFrequencyHz: number | null,
  result: HelmholtzResult,
): ExperimentalCorrectionResult | null {
  if (!measuredFrequencyHz || measuredFrequencyHz <= 0) return null;

  const omega = 2 * Math.PI * measuredFrequencyHz;
  const denominator = result.airVolumeM3 * (omega / result.speedOfSound) ** 2;
  if (denominator <= 0) return null;

  const effectiveLengthM = result.neckAreaM2 / denominator;
  const correctionFactorA = (effectiveLengthM - result.geometricNeckLengthM) / result.neckRadiusM;

  if (!Number.isFinite(effectiveLengthM) || !Number.isFinite(correctionFactorA)) return null;
  return { effectiveLengthM, correctionFactorA };
}

function SpectrumChart({ spectrum, pickedFrequencyHz, peakLevel }: SpectrumChartProps) {
  const chartWidth = 1000;
  const chartHeight = 320;
  const chartPaddingY = 28;
  const plotHeight = chartHeight - chartPaddingY * 2;

  const polyline = useMemo(() => {
    if (spectrum.length === 0) return '';
    return spectrum
      .map((point) => {
        const x = ((point.frequencyHz - MIN_DETECTION_HZ) / (MAX_DETECTION_HZ - MIN_DETECTION_HZ)) * chartWidth;
        const y = chartHeight - chartPaddingY - point.level * plotHeight;
        return `${Math.min(Math.max(x, 0), chartWidth).toFixed(2)},${Math.min(Math.max(y, chartPaddingY), chartHeight - chartPaddingY).toFixed(2)}`;
      })
      .join(' ');
  }, [spectrum, plotHeight]);

  const peakX = useMemo(() => {
    if (!pickedFrequencyHz) return null;
    const x = ((pickedFrequencyHz - MIN_DETECTION_HZ) / (MAX_DETECTION_HZ - MIN_DETECTION_HZ)) * chartWidth;
    return Math.min(Math.max(x, 0), chartWidth);
  }, [pickedFrequencyHz]);

  const labelX = peakX === null ? 0 : Math.min(Math.max(peakX + 12, 18), chartWidth - 190);

  return (
    <div className="spectrum-card practicum-spectrum-card">
      <div className="spectrum-header">
        <div>
          <span className="spectrum-title-text">Spektrum suara mikrofon</span>
          <small>FFT dan peak detection pada rentang 80–1500 Hz</small>
        </div>
        <strong className={pickedFrequencyHz ? 'peak-value-badge' : 'peak-value-badge idle'}>{pickedFrequencyHz ? `${formatNumber(pickedFrequencyHz, 1)} Hz` : 'Menunggu puncak'}</strong>
      </div>

      <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} role="img" aria-label="Spektrum frekuensi mikrofon dengan garis puncak merah">
        <defs>
          <linearGradient id="spectrumFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(125, 211, 252, 0.26)" />
            <stop offset="100%" stopColor="rgba(125, 211, 252, 0.02)" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width={chartWidth} height={chartHeight} rx="22" fill="url(#spectrumFill)" />
        <line x1="0" y1="260" x2={chartWidth} y2="260" />
        <line x1="0" y1="190" x2={chartWidth} y2="190" />
        <line x1="0" y1="120" x2={chartWidth} y2="120" />
        <line x1="0" y1="50" x2={chartWidth} y2="50" />

        {polyline ? <polyline points={polyline} /> : (
          <text className="spectrum-empty-label" x={chartWidth / 2} y={chartHeight / 2}>Aktifkan mikrofon dan tiup botol</text>
        )}

        {peakX !== null ? (
          <g className="peak-marker">
            <line x1={peakX} y1="20" x2={peakX} y2="300" />
            <rect x={labelX} y="24" width="170" height="45" rx="12" />
            <text x={labelX + 14} y="53">
              {formatNumber(pickedFrequencyHz ?? 0, 1)} Hz
            </text>
          </g>
        ) : null}
      </svg>

      <div className="spectrum-axis">
        <small>80 Hz</small>
        <small>Level puncak relatif: {formatNumber(peakLevel * 100, 0)}%</small>
        <small>1500 Hz</small>
      </div>
    </div>
  );
}

export function MicrophonePracticePanel({
  params,
  onParamsChange,
  result,
  useMicForAnimation,
  onUseMicForAnimationChange,
  onMeasuredFrequencyChange,
}: MicrophonePracticePanelProps) {
  const {
    isSupported,
    status,
    errorMessage,
    dominantFrequencyHz,
    averageFrequencyHz,
    confidence,
    peakLevel,
    spectrum,
    start,
    stop,
  } = useMicrophoneSpectrum();

  const measuredFrequencyHz = averageFrequencyHz ?? dominantFrequencyHz;
  const differenceHz = measuredFrequencyHz === null ? null : measuredFrequencyHz - result.frequencyHz;
  const differencePercent = differenceHz === null ? null : (differenceHz / result.frequencyHz) * 100;
  const experimentalCorrection = useMemo(
    () => calculateExperimentalEndCorrection(measuredFrequencyHz ?? null, result),
    [measuredFrequencyHz, result],
  );

  useEffect(() => {
    onMeasuredFrequencyChange(measuredFrequencyHz ?? null);
  }, [measuredFrequencyHz, onMeasuredFrequencyChange]);

  const update = <K extends keyof SimulationParams>(key: K, value: SimulationParams[K]) => {
    onParamsChange({ ...params, [key]: value });
  };

  const statusText =
    status === 'listening' ? 'Mikrofon aktif' : status === 'error' ? 'Mikrofon bermasalah' : 'Mikrofon belum aktif';

  const correctionIsPhysicallyReasonable =
    experimentalCorrection !== null && experimentalCorrection.correctionFactorA >= 0 && experimentalCorrection.correctionFactorA <= 4;

  return (
    <section className="practice-section">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Section 2 · Praktikum Sederhana</p>
          <h2 className="icon-heading hero-icon-heading"><Gauge size={34} /> Mengukur Frekuensi Botol Asli</h2>
        </div>
        <p>
          Masukkan ukuran botol nyata, aktifkan mikrofon, lalu tiup botol. Aplikasi akan membaca puncak spektrum dan membandingkan frekuensi aktual dengan rumus Helmholtz.
        </p>
      </div>

      <div className="practice-top-grid">
        <div className="practice-left-stack">
          <SpectrumChart spectrum={spectrum} pickedFrequencyHz={measuredFrequencyHz ?? null} peakLevel={peakLevel} />

          <div className="panel practice-measurement-results">
            <div className="panel-title-group compact-title">
              <p className="eyebrow">Hasil pengukuran</p>
              <h2 className="icon-heading"><Target size={24} /> Perbandingan Teori dan Mikrofon</h2>
            </div>

            <div className="practice-result-grid wide-result-grid">
              <div>
                <span className="metric-label"><Calculator size={16} /> Frekuensi teoritis</span>
                <strong>{formatNumber(result.frequencyHz, 1)} Hz</strong>
                <small>Berdasarkan ukuran botol dan koreksi ujung yang dipilih.</small>
              </div>
              <div>
                <span className="metric-label"><Mic size={16} /> Frekuensi aktual mikrofon</span>
                <strong>{measuredFrequencyHz ? `${formatNumber(measuredFrequencyHz, 1)} Hz` : '—'}</strong>
                <small>Rata-rata puncak dominan selama sekitar 1,8 detik.</small>
              </div>
              <div>
                <span className="metric-label"><TrendingUp size={16} /> Selisih</span>
                <strong>{differenceHz === null ? '—' : `${differenceHz > 0 ? '+' : ''}${formatNumber(differenceHz, 1)} Hz`}</strong>
                <small>
                  {differencePercent === null
                    ? 'Belum ada data mikrofon.'
                    : `${differencePercent > 0 ? '+' : ''}${formatNumber(differencePercent, 1)}% terhadap frekuensi teoritis.`}
                </small>
              </div>
              <div>
                <span className="metric-label"><Activity size={16} /> Kepercayaan puncak</span>
                <strong>{formatNumber(confidence * 100, 0)}%</strong>
                <small>Puncak makin tepercaya jika jauh lebih tinggi daripada noise sekitar.</small>
              </div>
              <div>
                <span className="metric-label"><RadioTower size={16} /> Level puncak relatif</span>
                <strong>{formatNumber(peakLevel * 100, 0)}%</strong>
                <small>Nilai relatif dari spektrum mikrofon, bukan dB SPL terkalibrasi.</small>
              </div>
              <div>
                <span className="metric-label"><Waves size={16} /> Koreksi ujung hasil praktikum</span>
                <strong>
                  {experimentalCorrection ? `${formatNumber(experimentalCorrection.correctionFactorA, 2)}a` : '—'}
                </strong>
                <small>
                  {experimentalCorrection
                    ? `L_eff praktikum ≈ ${formatNumber(experimentalCorrection.effectiveLengthM * 1000, 1)} mm${correctionIsPhysicallyReasonable ? '' : ' · cek ulang input/geometri'}`
                    : 'Dihitung setelah frekuensi aktual mikrofon terbaca.'}
                </small>
              </div>
            </div>

            <div className="practice-note compact-note">
              <strong>Catatan koreksi ujung</strong>
              <p>
                Frekuensi teoritis tetap perlu ditampilkan sebagai pembanding. Nilai koreksi ujung praktikum dihitung balik dari frekuensi aktual mikrofon,
                sehingga berguna untuk memperkirakan faktor koreksi <em>a</em> pada botol nyata.
              </p>
            </div>
          </div>
        </div>

        <aside className="panel practice-control-panel">
          <div className="panel-title-group compact-title">
            <p className="eyebrow">Input praktikum</p>
            <h2 className="icon-heading"><SlidersHorizontal size={24} /> Mikrofon dan Parameter Botol</h2>
          </div>

          <div className="mic-control-box">
            <button className="secondary-button mic-main-button" type="button" onClick={status === 'listening' ? stop : start} disabled={!isSupported}>
              {status === 'listening' ? <MicOff size={20} /> : <Mic size={20} />}
              {status === 'listening' ? 'Hentikan Mikrofon' : 'Aktifkan Mikrofon'}
            </button>
            <div className="mic-status-row no-margin">
              <span className={status === 'listening' ? 'live-dot active' : 'live-dot'} />
              <strong>{statusText}</strong>
              {status === 'error' ? <small>{errorMessage}</small> : <small>Estimasi frekuensi edukatif, bukan kalibrasi laboratorium.</small>}
            </div>
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={useMicForAnimation}
                disabled={!measuredFrequencyHz}
                onChange={(event) => onUseMicForAnimationChange(event.target.checked)}
              />
              <span>Animasi simulasi mengikuti frekuensi aktual mikrofon</span>
            </label>
          </div>

          <div className="measurement-form-title">
            <strong>Parameter hasil ukur botol sesungguhnya</strong>
            <small>Samakan input ini dengan ukuran botol yang dipakai saat praktikum.</small>
          </div>

          <MeasurementSlider
            label="Jari-jari leher"
            value={params.neckRadiusMm}
            min={2}
            max={24}
            step={0.5}
            unit="mm"
            icon={<Ruler size={20} />}
            hint="Dipakai untuk A = πa² dan faktor koreksi ujung."
            onChange={(value) => update('neckRadiusMm', value)}
          />

          <MeasurementSlider
            label="Panjang leher"
            value={params.neckLengthMm}
            min={2}
            max={90}
            step={1}
            unit="mm"
            icon={<Ruler size={20} />}
            hint="Panjang geometrik leher sebelum koreksi ujung."
            onChange={(value) => update('neckLengthMm', value)}
          />

          <MeasurementSlider
            label="Volume botol total"
            value={params.bottleVolumeMl}
            min={120}
            max={1500}
            step={10}
            unit="mL"
            icon={<Gauge size={20} />}
            hint="Volume total botol saat kosong."
            onChange={(value) => update('bottleVolumeMl', value)}
          />

          <MeasurementSlider
            label="Tinggi air"
            value={params.waterFillPercent}
            min={0}
            max={90}
            step={1}
            unit="%"
            icon={<Droplets size={20} />}
            hint="Air mengurangi volume udara efektif."
            onChange={(value) => update('waterFillPercent', value)}
          />

          <MeasurementSlider
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
            <span className="icon-heading"><Percent size={18} /> Koreksi ujung untuk frekuensi teoritis</span>
            <select
              value={params.endCorrectionMode}
              onChange={(event) => update('endCorrectionMode', event.target.value as EndCorrectionMode)}
            >
              <option value="orifice">Botol/orifice: L + 1,70a</option>
              <option value="unflanged">Tanpa flange: L + 1,22a</option>
              <option value="flanged">Berflange: L + 1,64a</option>
              <option value="custom">Custom</option>
            </select>
            <small>Frekuensi teoritis dihitung dari pilihan ini, sedangkan koreksi praktikum dihitung dari data mikrofon.</small>
          </label>

          {params.endCorrectionMode === 'custom' ? (
            <MeasurementSlider
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
        </aside>
      </div>
    </section>
  );
}
