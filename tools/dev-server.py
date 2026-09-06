#!/usr/bin/env python3
"""Lokale ontwikkelserver voor de Renoperfect-site, met opslaan.

Serveert de map net als `python -m http.server`, maar luistert daarnaast naar
POST /__opslaan. De tekstbewerker in de browser stuurt daar de bewerkte pagina
naartoe, en die wordt naar schijf geschreven.

Bewust beperkt:
  - luistert alleen op 127.0.0.1, dus niet bereikbaar vanaf het netwerk;
  - schrijft alleen naar de twee pagina's van deze site;
  - maakt voor elke schrijfactie een reservekopie in .bewerk-backups/.

Gebruik:  python tools/dev-server.py [poort]
"""

import base64
import datetime
import http.server
import json
import os
import re
import shutil
import socketserver
import sys

WORTEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TOEGESTAAN = {"index.html", "privacyverklaring.html"}
BACKUPMAP = os.path.join(WORTEL, ".bewerk-backups")
FOTOMAP = os.path.join(WORTEL, "assets", "img", "projecten")
FOTO_EXT = {".jpg", ".jpeg", ".png", ".webp"}
FOTO_MAX = 12 * 1024 * 1024
POORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=WORTEL, **kwargs)

    def end_headers(self):
        # Tijdens het bewerken wil je nooit een oude versie uit de cache zien.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def do_GET(self):
        if self.path.startswith("/__stand"):
            self._stand()
            return
        super().do_GET()

    def _stand(self):
        """Wanneer is de pagina voor het laatst gewijzigd? De bewerker onthoudt dit bij het
        laden en stuurt het bij het opslaan mee, zodat hij nooit werk overschrijft dat
        intussen van buitenaf in het bestand is gezet."""
        bestand = os.path.basename(self.path.split("=", 1)[-1]) if "=" in self.path else "index.html"
        if bestand not in TOEGESTAAN:
            bestand = "index.html"
        try:
            stempel = os.path.getmtime(os.path.join(WORTEL, bestand))
            self._antwoord(200, {"ok": True, "bestand": bestand, "stand": round(stempel, 3)})
        except OSError as fout:
            self._antwoord(400, {"ok": False, "fout": str(fout)})

    def do_POST(self):
        if self.path == "/__foto":
            self._foto()
            return
        if self.path != "/__opslaan":
            self.send_error(404)
            return
        try:
            lengte = int(self.headers.get("Content-Length") or 0)
            gegevens = json.loads(self.rfile.read(lengte).decode("utf-8"))
            bestand = os.path.basename(gegevens.get("bestand") or "")
            html = gegevens.get("html") or ""

            if bestand not in TOEGESTAAN:
                raise ValueError("bestand niet toegestaan: %r" % bestand)
            # Een lege of half aangekomen pagina mag nooit het origineel overschrijven.
            if len(html) < 2000 or "</html>" not in html:
                raise ValueError("inhoud lijkt onvolledig, niet opgeslagen")

            pad = os.path.join(WORTEL, bestand)

            # Is het bestand intussen van buitenaf gewijzigd? Dan niet overschrijven.
            stand = gegevens.get("stand")
            if stand is not None:
                nu = round(os.path.getmtime(pad), 3)
                if abs(nu - float(stand)) > 0.5:
                    raise ValueError(
                        "de pagina is intussen buiten de browser gewijzigd; "
                        "herlaad eerst (Ctrl+Shift+R) en probeer opnieuw")

            os.makedirs(BACKUPMAP, exist_ok=True)
            stempel = datetime.datetime.now().strftime("%Y%m%d-%H%M%S")
            shutil.copy2(pad, os.path.join(BACKUPMAP, "%s.%s" % (bestand, stempel)))

            with open(pad, "w", encoding="utf-8", newline="\n") as f:
                f.write(html)

            self._antwoord(200, {
                "ok": True,
                "bestand": bestand,
                "tekens": len(html),
                "stand": round(os.path.getmtime(pad), 3),
            })
            print("  opgeslagen: %s (%d tekens)" % (bestand, len(html)))
        except Exception as fout:  # noqa: BLE001 - alles terugmelden aan de browser
            self._antwoord(400, {"ok": False, "fout": str(fout)})
            print("  NIET opgeslagen: %s" % fout)

    def _foto(self):
        """Een ingesleepte foto opslaan in assets/img/projecten/."""
        try:
            lengte = int(self.headers.get("Content-Length") or 0)
            gegevens = json.loads(self.rfile.read(lengte).decode("utf-8"))

            naam = gegevens.get("naam") or ""
            ext = os.path.splitext(naam)[1].lower()
            if ext == ".jpeg":
                ext = ".jpg"
            if ext not in FOTO_EXT:
                raise ValueError("alleen jpg, png of webp (kreeg %r)" % ext)

            inhoud = base64.b64decode(gegevens.get("data") or "")
            if not inhoud:
                raise ValueError("leeg bestand")
            if len(inhoud) > FOTO_MAX:
                raise ValueError("foto is groter dan 12 MB")

            # Bestandsnaam uit de projecttitel, zodat de map leesbaar blijft.
            basis = re.sub(r"[^a-z0-9]+", "-", (gegevens.get("voorvoegsel") or "foto").lower())
            basis = basis.strip("-")[:60] or "foto"
            stempel = datetime.datetime.now().strftime("%H%M%S%f")[:10]
            bestand = "%s-%s%s" % (basis, stempel, ext)

            os.makedirs(FOTOMAP, exist_ok=True)
            with open(os.path.join(FOTOMAP, bestand), "wb") as f:
                f.write(inhoud)

            pad = "assets/img/projecten/" + bestand
            self._antwoord(200, {"ok": True, "pad": pad})
            print("  foto opgeslagen: %s (%d kB)" % (pad, len(inhoud) // 1024))
        except Exception as fout:  # noqa: BLE001
            self._antwoord(400, {"ok": False, "fout": str(fout)})
            print("  foto NIET opgeslagen: %s" % fout)

    def _antwoord(self, code, obj):
        ruw = json.dumps(obj).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(ruw)))
        self.end_headers()
        self.wfile.write(ruw)


class Server(socketserver.ThreadingTCPServer):
    allow_reuse_address = True
    daemon_threads = True


if __name__ == "__main__":
    with Server(("127.0.0.1", POORT), Handler) as server:
        print("Renoperfect draait op http://localhost:%d" % POORT)
        print("Teksten aanpassen: klik rechtsonder op 'Teksten bewerken'.")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\nGestopt.")
