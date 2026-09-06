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
      /* _replyto laat een antwoord op de melding rechtstreeks naar de aanvrager gaan
         (2026-09-06). */
      var gegevens = new FormData(form);
      var email = form.querySelector("#email");
      if (email && email.value) gegevens.set("_replyto", email.value);

      fetch(form.action, {
        method: "POST",
        body: gegevens,
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

  /* Omtrek van het werkgebied (2026-09-06, vraag Bartel: "niet in Frankrijk en Nederland:
     volg de 2 grenzen, volg ook de kustlijn").

     De lijn loopt met de klok mee: van De Panne langs de kust tot het Zwin, dan naar het
     oosten langs de Nederlandse grens, bij Dendermonde en Aalst naar beneden - verder
     oostwaarts gaan we niet - en via het westen van Henegouwen terug omhoog langs de
     Franse grens. De punten liggen bewust net binnen de landsgrens, zodat het vlak
     nergens over Frans of Nederlands gebied valt. Nog steeds een indicatie, geen
     kadastergrens; dat staat ook zo in de legende. */
  var gebied = [
    [51.08, 2.58],  /* De Panne, kust bij de Franse grens */
    [51.13, 2.69],  /* Koksijde */
    [51.16, 2.77],  /* Nieuwpoort */
    [51.21, 2.87],  /* Middelkerke */
    [51.24, 2.93],  /* Oostende */
    [51.28, 3.06],  /* De Haan */
    [51.31, 3.16],  /* Blankenberge */
    [51.34, 3.28],  /* Zeebrugge */
    [51.36, 3.36],  /* Knokke-Heist, het Zwin: hier raakt de Nederlandse grens de zee */
    [51.30, 3.36],  /* Nederlandse grens bij Westkapelle */
    [51.26, 3.45],  /* grens bij Maldegem */
    [51.25, 3.58],  /* grens bij Sint-Laureins */
    [51.22, 3.72],  /* grens bij Assenede */
    [51.20, 3.82],  /* grens bij Zelzate */
    [51.23, 3.95],  /* grens bij Sint-Gillis-Waas */
    [51.24, 4.07],  /* oostelijke rand van het Waasland */
    [51.03, 4.10],  /* Dendermonde */
    [50.94, 4.04],  /* Aalst: verder oostwaarts gaan we niet */
    [50.77, 3.90],  /* Geraardsbergen */
    [50.63, 3.80],  /* Aat */
    [50.53, 3.60],  /* Franse grens bij Bernissart */
    [50.51, 3.40],  /* Franse grens ten zuiden van Doornik */
    [50.63, 3.26],  /* Franse grens bij Pecq */
    [50.72, 3.21],  /* Moeskroen */
    [50.77, 3.10],  /* Menen */
    [50.74, 2.95],  /* Komen-Waasten */
    [50.72, 2.87],  /* Ploegsteert */
    [50.79, 2.72],  /* Poperinge */
    [50.90, 2.62],  /* Roesbrugge */
    [50.99, 2.60]   /* Veurne */
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

/* ===== Telefoonnummers: knop op gsm, tekst op de computer (2026-09-06, vraag Bartel) ======
   Op een telefoon moet een tik op het nummer meteen de kiezer openen - dat doet een
   tel:-link vanzelf. Op een computer opent diezelfde link Skype, Teams of een lege
   foutmelding, en dat is voor de bezoeker een dood spoor. Daar laten we de klik dus
   niets doen; het nummer blijft gewoon staan om te lezen en te kopieren.

   De test kijkt naar het INVOERAPPARAAT, niet naar de schermbreedte: een klein venster op
   een laptop blijft een computer, een grote tablet met aanraakscherm kan wel bellen. */
(function () {
  var kanBellen = window.matchMedia &&
    window.matchMedia('(hover: none) and (pointer: coarse)').matches;
  if (kanBellen) return;

  document.querySelectorAll('a[href^="tel:"]').forEach(function (link) {
    link.classList.add('tel-statisch');
    link.addEventListener('click', function (e) {
      e.preventDefault();
    });
  });
})();

/* ===== Voor-en-na-carrousels (2026-09-06, vraag Bartel) ===================================
   Elk project toont twee rechthoeken: links voor de werken, rechts erna. In elke rechthoek
   kunnen meerdere foto's zitten.

   De pijltjes en stippen worden hier gemaakt en niet in de HTML gezet, om twee redenen:
   met een enkele foto horen ze er niet te staan, en zo hoeft wie een foto toevoegt alleen
   een <div class="foto"> bij te zetten - de bediening past zich vanzelf aan. */
(function () {
  document.querySelectorAll('[data-fotos]').forEach(function (vak) {
    var spoor = vak.querySelector('.fotos-spoor');
    if (!spoor) return;

    var beelden = spoor.querySelectorAll('.foto');
    if (beelden.length < 2) return;   /* een enkele foto heeft geen bediening nodig */

    var kant = vak.getAttribute('data-kant') || 'foto';
    var huidig = 0;
    var stippen = [];

    function toon(nr) {
      huidig = (nr + beelden.length) % beelden.length;
      spoor.style.transform = 'translateX(' + (-100 * huidig) + '%)';
      /* De bewerker leest dit uit om te weten welke foto in beeld staat. */
      vak.setAttribute('data-huidig', String(huidig));
      stippen.forEach(function (stip, i) {
        stip.setAttribute('aria-current', i === huidig ? 'true' : 'false');
      });
    }

    function knop(klasse, teken, label, stap) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'fotos-knop ' + klasse;
      b.innerHTML = teken;
      b.setAttribute('aria-label', label + ' foto, ' + kant.toLowerCase());
      b.addEventListener('click', function () { toon(huidig + stap); });
      vak.appendChild(b);
    }

    knop('fotos-vorige', '&#10094;', 'Vorige', -1);
    knop('fotos-volgende', '&#10095;', 'Volgende', 1);

    var rij = document.createElement('div');
    rij.className = 'fotos-stippen';
    beelden.forEach(function (_, i) {
      var stip = document.createElement('button');
      stip.type = 'button';
      stip.className = 'fotos-stip';
      stip.setAttribute('aria-label', 'Foto ' + (i + 1) + ' van ' + beelden.length + ', ' + kant.toLowerCase());
      stip.addEventListener('click', function () { toon(i); });
      rij.appendChild(stip);
      stippen.push(stip);
    });
    vak.appendChild(rij);

    /* Vegen op een telefoon. Een korte beweging telt niet mee, anders schuift het beeld
       al door bij het scrollen. */
    var startX = null;
    vak.addEventListener('touchstart', function (e) {
      startX = e.changedTouches[0].clientX;
    }, { passive: true });
    vak.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var verschil = e.changedTouches[0].clientX - startX;
      if (Math.abs(verschil) > 40) toon(huidig + (verschil < 0 ? 1 : -1));
      startX = null;
    }, { passive: true });

    toon(0);
  });
})();

/* ===== Projectfoto uitvergroten (2026-09-06, vraag Bartel) ================================
   "De foto's moeten kunnen uitvergroot worden" - "als je erop dubbelklikt."

   Dubbelklikken en niet enkelklikken, om twee redenen: op een projectkaart wil je met een
   gewone klik nog gewoon kunnen scrollen en slepen, en in de bewerkmodus blijft de enkele
   klik vrij om tekst te selecteren.

   Het venster toont de foto's van dezelfde rechthoek, dus de reeks 'voor' of de reeks 'na'.
   Onderaan staat welke reeks je bekijkt en de hoeveelste foto het is. */
(function () {
  var venster = null;
  var beeld = null;
  var bijschrift = null;
  var reeks = [];
  var nr = 0;
  var kantNaam = '';

  function bouw() {
    venster = document.createElement('div');
    venster.className = 'vergroot';
    venster.setAttribute('role', 'dialog');
    venster.setAttribute('aria-modal', 'true');
    venster.setAttribute('aria-label', 'Foto uitvergroot');

    beeld = document.createElement('img');
    bijschrift = document.createElement('p');
    bijschrift.className = 'vergroot-bijschrift';

    venster.appendChild(beeld);
    venster.appendChild(bijschrift);
    venster.appendChild(knop('vergroot-sluit', '✕', 'Sluiten', sluit));
    venster.appendChild(knop('vergroot-vorige', '❮', 'Vorige foto', function () { toon(nr - 1); }));
    venster.appendChild(knop('vergroot-volgende', '❯', 'Volgende foto', function () { toon(nr + 1); }));

    /* Klikken naast de foto sluit; klikken op de foto zelf niet. */
    venster.addEventListener('click', function (e) {
      if (e.target === venster) sluit();
    });

    document.body.appendChild(venster);
  }

  function knop(klasse, teken, label, doen) {
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'vergroot-knop ' + klasse;
    b.textContent = teken;
    b.setAttribute('aria-label', label);
    b.addEventListener('click', function (e) {
      e.stopPropagation();
      doen();
    });
    return b;
  }

  function toon(index) {
    if (!reeks.length) return;
    nr = (index + reeks.length) % reeks.length;
    beeld.src = reeks[nr].src;
    beeld.alt = reeks[nr].alt || '';
    bijschrift.textContent = kantNaam + ' · foto ' + (nr + 1) + ' van ' + reeks.length;
    var meerdere = reeks.length > 1;
    venster.querySelector('.vergroot-vorige').hidden = !meerdere;
    venster.querySelector('.vergroot-volgende').hidden = !meerdere;
  }

  function open(vak, foto) {
    if (!venster) bouw();
    reeks = [].slice.call(vak.querySelectorAll('.foto img'));
    if (!reeks.length) return;
    kantNaam = vak.getAttribute('data-kant') || 'Foto';
    toon(reeks.indexOf(foto));
    venster.classList.add('toon');
    document.body.style.overflow = 'hidden';
    venster.querySelector('.vergroot-sluit').focus();
  }

  function sluit() {
    if (!venster) return;
    venster.classList.remove('toon');
    document.body.style.overflow = '';
  }

  document.addEventListener('dblclick', function (e) {
    var foto = e.target.closest('.foto img');
    if (!foto) return;
    var vak = foto.closest('[data-fotos]');
    if (!vak) return;
    e.preventDefault();
    open(vak, foto);
  });

  document.addEventListener('keydown', function (e) {
    if (!venster || !venster.classList.contains('toon')) return;
    if (e.key === 'Escape') sluit();
    if (e.key === 'ArrowLeft') toon(nr - 1);
    if (e.key === 'ArrowRight') toon(nr + 1);
  });
})();
