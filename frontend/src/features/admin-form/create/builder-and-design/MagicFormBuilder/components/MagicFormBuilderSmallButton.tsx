import { BiSolidMagicWand } from 'react-icons/bi'
import { Button, Icon, Tooltip } from '@chakra-ui/react'

const MagicFormBuilderSmallButton = ({
  isActive,
  onClick,
  ...styleProps
}: { isActive: boolean; onClick: () => void } & React.ComponentProps<
  typeof Button
>) => {
  return (
    <Tooltip openDelay={500} hasArrow label="Create fields with AI">
      <Button
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
      </Button>
    </Tooltip>
  )
}

export default MagicFormBuilderSmallButton
