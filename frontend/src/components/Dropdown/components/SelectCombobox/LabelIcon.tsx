import { As, Icon, InputLeftElement } from '@chakra-ui/react'

import { useSelectContext } from '../../SelectContext'

export interface LabelIconProps {
  icon: As
}

export const LabelIcon = ({ icon }: LabelIconProps): JSX.Element | null => {
  const { styles, isDisabled } = useSelectContext()

  return (
    <InputLeftElement pointerEvents="none">
      <Icon sx={styles.icon} as={icon} aria-disabled={isDisabled} />
    </InputLeftElement>
  )
}

// So input group knows to add right padding to the inner input.
LabelIcon.id = InputLeftElement.id
