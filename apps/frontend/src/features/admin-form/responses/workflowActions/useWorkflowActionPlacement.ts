import { useLayoutEffect, useState } from 'react'

export type ActionLocation = 'top' | 'current' | 'sticky'
type Bounds = Pick<DOMRect, 'top' | 'bottom' | 'left' | 'right'>
type RowBounds = Bounds & Pick<DOMRect, 'width' | 'height'>

export const isRowFullyVisible = (row: RowBounds, bounds: Bounds): boolean =>
  row.width > 0 &&
  row.height > 0 &&
  row.top >= bounds.top &&
  row.bottom <= bounds.bottom &&
  row.left >= bounds.left &&
  row.right <= bounds.right

export const getActionPlacement = (
  topIntersects: boolean,
  topFullyVisible: boolean,
  currentFullyVisible: boolean,
  focusedLocation: ActionLocation | null,
) => ({
  showCurrentActions: !topIntersects || focusedLocation === 'current',
  showStickyActions:
    !(topFullyVisible || currentFullyVisible) || focusedLocation === 'sticky',
})

export const useWorkflowActionPlacement = ({
  root,
  headerInset = 0,
  topRow,
  currentRow,
  focusedLocation,
}: {
  root: HTMLElement | null
  headerInset?: number
  topRow: HTMLElement | null
  currentRow: HTMLElement | null
  focusedLocation: ActionLocation | null
}) => {
  const [placement, setPlacement] = useState({
    showCurrentActions: false,
    showStickyActions: false,
  })
  useLayoutEffect(() => {
    if (!topRow) return
    let frame = 0
    const measure = () => {
      const rootRect = root?.getBoundingClientRect()
      const bounds = {
        top: Math.max(rootRect?.top ?? 0, 0) + headerInset,
        bottom: Math.min(
          rootRect?.bottom ?? window.innerHeight,
          window.innerHeight,
        ),
        left: Math.max(rootRect?.left ?? 0, 0),
        right: Math.min(
          rootRect?.right ?? window.innerWidth,
          window.innerWidth,
        ),
      }
      const top = topRow.getBoundingClientRect()
      const current = currentRow?.getBoundingClientRect()
      const topIntersects =
        top.width > 0 &&
        top.height > 0 &&
        top.bottom > bounds.top &&
        top.top < bounds.bottom
      const next = getActionPlacement(
        topIntersects,
        isRowFullyVisible(top, bounds),
        !!current && isRowFullyVisible(current, bounds),
        focusedLocation,
      )
      setPlacement((old) =>
        old.showCurrentActions === next.showCurrentActions &&
        old.showStickyActions === next.showStickyActions
          ? old
          : next,
      )
    }
    const schedule = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measure)
    }
    measure()
    root?.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(schedule)
        : null
    observer?.observe(topRow)
    if (currentRow) observer?.observe(currentRow)
    if (root) observer?.observe(root)
    return () => {
      cancelAnimationFrame(frame)
      root?.removeEventListener('scroll', schedule)
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', schedule)
      observer?.disconnect()
    }
  }, [root, headerInset, topRow, currentRow, focusedLocation])
  return placement
}
