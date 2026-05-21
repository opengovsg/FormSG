import { useCallback } from 'react'
import { IconType } from 'react-icons'
import {
  BiCheck,
  BiChevronRight,
  BiEditAlt,
  BiLinkExternal,
  BiListCheck,
  BiListUl,
  BiUser,
} from 'react-icons/bi'
import { Center, chakra, Flex, Icon, Stack, Text } from '@chakra-ui/react'

import type { Phase, PhaseStatus } from '../../types'

type SectionCardProps = {
  phase: Phase
  title: string
  description?: string
  subtitle?: string
  status: PhaseStatus
  isActive: boolean
  isFirstIncomplete: boolean
  onClick: () => void
}

const PHASE_ICONS: Record<Phase, IconType> = {
  add_steps: BiListUl,
  add_respondents: BiUser,
  create_fields: BiEditAlt,
  assign_fields: BiListCheck,
}

export const SectionCard = ({
  phase,
  title,
  description,
  subtitle,
  status,
  isActive,
  isFirstIncomplete,
  onClick,
}: SectionCardProps): JSX.Element => {
  const handleClick = useCallback(() => onClick(), [onClick])

  const isExternalLink = phase === 'create_fields'
  const PhaseIcon = PHASE_ICONS[phase]

  return (
    <chakra.button
      w="100%"
      textAlign="start"
      borderRadius="8px"
      bg={isActive ? '#F8F9FD' : 'transparent'}
      border="2px solid"
      borderColor={isActive ? '#445FCD' : 'transparent'}
      py="0.75rem"
      px="1rem"
      cursor="pointer"
      transition="all 0.15s"
      _hover={{
        bg: isActive ? '#F8F9FD' : 'neutral.100',
      }}
      onClick={handleClick}
    >
      <Flex align="center" gap="0.75rem">
        {/* Icon indicator */}
        <PhaseIndicator icon={PhaseIcon} status={status} isActive={isActive} />

        {/* Content */}
        <Stack flex={1} minW={0} spacing="0.125rem">
          <Text textStyle="subhead-1" color="secondary.500" noOfLines={1}>
            {title}
          </Text>
          {isActive && description ? (
            <Text textStyle="body-2" color="secondary.500" noOfLines={2}>
              {description}
            </Text>
          ) : !isActive && subtitle ? (
            <Text textStyle="body-2" color="secondary.400" noOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </Stack>

        {/* Trailing */}
        {isFirstIncomplete && !isExternalLink ? (
          <Text textStyle="subhead-2" color="primary.500" flexShrink={0}>
            Start &rarr;
          </Text>
        ) : (
          <Icon
            as={isExternalLink ? BiLinkExternal : BiChevronRight}
            fontSize="1.25rem"
            color="secondary.400"
            flexShrink={0}
          />
        )}
      </Flex>
    </chakra.button>
  )
}

type PhaseIndicatorProps = {
  icon: IconType
  status: PhaseStatus
  isActive: boolean
}

const PhaseIndicator = ({
  icon,
  status,
  isActive,
}: PhaseIndicatorProps): JSX.Element => {
  if (status === 'done') {
    return (
      <Center
        w="2rem"
        h="2rem"
        borderRadius="full"
        bg="success.500"
        flexShrink={0}
      >
        <Icon as={BiCheck} fontSize="1.25rem" color="white" />
      </Center>
    )
  }

  if (isActive) {
    return (
      <Center w="2rem" h="2rem" borderRadius="full" bg="#445FCD" flexShrink={0}>
        <Icon as={icon} fontSize="1.25rem" color="white" />
      </Center>
    )
  }

  // Inactive / not started - icon in a light circle
  return (
    <Center
      w="2rem"
      h="2rem"
      borderRadius="full"
      bg="neutral.200"
      flexShrink={0}
    >
      <Icon as={icon} fontSize="1.25rem" color="secondary.400" />
    </Center>
  )
}
