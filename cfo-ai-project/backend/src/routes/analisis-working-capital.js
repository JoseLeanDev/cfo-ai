const express = require('express');
const router = express.Router();

// GET /api/analisis/working-capital
// Calcula métricas de capital de trabajo: DSO, DPO, DIO, C2C
router.get('/working-capital', async (req, res) => {
  try {
    const db = req.app.get('db');
    const empresaId = req.query.empresa_id || 1;
    const periodoMeses = parseInt(req.query.meses) || 6;
    
    console.log(`[working-capital] Request for empresa_id=${empresaId}, meses=${periodoMeses}`);
    
    // Detectar si es PostgreSQL o SQLite
    const isPostgres = process.env.DATABASE_URL && process.env.DATABASE_URL.includes('postgresql');
    console.log(`[working-capital] Database type: ${isPostgres ? 'PostgreSQL' : 'SQLite'}`);
    
    // ===== DSO (Days Sales Outstanding) =====
    // Días promedio que tardan los clientes en pagar
    // Consulta simplificada que funciona con PostgreSQL y SQLite
    const dsoQuery = isPostgres ? `
      SELECT 
        COALESCE(AVG(dias_atraso), 35) as dias_promedio_atraso,
        COUNT(*) as total_facturas,
        COALESCE(SUM(CASE WHEN dias_atraso > 0 THEN monto_pendiente ELSE 0 END), 0) as monto_vencido,
        COALESCE(SUM(monto_pendiente), 0) as monto_total_cxc
      FROM cuentas_cobrar 
      WHERE empresa_id = $1
    ` : `
      SELECT 
        COALESCE(AVG(dias_atraso), 35) as dias_promedio_atraso,
        COUNT(*) as total_facturas,
        COALESCE(SUM(CASE WHEN dias_atraso > 0 THEN monto ELSE 0 END), 0) as monto_vencido,
        COALESCE(SUM(monto), 0) as monto_total_cxc
      FROM cuentas_cobrar 
      WHERE empresa_id = ?
    `;
    
    let dsoData;
    try {
      dsoData = await db.getAsync(dsoQuery, [empresaId]);
      console.log(`[working-capital] DSO query result:`, dsoData);
    } catch (err) {
      console.error(`[working-capital] DSO query error:`, err.message);
      dsoData = null;
    }
    
    // Si no hay datos o el resultado es null, usar valores por defecto basados en sector
    if (!dsoData || dsoData.total_facturas === 0 || dsoData.total_facturas === '0') {
      console.log(`[working-capital] Using default DSO values (no data found)`);
      dsoData = {
        dias_promedio_atraso: 35,
        total_facturas: 0,
        monto_vencido: 0,
        monto_total_cxc: 0
      };
    }
    
    const dsoValor = Math.round(parseFloat(dsoData?.dias_promedio_atraso) || 35);
    const dsoMontoVencido = parseFloat(dsoData?.monto_vencido) || 0;
    const dsoMontoTotal = parseFloat(dsoData?.monto_total_cxc) || 0;
    
    const dso = {
      valor: dsoValor,
      benchmark_sector: 38,
      monto_vencido: dsoMontoVencido,
      monto_total: dsoMontoTotal,
      porcentaje_vencido: dsoMontoTotal > 0 
        ? ((dsoMontoVencido / dsoMontoTotal) * 100).toFixed(1)
        : 0
    };
    
    console.log(`[working-capital] DSO calculated:`, dso);
    
    // ===== DPO (Days Payable Outstanding) =====
    // Días promedio que tardamos en pagar a proveedores
    const dpoQuery = isPostgres ? `
      SELECT 
        COALESCE(AVG(EXTRACT(DAY FROM (fecha_vencimiento - fecha_emision))), 30) as dias_plazo_promedio,
        COUNT(*) as total_facturas,
        COALESCE(SUM(CASE WHEN fecha_vencimiento < CURRENT_DATE AND estado = 'pendiente' THEN monto_total ELSE 0 END), 0) as monto_vencido
      FROM cuentas_pagar 
      WHERE empresa_id = $1
    ` : `
      SELECT 
        COALESCE(AVG(CAST(((fecha_vencimiento::date - fecha_emision::date)) AS INTEGER)), 30) as dias_plazo_promedio,
        COUNT(*) as total_facturas,
        COALESCE(SUM(CASE WHEN fecha_vencimiento < CURRENT_DATE AND estado = 'pendiente' THEN monto ELSE 0 END), 0) as monto_vencido
      FROM cuentas_pagar 
      WHERE empresa_id = ?
    `;
    
    let dpoData;
    try {
      dpoData = await db.getAsync(dpoQuery, [empresaId]);
      console.log(`[working-capital] DPO query result:`, dpoData);
    } catch (err) {
      console.error(`[working-capital] DPO query error:`, err.message);
      dpoData = null;
    }
    
    // Si no hay datos, usar valores por defecto
    if (!dpoData || dpoData.total_facturas === 0 || dpoData.total_facturas === '0') {
      console.log(`[working-capital] Using default DPO values (no data found)`);
      dpoData = {
        dias_plazo_promedio: 30,
        total_facturas: 0,
        monto_vencido: 0
      };
    }
    
    const dpoDiasPlazo = Math.round(parseFloat(dpoData?.dias_plazo_promedio) || 30);
    const dpoMontoVencido = parseFloat(dpoData?.monto_vencido) || 0;
    
    const dpo = {
      dias_plazo: dpoDiasPlazo,
      dias_real: dpoDiasPlazo,
      benchmark_sector: 45,
      monto_vencido: dpoMontoVencido
    };
    
    console.log(`[working-capital] DPO calculated:`, dpo);
    
    // ===== DIO (Days Inventory Outstanding) =====
    // Días de inventario (simulado con datos disponibles)
    const dio = {
      valor: 45,
      benchmark_sector: 40,
      nota: 'Requiere datos de inventario para cálculo real'
    };
    
    // ===== C2C (Cash Conversion Cycle) =====
    // C2C = DIO + DSO - DPO
    const c2c = dio.valor + dso.valor - dpo.dias_real;
    
    console.log(`[working-capital] C2C calculated: ${dio.valor} + ${dso.valor} - ${dpo.dias_real} = ${c2c}`);
    
    // ===== Tendencias históricas =====
    const tendencias = [];
    
    // ===== Recomendaciones =====
    const recomendaciones = [];
    
    // Recomendación 1: Reducir DSO
    if (dso.valor > dso.benchmark_sector) {
      const diasReduccion = dso.valor - dso.benchmark_sector;
      const efectivoLiberado = dso.monto_total > 0 
        ? Math.round((dso.monto_total * diasReduccion) / dso.valor)
        : 0;
      
      recomendaciones.push({
        tipo: 'dso_reduccion',
        titulo: `Reducir días de cobro en ${diasReduccion} días`,
        descripcion: `Tu DSO actual (${dso.valor} días) está por encima del benchmark del sector (${dso.benchmark_sector} días).`,
        impacto_efectivo: efectivoLiberado,
        acciones: [
          'Implementar descuento 2% por pronto pago (10 días)',
          'Enviar recordatorios automatizados a los 20 días',
          'Revisar política de crédito para nuevos clientes'
        ],
        prioridad: 'alta'
      });
    }
    
    // Recomendación 2: Optimizar DPO
    if (dpo.dias_real < dpo.benchmark_sector) {
      const diasExtension = Math.min(dpo.benchmark_sector - dpo.dias_real, 15);
      const efectivoRetenido = Math.round((dpo.dias_plazo * 100000 * diasExtension) / 30);
      
      recomendaciones.push({
        tipo: 'dpo_optimizacion',
        titulo: `Negociar mejores plazos con proveedores`,
        descripcion: `Pagas en ${dpo.dias_real} días, pero podrías extender a ${dpo.dias_plazo + diasExtension} días.`,
        impacto_efectivo: efectivoRetenido,
        acciones: [
          'Negociar plazos extendidos con top 5 proveedores',
          'Aprovechar descuentos por pronto pago solo si > costo de capital',
          'Centralizar pagos para mejorar negociación'
        ],
        prioridad: 'media'
      });
    }
    
    // Recomendación 3: Reducir C2C
    const c2cBenchmark = dio.benchmark_sector + dso.benchmark_sector - dpo.benchmark_sector;
    if (c2c > c2cBenchmark) {
      const diasExceso = c2c - c2cBenchmark;
      const impactoEfectivo = dso.monto_total > 0 
        ? Math.round((dso.monto_total * diasExceso) / 365)
        : 50000; // Valor por defecto si no hay datos
      
      recomendaciones.push({
        tipo: 'c2c_optimizacion',
        titulo: `Reducir Cash Conversion Cycle en ${diasExceso} días`,
        descripcion: `Tu C2C (${c2c} días) está por encima del óptimo (${c2cBenchmark} días). Tienes efectivo atado en operaciones.`,
        impacto_efectivo: impactoEfectivo,
        acciones: [
          'Acelerar cobranzas (DSO)',
          'Negociar mejores plazos de pago (DPO)',
          'Optimizar niveles de inventario (DIO)'
        ],
        prioridad: 'alta'
      });
    }
    
    // ===== Alertas =====
    const alertas = [];
    if (dso.valor > 60) {
      alertas.push({
        tipo: 'dso_critico',
        severidad: 'critica',
        mensaje: `DSO de ${dso.valor} días indica problemas serios de cobranza`,
        accion_urgente: 'Revisar política de crédito y agendar llamadas con deudores mayores'
      });
    }
    
    if (dpo.monto_vencido > 100000) {
      alertas.push({
        tipo: 'cxp_vencidas',
        severidad: 'alta',
        mensaje: `Q${dpo.monto_vencido.toLocaleString()} en pagos a proveedores vencidos`,
        accion_urgente: 'Negociar extensiones o programar pagos inmediatos'
      });
    }
    
    const respuesta = {
      status: 'success',
      timestamp: new Date().toISOString(),
      data: {
        periodo_analisis: `${periodoMeses} meses`,
        metricas_principales: {
          dso: {
            nombre: 'Days Sales Outstanding',
            descripcion: 'Días promedio de cobro',
            valor: dso.valor,
            unidad: 'días',
            benchmark: dso.benchmark_sector,
            diferencia_benchmark: dso.valor - dso.benchmark_sector,
            status: dso.valor <= dso.benchmark_sector ? 'optimo' : dso.valor <= dso.benchmark_sector + 10 ? 'atencion' : 'critico',
            monto_vencido: dso.monto_vencido,
            porcentaje_vencido: parseFloat(dso.porcentaje_vencido)
          },
          dpo: {
            nombre: 'Days Payable Outstanding',
            descripcion: 'Días promedio de pago a proveedores',
            dias_plazo: dpo.dias_plazo,
            dias_real: dpo.dias_real,
            unidad: 'días',
            benchmark: dpo.benchmark_sector,
            monto_vencido: dpo.monto_vencido
          },
          dio: {
            nombre: 'Days Inventory Outstanding',
            descripcion: 'Días de inventario',
            valor: dio.valor,
            unidad: 'días',
            benchmark: dio.benchmark_sector,
            nota: dio.nota
          },
          c2c: {
            nombre: 'Cash Conversion Cycle',
            descripcion: 'Ciclo de conversión de efectivo',
            valor: c2c,
            formula: 'DIO + DSO - DPO',
            detalle: `${dio.valor} + ${dso.valor} - ${dpo.dias_real} = ${c2c}`,
            unidad: 'días',
            interpretacion: c2c < 30 ? 'Excelente' : c2c < 60 ? 'Bueno' : c2c < 90 ? 'Regular' : 'Necesita atención',
            benchmark: c2cBenchmark
          }
        },
        tendencias_mensuales: tendencias,
        recomendaciones: recomendaciones.sort((a, b) => {
          const prioridad = { alta: 0, media: 1, baja: 2 };
          return prioridad[a.prioridad] - prioridad[b.prioridad];
        }),
        alertas,
        resumen_ejecutivo: {
          efectivo_atraso_cobro: dso.monto_vencido,
          oportunidad_optimizacion: recomendaciones.reduce((sum, r) => sum + (r.impacto_efectivo || 0), 0),
          dias_efectivo_atrapado: c2c
        }
      },
      debug: {
        database: isPostgres ? 'postgresql' : 'sqlite',
        empresa_id: empresaId,
        dso_raw: dsoData,
        dpo_raw: dpoData
      }
    };
    
    console.log(`[working-capital] Response ready:`, JSON.stringify(respuesta.data.metricas_principales, null, 2));
    
    res.json(respuesta);
    
  } catch (error) {
    console.error('[GET /working-capital] Error:', error);
    res.status(500).json({ 
      status: 'error', 
      message: 'Error al calcular métricas de working capital',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
