"""Worker de MusicGen: genera pistas musicales locales (facebook/musicgen-small).

Uso:
  python scripts/musicgen-worker.py <jobs.json> <outdir>
jobs.json: [{ "id": "intro_theme", "prompt": "...", "seconds": 30.0 }]
Salida: outdir/<id>.wav
"""
import json
import os
import sys
import time

try:
    with open(os.path.join(os.path.dirname(__file__), "..", ".env"), encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("HF_TOKEN="):
                os.environ.setdefault("HF_TOKEN", line.split("=", 1)[1])
except FileNotFoundError:
    pass

import torch  # noqa: E402
import soundfile as sf  # noqa: E402
from transformers import AutoProcessor, MusicgenForConditionalGeneration  # noqa: E402

MODEL_ID = "facebook/musicgen-small"
TOKENS_PER_SECOND = 50


def main() -> None:
    jobs_path, outdir = sys.argv[1], sys.argv[2]
    os.makedirs(outdir, exist_ok=True)
    with open(jobs_path, "r", encoding="utf-8") as f:
        jobs = json.load(f)

    t0 = time.time()
    processor = AutoProcessor.from_pretrained(MODEL_ID)
    model = MusicgenForConditionalGeneration.from_pretrained(MODEL_ID).to("cuda")
    print(f"[MUSIC] modelo cargado en {round(time.time() - t0, 1)}s", flush=True)

    for job in jobs:
        out = os.path.join(outdir, f"{job['id']}.wav")
        if os.path.exists(out):
            print(f"[MUSIC] {job['id']}.wav ya existe, omitiendo.", flush=True)
            continue
        seconds = float(job.get("seconds", 30.0))
        tokens = int(seconds * TOKENS_PER_SECOND)
        t1 = time.time()
        inputs = processor(text=[job["prompt"]], padding=True, return_tensors="pt").to("cuda")
        with torch.no_grad():
            audio = model.generate(**inputs, max_new_tokens=tokens)
        wav = audio[0].cpu().numpy()
        sf.write(out, wav.T, model.config.audio_encoder.sampling_rate)
        print(f"[MUSIC] {job['id']} -> {round(time.time() - t1, 1)}s", flush=True)
    print("[MUSIC] OK", flush=True)


if __name__ == "__main__":
    main()
