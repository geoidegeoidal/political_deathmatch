try {
  process.loadEnvFile?.();
} catch {
  // Ignorar si no existe archivo .env
}

import { existsSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';
import path from 'path';
import { spawnSync } from 'child_process';

const rootDir = process.cwd();
const MUSIC_DIR = path.join(rootDir, 'output', 'audio', 'music');

interface MusicJob {
  id: string;
  prompt: string;
  seconds: number;
}

/** Pistas del programa según la matriz de mezcla del design 005. */
export const MUSIC_JOBS: MusicJob[] = [
  {
    id: 'intro_theme',
    prompt: 'dramatic intense TV debate show intro theme, orchestral hits, powerful drums, tension build, broadcast television opening, epic',
    seconds: 30
  },
  {
    id: 'bed_ambient',
    prompt: 'tense dark ambient pad music, low drone, suspense background for TV debate studio, subtle, no melody',
    seconds: 25
  },
  {
    id: 'stinger_block',
    prompt: 'short news sting hit, dramatic impact sound, broadcast television transition, percussion slam',
    seconds: 3
  },
  {
    id: 'stinger_duel',
    prompt: 'epic duel face-off sting, cinematic tension hit, powerful orchestral slam, western standoff',
    seconds: 4
  }
];

/**
 * Genera las pistas musicales con MusicGen local (facebook/musicgen-small).
 * Skip si el archivo ya existe.
 */
export async function generateProgramMusic(outDir: string = MUSIC_DIR): Promise<string[]> {
  mkdirSync(outDir, { recursive: true });

  const pending = MUSIC_JOBS.filter(j => !existsSync(path.join(outDir, `${j.id}.wav`)));
  const generated: string[] = [];

  if (pending.length === 0) {
    console.log('[MUSIC] Todas las pistas ya existen.');
    return generated;
  }

  const jobsPath = path.join(outDir, '_jobs.json');
  await writeFile(jobsPath, JSON.stringify(pending, null, 1), 'utf-8');

  const worker = path.join(rootDir, 'scripts', 'musicgen-worker.py');
  const res = spawnSync('python', [worker, jobsPath, outDir], { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (res.status !== 0) {
    throw new Error(`MusicGen falló:\n${res.stderr}`);
  }

  for (const j of pending) {
    generated.push(path.join(outDir, `${j.id}.wav`));
  }
  return generated;
}
