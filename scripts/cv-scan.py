"""Escanea Common Voice es: distribución de acentos y candidatos por acento/género."""
import os
import sys
from collections import Counter

# El token se lee del entorno (HF_TOKEN) o del .env del proyecto; nunca hardcodeado.
try:
    with open(os.path.join(os.path.dirname(__file__), "..", ".env"), encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line.startswith("HF_TOKEN="):
                os.environ.setdefault("HF_TOKEN", line.split("=", 1)[1])
except FileNotFoundError:
    pass

from datasets import load_dataset  # noqa: E402


def main() -> None:
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 10000
    ds = load_dataset(
        "xaviviro/common_voice_es_16_1_accent",
        "default",
        split="train",
        streaming=True,
    )
    accents = Counter()
    candidates: dict[tuple[str, str], list[dict]] = {}
    seen = 0
    for row in ds:
        seen += 1
        accent = str(row.get("accent") or "sin_acento")
        gender = str(row.get("gender") or "unknown")
        accents[accent] += 1
        key = (accent.lower(), gender)
        if key not in candidates and len(candidates) < 40:
            candidates[key] = [row]
        if seen >= limit:
            break

    print(f"=== {seen} filas escaneadas ===")
    print("--- Acentos ---")
    for a, c in accents.most_common(25):
        print(f"{c:6d}  {a}")

    print("--- Candidatos (primero por acento/género) ---")
    for (a, g), rows in sorted(candidates.items()):
        r = rows[0]
        print(f"{a:22s} {g:8s} clips_totales={r.get('num_clips')} votos={r.get('up_votes')} id={r['client_id']} sent='{r['sentence'][:60]}'")


if __name__ == "__main__":
    main()
