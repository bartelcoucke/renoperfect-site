/* ===== Teksten en foto's aanpassen vanuit de browser (2026-09-06, vraag Bartel) ===========
   "Zorg dat ik zelf in de localhost de teksten op de website kan aanpassen."
   "Zorg dat ik zelf onmiddellijk foto's kan insteken. Gewoon erin slepen vanuit explorer."
   "Ik moet ook kunnen aanduiden welke de eerste foto is."

   Dit bestand doet ALLEEN iets op localhost. Op renoperfect.be of GitHub Pages stapt het
   meteen uit: geen knop, geen bewerkbare tekst, geen sleepzones. Opslaan gaat naar
   tools/dev-server.py, die de pagina en de foto's op schijf schrijft en van de pagina
   eerst een reservekopie maakt.

   Let op: bij opslaan gaat de HELE pagina naar schijf zoals de browser die op dat moment
   kent. Alles wat JavaScript onderweg toevoegt (de Leaflet-kaart, de carrouselknoppen, de
   klasse op telefoonnummers) wordt daarom eerst weggehaald - anders belandt dat in het
   bronbestand. */
(function () {
  var LOKAAL = ['localhost', '127.0.0.1', '::1'];
  if (LOKAAL.indexOf(location.hostname) === -1) return;

  /* Wat bewerkt mag worden: hele blokken, geen losse woorden. Zo blijft de opmaak binnen
     een alinea intact terwijl de tekst vrij te typen is. */
  var BEWERKBAAR = [
    'h1', 'h2', 'h3', 'h4',
    'p', 'li', 'label', 'legend', 'figcaption',
    '.nav a', '.btn', '.keuze-actie', '.stat-title', '.badge',
    '.hero-badge', '.hero-tel span', '.hero-wa span', '.bel-groot span',
    '.naamregel'
  ].join(', ');

  /* Waar we vanaf blijven: de kaart vult zichzelf, de zwevende knoppen zijn geen tekst,
     en de balk van deze bewerker hoort niet in het bestand. */
  var OVERSLAAN = '#tekstbalk, #werkgebied-kaart, .leaflet-container, .rp-wa, .rp-belknop, script, style, select, option';

  var FOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

  /* Foto's uit een toestel zijn al gauw 3 tot 5 MB. Zo groot horen ze niet op een website:
     op een gsm duurt de pagina dan tientallen seconden en Google rekent dat aan. Daarom
     wordt elke foto voor het opslaan teruggebracht tot 1600 pixels op de langste zijde en
     als JPEG bewaard - dat scheelt ongeveer negen tiende van de omvang, zonder zichtbaar
     verschil op het scherm (2026-09-06, vraag Bartel). */
  var FOTO_MAX_ZIJDE = 1600;
  var FOTO_KWALITEIT = 0.82;

  /* Na een fotobewerking herlaadt de pagina, anders klopt de carrousel niet meer met het
     aantal foto's. Deze sleutel onthoudt dat we daarna gewoon verder willen bewerken. */
  var HERVAT = 'tb-hervat';

  /* De kaart-div zoals hij in het bronbestand staat, vastgelegd voordat Leaflet hem vult.
     Daarom moet dit bestand VOOR main.js geladen worden. */
  var kaartOrigineel = null;
  var kaartVak = document.getElementById('werkgebied-kaart');
  if (kaartVak) kaartOrigineel = kaartVak.cloneNode(true);

  var aan = false;
  var balk, knopBewerk, knopOpslaan, melding;

  /* Tijdstip waarop het bronbestand stond toen deze pagina geladen werd. Gaat mee bij het
     opslaan: is het bestand intussen van buitenaf gewijzigd, dan weigert de server en
     overschrijf je dat werk niet (2026-09-06). */
  var stand = null;

  function bestandsnaam() {
    var deel = location.pathname.split('/').pop();
    return deel && deel.indexOf('.html') !== -1 ? deel : 'index.html';
  }

  function zeg(tekst) {
    if (melding) melding.textContent = tekst || '';
  }

  /* ---- Balk linksonder ---------------------------------------------------------------- */
  function bouwBalk() {
    var stijl = document.createElement('style');
    stijl.id = 'tb-stijl';
    stijl.textContent = [
      '#tekstbalk{position:fixed;left:16px;bottom:16px;z-index:100000;display:flex;',
      'align-items:center;gap:8px;padding:8px 10px;border-radius:6px;background:#1a1a2e;',
      'border:1px solid rgba(255,255,255,.16);box-shadow:0 8px 28px rgba(0,0,0,.35);',
      'font:500 13px/1.3 Inter,system-ui,sans-serif;color:#fff}',
      '#tekstbalk button{font:inherit;font-weight:600;cursor:pointer;border:0;',
      'border-radius:4px;padding:8px 14px;background:#e8611a;color:#fff}',
      '#tekstbalk button:hover{background:#cf5215}',
      '#tekstbalk button[disabled]{opacity:.4;cursor:default}',
      '#tekstbalk .tb-uit{background:transparent;border:1px solid rgba(255,255,255,.28)}',
      '#tekstbalk .tb-uit:hover{background:rgba(255,255,255,.12)}',
      '#tekstbalk .tb-melding{opacity:.8;max-width:320px}',
      '.tb-bewerkbaar{outline:1px dashed rgba(232,97,26,.55);outline-offset:3px}',
      '.tb-bewerkbaar:focus{outline:2px solid #e8611a;background:rgba(232,97,26,.06)}',
      /* Sleepzone en fotoknoppen */
      '.tb-sleep{outline:1px dashed rgba(232,97,26,.6);outline-offset:-3px}',
      '.tb-sleep-over{outline:2px solid #e8611a;outline-offset:-3px}',
      '.tb-sleep-over::after{content:"Laat los om toe te voegen";position:absolute;inset:0;',
      'z-index:5;display:flex;align-items:center;justify-content:center;text-align:center;',
      'padding:8px;background:rgba(26,26,46,.72);color:#fff;',
      'font:600 12px/1.3 Inter,system-ui,sans-serif}',
      '.tb-fotoknoppen{position:absolute;top:6px;right:6px;z-index:4;display:flex;gap:4px}',
      '.tb-fotoknoppen button{font:600 11px/1 Inter,system-ui,sans-serif;cursor:pointer;',
      'border:0;border-radius:4px;padding:5px 7px;background:rgba(26,26,46,.82);color:#fff}',
      '.tb-fotoknoppen button:hover{background:#e8611a}'
    ].join('');
    document.head.appendChild(stijl);

    balk = document.createElement('div');
    balk.id = 'tekstbalk';

    knopBewerk = document.createElement('button');
    knopBewerk.type = 'button';
    knopBewerk.textContent = 'Teksten en foto’s bewerken';
    knopBewerk.addEventListener('click', wissel);

    knopOpslaan = document.createElement('button');
    knopOpslaan.type = 'button';
    knopOpslaan.className = 'tb-uit';
    knopOpslaan.textContent = 'Opslaan';
    knopOpslaan.disabled = true;
    knopOpslaan.addEventListener('click', function () { opslaan(false); });

    melding = document.createElement('span');
    melding.className = 'tb-melding';

    balk.appendChild(knopBewerk);
    balk.appendChild(knopOpslaan);
    balk.appendChild(melding);
    document.body.appendChild(balk);

    bouwSleepzones();
    haalStand();
    hervat();
  }

  function haalStand() {
    fetch('/__stand?bestand=' + encodeURIComponent(bestandsnaam()))
      .then(function (res) { return res.json(); })
      .then(function (j) { if (j && j.ok) stand = j.stand; })
      .catch(function () { /* zonder stand blijft opslaan gewoon werken */ });
  }

  /* Na het herladen dat op een fotobewerking volgt: meteen weer in bewerkmodus, op
     dezelfde hoogte van de pagina. */
  function hervat() {
    var hoogte = null;
    try {
      hoogte = sessionStorage.getItem(HERVAT);
      if (hoogte !== null) sessionStorage.removeItem(HERVAT);
    } catch (e) { return; }
    if (hoogte === null) return;

    in_();
    zeg('Opgeslagen. Je kan verder bewerken en foto’s toevoegen.');
    var y = parseInt(hoogte, 10);
    if (!isNaN(y)) setTimeout(function () { window.scrollTo(0, y); }, 60);
  }

  /* ---- Aan en uit --------------------------------------------------------------------- */
  function wissel() {
    if (aan) {
      uit();
      zeg('Bewerken gestopt.');
    } else {
      in_();
    }
  }

  function in_() {
    aan = true;
    var aantal = 0;
    document.querySelectorAll(BEWERKBAAR).forEach(function (el) {
      if (el.closest(OVERSLAAN)) return;
      el.setAttribute('contenteditable', 'true');
      el.setAttribute('spellcheck', 'true');
      el.classList.add('tb-bewerkbaar');
      aantal++;
    });
    document.querySelectorAll('[data-fotos]').forEach(function (vak) {
      vak.classList.add('tb-sleep');
      zetFotoknoppen(vak);
    });
    knopBewerk.textContent = 'Stoppen met bewerken';
    knopOpslaan.disabled = false;
    zeg(aantal + ' teksten bewerkbaar. Sleep foto’s in een vak om ze toe te voegen.');
  }

  function uit() {
    aan = false;
    document.querySelectorAll('.tb-bewerkbaar').forEach(function (el) {
      el.removeAttribute('contenteditable');
      el.removeAttribute('spellcheck');
      el.classList.remove('tb-bewerkbaar');
      if (!el.getAttribute('class')) el.removeAttribute('class');
    });
    document.querySelectorAll('[data-fotos]').forEach(function (vak) {
      vak.classList.remove('tb-sleep', 'tb-sleep-over');
      var knoppen = vak.querySelector('.tb-fotoknoppen');
      if (knoppen) knoppen.remove();
    });
    knopBewerk.textContent = 'Teksten en foto’s bewerken';
    knopOpslaan.disabled = true;
  }

  /* Tijdens het bewerken mag een klik op een link of knop de pagina niet verlaten.
     De carrouselpijltjes en de fotoknoppen zijn de uitzondering. */
  document.addEventListener('click', function (e) {
    if (!aan) return;
    if (e.target.closest('#tekstbalk, .fotos-knop, .fotos-stip, .tb-fotoknoppen')) return;
    if (e.target.closest('a, button')) e.preventDefault();
  }, true);

  document.addEventListener('submit', function (e) {
    if (aan) e.preventDefault();
  }, true);

  window.addEventListener('beforeunload', function (e) {
    if (!aan) return;
    e.preventDefault();
    e.returnValue = '';
  });

  /* ---- Foto's: welke staat in beeld --------------------------------------------------- */
  function huidigeFoto(vak) {
    var beelden = vak.querySelectorAll('.foto');
    if (!beelden.length) return null;
    var nr = parseInt(vak.getAttribute('data-huidig') || '0', 10);
    if (isNaN(nr) || nr < 0 || nr >= beelden.length) nr = 0;
    return beelden[nr];
  }

  /* Knoppen op de foto die in beeld staat: eerste maken of verwijderen. */
  function zetFotoknoppen(vak) {
    var oud = vak.querySelector('.tb-fotoknoppen');
    if (oud) oud.remove();

    var beelden = vak.querySelectorAll('.foto');
    var echte = vak.querySelectorAll('.foto:not(.foto-leeg)');
    if (!echte.length) return;   /* nog geen echte foto's: niets te ordenen */

    var rij = document.createElement('div');
    rij.className = 'tb-fotoknoppen';

    if (beelden.length > 1) {
      var eerste = document.createElement('button');
      eerste.type = 'button';
      eerste.textContent = '1e';
      eerste.title = 'Maak dit de eerste foto';
      eerste.addEventListener('click', function () {
        var foto = huidigeFoto(vak);
        if (!foto) return;
        var spoor = vak.querySelector('.fotos-spoor');
        spoor.insertBefore(foto, spoor.firstElementChild);
        zeg('Eerste foto gewijzigd, bezig met opslaan…');
        opslaan(true);
      });
      rij.appendChild(eerste);
    }

    var weg = document.createElement('button');
    weg.type = 'button';
    weg.textContent = '×';
    weg.title = 'Verwijder deze foto uit de pagina';
    weg.addEventListener('click', function () {
      var foto = huidigeFoto(vak);
      if (!foto) return;
      var spoor = vak.querySelector('.fotos-spoor');
      foto.remove();
      if (!spoor.querySelector('.foto')) {
        var leeg = document.createElement('div');
        leeg.className = 'foto foto-leeg';
        leeg.textContent = 'Foto volgt';
        spoor.appendChild(leeg);
      }
      zeg('Foto verwijderd uit de pagina, bezig met opslaan…');
      opslaan(true);
    });
    rij.appendChild(weg);

    vak.appendChild(rij);
  }

  /* ---- Foto's inslepen ---------------------------------------------------------------- */
  function bouwSleepzones() {
    document.querySelectorAll('[data-fotos]').forEach(function (vak) {
      ['dragenter', 'dragover'].forEach(function (soort) {
        vak.addEventListener(soort, function (e) {
          if (!aan) return;
          e.preventDefault();
          e.dataTransfer.dropEffect = 'copy';
          vak.classList.add('tb-sleep-over');
        });
      });
      ['dragleave', 'dragend'].forEach(function (soort) {
        vak.addEventListener(soort, function () {
          vak.classList.remove('tb-sleep-over');
        });
      });
      vak.addEventListener('drop', function (e) {
        if (!aan) return;
        e.preventDefault();
        vak.classList.remove('tb-sleep-over');
        var bestanden = [].slice.call(e.dataTransfer.files || []);
        if (bestanden.length) verwerkFotos(vak, bestanden);
      });
    });
  }

  /* Verkleint de foto in de browser en geeft hem terug als JPEG. */
  function verklein(bestand) {
    return new Promise(function (klaar, mis) {
      var url = URL.createObjectURL(bestand);
      var beeld = new Image();
      beeld.onload = function () {
        var schaal = Math.min(1, FOTO_MAX_ZIJDE / Math.max(beeld.width, beeld.height));
        var breed = Math.round(beeld.width * schaal);
        var hoog = Math.round(beeld.height * schaal);

        var doek = document.createElement('canvas');
        doek.width = breed;
        doek.height = hoog;
        var pen = doek.getContext('2d');
        /* Een png kan doorzichtige delen hebben; jpeg kan dat niet. Wit eronder voorkomt
           dat die delen zwart worden. */
        pen.fillStyle = '#ffffff';
        pen.fillRect(0, 0, breed, hoog);
        pen.drawImage(beeld, 0, 0, breed, hoog);
        URL.revokeObjectURL(url);

        var data = doek.toDataURL('image/jpeg', FOTO_KWALITEIT).split(',')[1];
        klaar({
          data: data,
          naam: bestand.name.replace(/\.[^.]+$/, '') + '.jpg',
          bytes: Math.round(data.length * 3 / 4)
        });
      };
      beeld.onerror = function () {
        URL.revokeObjectURL(url);
        mis(new Error('kon ' + bestand.name + ' niet inlezen'));
      };
      beeld.src = url;
    });
  }

  function verwerkFotos(vak, bestanden) {
    var kaart = vak.closest('.project');
    var titel = kaart && kaart.querySelector('h3') ? kaart.querySelector('h3').textContent : 'project';
    var kant = vak.getAttribute('data-kant') || '';
    var spoor = vak.querySelector('.fotos-spoor');
    var gelukt = 0;
    var bespaard = 0;

    var beurt = Promise.resolve();
    bestanden.forEach(function (bestand) {
      beurt = beurt.then(function () {
        if (FOTO_TYPES.indexOf(bestand.type) === -1) {
          zeg('Overgeslagen: ' + bestand.name + ' is geen jpg, png of webp.');
          return;
        }
        zeg('Bezig met ' + bestand.name + '…');
        return verklein(bestand)
          .then(function (klein) {
            bespaard += Math.max(0, bestand.size - klein.bytes);
            return fetch('/__foto', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                naam: klein.naam,
                voorvoegsel: titel + ' ' + kant,
                data: klein.data
              })
            });
          })
          .then(function (res) {
            return res.json().then(function (j) { return { ok: res.ok, j: j }; });
          })
          .then(function (r) {
            if (!r.ok || !r.j.ok) throw new Error((r.j && r.j.fout) || 'onbekende fout');
            var leeg = spoor.querySelector('.foto-leeg');
            if (leeg) leeg.remove();
            var dia = document.createElement('div');
            dia.className = 'foto';
            var beeld = document.createElement('img');
            beeld.src = r.j.pad;
            beeld.alt = titel + ' — ' + kant.toLowerCase();
            dia.appendChild(beeld);
            spoor.appendChild(dia);
            gelukt++;
          })
          .catch(function (fout) {
            zeg('Mislukt bij ' + bestand.name + ': ' + fout.message);
          });
      });
    });

    beurt.then(function () {
      if (!gelukt) return;
      zeg(gelukt + ' foto’s toegevoegd (' + Math.round(bespaard / 1024 / 1024 * 10) / 10 +
          ' MB bespaard), bezig met opslaan…');
      opslaan(true);
    });
  }

  /* ---- Opslaan ------------------------------------------------------------------------ */
  function schoneKopie() {
    var kopie = document.documentElement.cloneNode(true);

    /* Sporen van deze bewerker */
    kopie.querySelectorAll('[contenteditable]').forEach(function (el) {
      el.removeAttribute('contenteditable');
      el.removeAttribute('spellcheck');
    });
    kopie.querySelectorAll('.tb-bewerkbaar, .tb-sleep, .tb-sleep-over').forEach(function (el) {
      el.classList.remove('tb-bewerkbaar', 'tb-sleep', 'tb-sleep-over');
      if (!el.getAttribute('class')) el.removeAttribute('class');
    });
    kopie.querySelectorAll('#tekstbalk, #tb-stijl, .tb-fotoknoppen').forEach(function (el) {
      el.remove();
    });

    /* Sporen die main.js achterlaat */
    kopie.querySelectorAll('.fotos-knop, .fotos-stippen, .vergroot').forEach(function (el) { el.remove(); });
    kopie.querySelectorAll('[data-fotos]').forEach(function (el) {
      el.removeAttribute('data-huidig');
      var spoor = el.querySelector('.fotos-spoor');
      if (spoor) spoor.removeAttribute('style');
    });
    kopie.querySelectorAll('.tel-statisch').forEach(function (el) {
      el.classList.remove('tel-statisch');
      if (!el.getAttribute('class')) el.removeAttribute('class');
    });
    var nav = kopie.querySelector('.nav');
    if (nav) nav.classList.remove('open');
    var menuKnop = kopie.querySelector('.menu-toggle');
    if (menuKnop) menuKnop.setAttribute('aria-expanded', 'false');

    /* De kaart terug naar de lege div uit het bronbestand */
    var kaart = kopie.querySelector('#werkgebied-kaart');
    if (kaart && kaartOrigineel) kaart.replaceWith(kaartOrigineel.cloneNode(true));

    return '<!DOCTYPE html>\n' + kopie.outerHTML + '\n';
  }

  /* herlaad = true na een fotobewerking: de carrousel moet opnieuw opgebouwd worden,
     anders kloppen de pijltjes en stippen niet meer met het aantal foto's. */
  function opslaan(herlaad) {
    var wasAan = aan;
    if (wasAan) uit();
    knopOpslaan.disabled = true;

    fetch('/__opslaan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ bestand: bestandsnaam(), html: schoneKopie(), stand: stand })
    })
      .then(function (res) {
        return res.json().then(function (j) { return { ok: res.ok, j: j }; });
      })
      .then(function (r) {
        if (!r.ok || !r.j.ok) throw new Error((r.j && r.j.fout) || 'onbekende fout');
        stand = r.j.stand || stand;
        if (herlaad) {
          /* Onthoud dat we aan het bewerken waren, zodat je na het herladen niet opnieuw
             op de knop moet duwen om de volgende foto's toe te voegen. */
          try {
            sessionStorage.setItem(HERVAT, String(window.scrollY));
          } catch (e) { /* privémodus: dan gewoon zonder */ }
          location.reload();
          return;
        }
        zeg('Opgeslagen in ' + r.j.bestand + '.');
      })
      .catch(function (fout) {
        zeg('Niet opgeslagen: ' + fout.message);
        /* Bij een mislukking blijft de bewerkstand staan, zodat je niets kwijt bent. */
        if (wasAan) in_();
      })
      .then(function () {
        if (aan) knopOpslaan.disabled = false;
      });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bouwBalk);
  } else {
    bouwBalk();
  }
})();
