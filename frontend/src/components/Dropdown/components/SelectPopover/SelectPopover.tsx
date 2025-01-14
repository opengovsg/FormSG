import { useLayoutEffect, useMemo, useRef } from 'react'
import { Box, useMergeRefs, useOutsideClick } from '@chakra-ui/react'
import {
  autoUpdate,
  flip,
  hide,
  offset,
  size,
  useFloating,
} from '@floating-ui/react'

import type { FCC } from '~typings/react'

import { useSelectContext } from '../../SelectContext'

import { SelectPopoverContext } from './SelectPopoverContext'

export const SelectPopoverProvider: FCC = ({ children }): JSX.Element => {
  const { setIsFocused, isOpen } = useSelectContext()

  const wrapperRef = useRef<HTMLDivElement | null>(null)

  const {
    x,
    y,
    refs: { reference, floating, setFloating, setReference },
    strategy,
    update,
  } = useFloating({
    placement: 'bottom-start',
    strategy: 'absolute',
    open: isOpen,
    middleware: [
      // offset middleware should be the first middleware
      offset(1),
      flip(),
      hide(),
      // Set width to be the same as the reference element.
      // @ts-expect-error type mismatch for some reason.
      size({
        apply({ rects, elements }) {
          Object.assign(elements.floating.style, {
            width: `${rects.reference.width}px`,
          })
        },
      }),
    ],
  })

  const mergedReferenceRefs = useMergeRefs(wrapperRef, setReference)

  const floatingStyles = useMemo(
    () => ({
      position: strategy,
      top: y ?? 0,
      left: x ?? 0,
    }),
    [strategy, x, y],
  )

  useLayoutEffect(() => {
    if (isOpen && reference.current && floating.current) {
      return autoUpdate(reference.current, floating.current, update)
    }
  }, [floating, isOpen, reference, update])

  useOutsideClick({
    ref: wrapperRef,
    handler: () => setIsFocused(false),
  })

  return (
    <SelectPopoverContext.Provider
      value={{
        floatingRef: setFloating,
        floatingStyles,
      }}
    >
      <Box ref={mergedReferenceRefs}>{children}</Box>
    </SelectPopoverContext.Provider>
  )
}
