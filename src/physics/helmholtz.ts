import type { EndCorrectionMode, HelmholtzResult, SimulationParams } from '../types';

const MM_TO_M = 0.001;
const ML_TO_M3 = 1e-6;
const AIR_DENSITY_KG_M3 = 1.204;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function speedOfSoundFromTemperature(temperatureC: number): number {
  // Aproksimasi udara kering: c ≈ 331,3 + 0,606T, satuan m/s.
  return 331.3 + 0.606 * temperatureC;
}

export function getEndCorrectionFactor(mode: EndCorrectionMode, customFactor: number): number {
  switch (mode) {
    case 'orifice':
      // Pendekatan botol/orifice sederhana: ΔL total ≈ 1,70a.
      return 1.7;
    case 'unflanged':
      // Dua ujung tak berflens: ΔL ≈ 0,6133a per sisi, total ≈ 1,22a.
      return 1.22;
    case 'flanged':
      // Dua ujung berflens: ΔL ≈ 0,8216a per sisi, total ≈ 1,64a.
      return 1.64;
    case 'custom':
      return Math.max(0, customFactor);
    default:
      return 1.7;
  }
}

export function calculateHelmholtz(params: SimulationParams): HelmholtzResult {
  const speedOfSound = speedOfSoundFromTemperature(params.temperatureC);
  const neckRadiusM = Math.max(params.neckRadiusMm * MM_TO_M, 0.0001);
  const neckAreaM2 = Math.PI * neckRadiusM ** 2;
  const geometricNeckLengthM = Math.max(params.neckLengthMm * MM_TO_M, 0.0001);
  const endCorrectionFactor = getEndCorrectionFactor(
    params.endCorrectionMode,
    params.customEndCorrectionFactor,
  );
  const effectiveNeckLengthM = geometricNeckLengthM + endCorrectionFactor * neckRadiusM;

  const clampedWater = Math.min(Math.max(params.waterFillPercent, 0), 98);
  const airVolumeM3 = Math.max(params.bottleVolumeMl * (1 - clampedWater / 100) * ML_TO_M3, 1e-6);

  const angularFrequency = speedOfSound * Math.sqrt(neckAreaM2 / (airVolumeM3 * effectiveNeckLengthM));
  const frequencyHz = angularFrequency / (2 * Math.PI);

  // Amplitudo virtual untuk model edukatif massa–pegas.
  // Disesuaikan dengan panjang efektif leher agar perubahan leher memengaruhi visual getaran.
  const displacementAmplitudeM = clamp(effectiveNeckLengthM * 0.028, 0.00012, 0.0016);

  // Tekanan rongga dari model massa–pegas sederhana:
  // Δp(t) = -ρc²(Ax(t)/V). Nilai ini adalah estimasi puncak virtual untuk visualisasi.
  const estimatedPeakPressurePa =
    AIR_DENSITY_KG_M3 * speedOfSound ** 2 * (neckAreaM2 * displacementAmplitudeM) / airVolumeM3;

  return {
    speedOfSound,
    airDensityKgM3: AIR_DENSITY_KG_M3,
    neckRadiusM,
    neckAreaM2,
    geometricNeckLengthM,
    effectiveNeckLengthM,
    airVolumeM3,
    frequencyHz,
    angularFrequency,
    endCorrectionFactor,
    displacementAmplitudeM,
    estimatedPeakPressurePa,
  };
}

export function formatNumber(value: number, digits = 2): string {
  return new Intl.NumberFormat('id-ID', {
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(value);
}
