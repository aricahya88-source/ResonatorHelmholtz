import type { EndCorrectionMode, SimulationParams } from '../types';

interface ControlPanelProps {
  params: SimulationParams;
  onChange: (next: SimulationParams) => void;
  onBlow: () => void;
  isBlowing: boolean;
  blowDurationSeconds: number;
}

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  unit: string;
  hint?: string;
  onChange: (value: number) => void;
}

function Slider({ label, value, min, max, step, unit, hint, onChange }: SliderProps) {
  return (
    <label className="slider-row">
      <span className="slider-label">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
      />
      <span className="slider-value">
        {value} {unit}
      </span>
      {hint ? <small>{hint}</small> : null}
    </label>
  );
}

export function ControlPanel({
  params,
  onChange,
  onBlow,
  isBlowing,
  blowDurationSeconds,
}: ControlPanelProps) {
  const update = <K extends keyof SimulationParams>(key: K, value: SimulationParams[K]) => {
    onChange({ ...params, [key]: value });
  };

  return (
    <section className="panel controls-panel">
      <div className="panel-title-group">
        <h2>Kontrol Parameter dan Suara</h2>
        <p className="panel-subtitle">Geser parameter untuk menghitung frekuensi, lalu tekan tombol tiup.</p>
      </div>

      <div className="top-blow-control">
        <button className="blow-button" onClick={onBlow} type="button" disabled={isBlowing}>
          {isBlowing ? `Resonansi aktif ${blowDurationSeconds} detik...` : `Tiup Botol ${blowDurationSeconds} Detik`}
        </button>
        <small>
          Tombol ini menyalakan suara resonansi dan animasi getaran partikel udara selama {blowDurationSeconds} detik.
        </small>
      </div>

      <Slider
        label="Jari-jari leher"
        value={params.neckRadiusMm}
        min={2}
        max={24}
        step={0.5}
        unit="mm"
        hint="A = πa². Leher lebih besar menaikkan frekuensi."
        onChange={(value) => update('neckRadiusMm', value)}
      />

      <Slider
        label="Panjang leher"
        value={params.neckLengthMm}
        min={2}
        max={90}
        step={1}
        unit="mm"
        hint="Leher lebih panjang menurunkan frekuensi."
        onChange={(value) => update('neckLengthMm', value)}
      />

      <Slider
        label="Volume botol total"
        value={params.bottleVolumeMl}
        min={120}
        max={1500}
        step={10}
        unit="mL"
        hint="Botol lebih besar cenderung menghasilkan nada lebih rendah."
        onChange={(value) => update('bottleVolumeMl', value)}
      />

      <Slider
        label="Tinggi air"
        value={params.waterFillPercent}
        min={0}
        max={90}
        step={1}
        unit="%"
        hint="Air naik → volume udara turun → frekuensi naik."
        onChange={(value) => update('waterFillPercent', value)}
      />

      <Slider
        label="Suhu udara"
        value={params.temperatureC}
        min={0}
        max={40}
        step={1}
        unit="°C"
        hint="c ≈ 331,3 + 0,606T. Udara lebih hangat sedikit menaikkan frekuensi."
        onChange={(value) => update('temperatureC', value)}
      />

      <label className="select-row">
        <span>Koreksi ujung</span>
        <select
          value={params.endCorrectionMode}
          onChange={(event) => update('endCorrectionMode', event.target.value as EndCorrectionMode)}
        >
          <option value="orifice">Botol/orifice: L + 1,70a</option>
          <option value="unflanged">Tanpa flange: L + 1,22a</option>
          <option value="flanged">Berflange: L + 1,64a</option>
          <option value="custom">Custom</option>
        </select>
        <small>Panjang efektif leher dipakai dalam penyebut persamaan Helmholtz.</small>
      </label>

      {params.endCorrectionMode === 'custom' && (
        <Slider
          label="Faktor koreksi custom"
          value={params.customEndCorrectionFactor}
          min={0}
          max={3}
          step={0.01}
          unit="× a"
          onChange={(value) => update('customEndCorrectionFactor', value)}
        />
      )}
    </section>
  );
}
