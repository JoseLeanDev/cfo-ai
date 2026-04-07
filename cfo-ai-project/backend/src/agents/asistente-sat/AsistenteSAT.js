/**
 * Asistente SAT Agent
 * Especialista en obligaciones fiscales de Guatemala
 * Responde preguntas sobre impuestos y cumplimiento
 */
const BaseAgent = require('../BaseAgent');

class AsistenteSAT extends BaseAgent {
  constructor() {
    super('AsistenteSAT', 'tax_specialist', [
      'sat_obligations',
      'tax_calculation',
      'compliance_check',
      'deadline_tracking',
      'tax_advisory'
    ]);
    
    // Base de conocimiento fiscal GT
    this.knowledgeBase = {
      iva: {
        general: 'El IVA en Guatemala es del 12%. Los contribuyentes deben declarar mensualmente.',
        plazo: 'La declaración del IVA vence el último día hábil del mes siguiente al período.',
        retencion: 'El IVA retenido debe pagarse dentro de los primeros 10 días hábiles del mes.'
      },
      isr: {
        general: 'El ISR varía según el régimen: renta presunta (5-7%), renta atribuida (25%), o renta sobre utilidades de actividades lucrativas.',
        plazo: 'Las declaraciones de ISR son trimestrales (abril, julio, octubre, enero) para PYMEs.',
        pagos: 'Los pagos a cuenta son mensuales para contribuyentes con ingresos > Q1M anuales.'
      },
      retenciones: {
        iva: 'La retención de IVA es del 15% sobre servicios y 5% sobre bienes.',
        isr: 'Las retenciones de ISR varían: 5% profesionales, 1% arrendamiento, 2% servicios.',
        plazo: 'Las retenciones deben pagarse dentro de los 10 primeros días del mes siguiente.'
      }
    };
  }

  async process(input, context) {
    const { query, empresaId } = input;
    const { db } = context;
    
    this.addToMemory('user', query);

    try {
      const query_lower = query.toLowerCase();

      // Detectar intención
      if (query_lower.includes('obligación') || query_lower.includes('vencimiento') || query_lower.includes('cuándo')) {
        return await this.checkObligations(db, empresaId);
      }

      if (query_lower.includes('iva')) {
        return this.adviseOnIVA(query_lower);
      }

      if (query_lower.includes('isr')) {
        return this.adviseOnISR(query_lower);
      }

      if (query_lower.includes('retención')) {
        return this.adviseOnRetenciones(query_lower);
      }

      // Respuesta general
      return this.generalTaxAdvice();

    } catch (error) {
      console.error('[AsistenteSAT] Error:', error);
      return this.formatResponse(
        'Hubo un error consultando información fiscal.',
        'error'
      );
    }
  }

  async checkObligations(db, empresaId) {
    const obligaciones = await db.allAsync(`
      SELECT tipo, descripcion, fecha_vencimiento, estado, monto_estimado
      FROM obligaciones_sat 
      WHERE empresa_id = ? AND estado != 'cumplida'
      ORDER BY fecha_vencimiento ASC
    `, [empresaId]);

    if (obligaciones.length === 0) {
      return this.formatResponse(
        '✅ ¡Excelente! No tienes obligaciones fiscales pendientes.',
        'success'
      );
    }

    let response = `📋 **Obligaciones SAT Pendientes**\n\n`;
    const hoy = new Date();
    const alerts = [];

    for (const obl of obligaciones) {
      const vencimiento = new Date(obl.fecha_vencimiento);
      const diasRestantes = Math.ceil((vencimiento - hoy) / (1000 * 60 * 60 * 24));
      
      let emoji = '✅';
      if (diasRestantes < 0) emoji = '🚨';
      else if (diasRestantes <= 5) emoji = '⚠️';
      else if (diasRestantes <= 10) emoji = '📅';

      response += `${emoji} **${obl.tipo}**\n`;
      response += `   ${obl.descripcion}\n`;
      response += `   Vence: ${obl.fecha_vencimiento} (${diasRestantes > 0 ? `en ${diasRestantes} días` : `vencido hace ${Math.abs(diasRestantes)} días`})\n`;
      if (obl.monto_estimado) {
        response += `   Monto estimado: GTQ ${obl.monto_estimado.toLocaleString()}\n`;
      }
      response += `\n`;

      if (diasRestantes <= 3 && diasRestantes >= 0) {
        alerts.push(`${obl.tipo} vence en ${diasRestantes} días`);
      }
    }

    const actions = alerts.length > 0 ? alerts.map(a => `Priorizar: ${a}`) : [];

    return this.formatResponse(response, 'data', { obligaciones }, actions);
  }

  adviseOnIVA(query) {
    let response = `📘 **Información sobre IVA**\n\n`;
    
    if (query.includes('retención')) {
      response += this.knowledgeBase.retenciones.iva;
    } else if (query.includes('plazo') || query.includes('cuándo')) {
      response += this.knowledgeBase.iva.plazo;
    } else {
      response += this.knowledgeBase.iva.general + '\n\n';
      response += this.knowledgeBase.iva.plazo;
    }

    response += `\n\n💡 *Tip:* Mantén tus facturas electrónicas (FEL) ordenadas por mes para facilitar la declaración.`;

    return this.formatResponse(response, 'advisory');
  }

  adviseOnISR(query) {
    let response = `📗 **Información sobre ISR**\n\n`;
    
    if (query.includes('retención')) {
      response += this.knowledgeBase.retenciones.isr;
    } else if (query.includes('plazo') || query.includes('cuándo')) {
      response += this.knowledgeBase.isr.plazo;
    } else if (query.includes('pago') || query.includes('cuenta')) {
      response += this.knowledgeBase.isr.pagos;
    } else {
      response += this.knowledgeBase.isr.general + '\n\n';
      response += this.knowledgeBase.isr.plazo;
    }

    response += `\n\n⚠️ *Nota:* Este es información general. Consulta con tu contador para casos específicos.`;

    return this.formatResponse(response, 'advisory');
  }

  adviseOnRetenciones(query) {
    let response = `📙 **Información sobre Retenciones**\n\n`;
    
    response += `**IVA:**\n${this.knowledgeBase.retenciones.iva}\n\n`;
    response += `**ISR:**\n${this.knowledgeBase.retenciones.isr}\n\n`;
    response += `**Plazo de pago:**\n${this.knowledgeBase.retenciones.plazo}`;

    return this.formatResponse(response, 'advisory');
  }

  generalTaxAdvice() {
    const response = `🏛️ **Asistente SAT - Guatemala**\n\n` +
      `Puedo ayudarte con:\n\n` +
      `📋 Ver obligaciones fiscales pendientes\n` +
      `📘 Consultas sobre IVA (12%, plazos, retenciones)\n` +
      `📗 Consultas sobre ISR (regímenes, pagos, retenciones)\n` +
      `📙 Información sobre retenciones\n\n` +
      `¿Qué necesitas saber?`;

    return this.formatResponse(response, 'info');
  }
}

module.exports = AsistenteSAT;
