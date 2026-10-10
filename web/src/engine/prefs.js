// Player preferences, kept apart from the save so a new game never resets them.
const KEY = 'elhuesped.prefs';

export const VOLUMES = [[1, 'Alto'], [0.65, 'Medio'], [0.35, 'Bajo'], [0, 'Silencio']];
export const SPEEDS = [[1, 'Normal'], [0.5, 'Rápido'], [0, 'Instantáneo'], [1.6, 'Lento']];

export const QUALITIES = [['auto', 'Auto'], ['alta', 'Alta'], ['baja', 'Baja']];
export const TOGGLES = [[true, 'Sí'], [false, 'No']];

// seenFast: a line already read once (in any game) comes up whole instead of being typed again
// reduceMotion starts as the system asks (prefers-reduced-motion): shakes and flashes softened
const systemCalm = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
export const prefs = { volume: 1, text: 1, quality: 'auto', vibrate: true, seenFast: true, reduceMotion: systemCalm };
try { Object.assign(prefs, JSON.parse(localStorage.getItem(KEY) || '{}')); } catch { /* storage unavailable */ }

export function savePrefs() {
  try { localStorage.setItem(KEY, JSON.stringify(prefs)); } catch { /* storage unavailable */ }
}

// the next value in a list of [value, label] pairs
export function cycle(list, current) {
  const i = list.findIndex(([v]) => v === current);
  return list[(i + 1) % list.length][0];
}

export const labelOf = (list, v) => (list.find(([x]) => x === v) || list[0])[1];
