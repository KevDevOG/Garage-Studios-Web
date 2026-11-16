#!/usr/bin/env node
// ── Recodificación de vídeos e iconos animados (sin tocar los originales) ──
//
// Requisito: ffmpeg ≥ 6 con libvpx-vp9, libx264 y libwebp en el PATH
// (Windows: `winget install Gyan.FFmpeg`). No es una dependencia npm.
//
//   node scripts/optimize-media.mjs --dry-run   # solo muestra los comandos
//   node scripts/optimize-media.mjs             # genera *.opt.webm / *.opt.mp4 / *.webp
//
// Criterio: misma estética, menos píxeles inútiles y menos bitrate.
//  * Se codifica a la resolución a la que el vídeo SE VE, no a la de origen
//    (medido con Playwright el 16-nov-2026):
//      - logo3d (intro): 1920×1080 → se muestra en una caja de 176–256 px
//        (object-contain). 640×360 cubre pantallas 2× con margen.
//      - rayos (fondo de planes, solo ≥1280 px): opacidad 0,18 + mix-blend
//        screen + capa negra al 55 %. 1280×720 es indistinguible.
//      - video_hero_visuals: 1078×606, se mantiene la resolución; solo bitrate.
//  * Sin audio (-an): todos se reproducen en silencio.
//  * Mismo número de fotogramas y duración (no se cambia la cadencia).
//  * Iconos GIF 640×640 con transparencia, mostrados a 48–64 px → WebP
//    animado 160×160 (2,5×) que conserva el canal alfa y la temporización.
//
// Después de generar: comparar a simple vista (misma pantalla, lado a lado),
// renombrar o actualizar las referencias (ver docs/cierre-pendientes-v1.md,
// "Vídeos y GIF") y borrar los originales solo con aprobación.

import { spawnSync } from "node:child_process";
import { existsSync, rmSync, statSync } from "node:fs";
import { join } from "node:path";

const DRY = process.argv.includes("--dry-run");
const ROOT = process.cwd();

const VIDEOS = [
  { src: "public/videos/logo3d.webm", out: "public/videos/logo3d.opt", scale: "640:-2", crf: { vp9: 33, h264: 24 } },
  { src: "public/videos/rayos.webm", out: "public/videos/rayos.opt", scale: "1280:-2", crf: { vp9: 38, h264: 28 }, mp4: false },
  { src: "public/videos/video_hero_visuals.webm", out: "public/videos/video_hero_visuals.opt", scale: null, crf: { vp9: 34, h264: 25 }, mp4: false },
];

const GIFS = [
  "cd", "edicion-de-fotografias", "edicion-de-video", "frente-de-camara", "mas", "microfono", "pista-de-tiempo",
].map((name) => ({ src: `public/icons/services/${name}.gif`, out: `public/icons/services/${name}.webp` }));

function run(args) {
  console.log("ffmpeg " + args.map((a) => (/\s/.test(a) ? `"${a}"` : a)).join(" "));
  if (DRY) return;
  const r = spawnSync("ffmpeg", args, { stdio: "inherit" });
  if (r.status !== 0) throw new Error(`ffmpeg terminó con código ${r.status}`);
}

function hasAlpha(file) {
  if (DRY) return false;
  const r = spawnSync("ffprobe", ["-v", "error", "-show_streams", "-select_streams", "v:0", file], { encoding: "utf8" });
  return /ALPHA_MODE=1/i.test(r.stdout || "");
}

function kb(file) {
  return existsSync(file) ? `${Math.round(statSync(file).size / 1024)} KB` : "—";
}

if (!DRY && spawnSync("ffmpeg", ["-version"]).status !== 0) {
  console.error("No se encuentra ffmpeg en el PATH. Instálalo (winget install Gyan.FFmpeg) o usa --dry-run.");
  process.exit(1);
}

for (const v of VIDEOS) {
  const src = join(ROOT, v.src);
  if (!existsSync(src)) { console.warn(`Falta ${v.src}`); continue; }
  const vf = v.scale ? ["-vf", `scale=${v.scale}:flags=lanczos`] : [];
  const alpha = hasAlpha(src);

  // VP9 de dos pasadas con calidad constante (-b:v 0 + CRF)
  const vp9 = [
    "-y", "-i", src, ...vf, "-an", "-c:v", "libvpx-vp9", "-b:v", "0", "-crf", String(v.crf.vp9),
    "-row-mt", "1", "-tile-columns", "2", "-deadline", "good", "-cpu-used", "1",
    "-pix_fmt", alpha ? "yuva420p" : "yuv420p",
  ];
  const nullOut = process.platform === "win32" ? "NUL" : "/dev/null";
  run([...vp9, "-pass", "1", "-passlogfile", `${v.out}.vp9log`, "-f", "webm", nullOut]);
  run([...vp9, "-pass", "2", "-passlogfile", `${v.out}.vp9log`, `${v.out}.webm`]);
  if (!DRY) rmSync(`${v.out}.vp9log-0.log`, { force: true }); // log temporal de la 1.ª pasada

  // H.264 de respaldo (Safari antiguo / iOS < 17) solo donde la página lo ofrece
  if (v.mp4 !== false) {
    run([
      "-y", "-i", src, ...vf, "-an", "-c:v", "libx264", "-preset", "veryslow", "-crf", String(v.crf.h264),
      "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart", `${v.out}.mp4`,
    ]);
  }
  if (!DRY) console.log(`✔ ${v.src} (${kb(src)}) → ${v.out}.webm (${kb(`${v.out}.webm`)})`);
}

for (const g of GIFS) {
  const src = join(ROOT, g.src);
  if (!existsSync(src)) { console.warn(`Falta ${g.src}`); continue; }
  run([
    "-y", "-i", src,
    "-vf", "scale=160:160:flags=lanczos",
    "-c:v", "libwebp_anim", "-lossless", "0", "-q:v", "82", "-compression_level", "6",
    "-loop", "0", "-fps_mode", "passthrough", "-an", g.out,
  ]);
  if (!DRY) console.log(`✔ ${g.src} (${kb(src)}) → ${g.out} (${kb(g.out)})`);
}

console.log(DRY ? "\n(dry-run: no se ha generado nada)" : "\nListo. Revisa los resultados antes de cambiar referencias.");
