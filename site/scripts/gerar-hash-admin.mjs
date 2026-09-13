// Gera o valor de ADMIN_SENHA_HASH usando o mesmo formato do aplicativo.
// Uso: node scripts/gerar-hash-admin.mjs "sua senha longa"
import { randomBytes, scryptSync } from "node:crypto";

const senha = process.argv.slice(2).join(" ");
if (!senha || senha.length < 12) {
  console.error("Informe uma senha com pelo menos 12 caracteres entre aspas.");
  process.exit(1);
}

const salt = randomBytes(16).toString("hex");
const derivado = scryptSync(senha.normalize("NFKC"), salt, 64).toString("hex");
console.log(`ADMIN_SENHA_HASH=scrypt$${salt}$${derivado}`);
