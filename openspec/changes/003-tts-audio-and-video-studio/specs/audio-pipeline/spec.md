# audio-pipeline Specification (Delta)

## Purpose
Definir los requerimientos para la síntesis de voz, mapeo de perfiles vocales, procesamiento de stems y mezcla de pistas con soporte de interrupciones (*pisadas de palabra*).

## Requirements

### Requirement: Multi-Voice Profile Synthesis
El sistema DEBERÁ sintetizar audio independiente para cada turno del debate mapeando el `voiceProfileId` del personaje a una voz con acento y timbre correspondiente.

#### Scenario: Voice Profile Mapping
- GIVEN un turno de debate con `speakerId: "comandante_moncada"` y `voiceProfileId: "voice_es_ve_caudillo"`
- WHEN el motor de TTS genera el audio
- THEN utilizar una voz con acento venezolano enérgico
- AND guardar el archivo de audio en `output/audio/stems/turn_XXX_moncada.mp3`.

#### Scenario: Character Voice Variety
- GIVEN los 15 personajes del catálogo
- WHEN se sintetizan sus voces
- THEN contar con perfiles diferenciados: chileno matinal, chileno cuico/ñuñoa, chileno popular, venezolano, argentino, español peninsular y alemán/académico.

### Requirement: Audio Timeline and Interruption Mixing
El sistema DEBERÁ calcular la línea de tiempo de audio (`audio_timeline.json`) y superponer pistas cuando exista una interrupción.

#### Scenario: Interruption Audio Overlap
- GIVEN un turno A en reproducción
- WHEN el turno B tiene `isInterruption: true` y entra 1.5 segundos antes de que termine el turno A
- THEN iniciar el audio del turno B con volumen al 100%
- AND atenuar (*ducking*) el volumen del turno A al 40% durante los últimos 1.5 segundos.

### Requirement: Sound Effects and Broadcast Stems
El sistema DEBERÁ incluir pistas de efectos sonoros de TV (gongs de tensión, cortinillas de bloque y murmullos de público).

#### Scenario: Block Transition Sound
- GIVEN el inicio de un nuevo bloque de debate
- WHEN el moderador introduce el tema
- THEN reproducir la cortinilla sonora de apertura de bloque.
