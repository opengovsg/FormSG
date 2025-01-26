import { forwardRef } from 'react'
import { BiSolidMagicWand } from 'react-icons/bi'
import { Box, Button, Flex, Icon, Text, Tooltip } from '@chakra-ui/react'

const MagicFormBuilderSmallButton = forwardRef(
  (
    {
      isActive,
      onClick,
      ...styleProps
    }: { isActive: boolean; onClick: () => void } & React.ComponentProps<
      typeof Button
    >,
    ref,
  ) => {
    return (
      <Tooltip openDelay={500} hasArrow label="Create fields with AI">
        <Button
          flexDirection="row"
          justifyContent="center"
          alignItems="center"
          ref={ref} // Rationale: forward ref allows the popover placement to work.
          variant="outline"
          onClick={onClick}
          padding="0"
          borderColor="primary.200"
          backgroundColor={isActive ? 'primary.200' : undefined}
          _hover={{
            backgroundColor: 'primary.200',
          }}
          borderWidth="1px"
          {...styleProps}
        >
          <Icon as={BiSolidMagicWand} color="primary.500" fontSize="1.5rem" />
          <Text mr="0.25rem" fontSize="0.75rem">
            AI
          </Text>
        </Button>
      </Tooltip>
    )
  },
)

export default MagicFormBuilderSmallButton
