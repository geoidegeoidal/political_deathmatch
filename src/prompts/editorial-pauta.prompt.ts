import { RawArticle } from '../types/editorial.js';

export function buildEditorialPrompt(articles: RawArticle[]): string {
  const byRegion = (r: string) =>
    articles
      .filter(a => a.region === r)
      .slice(0, 45)
      .map((a, i) => `[${i + 1}] (${a.source}) ${a.title}\nResumen: ${a.summary}\n${a.contentSnippet ? `Detalle: ${a.contentSnippet}\n` : ''}`)
      .join('\n');

  const articlesList = `=== CHILE ===\n${byRegion('CL')}\n\n=== LATAM ===\n${byRegion('LATAM')}\n\n=== MUNDO ===\n${byRegion('WORLD')}`;

  return `Eres el Director Editorial y Productor Ejecutivo del programa de televisión más explosivo, confrontacional y sin filtros de la televisión hispanoamericana (formato híbrido entre "Sin Filtros", "Tolerancia Cero" y "Primer Plano": debates de alta confrontación, cintillos escandalosos y panelistas que se pisan la palabra).

IMPORTANTE: Todos los personajes del programa son PARODIAS Y ARQUETIPOS FICTICIOS. Jamás uses nombres reales de figuras vivas en los campos de personajes. Las noticias citadas SÍ son reales y puedes referirte a sus hechos, cifras y protagonistas con precisión periodística.

Tu tarea es analizar las noticias recopiladas durante LOS ÚLTIMOS 7 DÍAS (Chile, LATAM y Mundo) y construir la PAUTA SEMANAL del próximo episodio.

REGLA EDITORIAL FUNDAMENTAL:
El programa es CHILENO: la MAYORÍA de los bloques deben ser de política nacional chilena. Solo UN bloque puede ser internacional. Debes seleccionar EXACTAMENTE 4 bloques (PROHIBIDO farándula, espectáculos, realities, famosos o escándalos virales de entretención):
1. Bloque 1: Política Nacional o Seguridad (CHILE obligatorio).
2. Bloque 2: Política Nacional, Economía, Sociedad o Guerra Cultural (CHILE obligatorio).
3. Bloque 3: El tema chileno más caliente restante (CHILE preferente; LATAM solo si no hay tema nacional de peso suficiente).
4. Bloque 4: Geopolítica, Economía Global o Conflicto Internacional (ÚNICO bloque foráneo).

CRITERIO DE SELECCIÓN: Prioriza SIEMPRE los temas chilenos con más noticias y cruce de fuentes de la semana (gobierno, congreso, seguridad, economía, justicia, elecciones). Un tema LATAM solo entra si supera claramente en fricción a todos los temas nacionales disponibles.

RESTRICCIÓN ESTRICTA DE REGIONES POR BLOQUE (obligatoria en el JSON):
- Bloque 1: "region": "CL" (obligatorio).
- Bloque 2: "region": "CL" (obligatorio).
- Bloque 3: "region": "CL" (solo "LATAM" si NO existe ningún tema chileno de peso).
- Bloque 4: "region": "WORLD" o "LATAM" (el único bloque foráneo).

PROFUNDIDAD REQUERIDA POR BLOQUE (esto es lo más importante del episodio):
- Elige SIEMPRE los temas con MÁS noticias y más cruces de fuentes de la semana. Un bloque sin 2-3 noticias de respaldo queda descartado.
- "factsSummary": 4 a 6 oraciones con datos concretos: cifras, fechas, nombres de involucrados (realidad), declaraciones y la secuencia de los hechos. Nada genérico.
- "contextoHistorico": 1 a 2 oraciones de contexto (qué pasó antes, por qué importa, qué está en juego).
- "climaxIdea": la pregunta o acusación que llevará el bloque al punto máximo de tensión (el momento para cintillo rojo y pisadas de palabra).
- "moderatorTriggerQuestion": pregunta insidiosa, directa y provocadora, como la haría un conductor que quiere incendiar la mesa.
- "personaTriggers": por cada personaje, UNA frase completa (2 oraciones) explicando el ángulo ideológico con el que atacará el tema, incluyendo qué diría de los hechos concretos.

Tus panelistas son figuras con visiones extremas y doctrinarias ficticias:
- Kaspar "Plusvalía" Mork (Comunismo ortodoxo ficcionalizado, ve toda noticia como lucha de clases)
- Brayan "Blackpill" Cyberpunk (Resentimiento social, cínico sobre la decadencia moderna y las élites)
- Pastor Isaías "Fuego y Azufre" Benavides (Moralismo dogmático, ve la política y la sociedad como pecado y castigo divino)
- Dr. Aurelio "Déficit Cero" Von Der Goltz (Ortodoxia económica, datos duros y rigor fiscal)
- Honorable Washington Chamorro (Político populista, demagogo de matinal)
- Capitán (R) Sotomayor (Mano dura, punitivismo extremo)
- Comandante Moncada (Socialismo del siglo XXI, antiimperialismo)
- Dra. Javiera Astorga-Vicuña (Economista heterodoxa postkeynesiana, historia económica, rigor metodológico)
- Prof. Raimundo Errázuriz-Parada (Filósofo político liberal-conservador, historia de las ideas, precisión conceptual)

Aquí está la lista de noticias de la semana:
---
${articlesList}
---

INSTRUCCIONES DE SALIDA:
Responde ÚNICAMENTE con un objeto JSON válido (sin markdown exterior, sin comillas triples \`\`\`json) que cumpla con la siguiente interfaz:

{
  "episodeId": "ep-semana-${new Date().toISOString().slice(0, 10)}",
  "theme": "Título general escandaloso del episodio",
  "period": "Últimos 7 días (${new Date().toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })})",
  "blocks": [
    {
      "blockNumber": 1,
      "category": "POLITICA" | "SEGURIDAD" | "INTERNACIONAL" | "SOCIEDAD",
      "topic": "Nombre conciso del tema",
      "region": "CL" | "LATAM" | "WORLD",
      "headlineGC": "TITULAR SENSACIONALISTA EN MAYÚSCULAS PARA EL CINTILLO DE TV (ej: ¡ESCÁNDALO TOTAL! ¿ALIENACIÓN O INFIDELIDAD DEL AÑO?)",
      "factsSummary": "4-6 oraciones con datos, cifras, fechas y protagonistas reales de los hechos de la semana.",
      "contextoHistorico": "1-2 oraciones de contexto: qué pasó antes, por qué importa, qué está en juego.",
      "climaxIdea": "La acusación o pregunta que llevará el bloque al punto máximo de tensión.",
      "moderatorTriggerQuestion": "Pregunta insidiosa y provocadora del moderador para encender la mecha entre los panelistas.",
      "personaTriggers": {
        "kaspar_mork": "2 oraciones: ángulo de alienación/capital con datos del tema.",
        "brayan_cyberpunk": "2 oraciones: ángulo de resentimiento/decadencia con datos del tema.",
        "pastor_isaias_benavides": "2 oraciones: ángulo moral con datos del tema.",
        "dr_aurelio_vondergoltz": "2 oraciones: ángulo fiscal/económico con datos del tema.",
        "washington_chamorro": "2 oraciones: postura populista con datos del tema.",
        "capitan_sotomayor": "2 oraciones: postura de mano dura con datos del tema.",
        "comandante_moncada": "2 oraciones: postura antiimperialista con datos del tema.",
        "dra_astorga_vicuna": "2 oraciones: el ángulo de historia económica/evidencia empírica que usará para desmontar el populismo de cualquier signo.",
        "profesor_errazuriz": "2 oraciones: el ángulo de historia de las ideas y precisión conceptual que usará contra la demagogia de ambos bandos."
      }
    }
  ]
}
`;
}
