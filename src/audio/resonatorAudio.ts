let audioContext: AudioContext | null = null;

type WindowWithWebkitAudio = Window & typeof globalThis & {
  webkitAudioContext?: typeof AudioContext;
};

function getAudioContext(): AudioContext {
  const AudioContextClass = window.AudioContext || (window as WindowWithWebkitAudio).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error('Web Audio API tidak tersedia pada browser ini.');
  }
  if (!audioContext) {
    audioContext = new AudioContextClass();
  }
  return audioContext;
}

function createNoiseBuffer(ctx: AudioContext, duration: number): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const buffer = ctx.createBuffer(1, Math.ceil(sampleRate * duration), sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < data.length; i += 1) {
    const progress = i / data.length;
    const attack = Math.min(progress / 0.07, 1);
    const release = Math.min((1 - progress) / 0.18, 1);
    const breathEnvelope = Math.max(0, Math.min(attack, release)) ** 0.42;
    data[i] = (Math.random() * 2 - 1) * breathEnvelope;
  }

  return buffer;
}

export async function playBottleBlow(frequencyHz: number, duration = 5): Promise<void> {
  const ctx = getAudioContext();

  if (ctx.state === 'suspended') {
    await ctx.resume();
  }

  const now = ctx.currentTime;
  const safeFrequency = Math.min(Math.max(frequencyHz, 55), 2200);

  const masterGain = ctx.createGain();
  masterGain.gain.setValueAtTime(0.0001, now);
  masterGain.gain.exponentialRampToValueAtTime(0.28, now + 0.08);
  masterGain.gain.setValueAtTime(0.24, now + duration * 0.78);
  masterGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  masterGain.connect(ctx.destination);

  const oscillator = ctx.createOscillator();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(safeFrequency, now);
  oscillator.frequency.linearRampToValueAtTime(safeFrequency * 0.996, now + duration);

  const oscillatorGain = ctx.createGain();
  oscillatorGain.gain.setValueAtTime(0.075, now);
  oscillatorGain.gain.setValueAtTime(0.055, now + duration * 0.78);
  oscillatorGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
  oscillator.connect(oscillatorGain);
  oscillatorGain.connect(masterGain);

  const noise = ctx.createBufferSource();
  noise.buffer = createNoiseBuffer(ctx, duration);

  const bandPass = ctx.createBiquadFilter();
  bandPass.type = 'bandpass';
  bandPass.frequency.setValueAtTime(safeFrequency, now);
  bandPass.Q.setValueAtTime(14, now);

  const lowPass = ctx.createBiquadFilter();
  lowPass.type = 'lowpass';
  lowPass.frequency.setValueAtTime(Math.max(900, safeFrequency * 3), now);

  const noiseGain = ctx.createGain();
  noiseGain.gain.setValueAtTime(0.19, now);
  noiseGain.gain.setValueAtTime(0.11, now + duration * 0.72);
  noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  noise.connect(bandPass);
  bandPass.connect(lowPass);
  lowPass.connect(noiseGain);
  noiseGain.connect(masterGain);

  oscillator.start(now);
  noise.start(now);
  oscillator.stop(now + duration);
  noise.stop(now + duration);

  window.setTimeout(() => {
    oscillator.disconnect();
    noise.disconnect();
    bandPass.disconnect();
    lowPass.disconnect();
    oscillatorGain.disconnect();
    noiseGain.disconnect();
    masterGain.disconnect();
  }, (duration + 0.35) * 1000);
}
