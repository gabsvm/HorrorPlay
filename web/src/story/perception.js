// Sanity, read as perception. Not a punishment and not a clinical measure: how much of Thomas is
// left in front of what is happening, and how loud the other thing is. Three bands:
//   steady   (≥65)  the evidence is clearer; fear is something he reasons about
//   strained (36–64) small distortions: the room answers back, he doubts his own readings
//   frayed   (≤35)  the other side is clearer (its signals, its method), the reading of facts less so
// Measured on a full first reading: about 100 in chapter I, 72 at the start of II, 54 at III, and a
// thorough player reaches the bottom by IV. Every band can finish the game; no door or control
// changes with it; no false clue is ever shown. All the rules live here, so scenes do not invent
// their own. Pure.
export const STEADY = 65, FRAYED = 35;

export function perceptionBand(sanity) {
  const s = typeof sanity === 'number' ? sanity : 100;
  return s >= STEADY ? 'steady' : s <= FRAYED ? 'frayed' : 'strained';
}

// ---------------------------------------------------------------- what a band gives
export const perception = {
  // steady: at a body, what still matters (not yet examined) is marked more clearly
  forensicMarks: (s) => perceptionBand(s) === 'steady',
  // steady: on the beat sheet, the two decisive times are pointed out after one miss, not two
  beatsHelpAfter: (s) => (perceptionBand(s) === 'steady' ? 1 : 2),
  // frayed: the raps' method is plain to him from the start (row, then column): the thing wants it read
  knockHelpStart: (s) => (perceptionBand(s) === 'frayed' ? 1 : 0),
  // frayed: the Ditch's green light shows in still water (signal, never evidence)
  waterGlow: (s) => perceptionBand(s) === 'frayed',

  // ---------------------------------------------------------------- what a band costs
  // strained and frayed: the room answers some clicks with a whisper (sound only, never a block)
  whisperChance: (s) => ({ steady: 0, strained: 0.15, frayed: 0.35 })[perceptionBand(s)],
  // frayed: a plausible explanation is marked as doubted in the notebook (he trusts his reading less)
  doubtTheories: (s) => perceptionBand(s) === 'frayed',
  // frayed: people notice (one line from whoever is there)
  othersNotice: (s) => perceptionBand(s) === 'frayed',
};
