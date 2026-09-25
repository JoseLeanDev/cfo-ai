/**
 * Verificación de humo contra un despliegue real.
 *
 * Comprueba lo único que el despliegue puede romper y la build local no: que el
 * sitio se sirva, que el rewrite de `/api` llegue al backend desde el mismo
 * origen, que las rutas profundas devuelvan el index en vez de un 404, y que la
 * aplicación cargue datos autenticados sin errores de consola.
 *
 *   node scripts/smoke.mjs https://qora-fjl4.onrender.com
 */

import { chromium } from 'playwright'

const BASE = (process.argv[2] || 'http://localhost:3001').replace(/\/$/, '')
const EMAIL = process.env.SHOT_EMAIL || 'demo@cfoai.com'
const PASSWORD = process.env.SHOT_PASSWORD || 'demo123'

const resultados = []
const check = (nombre, ok, detalle = '') => {
  resultados.push({ nombre, ok, detalle })
  console.log(`${ok ? '  ok  ' : ' FALLA'}  ${nombre}${detalle ? `  — ${detalle}` : ''}`)
}

const run = async () => {
  console.log(`\nVerificando ${BASE}\n`)

  // 1. El sitio responde y sirve el index.
  const raiz = await fetch(BASE)
  const html = await raiz.text()
  check('El sitio responde', raiz.ok, `HTTP ${raiz.status}`)
  check('Sirve el index de Qora', html.includes('<title>Qora'), 'busca <title>Qora')

  // 2. Ruta profunda: sin el rewrite de la SPA esto sería 404.
  const profunda = await fetch(`${BASE}/tesoreria/cuentas-por-cobrar`)
  const profundaHtml = await profunda.text()
  check(
    'Las rutas profundas devuelven el index',
    profunda.ok && profundaHtml.includes('<div id="root">'),
    `HTTP ${profunda.status}`
  )

  // 3. El rewrite de /api alcanza el backend desde este mismo origen.
  const salud = await fetch(`${BASE}/api/health`)
  let saludJson = null
  try {
    saludJson = await salud.json()
  } catch {
    /* no era JSON */
  }
  check(
    'El rewrite de /api llega al backend',
    salud.ok && saludJson?.status === 'ok',
    saludJson ? JSON.stringify(saludJson).slice(0, 80) : `HTTP ${salud.status}`
  )

  // 4. Autenticación por el mismo origen: si el rewrite fallara, esto daría CORS.
  const login = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  })
  const loginJson = await login.json().catch(() => null)
  const token = loginJson?.data?.token
  check('Login contra el mismo origen', Boolean(token), token ? 'token recibido' : 'sin token')

  if (!token) {
    console.log('\nSin token no se puede verificar la aplicación autenticada.\n')
    process.exit(1)
  }

  // 5. La aplicación carga y pide datos sin errores.
  const browser = await chromium.launch()
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, locale: 'es-GT' })
  await ctx.addInitScript(([t]) => localStorage.setItem('cfo_token', t), [token])
  const page = await ctx.newPage()

  const errores = []
  const apiCruzado = []
  page.on('pageerror', (e) => errores.push(e.message))
  page.on('console', (m) => {
    if (m.type() === 'error') errores.push(m.text().slice(0, 160))
  })
  page.on('request', (r) => {
    const u = r.url()
    if (u.includes('/api/') && !u.startsWith(BASE)) apiCruzado.push(u)
  })

  await page.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(6000)

  const marca = await page.evaluate(
    () => document.querySelector('svg[aria-label="Qora"]') !== null
  )
  check('El wordmark de Qora se renderiza', marca)

  const cifra = await page.evaluate(() => {
    const el = [...document.querySelectorAll('p')].find((p) =>
      /^Q\s?[\d,]{6,}$/.test(p.textContent.trim())
    )
    return el ? el.textContent.trim() : null
  })
  check('El resumen muestra cifras del backend', Boolean(cifra), cifra || 'sin cifra')

  check(
    'Ninguna llamada a /api sale del origen',
    apiCruzado.length === 0,
    apiCruzado[0] || ''
  )

  const fuentes = await page.evaluate(() =>
    [...document.fonts].filter((f) => f.status === 'loaded').map((f) => f.family)
  )
  const familias = [...new Set(fuentes)]
  check(
    'Las tres tipografías de marca cargan',
    ['Archivo', 'IBM Plex Sans', 'IBM Plex Mono'].every((f) => familias.includes(f)),
    familias.join(', ')
  )

  check('Sin errores en consola', errores.length === 0, errores.slice(0, 2).join(' · '))

  await browser.close()

  const fallas = resultados.filter((r) => !r.ok)
  console.log(
    `\n${resultados.length - fallas.length} de ${resultados.length} comprobaciones pasan.\n`
  )
  process.exit(fallas.length ? 1 : 0)
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
