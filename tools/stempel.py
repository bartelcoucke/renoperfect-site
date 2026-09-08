#!/usr/bin/env python3
"""Zet een versiestempel achter elke verwijzing naar een eigen CSS- of JS-bestand.

Waarom dit nodig is: de webserver geeft stijl- en scriptbestanden een cache van een jaar
met de vlag `immutable`. Dat is goed voor de snelheid, maar het betekent ook dat een
bezoeker die de site al eens bekeek een gewijzigd bestand NOOIT opnieuw ophaalt.

De oplossing is de verwijzing zelf te laten veranderen:

    assets/css/style.css  ->  assets/css/style.css?v=a1b2c3d4

De stempel is de eerste acht tekens van de SHA-256 van de bestandsinhoud. Verandert het
bestand, dan verandert de stempel, en haalt de browser het opnieuw op. Verandert er
niets, dan blijft de cache gewoon werken.

Draai dit vóór elke uitrol:

    python tools/stempel.py

Met --controle wordt niets geschreven; het script meldt alleen of alles bij is
(afsluitcode 1 als er iets ontbreekt), handig in een uitrolscript.
"""
import hashlib
import io
import os
import re
import sys

WORTEL = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PAGINAS = ("index.html", "privacyverklaring.html", "algemene-voorwaarden.html",
           "gebruiksvoorwaarden.html", "fr/index.html", "en/index.html",
           "fr/confidentialite.html", "en/privacy.html",
           "spoedherstelling.html",
           "schadeherstel.html", "dakwerken.html", "gevelwerken.html",
           "technieken.html", "renovatie.html")

# assets/... of ../assets/... gevolgd door .css of .js, met een eventuele oude stempel
PATROON = re.compile(r'((?:\.\./)?assets/(?:css|js)/[A-Za-z0-9_.-]+\.(?:css|js))(\?v=[0-9a-f]{8})?')


def stempel_van(bestandspad):
    with open(bestandspad, "rb") as f:
        return hashlib.sha256(f.read()).hexdigest()[:8]


def verwerk(pagina, controleer):
    pad = os.path.join(WORTEL, pagina)
    if not os.path.exists(pad):
        return 0, 0

    html = io.open(pad, encoding="utf-8").read()
    aangepast = [0]
    achterstallig = [0]

    def vervang(m):
        verwijzing, oude = m.group(1), m.group(2)
        bestand = os.path.join(WORTEL, verwijzing.replace("../", ""))
        if not os.path.exists(bestand):
            return m.group(0)
        nieuwe = "?v=" + stempel_van(bestand)
        if oude == nieuwe:
            return m.group(0)
        achterstallig[0] += 1
        if controleer:
            return m.group(0)
        aangepast[0] += 1
        return verwijzing + nieuwe

    nieuw = PATROON.sub(vervang, html)
    if not controleer and nieuw != html:
        io.open(pad, "w", encoding="utf-8", newline="\n").write(nieuw)
    return aangepast[0], achterstallig[0]


def main():
    controleer = "--controle" in sys.argv
    totaal_aangepast = totaal_achterstallig = 0

    for pagina in PAGINAS:
        aangepast, achterstallig = verwerk(pagina, controleer)
        totaal_aangepast += aangepast
        totaal_achterstallig += achterstallig
        if aangepast:
            print("  %-24s %d verwijzing(en) bijgewerkt" % (pagina, aangepast))
        elif achterstallig and controleer:
            print("  %-24s %d verwijzing(en) NIET bij" % (pagina, achterstallig))

    if controleer:
        if totaal_achterstallig:
            print("%d verwijzing(en) niet bij. Draai: python tools/stempel.py" % totaal_achterstallig)
            return 1
        print("Alle verwijzingen zijn bij.")
        return 0

    print("Klaar: %d verwijzing(en) bijgewerkt." % totaal_aangepast)
    return 0


if __name__ == "__main__":
    sys.exit(main())
