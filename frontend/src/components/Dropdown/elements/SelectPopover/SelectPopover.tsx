import { FC, useState } from 'react'
import { usePopper } from 'react-popper'
import { Box } from '@chakra-ui/react'

import { useSelectContext } from '~components/Dropdown/SelectContext'

import { SelectPopoverContext } from './SelectPopoverContext'

export const SelectPopoverProvider: FC = ({ children }): JSX.Element => {
  const [referenceElement, setReferenceElement] =
    useState<HTMLDivElement | null>(null)
  const [popperElement, setPopperElement] = useState<HTMLDivElement | null>(
    null,
  )
  const {
    styles: popperStyles,
    attributes: popperAttributes,
    update,
  } = usePopper(referenceElement, popperElement, { placement: 'bottom-start' })

  const { styles } = useSelectContext()

  return (
    <SelectPopoverContext.Provider
      value={{
        popperRef: setPopperElement,
        popperStyles,
        popperAttributes,
        update,
      }}
    >
      <Box ref={setReferenceElement} sx={styles.container}>
        {children}
      </Box>
    </SelectPopoverContext.Provider>
  )
}
