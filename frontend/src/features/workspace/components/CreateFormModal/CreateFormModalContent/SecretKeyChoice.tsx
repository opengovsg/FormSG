import { MouseEventHandler } from 'react'
import { IconType } from 'react-icons/lib'
import { Icon, Stack, StackProps, Text } from '@chakra-ui/react'

import Button from '~components/Button'

interface SecretKeyChoiceProps extends StackProps {
  icon: IconType
  actionTitle: React.ReactNode
  description: string
  onActionClick?: MouseEventHandler<HTMLButtonElement>
}

export const SecretKeyChoice = ({
  icon,
  actionTitle,
  description,
  onActionClick,
  ...props
}: SecretKeyChoiceProps) => {
  return (
    <Stack
      bg="white"
      justify="space-between"
      py="2rem"
      px="1.5rem"
      border="1px solid"
      borderColor="primary.300"
      spacing="0.75rem"
      _first={{
        borderStartRadius: {
          base: 'initial',
          md: '4px',
        },
        borderTopRadius: {
          base: '4px',
          md: 'initial',
        },
      }}
      _last={{
        borderEndRadius: {
          base: 'initial',
          md: '4px',
        },
        borderBottomRadius: {
          base: '4px',
          md: 'initial',
        },
      }}
      flex={1}
      {...props}
    >
      <Icon aria-hidden as={icon} color="secondary.500" fontSize="1.5rem" />
      <Text textStyle="body-2" color="secondary.400">
        {description}
      </Text>
      <Button variant="outline" onClick={onActionClick} alignSelf="flex-start">
        <Text>{actionTitle}</Text>
      </Button>
    </Stack>
  )
}
