// Gera os arquivos da hero a partir de assets/imagens/hero-produto.png (PNG com
// fundo transparente) e assets/imagens/hero-cenario.png (foto da bancada).
// O produto e recortado exatamente na area visivel para que o posicionamento no
// CSS seja previsivel e a base do aparelho encoste na bancada do cenario.
// Uso: node scripts/preparar-hero.mjs
import { mkdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const origem = path.join(process.cwd(), "..", "assets", "imagens");
const destino = path.join(process.cwd(), "public", "imagens");
await mkdir(destino, { recursive: true });

const avif = { quality: 64, effort: 6 };
const webp = { quality: 86 };

async function gerar(entrada, base, larguras) {
  for (const largura of larguras) {
    const img = entrada.clone().resize({ width: largura, withoutEnlargement: true, fit: "inside" });
    await img.clone().avif(avif).toFile(path.join(destino, `${base}-${largura}.avif`));
    await img.clone().webp(webp).toFile(path.join(destino, `${base}-${largura}.webp`));
  }
  console.log(`gerado: ${base} (${larguras.join(", ")})`);
}

// Produto: recorte na caixa alfa para remover a moldura vazia do PNG.
const produtoOrigem = sharp(path.join(origem, "hero-produto.png"));
const { width, height } = await produtoOrigem.metadata();
const bruto = await produtoOrigem.clone().ensureAlpha().raw().toBuffer();
let x0 = width, y0 = height, x1 = -1, y1 = -1;
for (let y = 0; y < height; y += 1) {
  for (let x = 0; x < width; x += 1) {
    if (bruto[(y * width + x) * 4 + 3] > 12) {
      if (x < x0) x0 = x;
      if (x > x1) x1 = x;
      if (y < y0) y0 = y;
      if (y > y1) y1 = y;
    }
  }
}
const recorte = { left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 };
console.log("recorte do produto:", recorte);
const produto = sharp(path.join(origem, "hero-produto.png")).extract(recorte);
await gerar(produto, "hero-produto", [480, 720, 1080, recorte.width]);

// Cenario: usado como fundo com object-fit cover, entao vale a largura cheia.
const cenario = sharp(path.join(origem, "hero-cenario.png"));
const meta = await cenario.metadata();
await gerar(cenario, "hero-cenario", [640, 1024, 1440, meta.width]);
