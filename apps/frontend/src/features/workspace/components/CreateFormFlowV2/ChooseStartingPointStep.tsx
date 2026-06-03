import { useCallback, useState } from 'react'
import { BiRightArrowAlt, BiSpreadsheet } from 'react-icons/bi'
import { BsArrowLeftRight } from 'react-icons/bs'
import { useNavigate } from 'react-router-dom'
import { Box, Circle, Flex, Icon, Stack, Text } from '@chakra-ui/react'

import { ADMINFORM_ROUTE } from '~constants/routes'
import Button from '~components/Button'

import { SplitScreenLayout } from './SplitScreenLayout'

// ─── Types ──────────────────────────────────────────────

type StartingPoint = 'fields' | 'process'

const OPTIONS: {
  value: StartingPoint
  title: string
  description: string
  icon: typeof BiSpreadsheet
  buttonText: string
}[] = [
  {
    value: 'fields',
    title: 'Build fields first',
    description:
      'Jump straight into creating your form fields. You can set up workflow steps later.',
    icon: BiSpreadsheet,
    buttonText: 'Build fields',
  },
  {
    value: 'process',
    title: 'Map your process first',
    description:
      "Define who's involved and what they do, then build your fields around that.",
    icon: BsArrowLeftRight,
    buttonText: 'Map your process',
  },
]

// ─── ChooseStartingPointWrapper ─────────────────────────
// Owns state + SplitScreenLayout for the "Choose Starting Point" variant.

interface ChooseStartingPointWrapperProps {
  formId: string
}

export const ChooseStartingPointWrapper = ({
  formId,
}: ChooseStartingPointWrapperProps): JSX.Element => {
  const [selected, setSelected] = useState<StartingPoint>('fields')

  return (
    <SplitScreenLayout
      currentStep="mapSteps"
      leftPanel={
        <ChooseStartingPointStep
          formId={formId}
          selected={selected}
          onSelect={setSelected}
        />
      }
      rightPanel={<ChooseStartingPointPreview selected={selected} />}
    />
  )
}

// ─── ChooseStartingPointStep (left panel) ───────────────

interface ChooseStartingPointStepProps {
  formId: string
  selected: StartingPoint
  onSelect: (value: StartingPoint) => void
}

const ChooseStartingPointStep = ({
  formId,
  selected,
  onSelect,
}: ChooseStartingPointStepProps): JSX.Element => {
  const navigate = useNavigate()

  const selectedOption = OPTIONS.find((o) => o.value === selected)

  const handleGetStarted = useCallback(() => {
    if (selected === 'process') {
      navigate(`${ADMINFORM_ROUTE}/${formId}?tab=workflow`)
    } else {
      navigate(`${ADMINFORM_ROUTE}/${formId}`)
    }
  }, [selected, formId, navigate])

  return (
    <Stack spacing="1.5rem" maxW="32rem">
      <Box>
        <Text textStyle="h2" color="secondary.700" mb="0.5rem">
          How would you like to start?
        </Text>
      </Box>

      <Stack spacing="0.75rem">
        {OPTIONS.map((option) => (
          <OptionCard
            key={option.value}
            title={option.title}
            description={option.description}
            icon={option.icon}
            isSelected={selected === option.value}
            onClick={() => onSelect(option.value)}
          />
        ))}
      </Stack>

      <Button
        rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
        onClick={handleGetStarted}
        isFullWidth
      >
        {selectedOption?.buttonText}
      </Button>
    </Stack>
  )
}

// ─── OptionCard ─────────────────────────────────────────

interface OptionCardProps {
  title: string
  description: string
  icon: typeof BiSpreadsheet
  isSelected: boolean
  onClick: () => void
}

const OptionCard = ({
  title,
  description,
  icon,
  isSelected,
  onClick,
}: OptionCardProps): JSX.Element => {
  return (
    <Box
      as="button"
      type="button"
      w="100%"
      textAlign="start"
      borderRadius="12px"
      border={isSelected ? '2px solid' : '1px solid'}
      borderColor={isSelected ? 'primary.500' : 'neutral.300'}
      bg={isSelected ? 'primary.100' : 'white'}
      p="1rem"
      cursor="pointer"
      _hover={{
        borderColor: 'primary.500',
        bg: isSelected ? 'primary.100' : 'primary.50',
      }}
      transition="border-color 0.2s, background 0.2s"
      onClick={onClick}
    >
      <Flex align="center" gap="0.75rem">
        <Icon
          as={icon}
          fontSize="1.5rem"
          color={isSelected ? 'primary.500' : 'secondary.500'}
          flexShrink={0}
        />
        <Stack spacing="0.125rem" flex={1}>
          <Text textStyle="subhead-1" color="secondary.500">
            {title}
          </Text>
          <Text textStyle="body-2" color="secondary.400">
            {description}
          </Text>
        </Stack>
        <Circle
          size="1.25rem"
          border="2px solid"
          borderColor={isSelected ? 'primary.500' : 'neutral.400'}
          flexShrink={0}
        >
          {isSelected && <Circle size="0.625rem" bg="primary.500" />}
        </Circle>
      </Flex>
    </Box>
  )
}

// ─── Right panel previews ───────────────────────────────

interface ChooseStartingPointPreviewProps {
  selected: StartingPoint
}

export const ChooseStartingPointPreview = ({
  selected,
}: ChooseStartingPointPreviewProps): JSX.Element => {
  return selected === 'fields' ? (
    <FieldsFirstPreview />
  ) : (
    <ProcessFirstPreview />
  )
}

const FieldsFirstPreview = (): JSX.Element => {
  return (
    <Flex direction="column" align="center" w="80%" maxW="32rem">
      <Box
        w="100%"
        bg="white"
        borderRadius="0.25rem"
        overflow="hidden"
        boxShadow="0 1px 3px rgba(0, 0, 0, 0.08)"
      >
        {/* Tab bar */}
        <Flex borderBottom="1px solid" borderColor="neutral.200" px="1.5rem">
          <Box
            px="0.75rem"
            py="0.75rem"
            borderBottom="2px solid"
            borderColor="primary.500"
          >
            <Text textStyle="caption-1" color="primary.500">
              CREATE
            </Text>
          </Box>
          <Box px="0.75rem" py="0.75rem">
            <Text textStyle="caption-1" color="secondary.400">
              SETTINGS
            </Text>
          </Box>
          <Box px="0.75rem" py="0.75rem">
            <Text textStyle="caption-1" color="secondary.400">
              RESULTS
            </Text>
          </Box>
        </Flex>

        {/* Sidebar + content area */}
        <Flex>
          {/* Mini sidebar */}
          <Stack
            spacing="0.5rem"
            py="1rem"
            px="0.5rem"
            borderRight="1px solid"
            borderColor="neutral.200"
          >
            {[1, 2, 3, 4].map((i) => (
              <Box
                key={i}
                w="1.25rem"
                h="1.25rem"
                bg="neutral.200"
                borderRadius="0.125rem"
              />
            ))}
          </Stack>

          {/* Field placeholders */}
          <Box flex={1} bg="neutral.100" p="1.5rem">
            <Box bg="white" borderRadius="0.25rem" p="1.25rem">
              {[40, 55, 30].map((width, i) => (
                <Box key={i} mb={i < 2 ? '1.25rem' : undefined}>
                  <Box
                    h="0.625rem"
                    w={`${width}%`}
                    bg="neutral.300"
                    borderRadius="0.125rem"
                    mb="0.5rem"
                  />
                  <Box
                    h="2rem"
                    w={i === 2 ? '60%' : '100%'}
                    bg="neutral.200"
                    borderRadius="0.25rem"
                  />
                </Box>
              ))}
            </Box>
          </Box>
        </Flex>
      </Box>
    </Flex>
  )
}

const ProcessFirstPreview = (): JSX.Element => {
  return (
    <Flex direction="column" align="center" w="80%" maxW="32rem">
      <Stack spacing="0" align="center" w="100%">
        {/* Step 1 card */}
        <Box
          w="100%"
          bg="white"
          borderRadius="12px"
          border="1px solid"
          borderColor="neutral.300"
          p="1rem"
        >
          <Flex align="center" gap="0.75rem">
            <Circle size="2rem" bg="primary.100">
              <Icon as={BiSpreadsheet} fontSize="1rem" color="primary.500" />
            </Circle>
            <Stack spacing="0">
              <Box
                h="0.625rem"
                w="5rem"
                bg="neutral.400"
                borderRadius="0.125rem"
              />
              <Box
                h="0.5rem"
                w="8rem"
                bg="neutral.200"
                borderRadius="0.125rem"
                mt="0.375rem"
              />
            </Stack>
          </Flex>
        </Box>

        {/* Connector */}
        <Box w="1px" h="1.5rem" bg="neutral.300" />

        {/* "+" circle */}
        <Circle size="2rem" border="1px dashed" borderColor="primary.400">
          <Text color="primary.400" fontSize="1rem" lineHeight={1}>
            +
          </Text>
        </Circle>

        {/* Connector */}
        <Box w="1px" h="1.5rem" bg="neutral.300" />

        {/* END OF WORKFLOW divider */}
        <Flex w="100%" align="center" gap="0.75rem">
          <Box flex={1} h="1px" bg="neutral.300" />
          <Text
            textStyle="caption-2"
            color="secondary.400"
            letterSpacing="0.1em"
          >
            END OF WORKFLOW
          </Text>
          <Box flex={1} h="1px" bg="neutral.300" />
        </Flex>

        {/* Email card */}
        <Box mt="0.75rem" />
        <Box
          w="100%"
          bg="white"
          borderRadius="12px"
          border="1px solid"
          borderColor="neutral.300"
          p="1rem"
        >
          <Flex align="center" gap="0.75rem">
            <Circle size="2rem" bg="purple.100">
              <Box
                w="1rem"
                h="0.75rem"
                bg="purple.400"
                borderRadius="0.125rem"
              />
            </Circle>
            <Box
              h="0.625rem"
              w="12rem"
              bg="neutral.300"
              borderRadius="0.125rem"
            />
          </Flex>
        </Box>
      </Stack>
    </Flex>
  )
}
