import { FC, useLayoutEffect, useMemo, useRef } from 'react'
import { Box, useMergeRefs, useOutsideClick } from '@chakra-ui/react'
import {
  autoUpdate,
  flip,
  hide,
  Middleware,
  offset,
  size,
  useFloating,
} from '@floating-ui/react-dom-interactions'

import { useSelectContext } from '~components/Dropdown/SelectContext'

import { SelectPopoverContext } from './SelectPopoverContext'

export const SelectPopoverProvider: FC = ({ children }): JSX.Element => {
  const { styles, setIsFocused, isOpen } = useSelectContext()

  const wrapperRef = useRef<HTMLDivElement | null>(null)

  // Custom hide middleware that ensures dropdown options are hidden correctly
  // by the sliding MiniHeader in public form pages.
  const hideWhenCoveredByHeader: Middleware = {
    name: 'hideWhenCoveredByHeader',
    fn(state) {
      const { reference } = state.elements
      const { ownerDocument } = reference as Element
      const { x, y, height } = reference.getBoundingClientRect()
      // Get className of all elements that cover the bottom-left corner of the combobox
      const elementsClassName = ownerDocument
        .elementsFromPoint(x, y + height)
        .map((e: Element) => e.className)
      return {
        data: {
          isCovered: elementsClassName.includes('chakra-slide'),
        },
      }
    },
  }

  const { x, y, refs, reference, floating, strategy, update, middlewareData } =
    useFloating({
      placement: 'bottom-start',
      strategy: 'absolute',
      open: isOpen,
      middleware: [
        // offset middleware should be the first middleware
        offset(1),
        flip(),
        hide(),
        hideWhenCoveredByHeader,
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

  const mergedReferenceRefs = useMergeRefs(reference, wrapperRef)

  const { referenceHidden } = middlewareData.hide || {}
  const { isCovered } = middlewareData.hideWhenCoveredByHeader || {}

  const floatingStyles = useMemo(
    () => ({
      visibility: referenceHidden || isCovered ? 'hidden' : 'visible',
      position: strategy,
      top: y ?? 0,
      left: x ?? 0,
    }),
    [referenceHidden, isCovered, strategy, x, y],
  )

  // Allows
  useLayoutEffect(() => {
    if (isOpen && refs.reference.current && refs.floating.current) {
      return autoUpdate(refs.reference.current, refs.floating.current, update)
    }
  }, [isOpen, update, refs.floating, refs.reference])

  useOutsideClick({
    ref: wrapperRef,
    handler: () => setIsFocused(false),
  })

  return (
    <SelectPopoverContext.Provider
      value={{
        floatingRef: floating,
        floatingStyles,
      }}
    >
      <Box ref={mergedReferenceRefs} sx={styles.container}>
        {children}
      </Box>
    </SelectPopoverContext.Provider>
  )
}
