import { Box, Flex, Stack, Text } from '@chakra-ui/react'

import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'

const TUCK_OVERLAP = '0.5rem'

const TUCKED_CAST_SHADOW =
  'inset 0 0.5rem 0.75rem -0.5rem rgba(97, 108, 137, 0.3)'

export interface PeekCardAction {
  label: string
  onClick: () => void
}

export type PeekCardActions =
  | readonly [PeekCardAction]
  | readonly [PeekCardAction, PeekCardAction]

export interface PeekCardProps {
  title: string
  subtitle?: string
  actions: PeekCardActions
  isTucked?: boolean
}

export const PeekCard = ({
  title,
  subtitle,
  actions,
  isTucked = true,
}: PeekCardProps): JSX.Element => {
  const isMobile = useIsMobile()

  return (
    <Box
      bg="primary.100"
      borderTopRadius={isTucked ? '0' : '8px'}
      borderBottomRadius="8px"
      borderStyle="solid"
      borderColor="primary.200"
      borderWidth={isTucked ? '0 1px 1px' : '1px'}
      mt={isTucked ? `-${TUCK_OVERLAP}` : undefined}
      boxShadow={isTucked ? TUCKED_CAST_SHADOW : undefined}
      pt={isTucked ? `calc(1.5rem + ${TUCK_OVERLAP})` : '1.5rem'}
      pb="1.5rem"
      px={{ base: '1.5rem', md: '2rem' }}
    >
      <Stack spacing="1rem">
        <Stack spacing="0.25rem">
          <Text textStyle="subhead-1" color="secondary.500">
            {title}
          </Text>
          {subtitle ? (
            <Text textStyle="body-2" color="secondary.400">
              {subtitle}
            </Text>
          ) : null}
        </Stack>
        <Flex
          direction={{ base: 'column-reverse', md: 'row' }}
          justify="flex-end"
          gap={{ base: '0.5rem', md: '0.75rem' }}
        >
          {actions.map((action, index) => (
            <Button
              key={`${index}-${action.label}`}
              variant={index === actions.length - 1 ? undefined : 'clear'}
              colorScheme={
                index === actions.length - 1 ? undefined : 'secondary'
              }
              isFullWidth={isMobile}
              onClick={action.onClick}
            >
              {action.label}
            </Button>
          ))}
        </Flex>
      </Stack>
    </Box>
  )
}
