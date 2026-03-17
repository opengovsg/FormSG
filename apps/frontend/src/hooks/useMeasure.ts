// from react-use https://github.com/streamich/react-use/blob/master/src/useMeasure.ts
// modified to debounce setRect call prevent rerenders during animation
import { useLayoutEffect, useMemo, useState } from 'react'
import { debounce } from 'lodash'

export type UseMeasureRect = Pick<
  DOMRectReadOnly,
  'x' | 'y' | 'top' | 'left' | 'right' | 'bottom' | 'height' | 'width'
>
export type UseMeasureRef<E extends Element = Element> = (element: E) => void
export type UseMeasureResult<E extends Element = Element> = [
  UseMeasureRef<E>,
  UseMeasureRect,
]

const defaultState: UseMeasureRect = {
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
}

export function useMeasure<E extends Element = Element>(): UseMeasureResult<E> {
  const [element, ref] = useState<E | null>(null)
  const [rect, setRect] = useState<UseMeasureRect>(defaultState)

  const deboucedSetRect = useMemo(() => debounce(setRect, 100), [])

  const observer = useMemo(
    () =>
      new ResizeObserver((entries) => {
        if (entries[0]) {
          const { x, y, width, height, top, left, bottom, right } =
            entries[0].contentRect
          deboucedSetRect({ x, y, width, height, top, left, bottom, right })
        }
      }),
    [deboucedSetRect],
  )

  useLayoutEffect(() => {
    if (!element) return
    observer.observe(element)
    return () => {
      observer.disconnect()
    }
  }, [element, observer])

  return [ref, rect]
}
