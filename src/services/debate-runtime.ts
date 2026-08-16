try {
  process.loadEnvFile?.();
} catch {
  // Ignorar si no existe archivo .env
}

import { EmotionState, CameraCue } from '../types/debate.js';

export interface DebateRuntimeOptions {
  model?: string;
  temperature?: number;
}

interface ChatCompletionResponse {
  choices?: { message?: { content?: string } }[];
}

const OLLAMA_DEFAULT_MODEL = 'hf.co/HauhauCS/Gemma4-12B-QAT-Uncensored-HauhauCS-Balanced:Q4_K_M';

/**
 * Runtime sin censura para el debate: Ollama local ($0 tokens) -> heurístico local.
 * Sin OpenRouter: el debate corre 100% local.
 */
export async function completeText(prompt: string, options: DebateRuntimeOptions = {}): Promise<string> {
  const ollamaResult = await tryOllama(prompt, options);
  if (ollamaResult) return ollamaResult;

  console.log('[RUNTIME] Ollama no disponible. Generando turno heurístico local...');
  return generateHeuristicTurn();
}

async function tryOllama(prompt: string, options: DebateRuntimeOptions): Promise<string | null> {
  const host = process.env.OLLAMA_HOST || 'http://localhost:11434';
  try {
    const res = await fetch(`${host}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model || OLLAMA_DEFAULT_MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature ?? 0.85,
        stream: false
      }),
      signal: AbortSignal.timeout(180_000)
    });

    if (res.ok) {
      const data = (await res.json()) as ChatCompletionResponse;
      const text = data?.choices?.[0]?.message?.content;
      if (text) return text;
    } else {
      console.warn(`[RUNTIME] Ollama error (${res.status}): ${(await res.text()).slice(0, 200)}`);
    }
  } catch (err) {
    console.warn(`[RUNTIME] Ollama no disponible: ${err instanceof Error ? err.message : String(err)}`);
  }
  return null;
}

const EMOTIONS: EmotionState[] = ['CALM', 'TALKING', 'ANGRY', 'OUTRAGED', 'SMUG', 'MOCKING', 'INTERRUPTING'];
const CAMERA_CUES: CameraCue[] = ['SPEAKER_FOCUS', 'SPLIT_SCREEN_VERSUS', 'WIDE_PANEL', 'REACTION_SHOT'];

function generateHeuristicTurn(): string {
  const emotion = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)];
  const cameraCue = CAMERA_CUES[Math.floor(Math.random() * CAMERA_CUES.length)];
  const tensionDelta = Math.floor(Math.random() * 31) - 10; // -10 a +20
  // ponytail: speechText vacío -> el orquestador lo rellena con las muletillas del personaje (getFallbackSpeech)
  return JSON.stringify({ speechText: '', emotion, cameraCue, tensionDelta });
}
