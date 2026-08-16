# editorial-desk Specification

## Purpose
Definir los requerimientos funcionales y de datos para la ingesta de noticias y la generación de la pauta editorial semanal del programa a partir de los últimos 7 días de noticias.

## Requirements

### Requirement: Multi-Region News Feed Ingestion
El sistema DEBERÁ conectarse a feeds RSS y endpoints de medios oficiales clasificados en 3 zonas: Chile (Nacional), LATAM (Regional) y Mundo (Global).

#### Scenario: Successful RSS Ingestion
- GIVEN una lista de URLs de feeds RSS válidas para Chile, LATAM y Mundo
- WHEN el módulo de ingesta ejecuta el scraping
- THEN recopilar todas las noticias publicadas en los últimos 7 días (la semana completa)
- AND parsear los campos: `id`, `title`, `summary`, `url`, `source`, `region`, `publishedAt`.

#### Scenario: Network / Parsing Fallback
- GIVEN un feed RSS que responde con timeout o formato inválido
- WHEN ocurre el error durante la descarga
- THEN registrar el warning sin detener la ejecución de las demás fuentes
- AND continuar con los feeds restantes.

### Requirement: Noise Filtering and Deduplication
El sistema DEBERÁ filtrar artículos irrelevantes y agrupar noticias duplicadas sobre el mismo acontecimiento.

#### Scenario: Category Filter
- GIVEN un conjunto de noticias extraídas
- WHEN el clasificador de texto detecta categorías como fútbol, espectáculos banales o clima
- THEN descartar los artículos y mantener solo política, economía, sociedad, seguridad y relaciones internacionales.

### Requirement: Controversy Scoring and Agenda Generation
El sistema DEBERÁ clasificar el grado de controversia (1-10) y generar la estructura de pauta para el debate.

#### Scenario: Agenda Synthesis
- GIVEN una lista de noticias filtradas
- WHEN el motor de síntesis procesa el lote
- THEN retornar un documento JSON `weekly_agenda.json` con exactamente 3 a 4 bloques de debate
- AND cada bloque debe incluir: `topic`, `headline_gc`, `facts_summary`, `moderator_trigger_question`, y `persona_triggers`.
