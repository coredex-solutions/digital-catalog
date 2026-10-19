/**
 * After a "Move up"/"Move down" click, the row may reach the top or bottom, which disables the
 * button that has keyboard focus (and the browser drops focus to the page). Hand focus to the
 * row's other move button instead. Buttons carry data-move={rowId} and data-dir="up"|"down".
 */
export function keepFocusOnRow(rowId: string, newIndex: number, length: number, delta: -1 | 1) {
  const reachedEnd = (delta === -1 && newIndex === 0) || (delta === 1 && newIndex === length - 1);
  if (!reachedEnd) return;
  const other = delta === -1 ? "down" : "up";
  requestAnimationFrame(() => {
    document.querySelector<HTMLButtonElement>(`[data-move="${CSS.escape(rowId)}"][data-dir="${other}"]`)?.focus();
  });
}
