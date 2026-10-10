// A buzz in the hand for the hard moments (the phone build): stings, the heart, a train shaking the
// arches. Off with the Vibration option, and silent wherever the device cannot vibrate.
import { prefs } from './prefs.js';

let last = 0;

export function buzz(pattern) {
  if (!prefs.vibrate || typeof navigator === 'undefined' || !navigator.vibrate) return;
  // browsers refuse (and complain) before the first touch: wait for it
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;
  const now = Date.now();
  if (now - last < 120) return;   // a burst of hits is felt as one
  last = now;
  try { navigator.vibrate(pattern); } catch { /* not allowed here */ }
}
