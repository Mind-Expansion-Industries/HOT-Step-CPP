// analyze-wavs.mjs — Waveform analysis of benchmark audio files
// Reads raw PCM samples and computes statistics to detect failed generations.

import fs from 'fs';
import path from 'path';

const DIR = path.resolve('.');

function readWav16(filePath) {
  const buf = fs.readFileSync(filePath);
  
  // Parse WAV header
  const riff = buf.toString('ascii', 0, 4);
  if (riff !== 'RIFF') throw new Error('Not a WAV file');
  
  const fmt = buf.toString('ascii', 12, 16);
  if (fmt !== 'fmt ') throw new Error('Missing fmt chunk');
  
  const audioFormat = buf.readUInt16LE(20);
  const channels = buf.readUInt16LE(22);
  const sampleRate = buf.readUInt32LE(24);
  const bitsPerSample = buf.readUInt16LE(34);
  
  // Find data chunk
  let offset = 36;
  while (offset < buf.length - 8) {
    const chunkId = buf.toString('ascii', offset, offset + 4);
    const chunkSize = buf.readUInt32LE(offset + 4);
    if (chunkId === 'data') {
      offset += 8;
      break;
    }
    offset += 8 + chunkSize;
  }
  
  // Read samples (16-bit signed PCM)
  const bytesPerSample = bitsPerSample / 8;
  const numSamples = Math.floor((buf.length - offset) / bytesPerSample);
  const samples = new Float32Array(numSamples);
  
  for (let i = 0; i < numSamples; i++) {
    if (bitsPerSample === 16) {
      samples[i] = buf.readInt16LE(offset + i * 2) / 32768.0;
    } else if (bitsPerSample === 32) {
      samples[i] = buf.readFloatLE(offset + i * 4);
    }
  }
  
  return { samples, sampleRate, channels, bitsPerSample };
}

function analyzeAudio(samples, sampleRate, channels) {
  const n = samples.length;
  if (n === 0) return { verdict: 'EMPTY', rms: 0, peak: 0 };
  
  // Basic statistics
  let sum = 0, sumSq = 0, peak = 0, zeroCount = 0;
  let min = Infinity, max = -Infinity;
  
  for (let i = 0; i < n; i++) {
    const v = samples[i];
    const abs = Math.abs(v);
    sum += v;
    sumSq += v * v;
    if (abs > peak) peak = abs;
    if (v < min) min = v;
    if (v > max) max = v;
    if (abs < 0.001) zeroCount++;
  }
  
  const rms = Math.sqrt(sumSq / n);
  const mean = sum / n;
  const silenceRatio = zeroCount / n;
  const peakDB = peak > 0 ? 20 * Math.log10(peak) : -120;
  const rmsDB = rms > 0 ? 20 * Math.log10(rms) : -120;
  const crestFactor = peak / (rms || 1e-10); // peak-to-RMS ratio
  
  // Segment analysis: split into 1-second chunks and measure RMS variation
  const chunkSize = sampleRate * channels; // 1 second of samples
  const numChunks = Math.floor(n / chunkSize);
  const chunkRms = [];
  
  for (let c = 0; c < numChunks; c++) {
    let cSumSq = 0;
    for (let i = c * chunkSize; i < (c + 1) * chunkSize; i++) {
      cSumSq += samples[i] * samples[i];
    }
    chunkRms.push(Math.sqrt(cSumSq / chunkSize));
  }
  
  // Dynamic range: variation in per-second RMS
  let rmsMin = Infinity, rmsMax = 0;
  for (const r of chunkRms) {
    if (r < rmsMin) rmsMin = r;
    if (r > rmsMax) rmsMax = r;
  }
  const dynamicRangeDB = rmsMax > 0 && rmsMin > 0 
    ? 20 * Math.log10(rmsMax / rmsMin) 
    : 0;
  
  // Count how many chunks are effectively silent (< -60 dB)
  const silentChunks = chunkRms.filter(r => r < 0.001).length;
  
  // Verdict
  let verdict = 'GOOD';
  let notes = [];
  
  if (rms < 0.001) {
    verdict = 'SILENT';
    notes.push('Near-zero RMS — no audio generated');
  } else if (silenceRatio > 0.95) {
    verdict = 'MOSTLY_SILENT';
    notes.push(`${(silenceRatio * 100).toFixed(1)}% silence`);
  } else if (peak > 0.99 && crestFactor < 2.0) {
    verdict = 'CLIPPED/NOISE';
    notes.push('Hard clipping or pure noise detected');
  } else if (dynamicRangeDB < 1.0 && rms > 0.01) {
    verdict = 'FLAT_NOISE';
    notes.push('No dynamics — likely static/noise rather than music');
  } else if (silentChunks > numChunks * 0.5) {
    verdict = 'PARTIAL';
    notes.push(`${silentChunks}/${numChunks} silent seconds`);
  } else {
    // Looks like real audio
    if (dynamicRangeDB > 3) notes.push('Good dynamics');
    if (crestFactor > 3) notes.push('Good transients');
    if (rmsDB > -30 && rmsDB < -6) notes.push('Healthy level');
  }
  
  return {
    verdict,
    rms: rms.toFixed(4),
    rmsDB: rmsDB.toFixed(1),
    peak: peak.toFixed(4),
    peakDB: peakDB.toFixed(1),
    crestFactor: crestFactor.toFixed(1),
    dynamicRangeDB: dynamicRangeDB.toFixed(1),
    silenceRatio: (silenceRatio * 100).toFixed(1) + '%',
    silentChunks: `${silentChunks}/${numChunks}`,
    notes: notes.join('; ') || 'Normal',
  };
}

// ─── Main ────────────────────────────────────────────────────────────────────

const files = fs.readdirSync(DIR)
  .filter(f => f.startsWith('benchmark_') && f.endsWith('.wav'))
  .sort();

console.log('╔══════════════════════════════════════════════════════════════════╗');
console.log('║  Waveform Analysis — Quantization Benchmark                    ║');
console.log('╚══════════════════════════════════════════════════════════════════╝\n');

const results = [];

for (const file of files) {
  const model = file.replace('benchmark_', '').replace('.wav', '');
  try {
    const { samples, sampleRate, channels, bitsPerSample } = readWav16(path.join(DIR, file));
    const analysis = analyzeAudio(samples, sampleRate, channels);
    
    const icon = analysis.verdict === 'GOOD' ? '✅' : 
                 analysis.verdict === 'SILENT' || analysis.verdict === 'MOSTLY_SILENT' ? '❌' :
                 analysis.verdict === 'PARTIAL' ? '⚠️' : '⚠️';
    
    console.log(`${icon} ${model.padEnd(12)} | RMS: ${analysis.rmsDB.padStart(6)} dB | Peak: ${analysis.peakDB.padStart(6)} dB | Crest: ${analysis.crestFactor.padStart(5)} | DR: ${analysis.dynamicRangeDB.padStart(5)} dB | ${analysis.verdict} — ${analysis.notes}`);
    
    results.push({ model, ...analysis });
  } catch (e) {
    console.log(`❌ ${model.padEnd(12)} | ERROR: ${e.message}`);
    results.push({ model, verdict: 'ERROR', notes: e.message });
  }
}

// Summary
console.log('\n─'.repeat(80));
const good = results.filter(r => r.verdict === 'GOOD').length;
const bad = results.filter(r => ['SILENT', 'MOSTLY_SILENT', 'CLIPPED/NOISE', 'FLAT_NOISE', 'ERROR'].includes(r.verdict)).length;
const partial = results.filter(r => r.verdict === 'PARTIAL').length;
console.log(`\nTotal: ${files.length} | ✅ Good: ${good} | ⚠️ Partial: ${partial} | ❌ Failed: ${bad}`);

// Save results
fs.writeFileSync(path.join(DIR, 'waveform-analysis.json'), JSON.stringify(results, null, 2));
console.log(`\nSaved: waveform-analysis.json`);
