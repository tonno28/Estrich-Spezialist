/* ═══════════════════════════════════════════════════════════
   Rendert eine Animationsseite Bild für Bild zu einer MP4.
   Es wird nicht mitgeschnitten, sondern jedes Einzelbild
   einzeln angesprungen — dadurch ist das Ergebnis unabhängig
   von der Rechengeschwindigkeit exakt reproduzierbar.

   Aufruf:
     node video/render.mjs                        # Hochformat, 30 fps
     node video/render.mjs --fps 60 --out clip.mp4
     node video/render.mjs --page landscape.html --w 1920 --h 1080
     node video/render.mjs --audio stimme.mp3     # Sprecherstimme dazumischen
     node video/render.mjs --music track.mp3      # Musik, wird ein- und ausgeblendet
   ═══════════════════════════════════════════════════════════ */

import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const HERE = path.dirname(fileURLToPath(import.meta.url));

/* ── Argumente ────────────────────────────────────────────── */
const argv = process.argv.slice(2);
const arg = (name, fallback) => {
  const i = argv.indexOf('--' + name);
  return i !== -1 && argv[i + 1] ? argv[i + 1] : fallback;
};

const PAGE   = arg('page', 'portrait.html');
const WIDTH  = parseInt(arg('w', '1080'), 10);
const HEIGHT = parseInt(arg('h', '1920'), 10);
const FPS    = parseInt(arg('fps', '30'), 10);
const AUDIO  = arg('audio', null);
// Musik wird leiser gemischt und am Ende ausgeblendet, Sprache läuft unverändert durch.
const MUSIC  = arg('music', null);
const MUSIC_GAIN = parseFloat(arg('music-gain', '0.55'));
const OUT    = path.resolve(HERE, arg('out', PAGE.replace(/\.html$/, '') + '.mp4'));

const CHROMIUM = process.env.CHROMIUM_PATH || '/opt/pw-browsers/chromium';

/* ── ffmpeg finden ────────────────────────────────────────── */
async function findFfmpeg() {
  try {
    const mod = await import('imageio-ffmpeg');           // falls als Node-Paket vorhanden
    if (mod?.default?.get_ffmpeg_exe) return mod.default.get_ffmpeg_exe();
  } catch { /* weiter */ }

  // Übliche Orte, inklusive der über pip installierten Binärdatei
  const candidates = [
    process.env.FFMPEG_PATH,
    '/usr/bin/ffmpeg',
    '/usr/local/bin/ffmpeg'
  ].filter(Boolean);

  const pipDir = '/usr/local/lib/python3.11/dist-packages/imageio_ffmpeg/binaries';
  if (fs.existsSync(pipDir)) {
    for (const f of fs.readdirSync(pipDir)) {
      if (f.startsWith('ffmpeg-')) candidates.push(path.join(pipDir, f));
    }
  }

  for (const c of candidates) if (fs.existsSync(c)) return c;
  throw new Error(
    'ffmpeg nicht gefunden. Installieren mit:  pip install imageio-ffmpeg\n' +
    'oder den Pfad über FFMPEG_PATH setzen.'
  );
}

/* ── Rendern ──────────────────────────────────────────────── */
const ffmpeg = await findFfmpeg();
console.log(`Seite    : ${PAGE}`);
console.log(`Format   : ${WIDTH}×${HEIGHT} @ ${FPS} fps`);
console.log(`ffmpeg   : ${ffmpeg}`);

const browser = await chromium.launch({
  executablePath: fs.existsSync(CHROMIUM) ? CHROMIUM : undefined,
  args: ['--force-device-scale-factor=1', '--hide-scrollbars', '--disable-lcd-text']
});

const page = await browser.newPage({
  viewport: { width: WIDTH, height: HEIGHT },
  deviceScaleFactor: 1
});

page.on('pageerror', e => { console.error('Fehler in der Seite:', e.message); });

await page.goto('file://' + path.resolve(HERE, PAGE) + '?render=1', { waitUntil: 'networkidle' });
await page.waitForFunction(() => typeof window.__seek === 'function');
await page.evaluate(() => document.fonts.ready);

const duration = await page.evaluate(() => window.__DURATION);
const frames = Math.round(duration * FPS);
console.log(`Länge    : ${duration.toFixed(2)} s  (${frames} Bilder)\n`);

/* ffmpeg nimmt die Einzelbilder über die Standardeingabe entgegen */
const args = [
  '-y', '-hide_banner', '-loglevel', 'error',
  '-f', 'image2pipe', '-framerate', String(FPS), '-i', 'pipe:0'
];
// Tonspuren als weitere Eingänge; Reihenfolge bestimmt die Indizes im Filtergraph.
const tracks = [];
if (AUDIO) { args.push('-i', path.resolve(HERE, AUDIO)); tracks.push('audio'); }
if (MUSIC) { args.push('-i', path.resolve(HERE, MUSIC)); tracks.push('music'); }

args.push(
  '-c:v', 'libx264', '-preset', 'slow', '-crf', '18',
  '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart',
  // gerade Kantenlängen erzwingen, sonst verweigert libx264 den Dienst
  '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2'
);

if (tracks.length) {
  const fadeStart = Math.max(0, duration - 1.5);
  const parts = [];

  tracks.forEach((kind, i) => {
    const src = i + 1;                                   // Eingang 0 ist das Bild
    if (kind === 'music') {
      // Musik: leiser, sanft ein, am Ende ausblenden, auf Videolänge kürzen
      parts.push(
        `[${src}:a]volume=${MUSIC_GAIN},` +
        `afade=t=in:st=0:d=1.2,` +
        `afade=t=out:st=${fadeStart.toFixed(2)}:d=1.5,` +
        `atrim=0:${duration.toFixed(3)},asetpts=N/SR/TB[m]`
      );
    } else {
      parts.push(`[${src}:a]afade=t=out:st=${fadeStart.toFixed(2)}:d=1.0[v]`);
    }
  });

  // apad füllt eine zu kurze Tonspur mit Stille auf. Zusammen mit -shortest
  // bestimmt damit immer das Bild die Länge — sonst würde eine kürzere
  // Sprachaufnahme das Video hinten abschneiden.
  const labels = tracks.map(k => (k === 'music' ? '[m]' : '[v]')).join('');
  const mix = tracks.length > 1
    ? `${labels}amix=inputs=2:duration=longest:dropout_transition=0,apad[out]`
    : `${labels}apad[out]`;

  args.push('-filter_complex', parts.join(';') + ';' + mix, '-map', '0:v', '-map', '[out]');
  // Feste Ausgabelänge statt -shortest: apad erzeugt einen endlosen Tonstrom,
  // den -shortest im Filtergraph nicht zuverlässig beendet.
  args.push('-c:a', 'aac', '-b:a', '192k', '-t', duration.toFixed(3));
} else {
  args.push('-an');
}
args.push(OUT);

const enc = spawn(ffmpeg, args, { stdio: ['pipe', 'inherit', 'inherit'] });

let encoderFailed = null;
enc.on('error', e => { encoderFailed = e; });
enc.stdin.on('error', e => {
  // EPIPE bedeutet: ffmpeg ist ausgestiegen. Der Exit-Code unten erklärt warum.
  if (e.code !== 'EPIPE') encoderFailed = e;
});

const write = buf => new Promise((resolve, reject) => {
  if (encoderFailed) return reject(encoderFailed);
  enc.stdin.write(buf) ? resolve() : enc.stdin.once('drain', resolve);
});

const started = Date.now();
for (let i = 0; i < frames; i++) {
  if (encoderFailed) break;
  await page.evaluate(t => window.__seek(t), i / FPS);
  await write(await page.screenshot({ type: 'png' }));

  if (i % FPS === 0 || i === frames - 1) {
    const pct = ((i + 1) / frames * 100).toFixed(0).padStart(3);
    process.stdout.write(`\r  ${pct} %  —  Bild ${i + 1}/${frames}`);
  }
}

enc.stdin.end();
await browser.close();

const code = await new Promise(res => enc.on('close', res));
process.stdout.write('\n');

if (encoderFailed) { console.error('\nFehler:', encoderFailed.message); process.exit(1); }
if (code !== 0)    { console.error(`\nffmpeg endete mit Code ${code}.`); process.exit(code); }

const mb = (fs.statSync(OUT).size / 1024 / 1024).toFixed(1);
console.log(`\nFertig: ${OUT}  (${mb} MB, ${((Date.now() - started) / 1000).toFixed(0)} s)`);
