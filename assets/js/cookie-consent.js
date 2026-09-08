/* ===== Cookiebanner + Google Analytics 4 (2026-09-08) =======================================
   Google Analytics laadt PAS nadat de bezoeker op "Alle cookies aanvaarden" klikt. Tot dan
   staat Google Consent Mode v2 op "denied" en wordt er geen enkel Google-cookie geplaatst.

   Waarom dit er nu bij komt terwijl bezoek.js al meet: bezoek.js telt bezoekers op onze eigen
   server, zonder cookies. Dat blijft. Google Ads heeft daarnaast GA4 nodig om te weten WELKE
   advertentieklik tot een telefoontje leidde — zonder die koppeling betaal je voor klikken
   zonder te weten wat ze opbrengen. Precies de fout die bij walbrugge.be geld kostte.

   Measurement ID: G-R704SB4E7P (property renoperfect.be, aangemaakt 7/9/2026).

   De drie contactmomenten die als conversie tellen:
     phone_click      - klik op een tel:-link
     whatsapp_click   - klik op een wa.me-link
     spoed_formulier  - het contactformulier is echt verstuurd (niet: verzonden geprobeerd)

   Zelfde opbouw als walbrugge.be (principe 4: één manier voor hetzelfde ding). */
(function () {
  'use strict';

  var COOKIE_NAAM = 'renoperfect_consent';
  var COOKIE_DAGEN = 365;
  var GA_ID = 'G-R704SB4E7P';

  /* ── Consent Mode v2: alles geweigerd, nog vóór gtag ooit bestaat ── */
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;
  window.gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
    functionality_storage: 'denied',
    personalization_storage: 'denied',
    security_storage: 'granted',
    wait_for_update: 500
  });

  /* ── Teksten per taal. De site staat in nl, fr en en. ── */
  var TAAL = (document.documentElement.lang || 'nl').slice(0, 2).toLowerCase();
  var T = {
    nl: {
      tekst: 'Deze website gebruikt cookies van Google Analytics om te meten hoe bezoekers ons vinden. Meer uitleg staat in onze <a href="/privacyverklaring">privacyverklaring</a>.',
      ja: 'Alle cookies aanvaarden',
      nee: 'Alleen noodzakelijke'
    },
    fr: {
      tekst: 'Ce site utilise des cookies Google Analytics pour mesurer comment les visiteurs nous trouvent. Plus d\'informations dans notre <a href="/fr/confidentialite">politique de confidentialité</a>.',
      ja: 'Accepter tous les cookies',
      nee: 'Uniquement les nécessaires'
    },
    en: {
      tekst: 'This website uses Google Analytics cookies to measure how visitors find us. More in our <a href="/en/privacy">privacy policy</a>.',
      ja: 'Accept all cookies',
      nee: 'Essential only'
    }
  };
  var t = T[TAAL] || T.nl;

  /* ── Cookies ── */
  function leesCookie(naam) {
    var v = document.cookie.match('(^|;)\\s*' + naam + '\\s*=\\s*([^;]+)');
    return v ? v.pop() : null;
  }
  function zetCookie(naam, waarde, dagen) {
    var d = new Date();
    d.setTime(d.getTime() + dagen * 864e5);
    document.cookie = naam + '=' + waarde + ';expires=' + d.toUTCString() + ';path=/;SameSite=Lax;Secure';
  }

  /* ── Google Analytics 4, enkel na toestemming ── */
  function laadGA() {
    if (window._reno_ga_geladen) return;
    window._reno_ga_geladen = true;

    window.gtag('consent', 'update', {
      ad_storage: 'granted',
      ad_user_data: 'granted',
      ad_personalization: 'granted',
      analytics_storage: 'granted',
      functionality_storage: 'granted',
      personalization_storage: 'granted'
    });

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID;
    document.head.appendChild(s);

    window.gtag('js', new Date());
    window.gtag('config', GA_ID, {
      anonymize_ip: true,
      page_language: TAAL
    });
  }

  /* Eén doorgeefluik voor alle gebeurtenissen. Zonder toestemming vertrekt er niets. */
  window.renoperfectMeet = function (naam, params) {
    if (!window._reno_ga_geladen) return;
    try { window.gtag('event', naam, params || {}); } catch (e) { /* stil falen */ }
  };

  /* ── Bellen en WhatsApp: één luisteraar op de hele pagina, ook voor links die er later
        bijkomen (de vaste belknop op mobiel, de projectcarrousel). ── */
  function volgKlikken() {
    document.addEventListener('click', function (ev) {
      var a = ev.target && ev.target.closest ? ev.target.closest('a[href]') : null;
      if (!a) return;
      var href = a.getAttribute('href') || '';
      if (href.indexOf('tel:') === 0) {
        window.renoperfectMeet('phone_click', {
          link_url: href,
          link_text: (a.textContent || '').trim().slice(0, 80),
          page_language: TAAL
        });
      } else if (href.indexOf('wa.me') !== -1 || href.indexOf('api.whatsapp.com') !== -1) {
        window.renoperfectMeet('whatsapp_click', { link_url: href, page_language: TAAL });
      }
    }, true);
  }

  /* ── Het formulier telt pas als het ECHT verstuurd is ──
     main.js toont de bedankboodschap door de klasse "toon" op #form-succes te zetten. Daar
     kijken we naar, in plaats van op "submit" te meten: dan zou een mislukte verzending of
     een bot ook als aanvraag tellen. Zo hoeft main.js niet aangepast te worden. */
  function volgFormulier() {
    var succes = document.getElementById('form-succes');
    if (!succes || typeof MutationObserver === 'undefined') return;
    var gemeld = false;
    new MutationObserver(function () {
      if (gemeld || !succes.classList.contains('toon')) return;
      gemeld = true;
      var keuze = document.getElementById('type') || document.getElementById('schadetype');
      window.renoperfectMeet('spoed_formulier', {
        schadetype: (keuze && keuze.value) || 'onbekend',
        page_path: location.pathname,
        page_language: TAAL
      });
    }).observe(succes, { attributes: true, attributeFilter: ['class'] });
  }

  /* ── De banner ── */
  function verbergBanner() {
    var el = document.getElementById('cookiebanner');
    if (el) el.style.display = 'none';
  }

  function aanvaardAlles() {
    zetCookie(COOKIE_NAAM, 'alles', COOKIE_DAGEN);
    verbergBanner();
    laadGA();
  }
  function enkelNoodzakelijk() {
    zetCookie(COOKIE_NAAM, 'noodzakelijk', COOKIE_DAGEN);
    verbergBanner();
  }

  function toonBanner() {
    var banner = document.createElement('div');
    banner.id = 'cookiebanner';
    banner.setAttribute('role', 'dialog');
    banner.setAttribute('aria-label', 'Cookies');
    banner.innerHTML =
      '<div class="cb-binnen">' +
        '<p class="cb-tekst">' + t.tekst + '</p>' +
        '<div class="cb-knoppen">' +
          '<button type="button" class="cb-knop cb-ja" id="cbJa">' + t.ja + '</button>' +
          '<button type="button" class="cb-knop cb-nee" id="cbNee">' + t.nee + '</button>' +
        '</div>' +
      '</div>';

    /* Opmaak staat hier en niet in style.css: de banner moet er ook staan als de stijl
       nog niet geladen is, en hij hoort bij dit script. Kleuren = huisstijl. */
    banner.style.cssText = 'position:fixed;bottom:0;left:0;right:0;z-index:99999;background:#1a1a2e;' +
      'color:#fff;padding:1rem 1.25rem;font-family:Inter,system-ui,sans-serif;font-size:.9rem;' +
      'line-height:1.5;box-shadow:0 -4px 20px rgba(0,0,0,.3)';

    banner.querySelector('.cb-binnen').style.cssText =
      'max-width:1100px;margin:0 auto;display:flex;align-items:center;gap:1.25rem;flex-wrap:wrap';

    var tekst = banner.querySelector('.cb-tekst');
    tekst.style.cssText = 'flex:1;min-width:260px;margin:0';
    var links = tekst.querySelectorAll('a');
    for (var i = 0; i < links.length; i++) {
      links[i].style.cssText = 'color:#e8611a;text-decoration:underline';
    }

    banner.querySelector('.cb-knoppen').style.cssText =
      'display:flex;gap:.75rem;flex-shrink:0;flex-wrap:wrap';

    var ja = banner.querySelector('#cbJa');
    ja.style.cssText = 'padding:.6rem 1.4rem;border:none;border-radius:6px;cursor:pointer;' +
      'font-weight:600;font-size:.85rem;background:#e8611a;color:#fff;font-family:inherit';

    var nee = banner.querySelector('#cbNee');
    nee.style.cssText = 'padding:.6rem 1.4rem;border:1px solid rgba(255,255,255,.4);border-radius:6px;' +
      'cursor:pointer;font-weight:500;font-size:.85rem;background:transparent;color:#fff;font-family:inherit';

    document.body.appendChild(banner);
    ja.addEventListener('click', aanvaardAlles);
    nee.addEventListener('click', enkelNoodzakelijk);
  }

  /* ── Start ── */
  function start() {
    volgKlikken();
    volgFormulier();
    var keuze = leesCookie(COOKIE_NAAM);
    if (keuze === 'alles') {
      laadGA();
    } else if (keuze !== 'noodzakelijk') {
      toonBanner();
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();
