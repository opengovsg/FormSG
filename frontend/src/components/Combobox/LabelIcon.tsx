import { As, Icon, InputLeftElement, SystemStyleObject } from '@chakra-ui/react'

export interface LabelIconProps {
  icon: As
  sx: SystemStyleObject
  isDisabled?: boolean
}

export const LabelIcon = ({
  icon,
  sx,
  isDisabled,
}: LabelIconProps): JSX.Element => {
  // Cannot use useStyles as this component is nested in an InputGroup,
  // and the styles from InputGroup will be used instead.
  return (
    <InputLeftElement pointerEvents="none">
      <Icon sx={sx} as={icon} aria-disabled={isDisabled} />
    </InputLeftElement>
  )
}

// So input group knows to add right padding to the inner input.
LabelIcon.id = InputLeftElement.id
