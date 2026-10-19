/**
 * New display_order values for a list the owner put in a new order. The positions the rows
 * already had are reused, so moving one dish up only changes the two rows that swapped places
 * (and the "unpublished changes" list stays short). Rows that shared a position are numbered
 * 0, 1, 2… instead. Returns only the rows whose position actually changes.
 *
 * `ids` must contain every row of the list exactly once; returns null when it doesn't (the list
 * changed in another tab, or the request is malformed).
 */
export function planReorder(ids: unknown, current: Map<string, number>): [string, number][] | null {
  if (!Array.isArray(ids) || ids.length !== current.size) return null;
  if (!ids.every((id) => typeof id === "string" && current.has(id))) return null;
  if (new Set(ids).size !== ids.length) return null;

  const positions = [...current.values()].sort((a, b) => a - b);
  const slots = new Set(positions).size === positions.length ? positions : positions.map((_, i) => i);
  return (ids as string[])
    .map((id, i) => [id, slots[i]] as [string, number])
    .filter(([id, position]) => current.get(id) !== position);
}
