"""Smoke test del Worker de contacto.

Uso:
    python smoke_worker.py https://<worker-url>
"""
import json
import sys
import urllib.request
import urllib.error

url = sys.argv[1].rstrip("/")
target = url + "/"

cases = [
    ("OPTIONS (preflight)", "OPTIONS", None, None),
    ("GET (debe dar 405)", "GET", None, None),
    ("payload invalido: email malo", "POST", {"name": "x", "email": "no-es-email", "message": "hola"}, 400),
    ("payload invalido: mensaje corto", "POST", {"name": "x", "email": "a@b.cl", "message": "hi"}, 400),
    ("payload valido", "POST", {"name": "Smoke Test", "email": "smoke@hackfluency.com",
                                "message": "Prueba automatica del formulario de contacto."}, 200),
]

for label, method, body, expected in cases:
    data = json.dumps(body).encode() if body else None
    req = urllib.request.Request(target, data=data, method=method)
    if data:
        req.add_header("Content-Type", "application/json")
    req.add_header("Origin", "https://www.hackfluency.com")
    req.add_header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
                                 "(KHTML, like Gecko) Chrome/156.0.0.0 Safari/537.36")
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            code, raw = r.status, r.read().decode()[:200]
    except urllib.error.HTTPError as e:
        code, raw = e.code, e.read().decode()[:200]
    except Exception as e:
        code, raw = -1, str(e)[:200]

    if expected is None:
        verdict = "ok" if code in (204, 200, 405) else "?"
    else:
        verdict = "OK" if code == expected else f"ESPERABA {expected}"
    print(f"[{verdict:12}] {label:34} -> {code}  {raw}")
