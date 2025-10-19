// Build a whitespace-separated, lowercased search line for an inventory item
// Includes: item_name, collection, rarityName, optional custom name, optional float (10 dp), optional paint seed
// Extra: collapse multiple spaces and trim; fixed-precision float for reliable token search
export function buildItemSearchLine(item) {
  const parts = [];

  // Item name (always)
  const name = (item?.item_name ?? '').toString().toLowerCase();
  if (name) parts.push(name);

  // Collection (if present)
  const collection = (item?.collection ?? '').toString().toLowerCase();
  if (collection) parts.push(collection);

  // Rarity name (if present)
  const rarity = (item?.rarityName ?? '').toString().toLowerCase();
  if (rarity) parts.push(rarity);

  // Wear name (if present)
  const wearName = (item?.item_wear_name ?? '').toString().toLowerCase();
  if (wearName) parts.push(wearName);

  // Extra: synthesized market-hash style name with parentheses to match inputs like
  // "USP-S | Whiteout (Field-Tested)" when base item_name doesn't include wear in parentheses
  if (name && wearName) {
    parts.push(`${name} (${wearName})`);
  }

  // Custom name (if present and not null/empty)
  // Extra: trim and skip if becomes empty
  const custom = item?.item_customname;
  if (custom != null) {
    const s = custom.toString().trim().toLowerCase();
    if (s) parts.push(s);
  }

  // Float wear value (if valid number) formatted to 10 decimals
  const wearNum = Number(item?.item_paint_wear);
  if (Number.isFinite(wearNum)) {
    parts.push(wearNum.toFixed(10));
  }

  // Paint seed (if present)
  const seed = item?.item_paint_seed;
  if (seed != null && seed !== '') {
    parts.push(String(seed).toLowerCase());
  }

  // Join, collapse multiple spaces, and trim
  return parts.join(' ').replace(/\s+/g, ' ').trim();
}
