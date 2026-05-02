import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

type AnalyzerStatus = 'idle' | 'listening' | 'error';

interface SpectrumPoint {
  frequencyHz: number;
  level: number;
}

interface FrequencySample {
  timestamp: number;
  frequencyHz: number;
  levelDb: number;
}

const MIN_DETECTION_HZ = 80;
const MAX_DETECTION_HZ = 1500;
const AVERAGING_WINDOW_MS = 1800;

function getAudioContextCtor(): typeof AudioContext | undefined {
  return window.AudioContext ?? (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
}

function normalizeDb(value: number): number {
  if (!Number.isFinite(value)) return 0;
  // AnalyserNode biasanya memberi level sekitar -120 dB sampai 0 dB.
  return Math.min(Math.max((value + 105) / 85, 0), 1);
}

function calculateConfidence(peakDb: number, averageDb: number): number {
  if (!Number.isFinite(peakDb) || !Number.isFinite(averageDb)) return 0;
  const separation = peakDb - averageDb;
  return Math.min(Math.max(separation / 28, 0), 1);
}

export function useMicrophoneSpectrum() {
  const [status, setStatus] = useState<AnalyzerStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [dominantFrequencyHz, setDominantFrequencyHz] = useState<number | null>(null);
  const [averageFrequencyHz, setAverageFrequencyHz] = useState<number | null>(null);
  const [confidence, setConfidence] = useState(0);
  const [peakLevel, setPeakLevel] = useState(0);
  const [spectrum, setSpectrum] = useState<SpectrumPoint[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const frameRef = useRef<number | null>(null);
  const samplesRef = useRef<FrequencySample[]>([]);
  const frequencyDataRef = useRef<Float32Array | null>(null);

  const isSupported = useMemo(() => {
    return typeof window !== 'undefined' && Boolean(navigator.mediaDevices?.getUserMedia) && getAudioContextCtor() !== undefined;
  }, []);

  const stop = useCallback(() => {
    if (frameRef.current !== null) {
      cancelAnimationFrame(frameRef.current);
      frameRef.current = null;
    }

    sourceRef.current?.disconnect();
    analyserRef.current?.disconnect();
    sourceRef.current = null;
    analyserRef.current = null;
    frequencyDataRef.current = null;

    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;

    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      void audioContextRef.current.close();
    }
    audioContextRef.current = null;

    samplesRef.current = [];
    setStatus('idle');
    setDominantFrequencyHz(null);
    setAverageFrequencyHz(null);
    setConfidence(0);
    setPeakLevel(0);
    setSpectrum([]);
  }, []);

  const analyze = useCallback(() => {
    const analyser = analyserRef.current;
    const ctx = audioContextRef.current;
    const data = frequencyDataRef.current;

    if (!analyser || !ctx || !data) return;

    // TypeScript 5.7+ makes typed arrays generic, while older DOM typings do not.
    // This cast keeps the code compatible across both local builds and GitHub Actions.
    analyser.getFloatFrequencyData(data as Parameters<AnalyserNode['getFloatFrequencyData']>[0]);

    const binWidth = ctx.sampleRate / analyser.fftSize;
    const startBin = Math.max(1, Math.floor(MIN_DETECTION_HZ / binWidth));
    const endBin = Math.min(data.length - 1, Math.ceil(MAX_DETECTION_HZ / binWidth));

    let peakBin = startBin;
    let peakDb = -Infinity;
    let sumDb = 0;
    let validCount = 0;

    for (let bin = startBin; bin <= endBin; bin += 1) {
      const db = data[bin];
      if (!Number.isFinite(db)) continue;
      sumDb += db;
      validCount += 1;
      if (db > peakDb) {
        peakDb = db;
        peakBin = bin;
      }
    }

    const averageDb = validCount > 0 ? sumDb / validCount : -120;
    const peakFrequency = peakBin * binWidth;
    const nextConfidence = calculateConfidence(peakDb, averageDb);
    const nextPeakLevel = normalizeDb(peakDb);

    if (nextConfidence > 0.12 && peakFrequency >= MIN_DETECTION_HZ && peakFrequency <= MAX_DETECTION_HZ) {
      const now = performance.now();
      samplesRef.current = [
        ...samplesRef.current.filter((sample) => now - sample.timestamp <= AVERAGING_WINDOW_MS),
        { timestamp: now, frequencyHz: peakFrequency, levelDb: peakDb },
      ];

      const weightedSum = samplesRef.current.reduce((sum, sample) => sum + sample.frequencyHz * normalizeDb(sample.levelDb), 0);
      const weight = samplesRef.current.reduce((sum, sample) => sum + normalizeDb(sample.levelDb), 0);
      setDominantFrequencyHz(peakFrequency);
      setAverageFrequencyHz(weight > 0 ? weightedSum / weight : peakFrequency);
    }

    const visibleBins = 96;
    const points: SpectrumPoint[] = [];
    for (let index = 0; index < visibleBins; index += 1) {
      const progress = index / (visibleBins - 1);
      const bin = Math.round(startBin + progress * (endBin - startBin));
      points.push({ frequencyHz: bin * binWidth, level: normalizeDb(data[bin]) });
    }

    setConfidence(nextConfidence);
    setPeakLevel(nextPeakLevel);
    setSpectrum(points);
    frameRef.current = requestAnimationFrame(analyze);
  }, []);

  const start = useCallback(async () => {
    if (!isSupported) {
      setStatus('error');
      setErrorMessage('Browser ini belum mendukung akses mikrofon melalui Web Audio API.');
      return;
    }

    try {
      stop();
      setStatus('idle');
      setErrorMessage('');

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      const AudioContextCtor = getAudioContextCtor();
      if (!AudioContextCtor) throw new Error('AudioContext tidak tersedia.');

      const ctx = new AudioContextCtor();
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 8192;
      analyser.minDecibels = -110;
      analyser.maxDecibels = -10;
      analyser.smoothingTimeConstant = 0.78;

      const source = ctx.createMediaStreamSource(stream);
      source.connect(analyser);

      streamRef.current = stream;
      audioContextRef.current = ctx;
      analyserRef.current = analyser;
      sourceRef.current = source;
      frequencyDataRef.current = new Float32Array(analyser.frequencyBinCount);
      samplesRef.current = [];

      setStatus('listening');
      frameRef.current = requestAnimationFrame(analyze);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Mikrofon tidak dapat diakses.';
      setStatus('error');
      setErrorMessage(message);
    }
  }, [analyze, isSupported, stop]);

  useEffect(() => stop, [stop]);

  return {
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
  };
}
