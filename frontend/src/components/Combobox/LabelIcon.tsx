import { As, Icon, InputLeftElement, useStyles } from '@chakra-ui/react'

export interface LabelIconProps {
  icon: As
}

export const LabelIcon = ({ icon }: LabelIconProps): JSX.Element => {
  const styles = useStyles()
  return (
    <InputLeftElement pointerEvents="none">
      <Icon __css={styles.icon} as={icon} />
    </InputLeftElement>
  )
}

// So input group knows to add right padding to the inner input.
LabelIcon.id = InputLeftElement.id
