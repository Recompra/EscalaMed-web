import fs from "node:fs";
import path from "node:path";

const OUT_FILE = path.resolve("data", "cities.ts");

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status} - ${url}`);
  return res.json();
}

function upperPT(s) {
  return (s || "").toLocaleUpperCase("pt-BR");
}

async function main() {
  console.log("Baixando UFs...");
  const states = await fetchJson(
    "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome"
  );

  // states: [{ id, sigla, nome, ...}]
  const ufs = states.map((s) => s.sigla).sort();

  const citiesByUf = {};

  for (const uf of ufs) {
    console.log(`Baixando cidades de ${uf}...`);
    const cities = await fetchJson(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`
    );

    citiesByUf[uf] = cities.map((c) => upperPT(c.nome));
  }

  const ts = `/* eslint-disable */
// AUTO-GERADO POR scripts/build-cities.mjs
// Fonte: IBGE (servicodados.ibge.gov.br)

export const UFS = ${JSON.stringify(ufs, null, 2)} as const;

export const CITIES_BY_UF: Record<(typeof UFS)[number], string[]> = ${JSON.stringify(
    citiesByUf,
    null,
    2
  )};
`;

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, ts, "utf8");

  console.log("OK! Gerado:", OUT_FILE);
}

main().catch((e) => {
  console.error("ERRO:", e);
  process.exit(1);
});