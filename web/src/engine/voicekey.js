// Which recording belongs to a line: the speaker as the cast knows them and the Spanish text, hashed.
// Shared by the game and by tools/voices (the script extractor), so a line edited in the source simply
// stops matching its old take and is spoken again only once it is re-recorded.

export function speakerOf(name, style) {
  if (style === 'thought') return 'Ashgrove';
  if (style === 'voice') return name ? `${name} (trance)` : 'La voz';
  if (name === 'Thomas') return 'Ashgrove';
  return name || 'Ashgrove';
}

export function plainOf(text) {
  return String(text).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
}

export function lineKey(name, style, text) {
  const s = `${speakerOf(name, style)}|${plainOf(text)}`;
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 0x01000193) >>> 0; }
  return h.toString(16).padStart(8, '0');
}
