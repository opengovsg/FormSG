import { useMemo } from 'react'
import { BoxProps, Center, forwardRef, Icon, Text } from '@chakra-ui/react'

import { BxsWidget } from '~assets/icons/BxsWidget'
import { useIsMobile } from '~hooks/useIsMobile'

interface EmptyFormPlaceholderProps extends BoxProps {
  isDraggingOver: boolean
  onClick: () => void
}

export const EmptyFormPlaceholder = forwardRef<
  EmptyFormPlaceholderProps,
  'div'
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
    <Center
      h="13.75rem"
      border="1px dashed"
      borderColor={isDraggingOver ? 'primary.700' : 'secondary.300'}
      borderRadius="4px"
      bgColor={isDraggingOver ? 'primary.200' : 'neutral.100'}
      onClick={onClick}
      {...props}
      ref={ref}
    >
      <Center flexDir="column" gap={'0.75rem'}>
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
      </Center>
    </Center>
  )
})
