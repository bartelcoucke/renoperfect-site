/* ===== Bezoekregistratie (2026-09-06, vraag Bartel) =======================================
   Meldt één keer per paginabezoek waar de bezoeker vandaan komt en op wat voor toestel hij
   kijkt. Die gegevens gaan naar de eigen server op Hetzner en zijn te zien in /admin.

   Bewust zonder cookies en zonder externe dienst. Er wordt niets in de browser bewaard en
   niets naar Google of een ander bedrijf gestuurd, dus is er ook geen cookiebanner nodig.

   Wat er vertrokken wordt:
     - het pad van de pagina (niet de zoekparameters)
     - de verwijzende site, alleen de domeinnaam
     - gsm / tablet / computer, schermbreedte, browser, besturingssysteem, taal

   Wat er NIET vertrokken wordt: naam, e-mail, muisbewegingen, of iets wat de bezoeker
   over meerdere sites volgt. De server bewaart het IP-adres niet; hij maakt er een
   dagelijks wisselende, niet omkeerbare code van om bezoekers te kunnen tellen. */
(function () {
  /* Op de ontwikkelmachine niets meten. */
  var LOKAAL = ['localhost', '127.0.0.1', '::1'];
  if (LOKAAL.indexOf(location.hostname) !== -1) return;

  /* Wie "niet volgen" heeft aanstaan in zijn browser, laten we met rust. */
  if (navigator.doNotTrack === '1' || window.doNotTrack === '1' || navigator.msDoNotTrack === '1') return;

  /* Alleen echte bezoekers; zoekmachines melden zichzelf. */
  if (/bot|crawl|spider|slurp|bingpreview|headless/i.test(navigator.userAgent)) return;

  function soortToestel() {
    var breed = window.screen && window.screen.width ? window.screen.width : window.innerWidth;
    var aanraking = (navigator.maxTouchPoints || 0) > 1;
    if (!aanraking) return 'computer';
    return breed < 768 ? 'gsm' : 'tablet';
  }

  /* Alleen de domeinnaam van de verwijzer, nooit het volledige adres: een zoekopdracht of
     een uitnodigingslink kan persoonlijke gegevens in de parameters bevatten. */
  function verwijzer() {
    if (!document.referrer) return null;
    try {
      var u = new URL(document.referrer);
      if (u.hostname === location.hostname) return 'intern';
      return u.hostname.replace(/^www\./, '');
    } catch (e) {
      return null;
    }
  }

  function browserSoort(ua) {
    if (/edg\//i.test(ua)) return 'Edge';
    if (/opr\/|opera/i.test(ua)) return 'Opera';
    if (/chrome|crios/i.test(ua)) return 'Chrome';
    if (/firefox|fxios/i.test(ua)) return 'Firefox';
    if (/safari/i.test(ua)) return 'Safari';
    return 'Andere';
  }

  function systeemSoort(ua) {
    if (/android/i.test(ua)) return 'Android';
    if (/iphone|ipad|ipod/i.test(ua)) return 'iOS';
    if (/windows/i.test(ua)) return 'Windows';
    if (/mac os/i.test(ua)) return 'macOS';
    if (/linux/i.test(ua)) return 'Linux';
    return 'Andere';
  }

  function meld() {
    var ua = navigator.userAgent || '';
    var gegevens = {
      pad: location.pathname.slice(0, 200),
      verwijzer: verwijzer(),
      soort: soortToestel(),
      browser: browserSoort(ua),
      systeem: systeemSoort(ua),
      breedte: window.screen ? window.screen.width : null,
      taal: (navigator.language || '').slice(0, 10)
    };

    var ruw = JSON.stringify(gegevens);

    /* sendBeacon vertrekt ook als de bezoeker meteen wegklikt, en houdt de pagina
       niet op. Lukt dat niet, dan een gewone fetch die we bewust negeren. */
    if (navigator.sendBeacon) {
      try {
        navigator.sendBeacon('/api/bezoek', new Blob([ruw], { type: 'application/json' }));
        return;
      } catch (e) { /* val terug op fetch */ }
    }
    fetch('/api/bezoek', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: ruw,
      keepalive: true
    }).catch(function () { /* een mislukte meting mag de site nooit storen */ });
  }

  /* Pas melden als de pagina echt bekeken wordt, niet bij een voorgeladen tabblad. */
  if (document.visibilityState === 'hidden') {
    document.addEventListener('visibilitychange', function eens() {
      if (document.visibilityState !== 'hidden') {
        document.removeEventListener('visibilitychange', eens);
        meld();
      }
    });
  } else {
    meld();
  }
})();
