# Estrich-Spezialist — Website

Statische Website für den Estrich-Fachbetrieb **Estrich-Spezialist** (Langerwehe, Kreis Düren).
Kein Build-Prozess, keine Abhängigkeiten, keine externen Requests.

Die zugrunde liegende Marktanalyse steht in [`WETTBEWERBSANALYSE.md`](WETTBEWERBSANALYSE.md).

---

## Aufbau

```
index.html            Startseite (Hero, Leistungen, Warum wir, Ablauf,
                      Bewertungen, Referenzen, Einsatzgebiet, FAQ, Kontakt)
impressum.html        Impressum — Pflichtangaben noch ausfüllen
datenschutz.html      Datenschutzerklärung — Angaben noch ausfüllen
404.html              Fehlerseite
robots.txt            Suchmaschinen-Freigabe + Sitemap-Verweis
sitemap.xml           XML-Sitemap
assets/css/style.css  Gesamtes Design
assets/js/main.js     Navigation und Anfrageformular
assets/img/           Bilder — hier die Fotos ablegen
```

## Lokal ansehen

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

Alternativ genügt ein Doppelklick auf `index.html`.

---

## Vor dem Livegang

### 1. Pflichtangaben ausfüllen

In `impressum.html` und `datenschutz.html` alle mit `[…]` markierten Stellen ersetzen.
Ohne vollständiges Impressum besteht Abmahnrisiko.

### 2. Domain eintragen

Die E-Mail-Adresse `estrichspezialist@gmx.de` ist bestätigt und überall hinterlegt.

Als Domain ist noch `www.estrich-spezialist.de` angenommen. Bei abweichender Domain in allen
Dateien ersetzen — betroffen sind `index.html` (canonical, Open Graph, JSON-LD), `robots.txt`
und `sitemap.xml`.

### 3. Kontaktformular scharf schalten

Standardmäßig öffnet das Formular das E-Mail-Programm des Besuchers — das funktioniert überall,
ist aber nicht ideal, weil manche Besucher an dieser Stelle abspringen.

Für echten Serverversand in `assets/js/main.js` ganz oben eintragen:

```js
var CONFIG = {
  formEndpoint: 'https://formspree.io/f/XXXXXXXX',   // z. B. Formspree, Netlify Forms
  mailTo: 'estrichspezialist@gmx.de'
};
```

Sobald ein externer Dienst genutzt wird, muss er in `datenschutz.html` ergänzt werden
(Anbieter, Sitz, Auftragsverarbeitungsvertrag).

### 4. Fotos ersetzen

Die Galerie zeigt acht Fotos aus dem Google-Unternehmensprofil. **Diese Dateien sind
Vorschaubilder mit rund 140 px Kantenlänge** — deshalb sind die Kacheln bewusst klein gehalten.
Sobald die Originale vom Rechner oder Handy vorliegen, gleichnamig überschreiben:

| Datei | Motiv |
|---|---|
| `fliessestrich-spiegelnde-flaeche.jpg` | Frischer Fließestrich, spiegelglatte Fläche |
| `fussbodenheizung-heizrohre.jpg` | Heizrohre in Schneckenform, vor dem Verguss |
| `estrich-flur-randdaemmstreifen.jpg` | Flur mit blauem Randdämmstreifen |
| `estrich-rohbau-wohnraum.jpg` | Wohnraum im Rohbau, Fläche fertig |
| `estrich-dachgeschoss.jpg` | Dachgeschoss unter Holzbalkendecke |
| `estrich-garage.jpg` | Garage mit Klinkerfassade |
| `estrichpumpe-anhaenger.jpg` | Estrichpumpe auf dem Anhänger |
| `firmenwagen-baustelle.jpg` | Firmenwagen vor eingerüstetem Neubau |

Nach dem Austausch drei Dinge in `index.html`, Sektion `#referenzen`:

1. **`width`/`height`** auf die tatsächlichen Pixelmaße setzen, damit beim Laden nichts springt
2. **Versionsstempel `?v=` hochzählen**, sonst zeigen Bestandsbesucher weiter die alten Bilder
3. **Ortsangabe in die `<figcaption>`** ergänzen, z. B. „Fließestrich — Neubau in Düren".
   Die Unterschriften sind bewusst ohne Ort formuliert; erfundene Orte wären schlechter als keine.
   Echte Orte sind ein realer Hebel für die lokale Sichtbarkeit.

Originale auf max. 1600 px Breite verkleinern und als JPEG (Qualität ~80) oder WebP speichern.
Dann lässt sich auch `minmax(190px, 1fr)` in `.gallery` wieder auf größere Kacheln anheben.

### 5. Google-Unternehmensprofil aktualisieren

Im Profil steht derzeit „Website hinzufügen". Nach dem Livegang die Domain dort eintragen —
das ist laut allen ausgewerteten SEO-Quellen der stärkste einzelne Hebel für lokale Sichtbarkeit,
noch vor der Website selbst.

Ebenfalls dort prüfen: Das Profil nennt als Einzugsgebiet „Bonn und Umgebung", der Profiltext
dagegen Langerwehe, Düren, Aachen, Köln, Eschweiler und die Eifel. Beides sollte übereinstimmen —
auf der Website ist die Variante aus dem Profiltext umgesetzt (Bonn ergänzt).

---

## Hosting

Die Seite ist rein statisch und läuft auf jedem Webspace. Empfehlenswert, weil kostenlos,
schnell und mit HTTPS: **Netlify**, **Cloudflare Pages** oder **GitHub Pages**.

Bei Netlify oder Cloudflare Pages genügt es, das Repository zu verbinden — kein Build-Befehl,
Publish-Verzeichnis ist das Wurzelverzeichnis. Beide bieten außerdem ein Formular-Backend,
das Punkt 3 ohne Fremddienst löst.

---

## Technische Entscheidungen

| Entscheidung | Grund |
|---|---|
| Kein Framework, kein Build | Lädt sofort, läuft auf jedem Hoster, ist in fünf Jahren noch wartbar |
| Keine Webfonts, System-Schriften | Spart einen Roundtrip und vermeidet die DSGVO-Frage bei Google Fonts |
| Keine Cookies, kein Tracking | Kein Cookie-Banner nötig — das ist gleichzeitig ein Conversion-Vorteil |
| Inline-SVG statt Icon-Font | Keine zusätzliche Datei, gestochen scharf, per CSS einfärbbar |
| `LocalBusiness`- und `FAQPage`-Schema | Sterne-Bewertung und FAQ-Aufklappen direkt in den Google-Ergebnissen |
| Sticky-Anruf-Leiste auf Mobil | Der Weg von der Suche zum Anruf soll unter 30 Sekunden liegen |

---

## Barrierefreiheit

Semantisches HTML, sichtbare Fokusringe, Skip-Link, alle Touch-Ziele ≥ 44 px,
`prefers-reduced-motion` respektiert, Formularfelder mit Labels und Fehlermeldungen,
Kontraste nach WCAG AA.

---

## Nächste Ausbaustufe (optional)

1. **Regionsseiten** statt nur einer Städteliste — je eine Seite für Düren, Aachen, Köln,
   Eschweiler mit echten lokalen Referenzen. Das ist genau der Hebel, über den der digitale
   Marktführer seine Reichweite aufbaut.
2. **Leistungs-Unterseiten** für Zementestrich, Fließestrich und Perlit-Dämmestrich mit je
   1.000+ Wörtern Fachtext.
3. **Bewertungen automatisch einbinden**, damit neue Google-Rezensionen ohne Codeänderung
   auf der Seite erscheinen.
4. **Vorher-Nachher-Slider** für die stärksten Referenzprojekte.
