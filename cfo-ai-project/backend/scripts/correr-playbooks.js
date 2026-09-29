#!/usr/bin/env node
/**
 * Corre a mano el analista de Insights de IA. La agenda lo hace sola cada dos
 * días; esto sirve para la primera corrida o para probar un playbook.
 *
 *   node scripts/correr-playbooks.js                 corre todas las áreas y guarda
 *   node scripts/correr-playbooks.js --dry-run       analiza e imprime, no guarda
 *   node scripts/correr-playbooks.js --playbook=caja solo esa área
 *   node scripts/correr-playbooks.js --list          lista los playbooks activos
 *
 * Necesita DATABASE_URL, DATABASE_URL_READONLY y OPENROUTER_API_KEY.
 */
require('dotenv').config();
const db = require('../database/connection');
const dbAgente = require('../src/services/dbAgente');
const { correrPlaybooks, cargarPlaybooks } = require('../src/services/analistaDiario');

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const slug = (args.find((a) => a.startsWith('--playbook=')) || '').split('=')[1] || null;

async function main() {
  if (args.includes('--list')) {
    const pbs = await cargarPlaybooks(db.pool, null);
    pbs.forEach((p) => console.log(`- ${p.slug}: ${p.nombre} (máximo ${p.max_insights})`));
    return;
  }
  const { resultados } = await correrPlaybooks({ pool: db.pool, slug, dryRun });
  if (dryRun) {
    for (const r of resultados) {
      console.log(`\n== ${r.slug} (${r.estado})`);
      for (const i of r.insights) {
        console.log(`- [${i.severidad}/${i.tipo}] ${i.titulo}\n  ${i.descripcion}\n  → ${i.recomendacion}`);
      }
    }
  }
}

main()
  .catch((e) => {
    console.error('FATAL:', e.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await dbAgente.cerrar().catch(() => {});
    await db.pool.end().catch(() => {});
  });
