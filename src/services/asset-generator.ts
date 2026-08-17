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

/** Estilo visual cinematográfico premium: caricatura satírica editorial de alto impacto para TV. */
const STYLE_PREFIX =
  'Masterpiece editorial political caricature illustration in the style of top satirical magazines (The Economist, Time, Der Spiegel), exaggerated expressive facial features, bold ink contours, dramatic broadcast TV studio rim lighting, vibrant volumetric colors, high-octane live television debate atmosphere, 8k resolution, award-winning character design, no text, no watermark, no typography.';

export type AvatarPose = 'BASE' | 'POINTING' | 'OUTRAGED' | 'SMUG' | 'ANGRY' | 'PANEL' | 'CLOSE_UP';

export function personaPosePrompt(p: PersonaProfile, pose: AvatarPose = 'BASE'): string {
  const poseDescriptions: Record<AvatarPose, string> = {
    BASE: 'Bust portrait, confident and alert expression, looking straight at the TV broadcast camera, hands near the desk, professional TV studio posture.',
    POINTING: 'Dynamic aggressive posture, leaning forward over the debate desk, pointing an accusatory index finger directly at the rival, intense fiery stare, furious mouth open.',
    OUTRAGED: 'Extreme explosion of anger, shouting at the top of their lungs, slamming both hands on the wooden TV desk, wide wild eyes, veins popping, total television meltdown.',
    SMUG: 'Arrogant superior smirk, arms crossed over chest, head slightly tilted back, half-closed dismissive eyes, mocking the opponent with absolute condescension.',
    ANGRY: 'Tight clenched teeth, furrowed heavy brows, clenched fist resting firmly on the debate table, tense ready-to-attack pose, dark red background backlights.',
    PANEL: 'Medium shot sitting behind the modern curved TV panel desk with a broadcast microphone in front, engaging with the debate panel, full upper torso visible.',
    CLOSE_UP: 'Extreme cinematic close-up on the face, intense rim lighting on the cheekbones, dramatic high-tension facial expression, deep shadows, live breaking news tension.'
  };

  return `${STYLE_PREFIX} Character: ${p.name} (${p.archetype}). Political persona: ${p.ideology}. Tone: ${p.tone}. Visual role: ${p.alias}. ${poseDescriptions[pose]} Wearing iconic high-end TV debate attire, studio lighting highlights in ruby red and cobalt blue.`;
}

const BACKGROUND_PROMPTS: Record<CameraCue, string> = {
  SPEAKER_FOCUS:
    `${STYLE_PREFIX} Broadcast TV debate set background: curved high-tech panelist desk, vibrant LED wall with dark blue and crimson ambient glow, dramatic overhead spotlights, empty speaker podium illuminated in center, prime-time live show ambiance.`,
  SPLIT_SCREEN_VERSUS:
    `${STYLE_PREFIX} Broadcast TV duel set background: two opposing illuminated debate podiums facing each other, divided lighting split in red versus cyan, electric tension lines, metallic studio truss grid.`,
  WIDE_PANEL:
    `${STYLE_PREFIX} Wide panoramic establishing shot of a modern political talk show TV studio: 6-seat curved wooden and glass desk, giant background LED matrix screen, atmospheric studio haze, vibrant broadcast lighting.`,
  REACTION_SHOT:
    `${STYLE_PREFIX} TV studio reaction camera angle: background audience silhouette slightly blurred, flashing warning amber and red set lighting, chaotic fast-paced broadcast studio environment.`
};

export interface GenerateAssetsOptions {
  personasPath?: string;
  avatarsDir?: string;
  backgroundsDir?: string;
  force?: boolean;
  poses?: AvatarPose[];
}

/**
 * Genera retratos de personajes en múltiples poses y fondos de estudio con OpenAI gpt-image-1.
 */
export async function generateAllAssets(options: GenerateAssetsOptions = {}): Promise<string[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY no configurada (agregarla en .env).');

  const personasPath = options.personasPath || path.join(rootDir, 'src', 'config', 'personas.json');
  const avatarsDir = options.avatarsDir || path.join(rootDir, 'src', 'assets', 'avatars');
  const backgroundsDir = options.backgroundsDir || path.join(rootDir, 'src', 'assets', 'backgrounds');
  const posesToGenerate: AvatarPose[] = options.poses || ['BASE', 'POINTING', 'OUTRAGED', 'SMUG', 'ANGRY', 'PANEL'];

  const personas = JSON.parse(await readFile(personasPath, 'utf-8')) as PersonaProfile[];
  mkdirSync(avatarsDir, { recursive: true });
  mkdirSync(backgroundsDir, { recursive: true });

  const generated: string[] = [];

  // 1. Generar retratos y poses por cada personaje
  for (const persona of personas) {
    for (const pose of posesToGenerate) {
      const fileName = pose === 'BASE' ? `${persona.id}.png` : `${persona.id}_${pose}.png`;
      const outPath = path.join(avatarsDir, fileName);

      if (!options.force && existsSync(outPath)) {
        console.log(`[ASSETS] ${fileName} ya existe, omitiendo.`);
        continue;
      }

      console.log(`[ASSETS] Generando pose ${pose} para: ${persona.name}...`);
      const prompt = personaPosePrompt(persona, pose);
      const image = await requestImage(prompt, apiKey);
      await writeFile(outPath, image);
      generated.push(outPath);
      console.log(`[ASSETS] -> ${fileName} OK.`);
    }
  }

  // 2. Fondos por cameraCue con 3 variantes de iluminación cada uno
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
      n: 1,
      size: '1024x1024'
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`OpenAI Images API error (${res.status}): ${errorText}`);
  }

  const json = (await res.json()) as { data?: { b64_json?: string; url?: string }[] };
  const first = json.data?.[0];
  if (!first) throw new Error('No se recibió imagen en la respuesta de OpenAI.');

  if (first.b64_json) {
    return Buffer.from(first.b64_json, 'base64');
  }
  if (first.url) {
    const imgRes = await fetch(first.url);
    if (!imgRes.ok) throw new Error(`Error descargando imagen desde URL: ${imgRes.status}`);
    return Buffer.from(await imgRes.arrayBuffer());
  }

  throw new Error('Formato de imagen no reconocido.');
}
