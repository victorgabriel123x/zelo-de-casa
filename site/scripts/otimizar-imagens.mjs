// Gera AVIF e WebP em varias larguras a partir dos PNGs originais do kit.
// Uso: node scripts/otimizar-imagens.mjs [pasta-de-origem]
import { mkdir, readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const origem = process.argv[2] ?? path.join(process.cwd(), "..", "assets", "imagens");
const destino = path.join(process.cwd(), "public", "imagens");
const larguras = [640, 960, 1440];

await mkdir(destino, { recursive: true });
const arquivos = (await readdir(origem)).filter(
  // hero-produto e hero-cenario tem larguras proprias em scripts/preparar-hero.mjs
  (f) => /\.(png|jpe?g)$/i.test(f) && !/^hero-/i.test(f),
);

for (const arquivo of arquivos) {
  const base = arquivo.replace(/\.(png|jpe?g)$/i, "");
  for (const largura of larguras) {
    const entrada = sharp(path.join(origem, arquivo)).resize({ width: largura, withoutEnlargement: true });
    await entrada.clone().avif({ quality: 62, effort: 6 }).toFile(path.join(destino, `${base}-${largura}.avif`));
    await entrada.clone().webp({ quality: 82 }).toFile(path.join(destino, `${base}-${largura}.webp`));
  }
  console.log(`gerado: ${base}`);
}
