import { Box, Icon, useMultiStyleConfig } from '@chakra-ui/react'

import { BxCheckAnimated } from '~assets/icons'
import { CHECKBOX_THEME_KEY } from '~theme/components/Checkbox'

interface ItemCheckboxIconProps {
  isChecked?: boolean
}

export const ItemCheckboxIcon = ({
  isChecked,
}: ItemCheckboxIconProps): JSX.Element => {
  const styles = useMultiStyleConfig(CHECKBOX_THEME_KEY, {})

  return (
    <Box
      display="inline-flex"
      alignItems="center"
      justifyContent="center"
      verticalAlign="top"
      userSelect="none"
      flexShrink={0}
      bg="white"
      __css={styles.control}
      data-checked={isChecked || undefined}
    >
      <Icon as={BxCheckAnimated} __css={styles.icon} isChecked={isChecked} />
    </Box>
  )
}
