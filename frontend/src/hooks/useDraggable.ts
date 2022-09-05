import { RefObject, useRef } from 'react'
import useDraggableScroll from 'use-draggable-scroll'

interface UseDraggableReturn<T extends HTMLElement> {
  ref: RefObject<T>
  onMouseDown: ReturnType<typeof useDraggableScroll>['onMouseDown']
}

export const useDraggable = <
  T extends HTMLElement,
>(): UseDraggableReturn<T> => {
  const ref = useRef<T>(null)

  // horizontal scroll on drag
  const { onMouseDown } = useDraggableScroll(ref)

  return {
    ref,
    onMouseDown,
  }
}
