import { useMemo } from 'react'
import {
  Box,
  ButtonProps,
  Center,
  chakra,
  Flex,
  forwardRef,
  Icon,
  Text,
} from '@chakra-ui/react'

import { BxsMagicWand } from '~assets/icons/BxsMagicWand'
import { BxsWidget } from '~assets/icons/BxsWidget'
import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'

interface EmptyFormPlaceholderProps extends ButtonProps {
  isDraggingOver: boolean
  onClick: () => void
}

export const EmptyFormPlaceholder = forwardRef<
  EmptyFormPlaceholderProps,
  'button'
>(({ isDraggingOver, onClick, ...props }, ref): JSX.Element => {
  const isMobile = useIsMobile()

  const placeholderText = useMemo(() => {
    if (isDraggingOver) {
      return 'Drop your field here'
    }
    return isMobile
      ? 'Tap here to add a field'
      : 'Drag a field from the Builder on the left to start'
  }, [isDraggingOver, isMobile])

  return (
    <Flex
      h="15.75rem"
      m={{ base: 0, lg: '1.625rem' }}
      justifyContent="center"
      position="relative"
    >
      <Button
        bottom="3rem"
        bgColor="secondary.500"
        position="absolute"
        leftIcon={<BxsMagicWand />}
      >
        Try out Magic Form Builder
      </Button>
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
          </Flex>
        </Center>
      </chakra.button>
    </Flex>
  )
})
