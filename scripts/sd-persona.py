"""Pipeline de personaje persistente con SDXL destilado (SSD-1B) + LoRA por persona.

Uso:
  python scripts/sd-persona.py dataset <personaId>   # genera dataset de entrenamiento (8 imagenes)
  python scripts/sd-persona.py generate <personaId>  # genera assets finales con el LoRA
"""
import json
import os
import sys

# El token se lee del entorno (HF_TOKEN) o del .env del proyecto; nunca hardcodeado.
try:
    with open(os.path.join(os.path.dirname(__file__), "..", ".env"), encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("HF_TOKEN="):
                os.environ.setdefault("HF_TOKEN", line.split("=", 1)[1])
except FileNotFoundError:
    pass

import torch  # noqa: E402
from PIL import Image  # noqa: E402
from diffusers import AutoPipelineForImage2Image, StableDiffusionXLPipeline  # noqa: E402

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
MODEL_ID = "segmind/SSD-1B"

STYLE = (
    "Semi-realistic satirical cartoon caricature, exaggerated facial features, stylized illustrated portrait, "
    "dramatic broadcast TV studio lighting, vibrant editorial illustration style, no text, no watermark."
)

EMOTIONS = {
    "BASE": "",
    "ANGRY": "La misma persona, ahora FURIOSA: ceño fruncido, gritando, venas marcadas; vista de tres cuartos inclinado hacia adelante sobre la mesa, puño golpeando la superficie.",
    "SMUG": "La misma persona, ahora ARROGANTE: sonrisa burlona, ceja levantada, brazos cruzados, mentón en alto, mirada despectiva; plano medio.",
    "MOCKING": "La misma persona, ahora BURLONA: riéndose a carcajadas del contrincante, gesto de burla con la mano, sarcasmo en la cara; plano medio amplio.",
    "OUTRAGED": "La misma persona, ahora INDIGNADA AL MÁXIMO: primerísimo primer plano, boca abierta gritando, ojos desorbitados, señalando con el dedo directo a cámara.",
    "PANEL": "La misma persona SENTADA en la mesa de debate, plano medio amplio, manos sobre la mesa, micrófono al frente, postura de discusión.",
}

PANEL_EXTRA = "La misma persona SENTADA en la mesa de debate del estudio, plano medio, manos sobre la mesa, micrófono enfrente."

DATA_DIR = os.path.join(ROOT, "models", "lora-data")
LORAS_DIR = os.path.join(ROOT, "models", "loras")
AVATARS_DIR = os.path.join(ROOT, "src", "assets", "avatars")


def load_persona(persona_id: str):
    with open(os.path.join(ROOT, "src", "config", "personas.json"), encoding="utf-8") as f:
        personas = json.load(f)
    p = next((x for x in personas if x["id"] == persona_id), None)
    if not p:
        sys.exit(f"Persona {persona_id} no encontrada.")
    return p


def persona_prompt(p, extra=""):
    desc = f"Retrato de {p['archetype'].lower()} en un debate televisivo chileno."
    return f"{STYLE} {desc} {extra}".strip()


def cmd_dataset(persona_id: str):
    p = load_persona(persona_id)
    out_dir = os.path.join(DATA_DIR, persona_id)
    os.makedirs(out_dir, exist_ok=True)

    base_pipe = StableDiffusionXLPipeline.from_pretrained(
        MODEL_ID, torch_dtype=torch.float16, variant="fp16", use_safetensors=True
    ).to("cuda")

    seed = abs(hash(persona_id)) % (2**31)
    gen = torch.Generator("cuda").manual_seed(seed)

    base = base_pipe(
        prompt=persona_prompt(p), num_inference_steps=28, guidance_scale=6.0, generator=gen
    ).images[0]
    base.save(os.path.join(out_dir, "0_BASE.png"))
    print("[dataset] 0_BASE ok")

    i2i = AutoPipelineForImage2Image.from_pipe(base_pipe)
    del base_pipe

    # Emociones + planos (variedad para el entrenamiento del LoRA)
    variants = {
        "1_ANGRY": (EMOTIONS["ANGRY"], 0.55),
        "2_SMUG": (EMOTIONS["SMUG"], 0.55),
        "3_MOCKING": (EMOTIONS["MOCKING"], 0.55),
        "4_OUTRAGED": (EMOTIONS["OUTRAGED"], 0.55),
        "5_PANEL": (PANEL_EXTRA, 0.5),
        "6_TURN3Q": ("La misma persona, vista de tres cuartos mirando a un costado.", 0.4),
        "7_POINTING": ("La misma persona señalando con el dedo hacia la cámara, discutiendo.", 0.45),
    }
    for name, (extra, strength) in variants.items():
        img = i2i(
            prompt=persona_prompt(p, extra),
            image=base,
            strength=strength,
            num_inference_steps=26,
            guidance_scale=6.0,
        ).images[0]
        img = img.resize((768, 768), Image.LANCZOS)
        img.save(os.path.join(out_dir, f"{name}.png"))
        print(f"[dataset] {name} ok")

    print(f"[dataset] Listo: {out_dir}")


def cmd_generate(persona_id: str, emotions: list[str]):
    p = load_persona(persona_id)
    os.makedirs(AVATARS_DIR, exist_ok=True)

    pipe = StableDiffusionXLPipeline.from_pretrained(
        MODEL_ID, torch_dtype=torch.float16, variant="fp16", use_safetensors=True
    ).to("cuda")

    lora_path = os.path.join(LORAS_DIR, f"{persona_id}.safetensors")
    if os.path.exists(lora_path):
        pipe.load_lora_weights(lora_path, adapter_name=persona_id)
        print(f"[generate] LoRA cargado: {persona_id}")
    else:
        print(f"[generate] SIN LoRA para {persona_id} (identidad no persistente)")

    seed = abs(hash(persona_id)) % (2**31)
    gen = torch.Generator("cuda").manual_seed(seed)

    for emo in emotions:
        extra = PANEL_EXTRA if emo == "PANEL" else EMOTIONS.get(emo, "")
        out_name = f"{persona_id}_{emo}.png" if emo != "BASE" else f"{persona_id}_BASE.png"
        img = pipe(
            prompt=persona_prompt(p, extra),
            num_inference_steps=28,
            guidance_scale=6.0,
            generator=gen,
        ).images[0]
        img.save(os.path.join(AVATARS_DIR, out_name))
        print(f"[generate] {out_name} ok")


BACKGROUNDS = {
    "SPEAKER_FOCUS": (
        "semi-realistic satirical cartoon caricature style, dramatic broadcast TV studio: panel LED azul oscuro, "
        "escritorio de panelistas curvo, focos dramáticos, silla de orador central iluminada, programa en vivo nocturno, "
        "no text, no watermark."
    ),
    "SPLIT_SCREEN_VERSUS": (
        "semi-realistic satirical cartoon caricature style, dramatic broadcast TV studio dividido en dos escenarios "
        "enfrentados con luces rojas y azules, mesa central con dos podios enfrentados, ambiente tenso de duelo "
        "televisivo nocturno, no text, no watermark."
    ),
    "WIDE_PANEL": (
        "semi-realistic satirical cartoon caricature style, vista panorámica de estudio de TV de debate: mesa larga "
        "con 6 asientos, panel LED con logo de programa en vivo, público de fondo borroso, luces de matinal "
        "sensacionalista, ambiente al rojo vivo, no text, no watermark."
    ),
    "REACTION_SHOT": (
        "semi-realistic satirical cartoon caricature style, plano del público y panelistas reaccionando en un estudio "
        "de TV, luces rojas de alerta, ambiente caótico de programa en vivo, cámara de reacción rápida, "
        "no text, no watermark."
    ),
}

BACKGROUNDS_DIR = os.path.join(ROOT, "src", "assets", "backgrounds")


def cmd_backgrounds():
    os.makedirs(BACKGROUNDS_DIR, exist_ok=True)
    pipe = StableDiffusionXLPipeline.from_pretrained(
        MODEL_ID, torch_dtype=torch.float16, variant="fp16", use_safetensors=True
    ).to("cuda")
    for cue, prompt in BACKGROUNDS.items():
        for v in range(1, 4):
            out = os.path.join(BACKGROUNDS_DIR, f"{cue}_{v}.png")
            if os.path.exists(out):
                print(f"[bg] {cue}_{v} ya existe")
                continue
            seed = abs(hash(cue)) + v * 1000
            gen = torch.Generator("cuda").manual_seed(seed)
            img = pipe(prompt=prompt, num_inference_steps=26, guidance_scale=6.0, generator=gen).images[0]
            img.save(out)
            print(f"[bg] {cue}_{v} ok")


def cmd_variants(persona_id: str, emotions: list[str]):
    """Genera variantes emocionales/planos con img2img PARTIENDO del retrato base
    existente (src/assets/avatars/{id}.png): hereda el estilo y la identidad del
    retrato aprobado (estilo late-show/caricatura editorial)."""
    p = load_persona(persona_id)
    base_path = os.path.join(AVATARS_DIR, f"{persona_id}.png")
    if not os.path.exists(base_path):
        sys.exit(f"Falta el retrato base {base_path} (generar antes con OpenAI o SD).")
    base = Image.open(base_path).convert("RGB").resize((1024, 1024), Image.LANCZOS)

    pipe = AutoPipelineForImage2Image.from_pretrained(
        MODEL_ID, torch_dtype=torch.float16, variant="fp16", use_safetensors=True
    ).to("cuda")

    os.makedirs(AVATARS_DIR, exist_ok=True)
    for emo in emotions:
        extra = PANEL_EXTRA if emo == "PANEL" else EMOTIONS.get(emo, "")
        out_name = f"{persona_id}_{emo}.png" if emo != "BASE" else f"{persona_id}_BASE.png"
        img = pipe(
            prompt=persona_prompt(p, extra),
            image=base,
            strength=0.6,
            num_inference_steps=26,
            guidance_scale=6.0,
        ).images[0]
        img.save(os.path.join(AVATARS_DIR, out_name))
        print(f"[variants] {out_name} ok")


if __name__ == "__main__":
    cmd = sys.argv[1]
    if cmd == "backgrounds":
        cmd_backgrounds()
    elif cmd == "dataset":
        cmd_dataset(sys.argv[2])
    elif cmd == "variants":
        persona_id = sys.argv[2]
        emotions = sys.argv[3].split(",") if len(sys.argv) > 3 else ["ANGRY", "SMUG", "MOCKING", "OUTRAGED", "PANEL"]
        cmd_variants(persona_id, emotions)
    elif cmd == "generate":
        persona_id = sys.argv[2]
        emotions = sys.argv[3].split(",") if len(sys.argv) > 3 else ["BASE", "ANGRY", "SMUG", "MOCKING", "OUTRAGED", "PANEL"]
        cmd_generate(persona_id, emotions)
    else:
        sys.exit("Comandos: dataset | variants | generate | backgrounds")
