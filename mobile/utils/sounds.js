/**
 * Spotix — Sound Effects Utility
 * Uses expo-audio (SDK 54+) with programmatic WAV generation
 */
import * as FileSystem from 'expo-file-system';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

// WAV file helper
function createWavBase64(samples, sampleRate = 22050) {
  const numSamples = samples.length;
  const dataSize = numSamples * 2;
  const headerSize = 44;
  const bytes = new Uint8Array(headerSize + dataSize);
  const view = new DataView(bytes.buffer);

  // RIFF header
  bytes[0]=82;bytes[1]=73;bytes[2]=70;bytes[3]=70; // RIFF
  view.setUint32(4, 36 + dataSize, true);
  bytes[8]=87;bytes[9]=65;bytes[10]=86;bytes[11]=69; // WAVE
  bytes[12]=102;bytes[13]=109;bytes[14]=116;bytes[15]=32; // fmt
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  bytes[36]=100;bytes[37]=97;bytes[38]=116;bytes[39]=97; // data
  view.setUint32(40, dataSize, true);

  for (let i = 0; i < numSamples; i++) {
    const val = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(headerSize + i * 2, val * 32767, true);
  }

  // Convert to base64
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let b64 = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i], b = bytes[i+1] || 0, c = bytes[i+2] || 0;
    b64 += chars[a >> 2] + chars[((a & 3) << 4) | (b >> 4)] +
      (i+1 < bytes.length ? chars[((b & 15) << 2) | (c >> 6)] : '=') +
      (i+2 < bytes.length ? chars[c & 63] : '=');
  }
  return b64;
}

function generateSuccessTone() {
  const sr = 22050, dur = 0.45;
  const s = new Float32Array(Math.floor(sr * dur));
  for (let i = 0; i < s.length; i++) {
    const t = i / sr;
    if (t < 0.2) {
      const env = Math.min(1, t * 20) * Math.max(0, 1 - (t - 0.15) * 8);
      s[i] = Math.sin(2 * Math.PI * 523 * t) * 0.4 * env;
    } else {
      const t2 = t - 0.15;
      const env = Math.min(1, (t - 0.15) * 15) * Math.max(0, 1 - (t - 0.35) * 8);
      s[i] = (Math.sin(2 * Math.PI * 659 * t2) * 0.35 + Math.sin(2 * Math.PI * 784 * t2) * 0.2) * env;
    }
  }
  return s;
}

function generateFailTone() {
  const sr = 22050, dur = 0.5;
  const s = new Float32Array(Math.floor(sr * dur));
  for (let i = 0; i < s.length; i++) {
    const t = i / sr;
    const env = Math.min(1, t * 30) * Math.max(0, 1 - t * 2.5);
    const freq = 400 - 200 * (t / dur);
    s[i] = (Math.sin(2 * Math.PI * freq * t) * 0.35 + Math.sin(2 * Math.PI * freq * 1.5 * t) * 0.15) * env;
  }
  return s;
}

let successPlayer = null;
let failPlayer = null;
let initialized = false;

async function ensureInit() {
  if (initialized) return;
  try {
    await setAudioModeAsync({ playsInSilentMode: true });
    initialized = true;
  } catch (e) {
    console.log('Audio mode error:', e);
  }
}

async function ensureFile(name, samples) {
  const dir = FileSystem.cacheDirectory + 'spotix_sounds/';
  const path = dir + name;
  const info = await FileSystem.getInfoAsync(path);
  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(dir, { intermediates: true });
    const b64 = createWavBase64(samples);
    await FileSystem.writeAsStringAsync(path, b64, { encoding: FileSystem.EncodingType.Base64 });
  }
  return path;
}

export async function playSuccess() {
  try {
    await ensureInit();
    if (successPlayer) {
      successPlayer.seekTo(0);
      successPlayer.play();
    } else {
      const uri = await ensureFile('success.wav', generateSuccessTone());
      successPlayer = createAudioPlayer({ uri });
      successPlayer.play();
    }
  } catch (e) {
    console.log('Play success error:', e);
  }
}

export async function playFail() {
  try {
    await ensureInit();
    if (failPlayer) {
      failPlayer.seekTo(0);
      failPlayer.play();
    } else {
      const uri = await ensureFile('fail.wav', generateFailTone());
      failPlayer = createAudioPlayer({ uri });
      failPlayer.play();
    }
  } catch (e) {
    console.log('Play fail error:', e);
  }
}

export default { playSuccess, playFail };
