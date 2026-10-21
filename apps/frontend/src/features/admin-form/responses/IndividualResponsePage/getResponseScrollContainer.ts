export const getResponseScrollContainer = (
  element: HTMLElement | null,
): HTMLElement | null => {
  let root = element?.parentElement ?? null
  while (root && !/(auto|scroll)/.test(getComputedStyle(root).overflowY)) {
    root = root.parentElement
  }
  return root
}
