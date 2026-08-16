try {
  process.loadEnvFile?.();
} catch {
  // Ignorar si no existe archivo .env
}

export interface LLMOptions {
  model?: string;
  temperature?: number;
}

/**
 * Cliente LLM unificado y resiliente (Gemini REST, OpenRouter, Ollama y Mock Fallback).
 */
export async function completeText(prompt: string, options: LLMOptions = {}): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const ollamaHost = process.env.OLLAMA_HOST || 'http://localhost:11434';

  // 1. Google Gemini API (Direct REST - Zero extra SDKs needed)
  if (geminiKey) {
    try {
      const model = options.model || 'gemini-2.5-flash';
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: options.temperature ?? 0.3,
            responseMimeType: "application/json"
          }
        })
      });

      if (res.ok) {
        const data: any = await res.json();
        const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) return text;
      } else {
        console.warn(`[WARN] Gemini API error (${res.status}): ${await res.text()}`);
      }
    } catch (err: any) {
      console.warn(`[WARN] Fallo llamada a Gemini API: ${err.message}`);
    }
  }

  // 2. OpenRouter API
  if (openRouterKey) {
    try {
      const model = options.model || 'deepseek/deepseek-chat';
      const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openRouterKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [{ role: 'user', content: prompt }],
          temperature: options.temperature ?? 0.3
        })
      });

      if (res.ok) {
        const data: any = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) return text;
      }
    } catch (err: any) {
      console.warn(`[WARN] Fallo llamada a OpenRouter: ${err.message}`);
    }
  }

  // 3. Fallback Heurístico Local si no hay API Key configurada
  console.log('[INFO] Sin GEMINI_API_KEY ni OPENROUTER_API_KEY detectadas. Generando pauta con sintetizador heurístico local...');
  return generateHeuristicPautaMock();
}

function generateHeuristicPautaMock(): string {
  return JSON.stringify({
    episodeId: `ep-semana-${new Date().toISOString().slice(0, 10)}`,
    theme: "¡ARDERÁ EL ESTUDIO! CRISIS DE SEGURIDAD, REFORMA POLÍTICA Y EL COLAPSO DEL ESTABLECIMIENTO",
    period: `Últimos 7 días (${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })})`,
    blocks: [
      {
        blockNumber: 1,
        topic: "Crisis de Seguridad y Medidas de Excepción en Chile",
        region: "CL",
        headlineGC: "¡ARDERÁ EL ESTUDIO! ¿ESTADO DE SITIO O DICTADURA DISFRAZADA?",
        factsSummary: "Durante los últimos 7 días se intensificó la presión parlamentaria por desplegar a las Fuerzas Armadas en zonas urbanas tras una seguidilla de crímenes de alto impacto.",
        moderatorTriggerQuestion: "¿Hasta cuándo esperamos para sacar a los militares a la calle con plenas facultades, o le tienen pánico a los organismos de derechos humanos?",
        personaTriggers: {
          karl_marx: "Denuncia que las FFAA y la policía son el brazo armado del capital para reprimir a la clase trabajadora ante el fracaso del modelo neoliberal.",
          joven_incel: "Sostiene que la sociedad moderna está podrida por la falta de disciplina y pide mano dura sin restricciones ni 'corrección política'.",
          fanatico_religioso: "Interpreta el desborde de violencia como castigo divino ante la pérdida de valores morales y la secularización.",
          politico_populista: "Promete cárceles de máxima seguridad y penas del infierno para ganar votos fáciles en el matinal."
        }
      },
      {
        blockNumber: 2,
        topic: "Tensiones Geopolíticas y Giros Electorales en LATAM",
        region: "LATAM",
        headlineGC: "¡BATALLA CAMPAL! ¿SOCIALISMO DEL SIGLO XXI O SHOCK LIBERTARIO?",
        factsSummary: "Declaraciones cruzadas entre mandatarios de la región marcan una fractura diplomática sobre el rumbo económico y las relaciones internacionales.",
        moderatorTriggerQuestion: "¿El modelo de shock económico es la única salida para América Latina o estamos ante un experimento inhumano?",
        personaTriggers: {
          karl_marx: "Analiza el imperialismo y la extracción de recursos como la raíz histórica de la miseria latinoamericana.",
          joven_incel: "Defiende el libre mercado extremo y ridiculiza el estado de bienestar con memes y datos de internet.",
          fanatico_religioso: "Alerta sobre la agenda globalista y los peligros de desviarse de los mandatos bíblicos.",
          politico_populista: "Se acomoda al discurso de moda buscando no perder votos de ninguno de los dos bandos."
        }
      },
      {
        blockNumber: 3,
        topic: "Conflictos Globales y Disputa por la Hegemonía Mundial",
        region: "WORLD",
        headlineGC: "¡TERCERA GUERRA MUNDIAL! ¿OCCIDENTE EN DECADENCIA?",
        factsSummary: "Escalamiento en frentes internacionales y reacomodo de alianzas militares entre potencias globales durante la última semana.",
        moderatorTriggerQuestion: "¿Estamos a las puertas de un conflicto mundial a gran escala y qué bando debería apoyar nuestro país?",
        personaTriggers: {
          karl_marx: "Califica la guerra como la etapa superior de la disputa entre bloques imperialistas por el reparto de mercados.",
          joven_incel: "Celebra el colapso del orden global y disfruta viendo a los líderes mundiales humillados en redes.",
          fanatico_religioso: "Profetiza el fin de los tiempos y el juicio venidero sobre las naciones soberbias.",
          politico_populista: "Emite comunicados vagos de 'condena enérgica' sin comprometerse con ninguna postura."
        }
      }
    ]
  }, null, 2);
}
