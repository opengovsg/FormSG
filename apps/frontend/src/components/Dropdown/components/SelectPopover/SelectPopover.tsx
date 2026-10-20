import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
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

  // Close popover when any scrollable ancestor element scrolls.
  // This prevents the dropdown from appearing above sticky headers or
  // floating elements after the trigger has scrolled out of view.
  useEffect(() => {
    if (!isOpen || !reference.current) return

    const handleScroll = () => {
      setIsFocused(false)
    }

    // Walk up the DOM tree and attach scroll listeners to all scrollable ancestors.
    const cleanups: (() => void)[] = []
    let element: HTMLElement | null = (
      reference.current as HTMLElement
    ).parentElement

    while (element) {
      const { overflow, overflowY } = getComputedStyle(element)
      if (
        ['auto', 'scroll'].some(
          (v) => overflow.includes(v) || overflowY.includes(v),
        )
      ) {
        element.addEventListener('scroll', handleScroll, { passive: true })
        const el = element
        cleanups.push(() => el.removeEventListener('scroll', handleScroll))
      }
      element = element.parentElement
    }

    // Also listen on window for page-level scrolling.
    window.addEventListener('scroll', handleScroll, { passive: true })
    cleanups.push(() => window.removeEventListener('scroll', handleScroll))

    return () => {
      cleanups.forEach((cleanup) => cleanup())
    }
  }, [isOpen, reference, setIsFocused])

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
