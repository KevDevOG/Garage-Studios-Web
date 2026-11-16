#!/usr/bin/env node
// ── Recodificación de medios EN EL SITIO (mismo nombre y misma extensión) ──
//
// Requisito: ffmpeg >= 6 con libvpx-vp9, libx264 (no es dependencia npm).
//   Windows: `winget install --id Gyan.FFmpeg -e`
//   Ruta: variable FFMPEG_DIR (carpeta bin), o PATH, o búsqueda en WinGet.
//
//   node scripts/optimize-media.mjs --dry-run   # solo muestra los comandos
//   node scripts/optimize-media.mjs             # codifica a temporal + QA (no toca el repo)
//   node scripts/optimize-media.mjs --apply     # igual, y reemplaza los que pasan el QA
//   MEDIA_TMP=<carpeta>                         # carpeta temporal (por defecto os.tmpdir()/garage-media)
//
// Flujo: original -> salida en carpeta TEMPORAL -> QA objetivo -> reemplazo.
// QA por archivo: duración y nº de fotogramas idénticos (ffprobe) y SSIM medido
// con ambos escalados a la resolución a la que SE VE (umbral por entrada).
// Si el SSIM no llega al umbral, se baja el CRF/calidad (paso -3) y se repite.
// Si no se gana al menos MIN_GAIN, se conserva el original.
//
// Parámetros finales (medidos con Playwright el 16-nov-2026):
//  * logo3d.{webm,mp4}: intro, 1920x1080 -> 640x360 (2,5x la caja de 256 px).
//    Sin alfa. VP9 CRF 30 / H.264 CRF 20 +faststart, yuv420p, sin audio.
//  * rayos.webm: fondo (opacidad .18) 1920x1080 -> 1280x720, VP9.
//  * video_hero_visuals.webm: misma resolución, VP9 con CRF más alto.
//  * Iconos GIF 640x640 -> 160x160 (2,5x de 64 px), siguen siendo GIF: alfa
//    conservado (reserve_transparent + alpha_threshold) y bucle infinito.
//  * Imágenes PNG: reducción sin pérdida visible, solo si gana > 15 %.

import { spawnSync } from "node:child_process";
import { copyFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, basename } from "node:path";

const DRY = process.argv.includes("--dry-run");
const APPLY = process.argv.includes("--apply");
const ROOT = process.cwd();
const TMP = process.env.MEDIA_TMP || join(tmpdir(), "garage-media");
const MIN_GAIN = 0.15;

// ── Localizar ffmpeg/ffprobe ────────────────────────────────────────────────
function findBin() {
  const exe = (d, n) => join(d, process.platform === "win32" ? `${n}.exe` : n);
  const candidates = [];
  if (process.env.FFMPEG_DIR) candidates.push(process.env.FFMPEG_DIR);
  const la = process.env.LOCALAPPDATA;
  if (la) {
    const pk = join(la, "Microsoft", "WinGet", "Packages");
    if (existsSync(pk)) {
      for (const p of readdirSync(pk).filter((x) => x.startsWith("Gyan.FFmpeg"))) {
        const base = join(pk, p);
        for (const s of readdirSync(base)) candidates.push(join(base, s, "bin"));
      }
    }
  }
  for (const d of candidates) if (existsSync(exe(d, "ffmpeg")) && existsSync(exe(d, "ffprobe"))) return { ffmpeg: exe(d, "ffmpeg"), ffprobe: exe(d, "ffprobe") };
  return { ffmpeg: "ffmpeg", ffprobe: "ffprobe" }; // PATH
}
const BIN = findBin();

// ── Entradas ────────────────────────────────────────────────────────────────
// ssimSize: resolución a la que se ve; ssimMin: umbral; crf: calidad inicial.
const ENTRIES = [
  { kind: "vp9", src: "public/videos/logo3d.webm", scale: "640:360", crf: 30, ssimSize: "512:288", ssimMin: 0.97 },
  { kind: "h264", src: "public/videos/logo3d.mp4", scale: "640:360", crf: 20, ssimSize: "512:288", ssimMin: 0.97 },
  { kind: "vp9", src: "public/videos/rayos.webm", scale: "1280:720", crf: 36, ssimSize: "1280:720", ssimMin: 0.95 },
  { kind: "vp9", src: "public/videos/video_hero_visuals.webm", scale: null, crf: 34, ssimSize: "1078:606", ssimMin: 0.97 },
  ...["cd", "edicion-de-fotografias", "edicion-de-video", "frente-de-camara", "mas", "microfono", "pista-de-tiempo"].map((n) => ({
    kind: "gif", src: `public/icons/services/${n}.gif`, scale: "160:160", ssimSize: "128:128", ssimMin: 0.97, colors: 256,
  })),
  { kind: "png", src: "public/images/logo-sin-fondo.png", width: null }, // máx. 500 px CSS en Hero (1024 px ya es ~2x): sin reescalar
  { kind: "png", src: "public/images/visuals_logo.png", width: null },
  { kind: "png", src: "public/og-garage-studios.png", width: null }, // debe seguir en 1200x630
  { kind: "png", src: "public/icon-192.png", width: null },
  { kind: "png", src: "public/icon-512.png", width: null },
  { kind: "png", src: "public/apple-touch-icon.png", width: null },
];

// ── Utilidades ──────────────────────────────────────────────────────────────
const q = (a) => (/[\s;\[\]]/.test(a) ? `"${a}"` : a);
function ff(args, capture = false) {
  if (DRY) { console.log("ffmpeg " + args.map(q).join(" ")); return { status: 0, stderr: "" }; }
  const r = spawnSync(BIN.ffmpeg, ["-hide_banner", "-loglevel", capture ? "info" : "error", ...args], { encoding: "utf8", maxBuffer: 1 << 28 });
  if (!capture && r.status !== 0) throw new Error(`ffmpeg falló (${r.status}): ${r.stderr}`);
  return r;
}
function probe(file) {
  const r = spawnSync(BIN.ffprobe, ["-v", "error", "-count_frames", "-select_streams", "v:0", "-show_entries",
    "stream=nb_read_frames,width,height:format=duration", "-of", "json", file], { encoding: "utf8" });
  const j = JSON.parse(r.stdout);
  return { frames: Number(j.streams[0].nb_read_frames), dur: Number(j.format.duration), w: j.streams[0].width, h: j.streams[0].height };
}
const size = (f) => statSync(f).size;
const kb = (n) => `${(n / 1024).toFixed(0)} KB`;

// SSIM global (All) entre original y nuevo, ambos a la resolución de visionado.
// GIF: se compone sobre negro antes de medir (el alfa cuenta).
function ssim(orig, neu, e) {
  const [w, h] = e.ssimSize.split(":");
  const prep = (i, o) => e.kind === "gif"
    ? `color=c=black:s=${w}x${h}:r=25[bg${o}];[${i}:v]scale=${w}:${h}:flags=lanczos,format=rgba[f${o}];[bg${o}][f${o}]overlay=shortest=1:format=auto,format=yuv420p[${o}]`
    : `[${i}:v]scale=${w}:${h}:flags=bicubic,setpts=PTS-STARTPTS[${o}]`;
  const fc = `${prep(0, "a")};${prep(1, "b")};[a][b]ssim`;
  const r = ff(["-i", neu, "-i", orig, "-filter_complex", fc, "-f", "null", "-"], true);
  const m = /All:([0-9.]+)/.exec(r.stderr || "");
  return m ? Number(m[1]) : 0;
}

// ── Codificadores ───────────────────────────────────────────────────────────
function encodeVideo(e, src, out, crf) {
  const vf = e.scale ? ["-vf", `scale=${e.scale}:flags=lanczos`] : [];
  if (e.kind === "vp9") {
    const base = ["-y", "-i", src, ...vf, "-an", "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", String(crf),
      "-row-mt", "1", "-deadline", "good", "-cpu-used", "1", "-pix_fmt", "yuv420p"];
    const log = join(TMP, `${basename(out)}.2pass`);
    ff([...base, "-pass", "1", "-passlogfile", log, "-f", "webm", process.platform === "win32" ? "NUL" : "/dev/null"]);
    ff([...base, "-pass", "2", "-passlogfile", log, out]);
  } else {
    ff(["-y", "-i", src, ...vf, "-an", "-c:v", "libx264", "-preset", "veryslow", "-crf", String(crf),
      "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart", out]);
  }
}
function encodeGif(e, src, out, colors) {
  // reserve_transparent -> el índice 0 de la paleta es el transparente;
  // alpha_threshold decide qué píxeles semitransparentes pasan a opacos.
  const fc = `[0:v]scale=${e.scale}:flags=lanczos,split[a][b];[a]palettegen=max_colors=${colors}:reserve_transparent=1:stats_mode=full[p];` +
    `[b][p]paletteuse=dither=sierra2_4a:alpha_threshold=128`;
  ff(["-y", "-i", src, "-filter_complex", fc, "-fps_mode", "passthrough", "-loop", "0", out]);
}
function encodePng(e, src, out) {
  const vf = e.width ? ["-vf", `scale=${e.width}:-1:flags=lanczos`] : [];
  ff(["-y", "-i", src, ...vf, "-compression_level", "100", "-frames:v", "1", out]);
}

// ── Principal ───────────────────────────────────────────────────────────────
mkdirSync(TMP, { recursive: true });
if (!DRY) {
  const v = spawnSync(BIN.ffmpeg, ["-version"], { encoding: "utf8" });
  if (v.status !== 0) { console.error("No se encuentra ffmpeg. Define FFMPEG_DIR o instálalo."); process.exit(1); }
  console.log(v.stdout.split("\n")[0], "->", BIN.ffmpeg, "\n");
}
const rows = [];
for (const e of ENTRIES) {
  const src = join(ROOT, e.src);
  if (!existsSync(src)) { console.warn(`Falta ${e.src}`); continue; }
  const out = join(TMP, basename(e.src));
  let crf = e.crf, colors = e.colors, ok = false, s = NaN, note = "";
  for (let attempt = 0; attempt < 5; attempt++) {
    if (e.kind === "gif") encodeGif(e, src, out, colors);
    else if (e.kind === "png") encodePng(e, src, out);
    else encodeVideo(e, src, out, crf);
    if (DRY) break;
    if (e.kind === "png") { ok = true; break; }
    s = ssim(src, out, e);
    const a = probe(src), b = probe(out);
    const same = a.frames === b.frames && Math.abs(a.dur - b.dur) < 0.1;
    note = `${b.w}x${b.h} ${b.frames}f ${b.dur.toFixed(2)}s`;
    if (s >= e.ssimMin && same) { ok = true; break; }
    if (!same) { note += " (frames/duración distintos)"; break; }
    if (e.kind === "gif") colors = 256; // sin más palancas: aviso
    else crf -= 3;
  }
  if (DRY) continue;
  const before = size(src), after = size(out);
  let verdict = "";
  if (e.kind === "png") {
    const d = probe(out);
    note = `${d.w}x${d.h}`;
    if (e.src.endsWith("og-garage-studios.png") && (d.w !== 1200 || d.h !== 630)) ok = false;
  }
  if (!ok) verdict = "NO pasa QA: se conserva original";
  else if (1 - after / before < MIN_GAIN) verdict = "ganancia <15 %: se conserva original";
  else if (APPLY) { copyFileSync(out, src); verdict = "REEMPLAZADO"; }
  else verdict = "listo (usa --apply)";
  rows.push({ archivo: e.src, antes: kb(before), despues: kb(after), ssim: Number.isNaN(s) ? "-" : s.toFixed(4), info: note, verdict });
}
if (!DRY) { console.table(rows); console.log(`Temporales en ${TMP}`); }
else console.log("\n(dry-run: no se ha generado nada)");
