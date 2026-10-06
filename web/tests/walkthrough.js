// Automated end-to-end playthrough. Run in the browser console on the game page:
//   const t = await import('/tests/walkthrough.js'); await t.run();
// It plays every chapter through the same hotspot/notebook paths a player would use and
// throws on the first step that does not advance the story.

export async function run({ log = true } = {}) {
  const game = window.game;
  window.FAST = true;
  window.LOG = [];
  const errors = [];
  const origError = console.error;
  console.error = (...a) => { errors.push(a.map(String).join(' ')); origError(...a); };

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
  const deduce = async (a, b) => {
    const res = game.tryDeduce(a, b);
    if (!res) throw new Error(`Deducción inválida: ${a} + ${b}`);
    await game.onNotebookClosed();
    await settle();
  };
  const need = (cond, msg) => { if (!cond) throw new Error(msg); };

  try {
    // Prologue
    game.inMenu = false;
    game.ui.hideMenu();
    game.state = (await import('../src/engine/game.js')).freshState();
    await game.startChapter('prologue');
    await settle();
    expectScene('foreshore');
    await act('boat');
    await act('water', null, [1, 0]);
    await settle();

    // Chapter 1
    expectScene('room');
    await act('door');
    need(game.state.scene === 'room', 'No debería poder salir sin abrigo');
    await act('boots'); await act('coat'); await act('lantern'); await act('desk'); await act('laudano');
    await act('mirror'); await act('clock'); await act('photo');
    await act('door');
    expectScene('bucks_row');
    await act('pike', null, [0]);            // doctor -> zurdo, anatomia
    await act('neil'); await act('boy'); await act('tracks'); await act('polly');
    need(game.G.hasClue('cuello'), 'Falta la pista del cuerpo (cuello)');
    await deduce('cuello', 'silencio');
    await deduce('ronda', 'silencio');
    await deduce('zurdo', 'anatomia');
    await deduce('botas', 'huellas');
    await act('pike', null, [0]);            // polly
    await act('pike', null, [1]);            // lead (after polly, notes is index 0)
    if (!game.state.flags.knackers_lead) await act('pike', null, [0]);
    need(game.state.flags.knackers_lead, 'No se obtuvo la pista del desolladero');
    await act('west');
    expectScene('knackers');
    await act('brennan', null, [2]);          // look -> brennan_zurdo
    if (!game.G.hasClue('brennan_zurdo')) await act('brennan', null, [1]);
    need(game.G.hasClue('brennan_zurdo'), 'Falta brennan_zurdo');
    await act('wren');
    await act('bollard', 'penique');
    await act('bollard', null, [0]);
    need(game.G.has('bisturi'), 'Falta el bisturí');
    await act('trough');
    await deduce('brennan_zurdo', 'zurdo');
    await deduce('bisturi', 'anatomia');
    await settle();

    // Chapter 2
    expectScene('hanbury');
    await act('annie');
    need(game.G.hasClue('anillos') && game.G.hasClue('falta'), 'Faltan las pistas del cuerpo de Annie');
    await deduce('anillos', 'falta');
    await act('pike'); await act('greaves', null, [0]); await act('amelia'); await act('apron'); await act('comb', null, [1]); await act('window');
    await deduce('delantal', 'brennan_zurdo');
    await deduce('ordenados', 'anatomia');
    await act('passage');
    expectScene('seance');
    await act('wexley'); await act('mirror'); await act('mirror');
    await act('clock'); await act('raven'); await act('chart');
    await act('table', 'peine');
    need(game.state.flags.seance_done, 'La sesión no terminó');
    await deduce('greaves_sabe', 'alguien_detras');
    await deduce('nat_voz', 'regla');
    await act('wexley', null, [0]);
    await act('door', null, [0, 1]);
    await settle();

    // Chapter 3
    expectScene('room');
    await act('desk');
    need(game.G.hasClue('dedos'), 'Falta la pista de los dedos');
    await act('bed');
    expectScene('mitre');
    await act('watkins', 'placa', [0]);
    await act('watkins', null, [0]); await act('watkins', null, [0]); await act('watkins', null, [0]);
    await act('corner'); await act('morris');
    need(game.G.hasClue('guantes') && game.G.hasClue('marcas'), 'Faltan las pistas del cuerpo de Kate');
    await deduce('guantes', 'rapido'); await deduce('marcas', 'ordenados');
    await deduce('rapido', 'ronda');
    await deduce('testigo', 'trozo');
    await act('east');
    expectScene('goulston');
    await act('doorway', null, [0, 0, 0, 0]);
    await settle();
    for (let i = 0; i < 200 && game.state.scene !== 'room'; i++) await new Promise((r) => setTimeout(r, 20));
    await settle();
    expectScene('room');
    await act('paper'); await act('bed'); await act('photo');
    await deduce('dedos', 'carta');
    await deduce('estuche', 'bisturi');
    await deduce('aqui_estoy', 'nat_voz');
    await act('door');
    await settle();

    // Chapter 4
    expectScene('greaves');
    await act('jars'); await act('chart');
    await act('drawer', 'bisturi');
    await act('cabinet', 'llave', [1]);
    await settle();
    expectScene('foreshore');
    need(game.state.flags.awake, 'No se activó el despertar');
    await act('water');
    need(game.state.scene === 'foreshore', 'El final no debería empezar sin deducciones');
    await deduce('ficha', 'zurdo'); await deduce('ficha', 'bisturi'); await deduce('ficha', 'testigo'); await deduce('ficha', 'expediente');
    await act('outfall');
    await act('water');
    await settle();
    for (let i = 0; i < 400 && !game.inMenu; i++) await new Promise((r) => setTimeout(r, 20));
    need(game.inMenu, 'El juego no volvió al menú al terminar');
  } catch (e) {
    errors.push(`FALLO: ${e.message}`);
  } finally {
    window.FAST = false;
    console.error = origError;
  }
  const result = { ok: errors.length === 0, errors, scene: game.state.scene, sanity: game.state.sanity, lines: window.LOG.length, deductions: game.state.deductions.length };
  if (log) console.log(result);
  return result;
}
