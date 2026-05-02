export type EndCorrectionMode = 'orifice' | 'unflanged' | 'flanged' | 'custom';

export interface SimulationParams {
  neckRadiusMm: number;
  neckLengthMm: number;
  bottleVolumeMl: number;
  waterFillPercent: number;
  temperatureC: number;
  endCorrectionMode: EndCorrectionMode;
  customEndCorrectionFactor: number;
}

export interface HelmholtzResult {
  speedOfSound: number;
  airDensityKgM3: number;
  neckRadiusM: number;
  neckAreaM2: number;
  geometricNeckLengthM: number;
  effectiveNeckLengthM: number;
  airVolumeM3: number;
  frequencyHz: number;
  angularFrequency: number;
  endCorrectionFactor: number;
  displacementAmplitudeM: number;
  estimatedPeakPressurePa: number;
}

export interface ExampleCase {
  id: string;
  title: string;
  description: string;
  params: SimulationParams;
}
