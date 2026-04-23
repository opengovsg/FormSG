import { useTranslation } from 'react-i18next'
import { Box, Flex, Portal, Text } from '@chakra-ui/react'

// Sit above page-level sticky chrome (sticky = 1100, banner = 1200, overlay = 1300)
// but below Chakra modals (modal = 1400) so an opened modal still sits on top.
const FRAME_Z_INDEX = 1350
const FRAME_THICKNESS = '6px'
const FRAME_COLOR = 'warning.500'

export const UseTemplateFrame = (): JSX.Element => {
  const { t } = useTranslation()
  return (
    <Portal>
      <Box
        aria-hidden
        position="fixed"
        inset={0}
        pointerEvents="none"
        borderWidth={FRAME_THICKNESS}
        borderStyle="solid"
        borderColor={FRAME_COLOR}
        zIndex={FRAME_Z_INDEX}
      >
        <Flex
          position="absolute"
          top={`-${FRAME_THICKNESS}`}
          left="50%"
          transform="translateX(-50%)"
          bg={FRAME_COLOR}
          color="secondary.700"
          px="1.5rem"
          py="0.75rem"
          borderTopRadius={0}
          borderBottomRadius="0.375rem"
        >
          <Text textStyle="subhead-1" fontWeight="bold" letterSpacing="0.15em">
            {t('features.adminForm.template.previewLabel').toUpperCase()}
          </Text>
        </Flex>
      </Box>
    </Portal>
  )
}
