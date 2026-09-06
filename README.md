# Renoperfect — publieke testsite

Statische 1-pagina website (HTML/CSS/JS) volgens Elementor-bouwplan **v1.1** (24 augustus 2026).

- **Geen WordPress.** Geen betalende hosting.
- **Doel nu:** testen via GitHub Pages.
- **Niet doen:** de React-login op `renoperfect.be` aanraken.

## Lokaal bekijken en teksten aanpassen

Start de ontwikkelserver vanuit deze map:

```
python tools/dev-server.py
```

Daarna: http://localhost:8080

Linksonder staat een balk met **Teksten bewerken**. Klik erop, klik in een tekst,
typ, en klik daarna op **Opslaan**. De wijziging gaat rechtstreeks naar `index.html`.
Voor elke opslag komt er een reservekopie in `.bewerk-backups/` (niet in git).

De bewerkbalk verschijnt alleen op localhost. Op GitHub Pages en op renoperfect.be
doet `assets/js/tekst-editor.js` niets.

## Live test-URL

Na GitHub Pages: `https://<github-user>.github.io/renoperfect-site/`

## Projectfoto's toevoegen

Elk project heeft twee rechthoeken: links voor de werken, rechts erna. In elke rechthoek
passen meerdere foto's.

**Vanuit de browser (makkelijkst).** Start de server, klik linksonder op *Teksten en
foto's bewerken*, en sleep de foto's vanuit de verkenner in het juiste vak. Ze worden
opgeslagen in `assets/img/projecten/` en meteen in de pagina gezet.

Op de foto die in beeld staat verschijnen twee knopjes rechtsboven:

- **1e** zet die foto vooraan, zodat hij als eerste getoond wordt
- **×** haalt hem uit de pagina (het bestand blijft in `assets/img/projecten/` staan)

Toegestaan: jpg, png en webp, tot 12 MB per foto. Liggende foto's werken het best, want
ze worden bijgesneden om de rechthoek te vullen.

**Met de hand.** Zet een bestand in `assets/img/` en voeg per foto een regel toe binnen de
juiste `<div class="fotos-spoor">`:

```html
<div class="foto"><img src="assets/img/waregem-dak-voor-1.jpg" alt="Dak voor de werken"></div>
```

Pijltjes en stippen verschijnen vanzelf zodra er meer dan een foto in een rechthoek zit.

**Uitvergroten.** Bezoekers dubbelklikken op een foto om hem groot te zien. In dat venster
blader je met de pijltjes of met de pijltjestoetsen, en sluit je met Escape of met een klik
naast de foto.

## Vóór elke uitrol: versiestempel

De webserver cachet CSS en JS een jaar lang. Zonder stempel ziet een terugkerende
bezoeker een wijziging nooit. Draai daarom telkens:

```
python tools/stempel.py
```

Dat zet `?v=<hash>` achter elke verwijzing naar een eigen stijl- of scriptbestand.
`python tools/stempel.py --controle` schrijft niets en meldt alleen of alles bij is.

## Talen

De site bestaat in drie talen:

- `index.html` — Nederlands (hoofdversie)
- `fr/index.html` — Frans
- `en/index.html` — Engels

De vertalingen zijn gemaakt uit de Nederlandse pagina en delen dezelfde structuur,
foto's en gestructureerde gegevens. Verandert er iets aan de Nederlandse pagina, dan
moeten de twee andere mee bijgewerkt worden.

## Later

- Echte werffoto’s i.p.v. “Foto volgt”
- Formulier koppelen aan Formspree (`bartelcoucke@renoperfect.be`)
- Eigen domein `www.renoperfect.be` (gratis DNS) — login blijft op `app.renoperfect.be`
