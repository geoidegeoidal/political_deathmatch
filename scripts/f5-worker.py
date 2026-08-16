"""Worker de síntesis F5-TTS: carga el modelo una vez y procesa un job JSON.

Uso:
  python scripts/f5-worker.py <jobs.json> <outdir>

jobs.json: [{ "id": "turn_001", "ref_audio": "...", "ref_text": "...", "text": "...", "speed": 1.0 }]
Salida: outdir/<id>.wav
"""
import json
import os
import sys
import time

# ffmpeg/ffprobe de ffmpeg-static (Node) al PATH para pydub y preprocesado de refs.
_ffmpeg_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "node_modules", "ffmpeg-static"))
os.environ["PATH"] = _ffmpeg_dir + os.pathsep + os.environ.get("PATH", "")

# torchaudio/torchcodec no encuentra FFmpeg DLLs en este equipo: shim a soundfile.
import torch
import torchaudio

_orig_load = torchaudio.load


def _load(path, *args, **kwargs):
    try:
        return _orig_load(path, *args, **kwargs)
    except Exception:
        import soundfile as sf
        data, sr = sf.read(str(path), dtype="float32")
        if data.ndim == 1:
            data = data[None, :]
        return torch.from_numpy(data).contiguous(), sr


torchaudio.load = _load

from f5_tts.api import F5TTS  # noqa: E402


def main() -> None:
    jobs_path, outdir = sys.argv[1], sys.argv[2]
    os.makedirs(outdir, exist_ok=True)
    with open(jobs_path, "r", encoding="utf-8") as f:
        jobs = json.load(f)

    t0 = time.time()
    tts = F5TTS(device="cuda")
    print(f"[F5] modelo cargado en {round(time.time() - t0, 1)}s", flush=True)

    for job in jobs:
        t1 = time.time()
        wav, sr, _ = tts.infer(
            ref_file=job["ref_audio"],
            ref_text=job["ref_text"],
            gen_text=job["text"],
            speed=float(job.get("speed", 1.0)),
            nfe_step=int(job.get("nfe_step", 48)),
            cfg_strength=float(job.get("cfg_strength", 2.5)),
            sway_sampling_coef=float(job.get("sway", -1)),
            seed=job.get("seed"),
        )
        import soundfile as sf

        out = os.path.join(outdir, f"{job['id']}.wav")
        sf.write(out, wav, sr)
        print(
            f"[F5] {job['id']} -> {round(len(wav) / sr, 1)}s en {round(time.time() - t1, 1)}s",
            flush=True,
        )
    print("[F5] OK", flush=True)


if __name__ == "__main__":
    main()
