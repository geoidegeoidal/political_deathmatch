try {
  process.loadEnvFile?.();
} catch {
  // Ignorar si no existe archivo .env
}

import { existsSync, mkdirSync } from 'fs';
import { readFile, writeFile } from 'fs/promises';
import path from 'path';
import { PersonaProfile } from '../types/debate.js';
import { CameraCue } from '../types/debate.js';

const rootDir = process.cwd();
const IMAGES_URL = 'https://api.openai.com/v1/images/generations';
const IMAGE_MODEL = 'gpt-image-1';

/** Estilo visual único del programa (caricatura satírica semi-realista, nunca fotorrealista). */
const STYLE_PREFIX =
  'Semi-realistic satirical cartoon caricature, exaggerated facial features, stylized illustrated portrait, dramatic broadcast TV studio lighting, vibrant editorial illustration style, no text, no watermark, no letters.';

function personaPrompt(p: PersonaProfile): string {
  return `${STYLE_PREFIX} Retrato de busto de un personaje de debate televisivo chileno: ${p.archetype}. Personalidad: ${p.ideology}. Estilo de hablar: ${p.tone}. Apariencia acorde a su rol (${p.alias}), con rasgos exagerados y cómicos pero imponentes, vestimenta de estudio de TV, fondo de set de debate rojo y negro.`;
}

const BACKGROUND_PROMPTS: Record<CameraCue, string> = {
  SPEAKER_FOCUS:
    `${STYLE_PREFIX} Escenografía de estudio de TV de debate chileno: panel LED azul oscuro, escritorio de panelistas curvo, focos dramáticos, silla de orador central iluminada, ambiente de programa en vivo nocturno.`,
  SPLIT_SCREEN_VERSUS:
    `${STYLE_PREFIX} Escenografía de estudio de TV de debate dividido en dos escenarios enfrentados con luces rojas y azules, mesa central con dos podios enfrentados, ambiente tenso de duelo televisivo nocturno.`,
  WIDE_PANEL:
    `${STYLE_PREFIX} Vista panorámica de estudio de TV de debate chileno: mesa larga con 6 asientos, panel LED con el logo de un programa en vivo, público de fondo borroso, luces de matinal sensacionalista, ambiente al rojo vivo.`,
  REACTION_SHOT:
    `${STYLE_PREFIX} Escenografía de estudio de TV de debate chileno: plano del público y panelistas reaccionando, luces rojas de alerta, ambiente caótico de programa en vivo, cámara de reacción rápida.`
};

export interface GenerateAssetsOptions {
  personasPath?: string;
  avatarsDir?: string;
  backgroundsDir?: string;
  force?: boolean;
}

interface ImageGenerationResponse {
  data?: { b64_json?: string; url?: string }[];
}/**
 * Genera retratos de personajes y fondos de estudio con OpenAI gpt-image-1
 * (one-shot: skip si el asset ya existe). Persistente: los PNG se commitean.
 */
export async function generateAllAssets(options: GenerateAssetsOptions = {}): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY no configurada (agregarla en .env).');

  const personasPath = options.personasPath || path.join(rootDir, 'src', 'config', 'personas.json');
  const avatarsDir = options.avatarsDir || path.join(rootDir, 'src', 'assets', 'avatars');
  const backgroundsDir = options.backgroundsDir || path.join(rootDir, 'src', 'assets', 'backgrounds');

  const personas = JSON.parse(await readFile(personasPath, 'utf-8')) as PersonaProfile[];
  mkdirSync(avatarsDir, { recursive: true });
  mkdirSync(backgroundsDir, { recursive: true });

  const generated: string[] = [];

  // Retratos por personaje
  for (const persona of personas) {
    const outPath = path.join(avatarsDir, `${persona.id}.png`);
    if (!options.force && existsSync(outPath)) {
      console.log(`[ASSETS] ${persona.id}.png ya existe, omitiendo.`);
      continue;
    }
    console.log(`[ASSETS] Generando retrato: ${persona.name}...`);
    const image = await requestImage(personaPrompt(persona), apiKey);
    await writeFile(outPath, image);
    generated.push(outPath);
    console.log(`[ASSETS] -> ${persona.id}.png OK.`);
  }

  // Fondos por cameraCue: 3 variantes cada uno (variedad visual por bloque)
  const cues: CameraCue[] = ['SPEAKER_FOCUS', 'SPLIT_SCREEN_VERSUS', 'WIDE_PANEL', 'REACTION_SHOT'];
  for (const cue of cues) {
    for (let v = 1; v <= 3; v++) {
      const outPath = path.join(backgroundsDir, `${cue}_${v}.png`);
      if (!options.force && existsSync(outPath)) {
        console.log(`[ASSETS] ${cue}_${v}.png ya existe, omitiendo.`);
        continue;
      }
      console.log(`[ASSETS] Generando fondo: ${cue}_${v}...`);
      const image = await requestImage(BACKGROUND_PROMPTS[cue], apiKey);
      await writeFile(outPath, image);
      generated.push(outPath);
      console.log(`[ASSETS] -> ${cue}_${v}.png OK.`);
    }
  }

  return generated;
}

async function requestImage(prompt: string, apiKey: string): Promise<Buffer> {
  const res = await fetch(IMAGES_URL, {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt,
      size: '1024x1024',
      quality: 'medium',
      n: 1
    }),
    signal: AbortSignal.timeout(180_000)
  });
  if (!res.ok) {
    const body = (await res.text()).slice(0, 300);
    throw new Error(`OpenAI images error ${res.status}: ${body}`);
  }
  const data = (await res.json()) as ImageGenerationResponse;
  const b64 = data?.data?.[0]?.b64_json;
  if (b64) return Buffer.from(b64, 'base64');
  const url = data?.data?.[0]?.url;
  if (!url) throw new Error('OpenAI images no devolvió imagen.');
  const imgRes = await fetch(url, { signal: AbortSignal.timeout(120_000) });
  if (!imgRes.ok) throw new Error(`Descarga de imagen falló: ${imgRes.status}`);
  return Buffer.from(await imgRes.arrayBuffer());
}
