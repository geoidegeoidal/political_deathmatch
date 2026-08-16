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

  // 2. OpenAI API (gpt-4o-mini - barato y profundo para la pauta editorial)
  const openaiKey = process.env.OPENAI_API_KEY;
  if (openaiKey) {
    try {
      const model = options.model?.startsWith('gpt-') ? options.model : 'gpt-4o-mini';
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: 'Eres un director editorial de noticias. Respondes solo con JSON válido.' },
            { role: 'user', content: prompt }
          ],
          temperature: options.temperature ?? 0.3,
          response_format: { type: 'json_object' }
        }),
        signal: AbortSignal.timeout(120_000)
      });

      if (res.ok) {
        const data: any = await res.json();
        const text = data?.choices?.[0]?.message?.content;
        if (text) return text;
      } else {
        console.warn(`[WARN] OpenAI error (${res.status}): ${(await res.text()).slice(0, 200)}`);
      }
    } catch (err: any) {
      console.warn(`[WARN] Fallo llamada a OpenAI: ${err.message}`);
    }
  }

  // 3. Ollama local (generación editorial sin costo)
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
        category: "SOCIEDAD",
        topic: "Crisis de Confianza y Decadencia Institucional",
        region: "CL",
        headlineGC: "¡LA CASA SE CAE! ¿SE ACABÓ LA CONFIANZA EN LAS INSTITUCIONES?",
        factsSummary: "Encuestas de la semana confirman un desplome histórico de la confianza en el Congreso, los partidos y el poder judicial, con demandas ciudadanas de renovación total.",
        moderatorTriggerQuestion: "¿Estamos frente al colapso definitivo de la institucionalidad o es solo el ciclo eterno de desilusión política?",
        personaTriggers: {
          kaspar_mork: "Desprecia las instituciones como el comité de administración de la burguesía, diseñado para sostener la explotación.",
          brayan_cyberpunk: "Se despacha contra la hipocresía de la clase política, las redes y el circo mediático que la sostiene.",
          pastor_isaias_benavides: "Condena a la clase dirigente como castigadora del pueblo y advierte del juicio divino sobre las instituciones corruptas.",
          washington_chamorro: "Finge indignación para capitalizar el descontento y prometer una refundación que nunca especifica."
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
