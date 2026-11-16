// Registra el alias "@/…" → "src/…" para que `node --test` pueda importar los
// módulos del proyecto sin bundler. Node ≥ 22.18 ejecuta TypeScript con
// eliminación de tipos de forma nativa.
import { registerHooks } from "node:module";
import { fileURLToPath, pathToFileURL } from "node:url";
import { dirname, join } from "node:path";
import { existsSync } from "node:fs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const srcDir = join(root, "src");
const EXTENSIONS = [".ts", ".tsx", ".mts", ".js", ".mjs"];

function resolveWithExtension(basePath) {
  if (existsSync(basePath) && !existsSync(join(basePath, "index.ts"))) return basePath;
  for (const ext of EXTENSIONS) {
    if (existsSync(basePath + ext)) return basePath + ext;
  }
  for (const ext of EXTENSIONS) {
    const index = join(basePath, `index${ext}`);
    if (existsSync(index)) return index;
  }
  return basePath;
}

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith("@/")) {
      const target = resolveWithExtension(join(srcDir, specifier.slice(2)));
      return nextResolve(pathToFileURL(target).href, context);
    }
    // Imports relativos sin extensión dentro de src (TypeScript lo permite)
    if ((specifier.startsWith("./") || specifier.startsWith("../")) && context.parentURL?.startsWith("file:")) {
      const parentPath = fileURLToPath(context.parentURL);
      const candidate = join(dirname(parentPath), specifier);
      if (!/\.[a-z]+$/i.test(specifier)) {
        return nextResolve(pathToFileURL(resolveWithExtension(candidate)).href, context);
      }
    }
    return nextResolve(specifier, context);
  },
});
