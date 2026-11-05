// Run from the checkout root with both web servers running and playwright-core installed.
import { chromium } from 'playwright-core';
import { mkdir } from 'node:fs/promises';

const browser = await chromium.launch({ channel: 'chrome', headless: true,
  args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
try {
  for (const [name, port] of [['antes', 5317], ['despues', 5318]]) {
    const dir = 'out/' + name;
    await mkdir(dir, { recursive: true });
    const page = await browser.newPage({ viewport: { width: 960, height: 540 } });
    const errors = [];
    page.on('pageerror', e => errors.push(String(e)));
    await page.goto('http://127.0.0.1:' + port + '/?scene=bucks_row&x=950&noenter=1&flags=br_intro');
    await page.waitForFunction(() => window.game?.scene?.id === 'bucks_row' &&
      game.player.model?.ready && game.actor('Chico')?.model?.ready);
    await page.clock.install();
    await page.clock.pauseAt(new Date(Date.now() + 1500));
    for (let frame = 0; frame < 105; frame++) {
      if (frame === 8) await page.evaluate(() => {
        const track = game.scene.hotspots.find(h => h.id === 'tracks');
        void game.onClick({ x: 0, y: 0 }, false, track);
      });
      if (frame === 75 || frame === 82 || frame === 94 || frame === 99) {
        await page.evaluate(() => { if (game.ui._advance) game.ui.advance(); });
      }
      await page.clock.runFor(100);
      await page.screenshot({ path: dir + '/' + String(frame).padStart(4, '0') + '.png' });
    }
    const result = await page.evaluate(() => ({ errors: game.scriptErrors || [], clue: game.G.hasClue('huellas') }));
    if (errors.length || result.errors.length || !result.clue) throw Error(JSON.stringify({ name, errors, result }));
    await page.close();
  }
} finally {
  await browser.close();
}
