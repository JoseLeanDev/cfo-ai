// Constantes financieras centralizadas del frontend CFO AI
// Extraídas de componentes para evitar valores hardcodeados

// Moneda
export const MONEDA_DEFAULT = import.meta.env.VITE_MONEDA_DEFAULT || 'GTQ';
export const TIPO_CAMBIO_DEFAULT = parseFloat(import.meta.env.VITE_TIPO_CAMBIO) || 7.75;

// Umbrales de liquidez
export const UMBRAL_SALDO_CRITICO = parseFloat(import.meta.env.VITE_UMBRAL_SALDO_CRITICO) || 1000000;
export const UMBRAL_SALDO_ADVERTENCIA = parseFloat(import.meta.env.VITE_UMBRAL_SALDO_ADVERTENCIA) || 2000000;

// Proyecciones
export const PROYECCION_SEMANAS_DEFAULT = parseInt(import.meta.env.VITE_PROYECCION_SEMANAS) || 12;

// Concentración cliente
export const CONCENTRACION_CLIENTE_CRITICO = parseFloat(import.meta.env.VITE_CONCENTRACION_CLIENTE_CRITICO) || 0.20;

// Helper para formato de moneda
export const formatCurrency = (value, moneda = MONEDA_DEFAULT) => {
  if (value === null || value === undefined || isNaN(value)) return '---';
  return new Intl.NumberFormat('es-GT', {
    style: 'currency',
    currency: moneda,
    minimumFractionDigits: 0
  }).format(value);
};

// Helper para formato GTQ (legacy)
export const formatGTQ = (value) => formatCurrency(value, 'GTQ');
