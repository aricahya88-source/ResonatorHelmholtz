import { useEffect, useState } from 'react';
import type { HelmholtzResult } from '../types';
import { formatNumber } from '../physics/helmholtz';

interface ResultPanelProps {
  result: HelmholtzResult;
  isBlowing: boolean;
}

export function ResultPanel({ result, isBlowing }: ResultPanelProps) {
  const [livePressurePa, setLivePressurePa] = useState(0);

  useEffect(() => {
    let frameId = 0;
    const startedAt = performance.now();

    const tick = (now: number) => {
      if (!isBlowing) {
        setLivePressurePa(0);
        return;
      }

      // Frekuensi aktual bisa ratusan Hz sehingga terlalu cepat untuk indikator UI.
      // Nilai ini diperlambat hanya untuk visual, sedangkan nilai puncak tetap dari rumus Δp.
      const visualRate = Math.min(Math.max(result.frequencyHz / 65, 1), 7);
      const time = (now - startedAt) / 1000;
      const pressure = -result.estimatedPeakPressurePa * Math.sin(time * visualRate * Math.PI * 2);
      setLivePressurePa(pressure);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [isBlowing, result.estimatedPeakPressurePa, result.frequencyHz]);

  const pressureRatio = Math.min(Math.abs(livePressurePa) / Math.max(result.estimatedPeakPressurePa, 1e-9), 1);
  const pressureState = livePressurePa > 0.25 ? 'Kompresi' : livePressurePa < -0.25 ? 'Ekspansi' : 'Netral';

  return (
    <section className="panel result-panel">
      <p className="eyebrow">Hasil real-time</p>
      <div className="frequency-card">
        <span>Frekuensi resonansi Helmholtz</span>
        <strong>{formatNumber(result.frequencyHz, 1)} Hz</strong>
        <small>Nilai ini juga menjadi frekuensi pusat suara dan kecepatan visual partikel.</small>
      </div>

      <div className="pressure-card">
        <div>
          <span>Tekanan rongga botol</span>
          <strong>{formatNumber(livePressurePa, 2)} Pa</strong>
          <small>
            Puncak estimasi: ±{formatNumber(result.estimatedPeakPressurePa, 2)} Pa · kondisi: {pressureState}
          </small>
        </div>
        <div className="pressure-meter" aria-label="Indikator tekanan rongga">
          <i style={{ width: `${pressureRatio * 100}%` }} />
        </div>
        <small className="pressure-formula">Δp(t) = -ρc² · A · x(t) / V</small>
      </div>

      <div className="result-grid">
        <div>
          <span>ωH</span>
          <strong>{formatNumber(result.angularFrequency, 1)} rad/s</strong>
        </div>
        <div>
          <span>c</span>
          <strong>{formatNumber(result.speedOfSound, 1)} m/s</strong>
        </div>
        <div>
          <span>A</span>
          <strong>{formatNumber(result.neckAreaM2 * 10_000, 2)} cm²</strong>
        </div>
        <div>
          <span>V udara</span>
          <strong>{formatNumber(result.airVolumeM3 * 1_000_000, 1)} mL</strong>
        </div>
        <div>
          <span>L geometrik</span>
          <strong>{formatNumber(result.geometricNeckLengthM * 1000, 1)} mm</strong>
        </div>
        <div>
          <span>L_eff</span>
          <strong>{formatNumber(result.effectiveNeckLengthM * 1000, 1)} mm</strong>
        </div>
        <div>
          <span>x puncak visual</span>
          <strong>{formatNumber(result.displacementAmplitudeM * 1000, 2)} mm</strong>
        </div>
        <div>
          <span>ρ udara</span>
          <strong>{formatNumber(result.airDensityKgM3, 3)} kg/m³</strong>
        </div>
      </div>
    </section>
  );
}
