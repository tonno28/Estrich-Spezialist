# Vorstellungsvideo

Kinetische Typografie im Stil des Referenzvideos, aber in der Bildsprache der Website:
Anthrazit, Orange, große Grotesk. 21 Sekunden, Hochformat 1080 × 1920.

```
portrait.html   Die Animation
render.mjs      Rendert die Animation zu MP4
portrait.mp4    Das fertige Video
```

## Warum nicht mit einem KI-Videogenerator

Weil KI-Generatoren bei exakter Typografie versagen. Sie erzeugen verzerrte Buchstaben und
treffen Markenfarben nicht — „0170 7753751" käme dort als Zeichensalat heraus. Diese Animation
läuft stattdessen im Browser und wird Bild für Bild abfotografiert: pixelgenau, in exakt dem
Orange der Website, jederzeit änderbar und ohne laufende Kosten.

KI bleibt für das sinnvoll, was sie gut kann — fotorealistische Aufnahmen und Vertonung.

## Ansehen und ändern

Die Animation im Browser öffnen — sie läuft dann in Endlosschleife:

```bash
python3 -m http.server 8000
# → http://localhost:8000/video/portrait.html
```

Texte stehen als normales HTML im `<section>`-Block der jeweiligen Szene. Ändern, Seite neu
laden, fertig. Die Zeitleiste steht darunter im `SCENES`-Array.

## Neu rendern

```bash
npm i -D playwright        # einmalig
pip install imageio-ffmpeg # einmalig, liefert ffmpeg mit

node video/render.mjs                                   # Hochformat, 30 fps
node video/render.mjs --fps 60                          # flüssiger, größere Datei
node video/render.mjs --audio stimme.mp3                # mit Sprecherstimme
node video/render.mjs --page landscape.html --w 1920 --h 1080 --out landscape.mp4
```

Der Renderer spielt die Animation nicht ab, sondern springt jedes Einzelbild einzeln an. Dadurch
ist das Ergebnis unabhängig von der Rechengeschwindigkeit immer identisch — ein Bildschirmmitschnitt
wäre das nicht.

Ein Durchlauf dauert rund sieben Minuten.

## Aufbau

| Zeit | Szene | Inhalt |
|---|---|---|
| 0,0–3,4 s | Auftakt | Wortmarke, über 20 Jahre Erfahrung |
| 3,4–7,0 s | Versprechen | „Pünktlich. Sauber. Termingerecht." — wortweise |
| 7,0–11,0 s | Leistungen | Fünf Chips, Perlit-Dämmestrich hervorgehoben |
| 11,0–14,4 s | Bewertung | 5,0 groß, Sterne zünden nacheinander |
| 14,4–17,4 s | Kundenstimme | Original-Google-Rezension |
| 17,4–21,0 s | Kontakt | Einsatzgebiet, Telefonnummer, Angebot in 24 h |

## Fotos

Die Hintergründe greifen auf **dieselben Dateien wie die Website-Galerie** zu
(`../assets/img/`). Ein Bildersatz für beides:

| Szene | Datei |
|---|---|
| Auftakt | `fliessestrich-wohnraum.jpg` |
| Leistungen | `heizestrich-fussbodenheizung.jpg` |
| Kundenstimme | `estrich-terrasse-carport.jpg` |
| Kontakt | `estrichpumpe-team.jpg` |

Fehlt eine Datei, entfernt sich das Bild selbst und die Farbfläche darunter bleibt stehen — das
Video rendert also auch ohne Fotos vollständig durch. Sobald die Dateien da sind, laufen sie
automatisch mit einer langsamen Ken-Burns-Fahrt hinter der Schrift.

## Sprecherstimme

`render.mjs` mischt eine Audiodatei per `--audio` dazu. Zwei Wege zur Aufnahme:

1. **Selbst einsprechen** — mit dem Handy, ruhiger Raum. Das wirkt bei einem Handwerksbetrieb
   oft glaubwürdiger als eine synthetische Stimme.
2. **Higgsfield** — braucht Guthaben auf dem verbundenen Konto.

Sprechtext, etwa 21 Sekunden bei ruhigem Tempo:

> Estrich-Spezialist. Seit über zwanzig Jahren.
> Pünktlich. Sauber. Termingerecht.
> Zementestrich, Fließestrich, Heizestrich, Dämmung und Perlit-Dämmestrich —
> für Garage, Terrasse, Wohnung und Großprojekte.
> Fünf von fünf Sternen bei Google, aus acht Rezensionen.
> Düren, Aachen, Köln, Eschweiler und die Eifel.
> Null eins sieben null — sieben sieben fünf drei sieben fünf eins.
> Ihr Angebot in vierundzwanzig Stunden.

## Querformat

Noch nicht gebaut. `portrait.html` nach `landscape.html` kopieren, Bühne auf 1920 × 1080 setzen
und die Stapel zweispaltig anordnen — die Zeitleiste kann unverändert bleiben.

## Schrift

Gesetzt in Liberation Sans, weil in dieser Umgebung keine andere Grotesk verfügbar ist. Für eine
eigene Hausschrift genügt es, die Datei als `@font-face` einzubetten und `--font` zu ändern.
