import { BoxProps, Center, forwardRef, Icon, Text } from '@chakra-ui/react'

import { BxsWidget } from '~assets/icons/BxsWidget'

interface EmptyFormPlaceholderProps extends BoxProps {
  isDraggingOver: boolean
}

export const EmptyFormPlaceholder = forwardRef<
  EmptyFormPlaceholderProps,
  'div'
>(({ isDraggingOver, ...props }, ref): JSX.Element => {
  return (
    <Center
      h="13.75rem"
      border="1px dashed"
      borderColor={isDraggingOver ? 'primary.700' : 'secondary.300'}
      borderRadius="4px"
      bgColor={isDraggingOver ? 'primary.200' : 'neutral.100'}
      {...props}
      ref={ref}
    >
      <Center flexDir="column" gap={'0.75rem'}>
        <Icon
          as={BxsWidget}
          __css={{ color: 'secondary.500', fontSize: '1.5rem' }}
        />
        <Text textStyle="subhead-2" color="secondary.500">
          Drag a field from the Builder on the left to start
        </Text>
      </Center>
    </Center>
  )
})
