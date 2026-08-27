import importlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

BASE = Path(__file__).resolve().parent
ROOT = BASE.parent
sys.path.insert(0, str(BASE))

from core.http import Http
from core.registry import SERVICE_MODULES
from core.translator import Translator
from core.utils import select_events, make_service

with open(ROOT / "config.json", "r", encoding="utf-8") as f:
    CONFIG = json.load(f)

http = Http(
    timeout=CONFIG.get("request_timeout", 12),
    debug=CONFIG.get("debug", False),
)

translator = Translator(
    language=CONFIG.get("language", "zh-TW"),
    timeout=CONFIG.get("translate_timeout", 6),
    debug=CONFIG.get("debug", False),
)

ctx = {
    "config": CONFIG,
    "http": http,
}

results = []

for module_name in SERVICE_MODULES:
    try:
        mod = importlib.import_module(module_name)
        result = mod.fetch(ctx)

        result.events = select_events(
            result.events,
            CONFIG.get("max_events", 3),
        )

        # Only translate the final three visible events.
        for event in result.events:
            event.title = translator.translate(event.title)

        results.append(result)
        print(f"[OK] {result.name}: {result.state} ({len(result.events)} events)")
    except Exception as e:
        print(f"[ERROR] {module_name}: {e}")

payload = {
    "generated_at": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
    "language": CONFIG.get("language", "zh-TW"),
    "max_events": CONFIG.get("max_events", 3),
    "services": [x.to_dict() for x in results],
}

data_dir = ROOT / "data"
data_dir.mkdir(exist_ok=True)

with open(data_dir / "status.json", "w", encoding="utf-8") as f:
    json.dump(payload, f, ensure_ascii=False, indent=2)

print("Wrote", data_dir / "status.json")
