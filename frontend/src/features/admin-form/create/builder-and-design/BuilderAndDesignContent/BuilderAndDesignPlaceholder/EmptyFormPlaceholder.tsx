import { useMemo } from 'react'
import {
  Box,
  ButtonProps,
  Center,
  chakra,
  Flex,
  forwardRef,
  Icon,
  shouldForwardProp,
  Text,
} from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'
import { isValidMotionProp, motion } from 'framer-motion'

import { featureFlags } from '~shared/constants'

import { BxsMagicWand } from '~assets/icons/BxsMagicWand'
import { BxsWidget } from '~assets/icons/BxsWidget'
import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'

import { useAdminForm } from '~features/admin-form/common/queries'
import { useUser } from '~features/user/queries'

const ChakraBox = chakra(motion.div, {
  /**
   * Allow motion props and non-Chakra props to be forwarded.
   */
  shouldForwardProp: (prop) =>
    isValidMotionProp(prop) || shouldForwardProp(prop),
})

interface EmptyFormPlaceholderProps extends ButtonProps {
  isDraggingOver: boolean
  onClick: () => void
  handleOpenMagicFormBuilderModal: () => void
}

export const EmptyFormPlaceholder = forwardRef<
  EmptyFormPlaceholderProps,
  'button'
>(
  (
    { isDraggingOver, onClick, handleOpenMagicFormBuilderModal, ...props },
    ref,
  ): JSX.Element => {
    const isMobile = useIsMobile()

    const placeholderText = useMemo(() => {
      if (isDraggingOver) {
        return 'Drop your field here'
      }
      return isMobile
        ? 'Tap here to add a field'
        : 'Drag a field from the Builder on the left to start'
    }, [isDraggingOver, isMobile])

    const { user } = useUser()
    const { data: form } = useAdminForm()

    const isMrf = form?.responseMode === 'multirespondent'

    const showMagicFormButton =
      useFeatureIsOn(featureFlags.magicFormBuilder) &&
      user?.betaFlags?.mfb &&
      !isMrf

    const showMagicFormButtonFinal = useMemo(() => {
      return showMagicFormButton ? (
        <Button
          leftIcon={<BxsMagicWand />}
          onClick={handleOpenMagicFormBuilderModal}
        >
          Try out Magic Form Builder
        </Button>
      ) : (
        <></>
      )
    }, [handleOpenMagicFormBuilderModal, showMagicFormButton])

    const showOrLine = useMemo(() => {
      return showMagicFormButton ? (
        <>
          <Box flexGrow={1} height="1px" bgColor="black" />
          <Text
            textStyle="subhead-2"
            color="secondary.500"
            px="1.5rem"
            textAlign={'center'}
          >
            OR
          </Text>
          <Box flexGrow={1} height="1px" bgColor="black" />
        </>
      ) : (
        <></>
      )
    }, [showMagicFormButton])

    return (
      <Flex
        h="15.75rem"
        m={{ base: 0, lg: '1.625rem' }}
        justifyContent="center"
        position="relative"
      >
        <ChakraBox
          position="absolute"
          bottom="3rem"
          animate={{
            scale: [1, 1, 1, 1, 1],
            rotate: [0, 1, -1, 1, 0],
          }}
          transition={{
            duration: '0.5',
            ease: 'easeInOut',
            repeat: 3,
            repeatType: 'loop',
          }}
          display="flex"
          justifyContent="center"
          alignItems="center"
        >
          {showMagicFormButtonFinal}
        </ChakraBox>
        <chakra.button
          _hover={{
            bg: 'primary.200',
          }}
          _focus={{
            boxShadow: '0 0 0 2px var(--chakra-colors-neutral-500)',
          }}
          h="100%"
          w="100%"
          border="1px dashed"
          borderColor={isDraggingOver ? 'primary.700' : 'secondary.300'}
          borderRadius="4px"
          bg="neutral.100"
          transitionProperty="common"
          transitionDuration="normal"
          onClick={onClick}
          {...props}
          ref={ref}
        >
          <Center flexDir="column" gap={'0.75rem'} pb="3rem">
            <Icon
              as={BxsWidget}
              __css={{ color: 'secondary.500', fontSize: '1.5rem' }}
            />
            <Text
              textStyle="subhead-2"
              color="secondary.500"
              px="1.5rem"
              textAlign={'center'}
            >
              {placeholderText}
            </Text>
            <Flex
              width="100%"
              maxW={isMobile ? '12rem' : '18rem'}
              flexDir="row"
              alignItems="center"
              justifyContent="space-around"
              verticalAlign="middle"
            >
              {showOrLine}
            </Flex>
          </Center>
        </chakra.button>
      </Flex>
    )
  },
)
