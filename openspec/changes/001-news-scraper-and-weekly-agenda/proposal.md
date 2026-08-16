# Proposal: News Scraper & Weekly Agenda Engine (Pauta Semanal)

## Overview
Implementar el motor de ingesta y generación de pauta editorial semanal para *Political Deathmatch*, capaz de extraer noticias de los últimos 7 días (la semana completa) desde los principales medios de comunicación de Chile (Nacional), Latinoamérica (Regional) y el Mundo (Global), filtrar ruido temático no relevante y sintetizar una pauta estructurada de 3 a 4 bloques de debate de alta fricción política e ideológica.

## Problem Statement
El debate automatizado de *Political Deathmatch* necesita temas reales, frescos y altamente polarizantes para enfrentar a los personajes (Marx, Incel, Fanático Religioso, Políticos). Sin una ingesta automatizada y clasificada de noticias:
1. La selección de temas requeriría intervención humana constante.
2. Los temas perderían frescura y resonancia con la coyuntura actual de Chile y LATAM.
3. Se gastarían tokens innecesarios si se enviaran textos sin procesar ni filtrar a los modelos de lenguaje.

## Proposed Solution
1. **Ingesta RSS-First Multifuente:**
   - Chile: BioBioChile, La Tercera, El Mostrador, Emol, Cooperativa.
   - LATAM: Infobae América, El País América, CNN en Español, La Nación (AR).
   - Mundo: BBC Mundo, DW Español, RT en Español, Reuters ES.
2. **Normalizador y Deduplicador de Noticias:**
   - Normalización de titulares, resúmenes, timestamps y fuentes.
   - Filtro de ruido (descarte de farándula banal, deportes, clima, avisos comerciales).
3. **Controversy & Polarization Ranker:**
   - Scoring de controversia (1-10) evaluando potencial de fricción ideológica.
   - Selección de los 3-4 tópicos más candentes.
4. **Generador de Pauta Semanal (`weekly_agenda.json`):**
   - Titulares sensacionalistas para el Generador de Caracteres (GC) estilo *Sin Filtros TV*.
   - Resumen fáctico neutral.
   - Pregunta detonante del moderador.
   - Triggers emocionales específicos para cada panelista.

## Model Assignment (Build & Run)
- **Extracción & Parsing:** Código nativo TypeScript (0 tokens).
- **Ranking & Pauta Synthesis:** `google/gemini-2.5-flash` (Thinking: Low / Off) con fallback a `deepseek/deepseek-chat` (V3).
