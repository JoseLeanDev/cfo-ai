/**
 * Captura de pantallas para revisión de diseño.
 *
 * Inicia sesión una vez contra el backend, inyecta el token y recorre todas las
 * rutas. Uso:
 *   node scripts/shots.mjs [--out dir] [--width 1440] [--only ruta,ruta]
 */

import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import path from 'node:path'

const BASE = process.env.SHOT_BASE || 'http://localhost:3001'
const EMAIL = process.env.SHOT_EMAIL || 'demo@cfoai.com'
const PASSWORD = process.env.SHOT_PASSWORD || 'demo123'

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const i = args.indexOf(`--${name}`)
  return i >= 0 ? args[i + 1] : fallback
}

const OUT = flag('out', 'shots')
const WIDTH = Number(flag('width', 1440))
const HEIGHT = Number(flag('height', 1000))
const ONLY = flag('only', null)

const ROUTES = [
  ['login', '/login'],
  ['resumen', '/'],
  ['ventas', '/ventas'],
  ['margenes', '/margenes'],
  ['produccion', '/produccion'],
  ['compras', '/compras'],
  ['historial-ventas', '/compras/historial-ventas'],
  ['gastos-operativos', '/gastos-operativos'],
  ['tesoreria', '/tesoreria'],
  ['cxc', '/tesoreria/cuentas-por-cobrar'],
  ['cxp', '/tesoreria/cuentas-por-pagar'],
  ['cuentas-bancarias', '/tesoreria/cuentas-bancarias'],
  ['proyecciones', '/tesoreria/proyecciones'],
  ['contabilidad', '/contabilidad'],
  ['libro-diario', '/contabilidad/libro-diario'],
  ['cierre', '/contabilidad/cierre'],
  ['sat', '/sat'],
  ['analisis', '/analisis'],
  ['reportes', '/reportes'],
  ['asistente', '/asistente'],
  ['agentes', '/agentes'],
  ['usuarios', '/usuarios'],
]

const run = async () => {
  await mkdir(OUT, { recursive: true })

  // Token real del backend: las páginas consultan endpoints autenticados.
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  const body = await res.json()
  const token = body?.data?.token
  if (!token) throw new Error(`No se obtuvo token: ${JSON.stringify(body).slice(0, 200)}`)

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: { width: WIDTH, height: HEIGHT },
    deviceScaleFactor: 1,
    locale: 'es-GT',
  })
  await context.addInitScript(
    ([t]) => window.localStorage.setItem('cfo_token', t),
    [token]
  )

  const page = await context.newPage()
  const errores = []
  page.on('pageerror', (e) => errores.push(`[pageerror] ${e.message}`))
  page.on('console', (m) => {
    if (m.type() === 'error') errores.push(`[console] ${m.text().slice(0, 200)}`)
  })

  const targets = ONLY
    ? ROUTES.filter(([name, route]) => ONLY.split(',').some((o) => name === o || route === o))
    : ROUTES

  for (const [name, route] of targets) {
    errores.length = 0
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' })
    // Las gráficas de recharts miden el contenedor tras el primer layout.
    await page.waitForLoadState('load').catch(() => {})
    await page.waitForTimeout(4500)
    await page.screenshot({
      path: path.join(OUT, `${name}.png`),
      fullPage: true,
    })
    const alto = await page.evaluate(() => document.body.scrollHeight)
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    )
    console.log(
      `${name.padEnd(20)} ${String(alto).padStart(6)}px${overflow ? '  ⚠ desborde horizontal' : ''}` +
        (errores.length ? `\n    ${errores.slice(0, 3).join('\n    ')}` : '')
    )
  }

  await browser.close()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
