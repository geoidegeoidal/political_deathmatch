# Design: Diverse Personas, Emotional Avatars, Program Intro & Local Music

## Context

Ver proposal.md. El 004 dejó 17 retratos neutros + 3 fondos generados con OpenAI gpt-image-1. Este cambio amplía el elenco, agrega emociones con diseño persistente y dota al programa de intro y música local.

## Goals / Non-Goals

**Goals:**
- 5-6 personajes nuevos diversos (mujeres, LGBTQ+, indígena, migrante) sin tocar el capítulo actual.
- Variantes emocionales por personaje con el retrato base como referencia (persistencia visual).
- Intro de ~15s y música local (MusicGen) con mezcla de volúmenes cuidada.

**Non-Goals:**
- No se re-renderiza el capítulo actual (los assets nuevos aplican a futuros episodios).
- No hay animación de boca/rigging (queda para una fase posterior).

## Decisions

### 1. Modelo de personaje persistente: LoRA por persona (SDXL destilado local)
- **Motor:** `segmind/SSD-1B` (SDXL destilado, 1024x1024 nativo, no-gated) con diffusers + torch CUDA local. **$0** (se descarta gpt-image-1 para avatares).
- **Facciones marcadas:** estilo reforzado en los prompts ("highly exaggerated facial features, strong jaw, big nose, expressive editorial caricature").
- **LoRA por personaje (`models/loras/{personaId}.safetensors`):** se entrena un LoRA (rank 16, ~1000 pasos) por persona sobre un dataset generado localmente (retrato base + 4 emociones + plano medio, img2img desde una semilla de estilo común). Con el LoRA, CUALQUIER generación futura (emociones, planos, poses nuevas) mantiene la identidad del personaje.
- **Assets finales (regenerados con el LoRA):** `src/assets/avatars/{personaId}_BASE|ANGRY|SMUG|MOCKING|OUTRAGED.png` + `{personaId}_PANEL.png` (plano medio sentado para WIDE_PANEL).
- **Render:** SPEAKER_FOCUS/SPLIT_SCREEN/REACTION usan la variante emocional; WIDE_PANEL usa el plano medio.
- **Costos:** $0 en imágenes. Tiempo: ~10-15 min de entrenamiento por persona en RTX 3060 (batch de 23 ≈ 4-6 h, corrida desatendida).

### 2. Personas nuevas
- Mujer conservadora (derecha): complementa a Dra. Astorga (izquierda) en femeninos.
- Activista LGBTQ+ (parodia ficticia, activismo de la diversidad).
- Líder indígena (pueblos originarios, cosmovisión mapuche ficcionalizada).
- Migrante venezolana en Chile (izquierda social, experiencia migrante).
- Ecologista/extractivismo (puede combinarse con indígena según el presupuesto).
- Voces OpenAI: femeninas → nova/shimmer; masculinas → alloy/echo; diferenciación por instrucciones y pitch (ffmpeg).

### 3. Intro del programa
- 3-5 frames SVG fijos: (1) logo + eslogan sobre fondo oscuro, (2) tarjeta de título del capítulo, (3) lineup de personajes (retratos en fila), (4) "EN VIVO" + fecha.
- Ken Burns (zoom lento) vía ffmpeg `zoompan` sobre cada frame; duración total ~15s; audio = tema de apertura a volumen completo.

### 4. Música local con volúmenes controlados
- **Modelo:** `facebook/musicgen-small` (transformers + torch CUDA ya instalados; HF con token). Generación ~1-2 min por 30s en RTX 3060.
- **Pistas:** tema apertura (~30s, "intense TV debate show intro, dramatic drums"), stinger bloque (~3s, "news sting hit"), cama ambiente (loop ~20s, "tense low ambient pad").
- **Mezcla (audio-mixer):** 3 inputs extra por pista musical con volúmenes:
  - Cama musical: `volume=0.12` (-18dB) con ducking dinámico bajo las voces: el filtro `sidechaincompress` o un enfoque más simple: `volume` por segmentos usando el timeline (durante cada stem, la cama baja a 0.04; en silencios sube a 0.12) — implementado con `volume='if(...)'` como el ducking de interrupciones actual.
  - Intro: volumen completo (1.0) solo en el segmento de intro (0-15s).
  - Stingers: -10dB en los inicios de bloque.

## Risks / Trade-offs

- **[MusicGen en CPU lento] → Mitigación:** usar GPU (CUDA disponible); small=300M es rápido.
- **[Persistencia imperfecta entre emociones] → Mitigación:** la imagen de referencia de gpt-image-1 mantiene identidad; si alguna variante se desvía, regenerar solo esa (one-shot por asset).
- **[Costo de imágenes] → Mitigación:** el generador soporta `--emotions` para escalar; fallback a retrato base si falta variante.
- **[Música genérica] → Mitigación:** prompts de MusicGen específicos para el género; iterar sobre la semilla.

## Migration Plan

1. Agregar personas + voces (config).
2. Extender asset-generator con modo emociones (imagen de referencia).
3. Generar variantes emocionales (según saldo aprobado).
4. MusicGen: instalar transformers, descargar modelo, generar 3 pistas.
5. Mezclador: integrar camas con ducking + intro + stingers.
6. Intro: frames + zoompan + mux.
7. Re-render de un episodio de prueba (no el actual).
