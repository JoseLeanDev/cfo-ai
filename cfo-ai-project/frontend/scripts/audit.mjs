/**
 * Auditoría automática: contraste, tamaño mínimo de texto, blancos de
 * accesibilidad y desborde horizontal en móvil.
 *
 *   node scripts/audit.mjs [--width 1440]
 */

import { chromium } from 'playwright'

const BASE = process.env.SHOT_BASE || 'http://localhost:3001'
const EMAIL = process.env.SHOT_EMAIL || 'demo@cfoai.com'
const PASSWORD = process.env.SHOT_PASSWORD || 'demo123'

const args = process.argv.slice(2)
const flag = (n, d) => {
  const i = args.indexOf(`--${n}`)
  return i >= 0 ? args[i + 1] : d
}
const WIDTH = Number(flag('width', 1440))

const ROUTES = [
  '/', '/ventas', '/margenes', '/produccion', '/compras',
  '/compras/historial-ventas', '/gastos-operativos', '/tesoreria',
  '/tesoreria/cuentas-por-cobrar', '/tesoreria/cuentas-por-pagar',
  '/tesoreria/cuentas-bancarias', '/tesoreria/proyecciones',
  '/contabilidad', '/contabilidad/libro-diario', '/contabilidad/conciliacion',
  '/contabilidad/cierre', '/sat', '/analisis', '/reportes', '/asistente', '/agentes',
  '/usuarios',
]

/* Contraste WCAG sobre el color efectivamente pintado. */
const PROBE = () => {
  const lum = (rgb) => {
    const [r, g, b] = rgb.map((v) => {
      const c = v / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    })
    return 0.2126 * r + 0.7152 * g + 0.0722 * b
  }
  const parse = (s) => {
    const m = s.match(/rgba?\(([^)]+)\)/)
    if (!m) return null
    const p = m[1].split(',').map((x) => parseFloat(x))
    return { rgb: p.slice(0, 3), a: p.length > 3 ? p[3] : 1 }
  }
  const over = (fg, bg) => fg.rgb.map((c, i) => c * fg.a + bg[i] * (1 - fg.a))
  const bgOf = (el) => {
    let n = el
    while (n && n !== document.documentElement) {
      const c = parse(getComputedStyle(n).backgroundColor)
      if (c && c.a > 0.95) return c.rgb
      n = n.parentElement
    }
    return [246, 245, 243]
  }

  const problemas = { contraste: [], tamano: [], botonSinNombre: [], imgSinAlt: [] }

  for (const el of document.querySelectorAll('body *')) {
    const cs = getComputedStyle(el)
    if (cs.display === 'none' || cs.visibility === 'hidden' || cs.opacity === '0') continue

    const propio = [...el.childNodes].some(
      (n) => n.nodeType === 3 && n.textContent.trim().length > 1
    )
    if (!propio) continue

    const size = parseFloat(cs.fontSize)
    const peso = parseInt(cs.fontWeight, 10) || 400
    const texto = el.textContent.trim().slice(0, 40)

    if (size < 11) problemas.tamano.push({ size, texto })

    const fg = parse(cs.color)
    if (!fg) continue
    const bg = bgOf(el)
    const c = over(fg, bg)
    const l1 = lum(c)
    const l2 = lum(bg)
    const ratio = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)
    const grande = size >= 24 || (size >= 18.66 && peso >= 700)
    const minimo = grande ? 3 : 4.5
    if (ratio < minimo) {
      problemas.contraste.push({
        ratio: Math.round(ratio * 100) / 100,
        minimo,
        size: Math.round(size),
        color: cs.color,
        texto,
      })
    }
  }

  for (const b of document.querySelectorAll('button, a')) {
    const nombre =
      b.getAttribute('aria-label') || b.getAttribute('title') || b.textContent.trim()
    if (!nombre) problemas.botonSinNombre.push(b.outerHTML.slice(0, 90))
  }
  for (const i of document.querySelectorAll('img')) {
    if (!i.hasAttribute('alt')) problemas.imgSinAlt.push(i.src.slice(0, 70))
  }

  return problemas
}

const run = async () => {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  const token = (await res.json())?.data?.token
  if (!token) throw new Error('sin token')

  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: WIDTH, height: 1000 }, locale: 'es-GT' })
  await ctx.addInitScript(([t]) => localStorage.setItem('cfo_token', t), [token])
  const page = await ctx.newPage()

  const totales = { contraste: 0, tamano: 0, botonSinNombre: 0, imgSinAlt: 0, desborde: 0 }
  const muestras = new Map()

  for (const route of ROUTES) {
    await page.goto(`${BASE}${route}`, { waitUntil: 'domcontentloaded' })
    await page.waitForTimeout(2500)

    const p = await page.evaluate(PROBE)
    const desborde = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth + 1
    )

    totales.contraste += p.contraste.length
    totales.tamano += p.tamano.length
    totales.botonSinNombre += p.botonSinNombre.length
    totales.imgSinAlt += p.imgSinAlt.length
    if (desborde) totales.desborde++

    for (const c of p.contraste) {
      const k = `${c.color} @ ${c.size}px`
      if (!muestras.has(k)) muestras.set(k, { ...c, rutas: new Set() })
      muestras.get(k).rutas.add(route)
    }

    const partes = []
    if (p.contraste.length) partes.push(`contraste ${p.contraste.length}`)
    if (p.tamano.length) partes.push(`texto<11px ${p.tamano.length}`)
    if (p.botonSinNombre.length) partes.push(`control sin nombre ${p.botonSinNombre.length}`)
    if (desborde) partes.push('DESBORDE H')
    console.log(`${route.padEnd(38)} ${partes.length ? partes.join(' · ') : 'ok'}`)
  }

  console.log(`\n— totales @${WIDTH}px —`)
  console.log(totales)

  if (muestras.size) {
    console.log('\n— colores con contraste insuficiente —')
    for (const [k, v] of [...muestras.entries()].sort((a, b) => a[1].ratio - b[1].ratio).slice(0, 12)) {
      console.log(`  ${v.ratio} (min ${v.minimo})  ${k}  «${v.texto}»  ${[...v.rutas].length} rutas`)
    }
  }

  await browser.close()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
