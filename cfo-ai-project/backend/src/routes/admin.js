/**
 * Endpoint de migración de emergencia para PostgreSQL
 * Agrega columnas faltantes para compatibilidad con agentes v2.0
 */

const express = require('express');
const router = express.Router();

/**
 * POST /api/admin/fix-postgres-schema
 * Agrega columnas faltantes en PostgreSQL para compatibilidad
 */
router.post('/fix-postgres-schema', async (req, res) => {
  try {
    const db = req.app.get('db');
    const isPostgres = !!db.pool;
    
    if (!isPostgres) {
      return res.json({
        status: 'info',
        message: 'No es PostgreSQL, no se requieren cambios',
        isPostgres: false
      });
    }

    const results = [];

    // 1. Agregar 'nombre' a cuentas_bancarias si no existe
    try {
      await db.runAsync(`
        ALTER TABLE cuentas_bancarias 
        ADD COLUMN IF NOT EXISTS nombre VARCHAR(255) DEFAULT 'Cuenta Bancaria'
      `);
      results.push({ tabla: 'cuentas_bancarias', columna: 'nombre', status: 'agregada' });
    } catch (e) {
      results.push({ tabla: 'cuentas_bancarias', columna: 'nombre', status: 'error', error: e.message });
    }

    // 2. Agregar 'saldo_actual' como alias/computed (o columna real)
    try {
      await db.runAsync(`
        ALTER TABLE cuentas_bancarias 
        ADD COLUMN IF NOT EXISTS saldo_actual DECIMAL(15,2) DEFAULT 0
      `);
      results.push({ tabla: 'cuentas_bancarias', columna: 'saldo_actual', status: 'agregada' });
    } catch (e) {
      results.push({ tabla: 'cuentas_bancarias', columna: 'saldo_actual', status: 'error', error: e.message });
    }

    // 3. Sincronizar saldo_actual con saldo existente
    try {
      await db.runAsync(`
        UPDATE cuentas_bancarias 
        SET saldo_actual = saldo 
        WHERE saldo_actual IS NULL OR saldo_actual = 0
      `);
      results.push({ tabla: 'cuentas_bancarias', accion: 'sincronizar_saldo', status: 'ok' });
    } catch (e) {
      results.push({ tabla: 'cuentas_bancarias', accion: 'sincronizar_saldo', status: 'error', error: e.message });
    }

    // 4. Agregar 'descripcion' a transacciones si no existe (para compatibilidad SQLite)
    try {
      await db.runAsync(`
        ALTER TABLE transacciones 
        ADD COLUMN IF NOT EXISTS descripcion TEXT
      `);
      results.push({ tabla: 'transacciones', columna: 'descripcion', status: 'agregada' });
    } catch (e) {
      results.push({ tabla: 'transacciones', columna: 'descripcion', status: 'error', error: e.message });
    }

    // 5. Copiar concepto a descripcion si descripcion está vacía
    try {
      await db.runAsync(`
        UPDATE transacciones 
        SET descripcion = concepto 
        WHERE descripcion IS NULL AND concepto IS NOT NULL
      `);
      results.push({ tabla: 'transacciones', accion: 'copiar_concepto', status: 'ok' });
    } catch (e) {
      results.push({ tabla: 'transacciones', accion: 'copiar_concepto', status: 'error', error: e.message });
    }

    // 6. Agregar campos faltantes a cuentas_cobrar (para compatibilidad)
    try {
      await db.runAsync(`
        ALTER TABLE cuentas_cobrar 
        ADD COLUMN IF NOT EXISTS cliente VARCHAR(255)
      `);
      results.push({ tabla: 'cuentas_cobrar', columna: 'cliente', status: 'agregada' });
    } catch (e) {
      results.push({ tabla: 'cuentas_cobrar', columna: 'cliente', status: 'error', error: e.message });
    }

    // 7. Verificar tabla agentes_logs existe
    try {
      await db.runAsync(`
        CREATE TABLE IF NOT EXISTS agentes_logs (
          id SERIAL PRIMARY KEY,
          empresa_id INTEGER DEFAULT 1,
          agente_nombre VARCHAR(255),
          agente_tipo VARCHAR(100),
          agente_version VARCHAR(50) DEFAULT '1.0.0',
          categoria VARCHAR(100),
          descripcion TEXT,
          detalles_json TEXT,
          entidad_tipo VARCHAR(100),
          entidad_id INTEGER,
          impacto_valor DECIMAL(15,2),
          impacto_moneda VARCHAR(10) DEFAULT 'GTQ',
          resultado_status VARCHAR(50) DEFAULT 'exitoso',
          duracion_ms INTEGER,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      results.push({ tabla: 'agentes_logs', accion: 'crear', status: 'ok' });
    } catch (e) {
      results.push({ tabla: 'agentes_logs', accion: 'crear', status: 'error', error: e.message });
    }

    // 8. Verificar tabla alertas_financieras existe
    try {
      await db.runAsync(`
        CREATE TABLE IF NOT EXISTS alertas_financieras (
          id SERIAL PRIMARY KEY,
          tipo VARCHAR(100) NOT NULL,
          nivel VARCHAR(50),
          titulo TEXT NOT NULL,
          descripcion TEXT,
          monto_afectado DECIMAL(15,2) DEFAULT 0,
          estado VARCHAR(50) DEFAULT 'activa',
          metadata TEXT,
          resuelta_por VARCHAR(255),
          resuelta_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW(),
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      results.push({ tabla: 'alertas_financieras', accion: 'crear', status: 'ok' });
    } catch (e) {
      results.push({ tabla: 'alertas_financieras', accion: 'crear', status: 'error', error: e.message });
    }

    // 9. Verificar tabla snapshots_financieros existe
    try {
      await db.runAsync(`
        CREATE TABLE IF NOT EXISTS snapshots_financieros (
          id SERIAL PRIMARY KEY,
          fecha DATE NOT NULL,
          tipo VARCHAR(100),
          datos_json TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      results.push({ tabla: 'snapshots_financieros', accion: 'crear', status: 'ok' });
    } catch (e) {
      results.push({ tabla: 'snapshots_financieros', accion: 'crear', status: 'error', error: e.message });
    }

    res.json({
      status: 'success',
      message: 'Migración de emergencia completada',
      isPostgres: true,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Fix Schema] Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * POST /api/admin/seed-demo-data
 * Inserta datos de demo para mostrar funcionamiento de agentes
 */
router.post('/seed-demo-data', async (req, res) => {
  try {
    const db = req.app.get('db');
    const empresaId = req.body.empresa_id || 1;
    
    const results = [];

    // 1. Insertar cuentas bancarias de demo
    try {
      await db.runAsync(`
        INSERT INTO cuentas_bancarias (empresa_id, nombre, banco, numero_cuenta, tipo, moneda, saldo, saldo_actual, activa)
        VALUES 
          ($1, 'Cuenta Principal GTQ', 'Banco Industrial', '1234567890', 'monetaria', 'GTQ', 250000, 250000, TRUE),
          ($1, 'Cuenta USD', 'Banco G&T Continental', '0987654321', 'monetaria', 'USD', 15000, 15000, TRUE)
        ON CONFLICT DO NOTHING
      `, [empresaId]);
      results.push({ tabla: 'cuentas_bancarias', accion: 'insert', status: 'ok' });
    } catch (e) {
      // Si ya existen, solo actualizar
      await db.runAsync(`
        UPDATE cuentas_bancarias 
        SET saldo = 250000, saldo_actual = 250000, activa = TRUE
        WHERE empresa_id = $1 AND moneda = 'GTQ'
      `, [empresaId]);
      await db.runAsync(`
        UPDATE cuentas_bancarias 
        SET saldo = 15000, saldo_actual = 15000, activa = TRUE
        WHERE empresa_id = $1 AND moneda = 'USD'
      `, [empresaId]);
      results.push({ tabla: 'cuentas_bancarias', accion: 'update', status: 'ok' });
    }

    // 2. Insertar cuentas contables base
    const cuentas = [
      ['1100', 'Caja y Bancos', 'activo'],
      ['1120', 'Cuentas por Cobrar', 'activo'],
      ['2100', 'Cuentas por Pagar', 'pasivo'],
      ['3100', 'Capital Social', 'patrimonio'],
      ['4100', 'Ventas', 'ingreso'],
      ['5100', 'Costo de Ventas', 'gasto'],
      ['6100', 'Gastos Operativos', 'gasto']
    ];
    
    for (const [codigo, nombre, tipo] of cuentas) {
      try {
        await db.runAsync(`
          INSERT INTO cuentas_contables (empresa_id, codigo, nombre, tipo, activa)
          VALUES ($1, $2, $3, $4, TRUE)
          ON CONFLICT (codigo) DO NOTHING
        `, [empresaId, codigo, nombre, tipo]);
      } catch (e) {
        // ignora duplicados
      }
    }
    results.push({ tabla: 'cuentas_contables', accion: 'insert', count: cuentas.length });

    // 3. Insertar transacciones de ventas (últimos 90 días)
    const ventas = [
      [30, 'Cliente A', 45000, 'venta_producto'],
      [25, 'Cliente B', 32000, 'venta_producto'],
      [20, 'Cliente C', 28000, 'venta_servicio'],
      [15, 'Cliente D', 65000, 'venta_producto'],
      [10, 'Cliente E', 12000, 'venta_producto'],
      [5, 'Cliente F', 38000, 'venta_servicio'],
      [2, 'Cliente G', 22000, 'venta_producto']
    ];
    
    for (const [dias, cliente, monto, cat] of ventas) {
      try {
        await db.runAsync(`
          INSERT INTO transacciones (empresa_id, fecha, cuenta_id, tipo, monto, concepto, descripcion, categoria, estado)
          VALUES (
            $1, 
            CURRENT_DATE - INTERVAL '${dias} days',
            (SELECT id FROM cuentas_contables WHERE codigo = '4100' LIMIT 1),
            'haber', 
            $2, 
            'Venta a ${cliente}',
            'Venta a ${cliente}',
            $3,
            'activa'
          )
        `, [empresaId, monto, cat]);
      } catch (e) {
        console.log('Ventas insert error:', e.message);
      }
    }
    results.push({ tabla: 'transacciones', accion: 'ventas', count: ventas.length });

    // 4. Insertar CxC (cuentas por cobrar)
    const cxc = [
      ['Comercial XYZ', 85000, 45, 'pendiente'],
      ['Distribuidora Sur', 42000, 30, 'pendiente'],
      ['Tienda Centro', 18000, 15, 'pendiente'],
      ['Cliente VIP', 125000, 60, 'pendiente'],
      ['Restaurante Local', 9500, 5, 'pendiente']
    ];
    
    for (const [cliente, monto, dias, estado] of cxc) {
      try {
        await db.runAsync(`
          INSERT INTO transacciones (empresa_id, fecha, cuenta_id, tipo, monto, concepto, descripcion, nombre_cliente, estado)
          VALUES (
            $1,
            CURRENT_DATE - INTERVAL '${dias} days',
            (SELECT id FROM cuentas_contables WHERE codigo = '1120' LIMIT 1),
            'haber',
            $2,
            'CxC ${cliente}',
            'CxC ${cliente}',
            $3,
            'activa'
          )
        `, [empresaId, monto, cliente]);
      } catch (e) {
        console.log('CxC insert error:', e.message);
      }
    }
    results.push({ tabla: 'transacciones', accion: 'cxc', count: cxc.length });

    // 5. Insertar gastos operativos
    const gastos = [
      [5, 'Nómina', 85000, 'nomina'],
      [3, 'Alquiler', 25000, 'alquiler'],
      [1, 'Servicios públicos', 12000, 'servicios'],
      [2, 'Publicidad', 18000, 'publicidad'],
      [4, 'Transporte', 8000, 'transporte']
    ];
    
    for (const [dias, concepto, monto, cat] of gastos) {
      try {
        await db.runAsync(`
          INSERT INTO transacciones (empresa_id, fecha, cuenta_id, tipo, monto, concepto, descripcion, categoria, estado)
          VALUES (
            $1,
            CURRENT_DATE - INTERVAL '${dias} days',
            (SELECT id FROM cuentas_contables WHERE codigo = '6100' LIMIT 1),
            'debe',
            $2,
            $3,
            $3,
            $4,
            'activa'
          )
        `, [empresaId, monto, concepto, cat]);
      } catch (e) {
        console.log('Gastos insert error:', e.message);
      }
    }
    results.push({ tabla: 'transacciones', accion: 'gastos', count: gastos.length });

    // 6. Insertar snapshot de tasa de cambio
    try {
      await db.runAsync(`
        INSERT INTO snapshots_financieros (fecha, tipo, datos_json)
        VALUES (CURRENT_DATE, 'tasa_cambio', '{"tasa": 7.85}')
      `);
      results.push({ tabla: 'snapshots_financieros', accion: 'tasa', status: 'ok' });
    } catch (e) {
      results.push({ tabla: 'snapshots_financieros', accion: 'tasa', status: 'error', error: e.message });
    }

    res.json({
      status: 'success',
      message: 'Datos de demo insertados correctamente',
      empresa_id: empresaId,
      results,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Seed Demo] Error:', error);
    res.status(500).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router;
