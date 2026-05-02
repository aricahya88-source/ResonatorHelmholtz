import type { HelmholtzResult } from '../types';

export const BOTTLE_GROUP_Y = 0.1;

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

export function getTotalVolumeMl(result: HelmholtzResult, waterFillPercent: number): number {
  const airFraction = Math.max(1 - waterFillPercent / 100, 0.02);
  return (result.airVolumeM3 * 1_000_000) / airFraction;
}

export function getVisualNeckHeight(result: HelmholtzResult): number {
  const lengthMm = result.geometricNeckLengthM * 1000;
  return 0.44 + clamp((lengthMm - 2) / 88, 0, 1) * 1.05;
}

export function getBottleVisualGeometry(result: HelmholtzResult, waterFillPercent: number) {
  const totalVolumeMl = getTotalVolumeMl(result, waterFillPercent);
  const volumeScale = clamp(Math.cbrt(totalVolumeMl / 500), 0.78, 1.35);
  const bodyRadius = 0.72 * Math.sqrt(volumeScale);
  const bodyHeight = 2.5 * volumeScale;
  const shoulderHeight = 0.42 * Math.sqrt(volumeScale);
  const neckHeight = getVisualNeckHeight(result);
  const visualNeckRadius = clamp(result.neckRadiusM * 24, 0.12, 0.34);

  const bodyBottomLocal = -bodyHeight / 2;
  const bodyTopLocal = bodyHeight / 2;
  const shoulderBottomLocal = bodyTopLocal - 0.03;
  const shoulderTopLocal = bodyTopLocal + shoulderHeight - 0.03;
  const neckBottomLocal = bodyTopLocal + shoulderHeight - 0.04;
  const neckTopLocal = bodyTopLocal + shoulderHeight + neckHeight - 0.04;
  const neckCenterLocal = (neckBottomLocal + neckTopLocal) / 2;

  const clampedWater = clamp(waterFillPercent, 0, 98);
  const waterHeight = Math.max((clampedWater / 100) * bodyHeight, 0);
  const waterYLocal = bodyBottomLocal + waterHeight / 2;
  const waterTopLocal = bodyBottomLocal + waterHeight;
  const airBottomLocal = Math.min(waterTopLocal + 0.08, bodyTopLocal - 0.08);
  const airTopLocal = bodyTopLocal - 0.08;
  const airHeight = Math.max(airTopLocal - airBottomLocal, 0.04);
  const airCenterLocal = airBottomLocal + airHeight / 2;

  const toWorldY = (localY: number) => localY + BOTTLE_GROUP_Y;

  return {
    totalVolumeMl,
    volumeScale,
    bodyRadius,
    bodyHeight,
    shoulderHeight,
    neckHeight,
    visualNeckRadius,
    bodyBottomLocal,
    bodyTopLocal,
    shoulderBottomLocal,
    shoulderTopLocal,
    neckBottomLocal,
    neckTopLocal,
    neckCenterLocal,
    waterHeight,
    waterYLocal,
    waterTopLocal,
    airBottomLocal,
    airTopLocal,
    airCenterLocal,
    airHeight,
    bodyBottomY: toWorldY(bodyBottomLocal),
    bodyTopY: toWorldY(bodyTopLocal),
    neckBottomY: toWorldY(neckBottomLocal),
    neckTopY: toWorldY(neckTopLocal),
    neckCenterY: toWorldY(neckCenterLocal),
    waterTopY: toWorldY(waterTopLocal),
    airBottomY: toWorldY(airBottomLocal),
    airTopY: toWorldY(airTopLocal),
    airCenterY: toWorldY(airCenterLocal),
  };
}
