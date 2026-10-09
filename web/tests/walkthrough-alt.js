// A second playthrough that plays badly on purpose, to prove the game cannot get stuck:
// it leaves the room without looking at the desk, makes chapter one's last deductions back in
// Buck's Row, and tries to leave Hanbury Street without the comb the seance needs.
//   node web/tools/walk.mjs alt
export async function run({ log = true } = {}) {
  const game = window.game;
  window.FAST = true;
  window.LOG = [];
  const errors = [];
  const settle = async () => { for (let i = 0; i < 400 && game.running; i++) await new Promise((r) => setTimeout(r, 5)); };
  const expectScene = (id) => { if (game.state.scene !== id) throw new Error(`Esperaba escena ${id}, estoy en ${game.state.scene}`); };
  const act = async (id, item = null, picks = []) => {
    await settle();
    const h = game.activeHotspots().find((x) => x.id === id);
    if (!h) throw new Error(`Hotspot no disponible: ${id} en ${game.state.scene}`);
    window.LOG.push(`### ${game.state.scene}:${id}${item ? ' +' + item : ''}`);
    window.PICKS = [...picks];
    game.selectedItem = item;
    const [x, y, w, hh] = typeof h.rect === 'function' ? h.rect(game.G) : h.rect;
    await game.onClick({ x: x + w / 2 - game.r.cam.x, y: y + hh / 2 }, false);
    await settle();
  };
  const deduce = async (a, b) => { if (!game.tryDeduce(a, b)) throw new Error(`Deducción inválida: ${a} + ${b}`); await game.onNotebookClosed(); await settle(); };
  const need = (cond, msg) => { if (!cond) throw new Error(msg); };
  try {
    game.inMenu = false; game.ui.hideMenu();
    game.state = (await import('../src/engine/game.js')).freshState();
    await game.startChapter('prologue'); await settle();
    await act('boat'); await act('water', null, [0]); await settle();
    need(game.state.flags.answered1866, 'El niño contestó');
    expectScene('room');
    // only what the door asks for: no desk
    await act('coat'); await act('boots'); await act('lantern');
    need(game.G.has('placa') && game.G.has('penique'), 'El abrigo debería llevar la placa y el penique');
    await act('door'); expectScene('bucks_row');
    await act('pike', null, [0]); await act('pike', null, [0]); await act('pike', null, [1]);
    if (!game.state.flags.knackers_lead) await act('pike', null, [0]);
    await act('west'); expectScene('knackers');
    await act('brennan', null, [2]); if (!game.G.hasClue('brennan_zurdo')) await act('brennan', null, [1]);
    await act('wren', null, [1]); await act('wren', 'penique');   // not now; then the penny offered to her
    need(game.G.has('bisturi'), 'Falta el bisturí');
    // back to Buck's Row, and the deductions are made there
    await act('east'); expectScene('bucks_row');
    await deduce('brennan_zurdo', 'zurdo'); await deduce('bisturi', 'anatomia');
    need(/desolladero/.test(game.state.objective || ''), 'Tras deducir en Buck\'s Row el objetivo debería mandar al desolladero');
    await act('west'); await settle();
    for (let i = 0; i < 200 && game.state.scene !== 'hanbury'; i++) await new Promise((r) => setTimeout(r, 20));
    expectScene('hanbury');
    // try to leave without the comb
    await act('greaves', null, [0]); await act('apron');
    await act('passage');
    expectScene('hanbury');
    need(/valla/.test(game.state.objective || ''), 'Sin el peine, el objetivo debería señalar la valla');
    await act('comb', null, [1]);
    await act('passage'); expectScene('seance');
    need(game.G.has('peine'), 'Hay que llegar a la sesión con el peine');
  } catch (e) { errors.push(`FALLO: ${e.message}`); } finally { window.FAST = false; }
  const result = { ok: errors.length === 0, errors, scene: game.state.scene, lines: window.LOG.length, deductions: game.state.deductions.length };
  if (log) console.log(result);
  return result;
}
