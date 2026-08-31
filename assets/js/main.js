(function () {
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.querySelector(".nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  document.querySelectorAll(".js-jaar").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  var form = document.getElementById("contactformulier");
  if (form) {
    var succes = document.getElementById("form-succes");
    var fout = document.getElementById("form-fout");
    var knop = form.querySelector("button[type=submit]");
    var knopTekst = knop ? knop.textContent : "";

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var privacy = form.querySelector("#privacy");
      if (privacy && !privacy.checked) {
        privacy.focus();
        return;
      }
      if (fout) fout.classList.remove("toon");
      if (knop) {
        knop.disabled = true;
        knop.textContent = "Versturen…";
      }
      fetch(form.action, {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" }
      })
        .then(function (res) {
          if (!res.ok) throw new Error("Formspree antwoordde " + res.status);
          if (succes) succes.classList.add("toon");
          form.reset();
        })
        .catch(function () {
          if (fout) fout.classList.add("toon");
        })
        .then(function () {
          if (knop) {
            knop.disabled = false;
            knop.textContent = knopTekst;
          }
        });
    });
  }
})();

/* De spoedknop vult het type alvast in (2026-08-31). Wie op "dringende interventie" klikt,
   hoeft dat niet nog eens uit de lijst te kiezen. Zonder JavaScript land je nog steeds
   gewoon op het formulier. */
(function () {
  var knop = document.getElementById('knop-dringend');
  if (!knop) return;
  knop.addEventListener('click', function () {
    var keuze = document.getElementById('type');
    if (keuze) keuze.value = 'Dringende interventie';
  });
})();

/* ===== Werkgebied-kaart (2026-08-31, vraag Bartel) =========================================
   "Enkel de kaart mag blijven, maar misschien afbakenen waar we actief zijn en onze 2
   adressen erin zetten."

   De vorige Google-iframe kon dat niet: die toont een adres en verder niets. Leaflet met
   OpenStreetMap heeft geen sleutel en geen kosten nodig.

   De twee coordinaten zijn OPGEZOCHT (Nominatim), niet geschat. Het gebied is bewust een
   ruwe omtrek en geen exacte provinciegrens - het is een indicatie van waar we komen, en
   dat staat ook zo in de legende. Wil je exacte grenzen, dan hoort daar echte
   grensdata bij en geen zelfgetekende veelhoek. */
(function () {
  var vak = document.getElementById('werkgebied-kaart');
  if (!vak || typeof L === 'undefined') return;

  var vestigingen = [
    { naam: 'Renoperfect &mdash; Anzegem', adres: 'Walbrugge 36, 8573 Anzegem', pos: [50.810367, 3.465171] },
    { naam: 'Renoperfect &mdash; Ooigem',  adres: 'Oostrozebeeksestraat 70A, 8710 Ooigem', pos: [50.898416, 3.332950] }
  ];

  /* Ruwe omtrek van West- en Oost-Vlaanderen plus het westen van Henegouwen. */
  var gebied = [
    [51.38, 2.55], [51.32, 4.25], [50.95, 4.30],
    [50.68, 3.95], [50.50, 3.35], [50.68, 2.85], [50.95, 2.55]
  ];

  var kaart = L.map(vak, { scrollWheelZoom: false });
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
  }).addTo(kaart);

  var vlak = L.polygon(gebied, {
    color: '#e67e22', weight: 2, opacity: 0.9,
    fillColor: '#e67e22', fillOpacity: 0.12
  }).addTo(kaart);

  vestigingen.forEach(function (v) {
    L.marker(v.pos).addTo(kaart)
      .bindPopup('<strong>' + v.naam + '</strong><br>' + v.adres);
  });

  kaart.fitBounds(vlak.getBounds(), { padding: [12, 12] });

  /* Scrollen over de kaart mag de pagina niet kapen; met ctrl ingedrukt kan je wel zoomen. */
  kaart.on('focus', function () { kaart.scrollWheelZoom.enable(); });
  kaart.on('blur', function () { kaart.scrollWheelZoom.disable(); });
})();
