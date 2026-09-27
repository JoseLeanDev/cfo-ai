/**
 * Tema de gráficas.
 *
 * El diseño anterior usaba una paleta distinta por pantalla (violeta, cian,
 * rosa, lima, índigo), de modo que un mismo color significaba cosas distintas
 * en dos vistas contiguas. Aquí la serie principal es tinta, la comparación es
 * niebla y el cobalto se reserva para lo que produce un agente: proyección,
 * estimado, escenario.
 */

export const chart = {
  ink: '#17181B',
  graphite: '#33373D',
  slate: '#6C7278',
  mist: '#C7CBD0',
  fog: '#E9EAEC',
  paper: '#F6F5F3',
  white: '#FFFFFF',
  cobalt: '#4F6BE8',
  copper: '#B87A34',
  verified: '#2F8F5F',
  breach: '#C2452F',
}

/** Series categóricas, en orden de uso. Neutros primero, acento al final. */
export const series = [
  chart.ink,
  chart.slate,
  chart.mist,
  chart.cobalt,
  chart.copper,
  chart.graphite,
  chart.verified,
  chart.breach,
]

export const seriesAt = (index) => series[index % series.length]

/**
 * Color por marca. Identidad, no rango: cada marca conserva su color aunque un
 * filtro cambie el orden o quite las demás. Validado para daltonismo (ΔE ≥ 9.9
 * entre cualquier par) sobre blanco. El cobalto claro queda bajo 3:1 contra el
 * fondo, así que siempre va acompañado del nombre o de su cifra.
 */
export const marcas = {
  'Casa & Hogar': '#3D56C9',
  SportLife: '#149282',
  TechZone: '#B87A34',
  'Moda Urbana': '#8FA2F2',
}

export const colorMarca = (marca) => marcas[marca] ?? chart.slate

/** Ejes: sin línea de eje, sin marcas, rejilla horizontal en filete de niebla. */
export const axis = {
  stroke: chart.slate,
  tick: {
    fill: chart.slate,
    fontSize: 11,
    fontFamily: "'IBM Plex Mono', monospace",
  },
  axisLine: false,
  tickLine: false,
}

export const grid = {
  stroke: chart.fog,
  strokeDasharray: '0',
  vertical: false,
}

/** Tooltip: placa blanca, filete, sin radio grande ni sombra difusa. */
export const tooltip = {
  contentStyle: {
    background: chart.white,
    border: `1px solid ${chart.fog}`,
    borderRadius: '4px',
    boxShadow: '0 6px 20px -6px rgba(23, 24, 27, 0.16)',
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: '13px',
    padding: '10px 12px',
  },
  labelStyle: {
    color: chart.slate,
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: '11px',
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    marginBottom: '6px',
  },
  itemStyle: {
    color: chart.ink,
    fontVariantNumeric: 'tabular-nums',
    padding: '1px 0',
  },
  cursor: { fill: chart.paper },
}

/**
 * Recharts pinta el texto de la leyenda con el color de la serie. Cuando la
 * serie es clara (niebla sobre blanco: 1.63:1) el rótulo deja de leerse, así
 * que el texto va siempre en grafito y el color queda solo en el símbolo.
 */
export const legendLabel = (value) => (
  <span style={{ color: chart.graphite }}>{value}</span>
)

export const legend = {
  formatter: legendLabel,
  wrapperStyle: {
    fontFamily: "'IBM Plex Sans', sans-serif",
    fontSize: '13px',
    color: chart.slate,
    paddingTop: '12px',
  },
  iconType: 'plainline',
  iconSize: 12,
}

export default chart
