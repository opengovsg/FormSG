import { RefObject, useCallback, useEffect, useRef, useState } from 'react'

const DEFAULT_OVERSCAN = 2

export interface ColumnWindow {
  /** First column to render. */
  startIndex: number
  /** One past the last column to render. */
  endIndex: number
  /** Width standing in for the columns before startIndex. */
  paddingLeft: number
  /** Width standing in for the columns after endIndex. */
  paddingRight: number
}

export const EMPTY_COLUMN_WINDOW: ColumnWindow = {
  startIndex: 0,
  endIndex: 0,
  paddingLeft: 0,
  paddingRight: 0,
}

/**
 * Which columns fall inside the horizontal viewport. Widths vary per column, so
 * this walks them rather than dividing as the row window can.
 */
export const computeColumnWindow = ({
  columnWidths,
  scrollLeft,
  viewportWidth,
  overscan = DEFAULT_OVERSCAN,
}: {
  columnWidths: number[]
  scrollLeft: number
  viewportWidth: number
  overscan?: number
}): ColumnWindow => {
  if (columnWidths.length === 0 || viewportWidth <= 0) {
    return EMPTY_COLUMN_WINDOW
  }

  const viewportRight = scrollLeft + viewportWidth

  let offset = 0
  let firstVisible = columnWidths.length
  let lastVisible = 0

  columnWidths.forEach((width, index) => {
    const right = offset + width
    if (right > scrollLeft && offset < viewportRight) {
      firstVisible = Math.min(firstVisible, index)
      lastVisible = Math.max(lastVisible, index)
    }
    offset = right
  })

  // Scrolled clear of every column, which a stale width can produce.
  if (firstVisible === columnWidths.length) return EMPTY_COLUMN_WINDOW

  const startIndex = Math.max(0, firstVisible - overscan)
  const endIndex = Math.min(columnWidths.length, lastVisible + 1 + overscan)

  const sum = (from: number, to: number) =>
    columnWidths.slice(from, to).reduce((total, width) => total + width, 0)

  return {
    startIndex,
    endIndex,
    paddingLeft: sum(0, startIndex),
    paddingRight: sum(endIndex, columnWidths.length),
  }
}

/**
 * The table scrolls sideways inside a Box, not the page, so this finds the
 * nearest ancestor that both may scroll horizontally and does.
 */
const getHorizontalScrollParent = (
  node: HTMLElement | null,
): HTMLElement | null => {
  for (let el = node?.parentElement; el; el = el.parentElement) {
    const { overflowX } = window.getComputedStyle(el)
    const mayScroll = overflowX === 'auto' || overflowX === 'scroll'
    if (mayScroll && el.scrollWidth > el.clientWidth) return el
  }
  return null
}

/**
 * Renders only the columns in view, with spacers standing in for the rest, so a
 * form with two hundred fields costs a row the same as a form with six.
 */
export const useColumnVirtualizer = <T extends HTMLElement>({
  columnWidths,
  enabled,
  overscan,
}: {
  columnWidths: number[]
  enabled: boolean
  overscan?: number
}): { tableRef: RefObject<T>; columnWindow: ColumnWindow } => {
  const tableRef = useRef<T>(null)
  const scrollParentRef = useRef<HTMLElement | null>(null)
  const frameRef = useRef<number>()
  const [columnWindow, setColumnWindow] =
    useState<ColumnWindow>(EMPTY_COLUMN_WINDOW)

  const measure = useCallback(() => {
    const table = tableRef.current
    if (!table) return

    // Resolved here rather than on mount: until the columns render there is
    // nothing wide enough to scroll, and so no scrolling ancestor to find.
    if (!scrollParentRef.current) {
      scrollParentRef.current = getHorizontalScrollParent(table)
    }
    const scrollParent = scrollParentRef.current

    const next = computeColumnWindow({
      columnWidths,
      scrollLeft: scrollParent?.scrollLeft ?? 0,
      viewportWidth: scrollParent?.clientWidth ?? window.innerWidth,
      overscan,
    })

    setColumnWindow((current) =>
      current.startIndex === next.startIndex &&
      current.endIndex === next.endIndex &&
      current.paddingLeft === next.paddingLeft &&
      current.paddingRight === next.paddingRight
        ? current
        : next,
    )
  }, [columnWidths, overscan])

  // Scrolling fires faster than it can paint, and measuring reads layout.
  const onScroll = useCallback(() => {
    if (frameRef.current !== undefined) return
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = undefined
      measure()
    })
  }, [measure])

  useEffect(() => {
    if (!enabled) {
      setColumnWindow(EMPTY_COLUMN_WINDOW)
      return
    }

    measure()
    // Scroll does not bubble, but it is dispatched through the capture phase,
    // so this hears whichever ancestor turns out to be the scroller.
    document.addEventListener('scroll', onScroll, {
      capture: true,
      passive: true,
    })
    window.addEventListener('resize', onScroll)
    return () => {
      if (frameRef.current !== undefined) cancelAnimationFrame(frameRef.current)
      frameRef.current = undefined
      document.removeEventListener('scroll', onScroll, { capture: true })
      window.removeEventListener('resize', onScroll)
    }
  }, [enabled, measure, onScroll])

  return { tableRef, columnWindow }
}
