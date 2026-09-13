// Recria a pasta public a partir dos arquivos originais do kit.
// Copia marca, ícones e decoração e regenera as imagens em AVIF e WebP.
// Uso: node scripts/preparar-assets.mjs [pasta-do-kit]
// Padrão: a pasta acima deste projeto, onde fica assets/ do kit.
import { copyFile, mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const kit = process.argv[2] ?? path.join(process.cwd(), "..");
const origemAssets = path.join(kit, "assets");
const publico = path.join(process.cwd(), "public");
const larguras = [640, 960, 1440];

async function copiarPasta(sub) {
  const de = path.join(origemAssets, sub);
  const para = path.join(publico, sub);
  await mkdir(para, { recursive: true });
  const arquivos = (await readdir(de)).filter((f) => /\.(svg|png)$/i.test(f));
  for (const arquivo of arquivos) {
    await copyFile(path.join(de, arquivo), path.join(para, arquivo));
  }
  console.log(`copiados ${arquivos.length} arquivos de ${sub}`);
}

async function gerarLogotipo() {
  const original = await readFile(path.join(publico, "marca", "logo-principal.svg"), "utf8");
  const simbolo =
    '<g transform="translate(12 22)"><g fill="none" stroke="#C65D3A" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"><path d="M18 58 64 18 110 58M28 51v59h72V51"/><path d="M64 94 45 76c-16-18 9-35 19-16 10-19 35-2 19 16Z"/></g></g>';
  if (!original.includes(simbolo)) {
    console.warn("símbolo não encontrado na logo, logotipo não foi regerado");
    return;
  }
  const semSimbolo = original
    .replace(simbolo, "")
    .replace('width="600" height="180" viewBox="0 0 600 180"', 'width="440" height="180" viewBox="158 0 442 180"');
  await writeFile(path.join(publico, "marca", "logotipo.svg"), semSimbolo, "utf8");
  await writeFile(
    path.join(publico, "marca", "logotipo-claro.svg"),
    semSimbolo.replaceAll('fill="#2A211D"', 'fill="#FDF8F1"'),
    "utf8",
  );
  console.log("logotipo e logotipo-claro regerados");
}

async function gerarImagens() {
  const de = path.join(origemAssets, "imagens");
  const para = path.join(publico, "imagens");
  await mkdir(para, { recursive: true });
  const arquivos = (await readdir(de)).filter((f) => /\.(png|jpe?g)$/i.test(f) && !/referencia/i.test(f));
  for (const arquivo of arquivos) {
    const base = arquivo.replace(/\.(png|jpe?g)$/i, "");
    for (const largura of larguras) {
      const entrada = sharp(path.join(de, arquivo)).resize({ width: largura, withoutEnlargement: true });
      await entrada.clone().avif({ quality: 62, effort: 6 }).toFile(path.join(para, `${base}-${largura}.avif`));
      await entrada.clone().webp({ quality: 82 }).toFile(path.join(para, `${base}-${largura}.webp`));
    }
    console.log(`gerado ${base}`);
  }
}

await copiarPasta("marca");
await copiarPasta("icones");
await copiarPasta("decoracao");
await gerarLogotipo();
await gerarImagens();
console.log("pasta public atualizada a partir do kit");
