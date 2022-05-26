import { useRef, useState } from 'react'
import { Modifier, usePopper } from 'react-popper'
import { Box, useMergeRefs, useOutsideClick } from '@chakra-ui/react'

import { useSelectContext } from '~components/Dropdown/SelectContext'

import { SelectPopoverContext } from './SelectPopoverContext'

export const matchWidth: Modifier<'matchWidth'> = {
  name: 'matchWidth',
  enabled: true,
  phase: 'beforeWrite',
  requires: ['computeStyles'],
  fn: ({ state }) => {
    state.styles.popper.width = `${state.rects.reference.width}px`
  },
  effect:
    ({ state }) =>
    () => {
      const reference = state.elements.reference as HTMLElement
      state.elements.popper.style.width = `${reference.offsetWidth}px`
    },
}

export const SelectPopoverProvider = ({
  children,
}: {
  children?: React.ReactNode
}): JSX.Element => {
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null)
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null,
  )

  const {
    styles: popperStyles,
    attributes: popperAttributes,
    update,
  } = usePopper(referenceElement, popperElement, {
    placement: 'bottom-start',
    strategy: 'fixed',
    modifiers: [matchWidth],
  })

  const { styles, setIsFocused, isOpen } = useSelectContext()

  const wrapperRef = useRef<HTMLDivElement | null>(null)
  const mergedPopperRefs = useMergeRefs(setReferenceElement, wrapperRef)

  useOutsideClick({
    ref: wrapperRef,
    handler: () => setIsFocused(false),
  })

  return (
    <SelectPopoverContext.Provider
      value={{
        popperRef: isOpen ? setPopperElement : null,
        popperStyles,
        popperAttributes,
        update,
      }}
    >
      <Box ref={mergedPopperRefs} sx={styles.container}>
        {children}
      </Box>
    </SelectPopoverContext.Provider>
  )
}
