/**
 * Script para ejecutar manualmente todas las tareas de agentes
 * para verificar que funcionan correctamente con PostgreSQL
 * VERSION 2 - Con logs completos de errores
 */

const { getCFOAICore } = require('./src/agents');
const AgenteCaja = require('./src/agents/caja/AgenteCaja');
const AgenteAnalisis = require('./src/agents/analisis/AgenteAnalisis');
const AgenteCobranza = require('./src/agents/cobranza/AgenteCobranza');
const AgenteContabilidad = require('./src/agents/contabilidad/AgenteContabilidad');

const EMPRESA_ID = 1;

async function ejecutarTarea(nombre, agente, tareaId) {
  console.log(`\n🚀 Ejecutando: ${nombre}.${tareaId}()`);
  const startTime = Date.now();
  try {
    const resultado = await agente.process({ tarea: tareaId, empresaId: EMPRESA_ID }, {});
    const duracion = Date.now() - startTime;
    console.log(`  ✅ ${duracion}ms - ${resultado.content || 'OK'}`);
    if (resultado.type === 'error') {
      console.log(`  ⚠️ Tipo: error`);
      return { ok: false, error: resultado.content };
    }
    return { ok: true };
  } catch (error) {
    const duracion = Date.now() - startTime;
    console.log(`  ❌ ${duracion}ms - ERROR:`);
    console.log(`     Message: ${error.message}`);
    console.log(`     Stack: ${error.stack?.substring(0, 500)}`);
    return { ok: false, error: error.message, stack: error.stack };
  }
}

async function main() {
  console.log('========================================');
  console.log('  TEST MANUAL DE AGENTES v2.0');
  console.log('  Verificando PostgreSQL...');
  console.log('========================================');

  // Crear instancias de agentes
  const caja = new AgenteCaja();
  const analisis = new AgenteAnalisis();
  const cobranza = new AgenteCobranza();
  const contabilidad = new AgenteContabilidad();

  const resultados = [];

  // 1. Agente Caja
  console.log('\n--- 💰 AGENTE CAJA ---');
  resultados.push(await ejecutarTarea('Caja', caja, 'calcularRunway'));
  resultados.push(await ejecutarTarea('Caja', caja, 'analizarCashFlow'));
  resultados.push(await ejecutarTarea('Caja', caja, 'analizarFlujoEfectivo'));

  // 2. Agente Análisis
  console.log('\n--- 📊 AGENTE ANÁLISIS ---');
  resultados.push(await ejecutarTarea('Análisis', analisis, 'calcularKPIsDiarios'));
  resultados.push(await ejecutarTarea('Análisis', analisis, 'analizarRentabilidadClientes'));

  // 3. Agente Cobranza
  console.log('\n--- 💵 AGENTE COBRANZA ---');
  resultados.push(await ejecutarTarea('Cobranza', cobranza, 'actualizarAging'));
  resultados.push(await ejecutarTarea('Cobranza', cobranza, 'calcularDSO'));
  resultados.push(await ejecutarTarea('Cobranza', cobranza, 'calcularCCC'));

  // 4. Agente Contabilidad
  console.log('\n--- 📗 AGENTE CONTABILIDAD ---');
  resultados.push(await ejecutarTarea('Contabilidad', contabilidad, 'verificarObligacionesFiscales'));
  resultados.push(await ejecutarTarea('Contabilidad', contabilidad, 'importarTransacciones'));
  resultados.push(await ejecutarTarea('Contabilidad', contabilidad, 'generarAsientos'));

  // 5. CFO AI Core - Briefing
  console.log('\n--- 🤖 CFO AI CORE ---');
  const core = getCFOAICore();
  await core.iniciar();
  resultados.push(await ejecutarTarea('Core', core, 'generarBriefingDiario'));

  // Resumen
  console.log('\n========================================');
  console.log('  RESUMEN DE RESULTADOS');
  console.log('========================================');
  const exitosos = resultados.filter(r => r.ok).length;
  const fallidos = resultados.filter(r => !r.ok).length;
  console.log(`  ✅ Exitosos: ${exitosos}`);
  console.log(`  ❌ Fallidos: ${fallidos}`);
  console.log(`  📊 Total: ${resultados.length}`);

  if (fallidos > 0) {
    console.log('\n  ❌ ERRORES DETECTADOS:');
    resultados.forEach((r, i) => {
      if (!r.ok) {
        console.log(`\n    #${i + 1}: ${r.error}`);
        if (r.stack) console.log(`    Stack: ${r.stack.substring(0, 300)}...`);
      }
    });
    process.exit(1);
  } else {
    console.log('\n  🎉 TODAS LAS TAREAS COMPLETADAS SIN ERRORES');
    process.exit(0);
  }
}

main().catch(e => {
  console.error('Error fatal:', e);
  process.exit(1);
});
