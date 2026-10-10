// The signature that turns into another name: the frames the field shows, one per stroke.
// Whatever was written (long, empty, accents, emoji) is first worn down to the target's length,
// then each letter is overwritten in turn. The last frame is always exactly the target.
// Pure, so it is tested without a page (tests/unit/signature.test.mjs).
export function morphFrames(text, target) {
  const cur = [...String(text ?? '')];   // by code point: an emoji is one stroke, not two
  const want = [...target];
  const frames = [];
  while (cur.length > want.length) { cur.pop(); frames.push(cur.join('')); }
  for (let k = 0; k < want.length; k++) {
    cur[k] = want[k];
    frames.push(cur.join(''));
  }
  if (frames[frames.length - 1] !== target) frames.push(target);
  return frames;
}
