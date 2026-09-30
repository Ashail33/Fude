import { chromium } from 'playwright'
const SHOTS = '/tmp/claude-0/-home-user-Fude/dade6edd-d322-5bd8-a247-cff17e733393/scratchpad/shots'
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium' })
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
async function run(id, fn) {
  const page = await (await browser.newContext({ viewport: { width: 390, height: 844 } })).newPage()
  const errs = []
  page.on('console', (m) => { if ((m.type() === 'error' || m.type() === 'warning') && !m.text().includes('CERT')) errs.push(m.text()) })
  page.on('pageerror', (e) => errs.push('PAGEERR ' + e.message))
  await page.goto('http://localhost:5391/#/play/' + id)
  await page.click('.intro button')
  await fn(page)
  console.log(id, errs.slice(0, 5))
}
await Promise.all([
  run('r1-mastery', async (page) => {
    await sleep(9000)
    await page.screenshot({ path: `${SHOTS}/idle-mastery-mid.png` })
    for (let i = 0; i < 60; i++) { if (await page.locator('.sd-field').count() === 0) break; await sleep(1000) }
    await page.screenshot({ path: `${SHOTS}/idle-mastery-end.png` })
  }),
  run('r2-speed', async (page) => {
    await sleep(7200)
    await page.screenshot({ path: `${SHOTS}/idle-speed-hit.png` })
    for (let i = 0; i < 70; i++) { if (await page.locator('.sc-lane').count() === 0) break; await sleep(1000) }
    await page.screenshot({ path: `${SHOTS}/idle-speed-end.png` })
  }),
])
await browser.close()
