/* ═══════════════════════════════════════════════════════════
   Estrich-Spezialist — main.js
   Vanilla JS, keine Abhängigkeiten.
   ═══════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────
     KONFIGURATION
     ───────────────────────────────────────────────────────── */
  var CONFIG = {
    // Formular-Endpunkt (z. B. Formspree: "https://formspree.io/f/xxxxxxxx").
    // Solange leer, öffnet das Formular das E-Mail-Programm des Besuchers.
    formEndpoint: '',
    // Empfängeradresse für den E-Mail-Fallback.
    mailTo: 'estrichspezialist@gmx.de'
  };

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ─────────────────────────────────────────────────────────
     Jahreszahl im Footer
     ───────────────────────────────────────────────────────── */
  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ─────────────────────────────────────────────────────────
     Header: Schatten beim Scrollen + mobile Navigation
     ───────────────────────────────────────────────────────── */
  var header = $('.site-header');
  var nav    = $('#site-nav');
  var toggle = $('.nav-toggle');
  var sticky = $('.sticky-cta');

  function closeNav() {
    if (!nav || !toggle) return;
    nav.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Menü öffnen');
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.setAttribute('aria-label', open ? 'Menü schließen' : 'Menü öffnen');
    });
    $$('a', nav).forEach(function (a) { a.addEventListener('click', closeNav); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeNav(); });
  }

  var onScroll = function () {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle('is-stuck', y > 8);
    if (sticky) sticky.classList.toggle('is-visible', y > 480);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ─────────────────────────────────────────────────────────
     Aktiver Navigationspunkt beim Scrollen
     ───────────────────────────────────────────────────────── */
  var navLinks = nav ? $$('a[href^="#"]', nav) : [];
  var sections = navLinks
    .map(function (a) { return $(a.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });
    sections.forEach(function (s) { io.observe(s); });
  }

  /* ─────────────────────────────────────────────────────────
     Estrich-Rechner
     ───────────────────────────────────────────────────────── */
  var calc = {
    area:   $('#calc-area'),
    type:   $('#calc-type'),
    thick:  $('#calc-thick'),
    out:    $('#calc-thick-out'),
    use:    $('#calc-use'),
    hint:   $('#calc-hint'),
    note:   $('#calc-note'),
    rVol:   $('#r-vol'),
    rWeight:$('#r-weight'),
    rEdge:  $('#r-edge'),
    rWalk:  $('#r-walk'),
    rDry:   $('#r-dry')
  };

  // Mindest-Estrichdicken je Nutzung (Richtwerte für schwimmenden Estrich)
  var MIN_THICKNESS = {
    wohnen: { min: 45, label: 'Wohnraum ohne Heizung: ca. 45–50 mm · mit Fußbodenheizung: 65–75 mm' },
    keller: { min: 45, label: 'Keller und Nebenräume: ca. 45–60 mm, je nach Belastung' },
    garage: { min: 80, label: 'Garage und Einfahrt: ca. 80–120 mm, befahrbar ausgeführt' },
    gewerbe:{ min: 50, label: 'Gewerbe und Halle: ca. 50–80 mm, abhängig von der Nutzlast' }
  };

  // Rohdichten in kg/m³ (Richtwerte für die Mengenabschätzung)
  var DENSITY = { ct: 2100, caf: 2150, heiz: 2100 };

  function deFormat(value, decimals) {
    return value.toFixed(decimals == null ? 1 : decimals).replace('.', ',');
  }

  function updateCalc() {
    if (!calc.area || !calc.thick) return;

    var area   = Math.max(1, Math.min(10000, parseFloat(calc.area.value) || 0));
    var thick  = parseInt(calc.thick.value, 10);       // mm
    var type   = calc.type ? calc.type.value : 'ct';
    var use    = calc.use ? calc.use.value : 'wohnen';

    if (calc.out) calc.out.textContent = String(thick);

    // Volumen und Gewicht
    var volume = area * (thick / 1000);                 // m³
    var weight = (volume * DENSITY[type]) / 1000;       // t

    // Randdämmstreifen: Umfang einer flächengleichen quadratischen Fläche,
    // plus 15 % Zuschlag für Innenwände, Nischen und Verschnitt.
    var edge = Math.ceil(4 * Math.sqrt(area) * 1.15);

    // Begehbarkeit
    var walk = type === 'caf' ? 2 : 3;

    // Belegreife: Faustregel 1 Woche je cm. Oberhalb von 40 mm dauert es
    // überproportional länger, Fließestrich trocknet schneller ab.
    var weeks;
    if (thick <= 40) {
      weeks = thick / 10;
    } else {
      weeks = 4 + ((thick - 40) / 10) * 2;
    }
    if (type === 'caf') weeks = weeks * 0.55;
    weeks = Math.max(1, Math.round(weeks));

    if (calc.rVol)    calc.rVol.textContent    = deFormat(volume, volume < 10 ? 1 : 0);
    if (calc.rWeight) calc.rWeight.textContent = deFormat(weight, weight < 10 ? 1 : 0);
    if (calc.rEdge)   calc.rEdge.textContent   = String(edge);
    if (calc.rWalk)   calc.rWalk.textContent   = String(walk);
    if (calc.rDry)    calc.rDry.textContent    = String(weeks);

    // Hinweistext zur Nutzung
    var rule = MIN_THICKNESS[use] || MIN_THICKNESS.wohnen;
    if (calc.hint) {
      if (thick < rule.min) {
        calc.hint.textContent = '⚠ Für diese Nutzung sind mindestens ca. ' + rule.min +
          ' mm üblich. ' + rule.label;
        calc.hint.style.color = '#c2410c';
      } else {
        calc.hint.textContent = rule.label;
        calc.hint.style.color = '';
      }
    }

    if (calc.note) {
      var extra = type === 'caf'
        ? 'Calciumsulfat-Fließestrich trocknet in der Regel deutlich schneller als Zementestrich. '
        : '';
      calc.note.textContent = extra + 'Richtwerte für die Planung. Die tatsächliche Belegreife wird ' +
        'vor dem Belegen per CM-Messung bestimmt und hängt von Aufbau, Lüftung und Temperatur ab.';
    }
  }

  ['calc-area', 'calc-type', 'calc-thick', 'calc-use'].forEach(function (id) {
    var el = document.getElementById(id);
    if (el) { el.addEventListener('input', updateCalc); el.addEventListener('change', updateCalc); }
  });
  updateCalc();

  /* Ergebnis in die Anfrage übernehmen */
  var calcToForm = $('#calc-to-form');
  if (calcToForm) {
    calcToForm.addEventListener('click', function () {
      var area  = parseFloat(calc.area.value) || 0;
      var thick = calc.thick.value;
      var typeLabel = calc.type.options[calc.type.selectedIndex].text;
      var useLabel  = calc.use.options[calc.use.selectedIndex].text;

      var fArea = $('#f-area');
      var fMsg  = $('#f-msg');
      var fType = $('#f-type');

      if (fArea) fArea.value = String(Math.round(area));

      if (fType) {
        var map = { ct: 'Zementestrich', caf: 'Fließestrich', heiz: 'Heizestrich' };
        var want = map[calc.type.value];
        $$('option', fType).forEach(function (o) { if (o.text === want) fType.value = o.value || o.text; });
      }

      if (fMsg) {
        var line = 'Angaben aus dem Estrich-Rechner: ' + Math.round(area) + ' m² ' + typeLabel +
                   ', Estrichdicke ca. ' + thick + ' mm, Nutzung: ' + useLabel + '.';
        fMsg.value = fMsg.value ? fMsg.value.replace(/\n*Angaben aus dem Estrich-Rechner:.*$/s, '').trim() + '\n\n' + line : line;
      }

      var target = $('#kontakt');
      if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      window.setTimeout(function () { var n = $('#f-name'); if (n) n.focus({ preventScroll: true }); }, 600);
    });
  }

  /* ─────────────────────────────────────────────────────────
     Anfrageformular
     ───────────────────────────────────────────────────────── */
  var form   = $('#anfrage-form');
  var status = $('#form-status');

  function setError(field, message) {
    var msgEl = $('.err[data-for="' + field.id + '"]', form);
    if (msgEl) msgEl.textContent = message || '';
    if (message) field.setAttribute('aria-invalid', 'true');
    else field.removeAttribute('aria-invalid');
  }

  function validate() {
    var ok = true;
    var first = null;

    var checks = [
      { el: $('#f-name'),  test: function (v) { return v.trim().length >= 2; },  msg: 'Bitte geben Sie Ihren Namen an.' },
      { el: $('#f-phone'), test: function (v) { return v.replace(/[^\d]/g, '').length >= 6; }, msg: 'Bitte geben Sie eine Telefonnummer an, unter der wir Sie erreichen.' },
      { el: $('#f-place'), test: function (v) { return v.trim().length >= 2; },  msg: 'Bitte nennen Sie den Ort der Baustelle.' },
      { el: $('#f-mail'),  test: function (v) { return v === '' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim()); }, msg: 'Diese E-Mail-Adresse sieht nicht vollständig aus.' }
    ];

    checks.forEach(function (c) {
      if (!c.el) return;
      if (!c.test(c.el.value)) { setError(c.el, c.msg); ok = false; if (!first) first = c.el; }
      else setError(c.el, '');
    });

    var privacy = $('#f-privacy');
    if (privacy) {
      if (!privacy.checked) {
        setError(privacy, 'Bitte bestätigen Sie die Datenschutzerklärung.');
        ok = false; if (!first) first = privacy;
      } else setError(privacy, '');
    }

    if (first) first.focus();
    return ok;
  }

  function collect() {
    var val = function (id) { var el = $(id); return el ? el.value.trim() : ''; };
    return {
      Name:        val('#f-name'),
      Telefon:     val('#f-phone'),
      'E-Mail':    val('#f-mail') || '—',
      Ort:         val('#f-place'),
      Leistung:    val('#f-type'),
      'Fläche':    val('#f-area') ? val('#f-area') + ' m²' : '—',
      Objektart:   val('#f-object'),
      Wunschtermin: val('#f-date') || '—',
      Nachricht:   val('#f-msg') || '—'
    };
  }

  function toText(data) {
    return Object.keys(data).map(function (k) { return k + ': ' + data[k]; }).join('\n');
  }

  function say(message, kind) {
    if (!status) return;
    status.textContent = message;
    status.className = 'form-status ' + (kind || '');
  }

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      // Honeypot: von Bots ausgefüllt, von Menschen nie.
      var hp = $('#f-website');
      if (hp && hp.value !== '') return;

      if (!validate()) {
        say('Bitte prüfen Sie die markierten Felder.', 'bad');
        return;
      }

      var data = collect();
      var submitBtn = $('button[type="submit"]', form);

      if (CONFIG.formEndpoint) {
        if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Wird gesendet …'; }
        say('Anfrage wird gesendet …', '');

        fetch(CONFIG.formEndpoint, {
          method: 'POST',
          headers: { 'Accept': 'application/json', 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        })
          .then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            form.reset();
            say('Vielen Dank! Ihre Anfrage ist bei uns eingegangen — wir melden uns in der Regel innerhalb von 24 Stunden.', 'ok');
          })
          .catch(function () {
            say('Das Senden hat leider nicht geklappt. Rufen Sie uns gerne direkt an: 0170 7753751.', 'bad');
          })
          .then(function () {
            if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = 'Anfrage absenden'; }
          });

      } else {
        // Fallback ohne Backend: E-Mail-Programm des Besuchers öffnen.
        var subject = 'Estrich-Anfrage: ' + data.Leistung + ' in ' + data.Ort;
        var href = 'mailto:' + CONFIG.mailTo +
                   '?subject=' + encodeURIComponent(subject) +
                   '&body='    + encodeURIComponent(toText(data));
        window.location.href = href;
        say('Ihr E-Mail-Programm wurde geöffnet — bitte die Nachricht dort noch abschicken. Alternativ erreichen Sie uns unter 0170 7753751.', 'ok');
      }
    });

    // Fehlermeldung entfernen, sobald korrigiert wird
    $$('input, select, textarea', form).forEach(function (el) {
      el.addEventListener('input', function () { if (el.getAttribute('aria-invalid')) setError(el, ''); });
    });
  }

})();
