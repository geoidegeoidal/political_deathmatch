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
 * Cliente LLM unificado y resiliente (Gemini REST y Mock Fallback).
 */
export async function completeText(prompt: string, options: LLMOptions = {}): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
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

  // 2. Ollama local (generación editorial sin costo)
  try {
    const res = await fetch(`${ollamaHost}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: options.model || 'hf.co/HauhauCS/Gemma4-12B-QAT-Uncensored-HauhauCS-Balanced:Q4_K_M',
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature ?? 0.3,
        stream: false
      }),
      signal: AbortSignal.timeout(180_000)
    });

    if (res.ok) {
      const data: any = await res.json();
      const text = data?.choices?.[0]?.message?.content;
      if (text) return text;
    } else {
      console.warn(`[WARN] Ollama error (${res.status}): ${(await res.text()).slice(0, 200)}`);
    }
  } catch (err: any) {
    console.warn(`[WARN] Fallo llamada a Ollama: ${err.message}`);
  }

  // 3. Fallback Heurístico Local
  console.log('[INFO] Sin GEMINI_API_KEY ni Ollama disponibles. Generando pauta con sintetizador heurístico local...');
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
        category: "SEGURIDAD",
        topic: "Crisis de Seguridad y Medidas de Excepción en Chile",
        region: "CL",
        headlineGC: "¡ARDERÁ EL ESTUDIO! ¿ESTADO DE SITIO O DICTADURA DISFRAZADA?",
        factsSummary: "Durante los últimos 7 días se intensificó la presión parlamentaria por desplegar a las Fuerzas Armadas en zonas urbanas tras una seguidilla de crímenes de alto impacto.",
        moderatorTriggerQuestion: "¿Hasta cuándo esperamos para sacar a los militares a la calle con plenas facultades, o le tienen pánico a los organismos de derechos humanos?",
        personaTriggers: {
          kaspar_mork: "Denuncia que las FFAA y la policía son el brazo armado del capital para reprimir a la clase trabajadora.",
          brayan_cyberpunk: "Sostiene que la sociedad moderna está podrida por la falta de disciplina y pide mano dura sin 'corrección política'.",
          pastor_isaias_benavides: "Interpreta el desborde de violencia como castigo divino ante la pérdida de valores morales.",
          washington_chamorro: "Promete cárceles de máxima seguridad y penas del infierno para ganar votos fáciles en el matinal."
        }
      },
      {
        blockNumber: 2,
        category: "FARANDULA",
        topic: "Escándalo de Infidelidad y Polémica entre Famosos e Influencers",
        region: "CL",
        headlineGC: "¡TERREMOTO EN LA FARÁNDULA! ¿HIPERGAMIA DIGITAL O CIRCO PARA DISTRAER AL PUEBLO?",
        factsSummary: "Filtración de chats privados y declaraciones cruzadas entre reconocidas figuras del espectáculo y streamers paralizan las redes sociales.",
        moderatorTriggerQuestion: "¿Es este el reflejo de la total decadencia moral de nuestra televisión o simplemente un negocio millonario de monetización del morbo?",
        personaTriggers: {
          kaspar_mork: "Desprecia la farándula como la industria del entretenimiento burgués diseñada para adormecer la conciencia de clase.",
          brayan_cyberpunk: "Se despacha con una diatriba sobre las dinámicas de pareja modernas, la vanidad de las redes sociales y el fin de los valores.",
          pastor_isaias_benavides: "Condena la lujuria, el exhibicionismo público y advierte que Sodoma y Gomorra palidecen ante la televisión actual.",
          washington_chamorro: "Finge estar indignado pero cita frases del escándalo para conectar con los televidentes más jóvenes."
        }
      },
      {
        blockNumber: 3,
        category: "INTERNACIONAL",
        topic: "Tensiones Geopolíticas y Giros Electorales en LATAM",
        region: "LATAM",
        headlineGC: "¡BATALLA CAMPAL! ¿SOCIALISMO DEL SIGLO XXI O SHOCK LIBERTARIO?",
        factsSummary: "Declaraciones cruzadas entre mandatarios de la región marcan una fractura diplomática sobre el rumbo económico y las relaciones internacionales.",
        moderatorTriggerQuestion: "¿El modelo de shock económico es la única salida para América Latina o estamos ante un experimento inhumano?",
        personaTriggers: {
          kaspar_mork: "Analiza el imperialismo y la extracción de recursos como la raíz histórica de la miseria latinoamericana.",
          brayan_cyberpunk: "Defiende el libre mercado extremo y ridiculiza el estado de bienestar con memes y datos de internet.",
          pastor_isaias_benavides: "Alerta sobre la agenda globalista y los peligros de desviarse de los mandatos bíblicos.",
          washington_chamorro: "Se acomoda al discurso de moda buscando no perder votos de ninguno de los dos bandos."
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
          kaspar_mork: "Califica la guerra como la etapa superior de la disputa entre bloques por el reparto de mercados.",
          brayan_cyberpunk: "Celebra el colapso del orden global y disfruta viendo a los líderes mundiales humillados en redes.",
          pastor_isaias_benavides: "Profetiza el fin de los tiempos y el juicio venidero sobre las naciones soberbias.",
          washington_chamorro: "Emite comunicados vagos de 'condena enérgica' sin comprometerse con ninguna postura."
        }
      }
    ]
  }, null, 2);
}
