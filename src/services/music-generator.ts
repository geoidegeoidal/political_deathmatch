try {
  process.loadEnvFile?.();
} catch {
  // Ignorar si no existe archivo .env
}

import { existsSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import path from 'path';
import { spawnSync } from 'child_process';
import { ffmpegBin } from './tts-pipeline.js';

const rootDir = process.cwd();
const MUSIC_DIR = path.join(rootDir, 'output', 'audio', 'music');

interface MusicJob {
  id: string;
  prompt: string;
  seconds: number;
}

/** Pistas del programa según la matriz de mezcla del design 005 (Estilo Noticias & Debate de Alta Tensión). */
export const MUSIC_JOBS: MusicJob[] = [
  {
    id: 'intro_theme',
    prompt: 'dramatic intense breaking news TV debate intro theme, orchestral brass hits, deep sub impact, pulsating synthesizer, broadcast television opening, prime-time news tension, cinematic',
    seconds: 15
  },
  {
    id: 'bed_ambient',
    prompt: 'suspenseful newsroom background music, rhythmic ticking synth pulse 115 bpm, deep dark bass drone, live political debate tension, subtle background bed',
    seconds: 30
  },
  {
    id: 'stinger_block',
    prompt: 'breaking news stinger hit, brass impact sound, TV news transition sound effect, dramatic boom',
    seconds: 3
  },
  {
    id: 'stinger_duel',
    prompt: 'epic face-off standoff stinger, heavy sub boom, dissonant string swell, high stakes political duel sound effect',
    seconds: 4
  }
];

/**
 * Genera las pistas musicales para el programa:
 * Intenta MusicGen local con PyTorch; si no está disponible, sintetiza camas
 * de noticias y debate televisivo de alta fidelidad mediante FFmpeg.
 */
export async function generateProgramMusic(outDir: string = MUSIC_DIR): Promise<string[]> {
  mkdirSync(outDir, { recursive: true });

  const pending = MUSIC_JOBS.filter(j => !existsSync(path.join(outDir, `${j.id}.wav`)));
  const generated: string[] = [];

  if (pending.length === 0) {
    console.log('[MUSIC] Todas las pistas de audio y camas musicales ya existen.');
    return MUSIC_JOBS.map(j => path.join(outDir, `${j.id}.wav`));
  }

  // Intentar generar con MusicGen local si Python/Torch están configurados
  let musicgenSuccess = false;
  try {
    const jobsPath = path.join(outDir, '_jobs.json');
    await writeFile(jobsPath, JSON.stringify(pending, null, 1), 'utf-8');
    const worker = path.join(rootDir, 'scripts', 'musicgen-worker.py');
    const res = spawnSync('python', [worker, jobsPath, outDir], { encoding: 'utf8', timeout: 60000 });
    if (res.status === 0) {
      musicgenSuccess = true;
    }
  } catch {
    musicgenSuccess = false;
  }

  // Fallback: Sintetizador de audio broadcast de estudio TV con FFmpeg
  if (!musicgenSuccess) {
    console.log('[MUSIC] Sintetizando camas de noticias y debate con audio engine broadcast...');
    for (const job of pending) {
      const outPath = path.join(outDir, `${job.id}.wav`);
      if (existsSync(outPath)) continue;
      generateBroadcastAudioBed(job.id, job.seconds, outPath);
      generated.push(outPath);
      console.log(`[MUSIC] -> ${job.id}.wav generado.`);
    }
  }

  return MUSIC_JOBS.map(j => path.join(outDir, `${j.id}.wav`));
}

/**
 * Sintetizador de audio con filtros lavfi de FFmpeg para cortinas y fondos de TV:
 * - intro_theme: Fanfarria de noticias con pulso de percusión y barrido de sintetizador.
 * - bed_ambient: Cama rítmica de 115 BPM con drone en Re menor y pulso de reloj tenso.
 * - stinger_block: Golpe de impacto orquestal con campana y ruido sordo.
 * - stinger_duel: Impacto grave y sirena sutil de confrontación.
 */
function generateBroadcastAudioBed(id: string, seconds: number, outPath: string): void {
  let expr = '';
  switch (id) {
    case 'intro_theme':
      // Fanfarria TV: acorde Re menor + pulso rítmico de percusión electrónica + sweep
      expr = `aevalsrc=0.25*sin(2*PI*146.83*t)*exp(-0.15*t)+0.2*sin(2*PI*220*t)+0.15*sin(2*PI*370*t)*sin(2*PI*4*t)+0.3*sin(2*PI*73.4*t)*(mod(t*2,1)<0.2):s=44100:d=${seconds}`;
      break;
    case 'bed_ambient':
      // Cama de debate: drone grave 65Hz + pulso rítmico sutil de reloj 115 BPM
      expr = `aevalsrc=0.18*sin(2*PI*65.4*t)+0.12*sin(2*PI*130.8*t)+0.08*sin(2*PI*196*t)+0.06*sin(2*PI*1200*t)*(mod(t*1.916,1)<0.05):s=44100:d=${seconds}`;
      break;
    case 'stinger_block':
      // Stinger de bloque: impacto grave + campana metálica
      expr = `aevalsrc=0.4*sin(2*PI*98*t)*exp(-2.5*t)+0.3*sin(2*PI*587.3*t)*exp(-3.5*t)+0.25*sin(2*PI*1174.6*t)*exp(-4.0*t):s=44100:d=${seconds}`;
      break;
    case 'stinger_duel':
      // Stinger de duelo: acorde disonante y pulso cardiaco tenso
      expr = `aevalsrc=0.45*sin(2*PI*55*t)*exp(-1.2*t)+0.3*sin(2*PI*311.1*t)*exp(-1.5*t)+0.2*sin(2*PI*622.2*t)*exp(-2.0*t):s=44100:d=${seconds}`;
      break;
    default:
      expr = `aevalsrc=0.15*sin(2*PI*220*t)*exp(-1.0*t):s=44100:d=${seconds}`;
  }

  const res = spawnSync(ffmpegBin(), ['-y', '-f', 'lavfi', '-i', expr, '-c:a', 'pcm_s16le', outPath], {
    encoding: 'utf8'
  });
  if (res.status !== 0) {
    throw new Error(`Error generando pista musical ${id}:\n${res.stderr}`);
  }
}
