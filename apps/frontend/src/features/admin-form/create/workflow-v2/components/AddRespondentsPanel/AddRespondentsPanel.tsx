import { useCallback, useMemo } from 'react'
import { BiLeftArrowAlt } from 'react-icons/bi'
import { BsFillPlusCircleFill } from 'react-icons/bs'
import {
  Box,
  Button,
  Divider,
  Flex,
  HStack,
  Icon,
  IconButton,
  Stack,
  Text,
} from '@chakra-ui/react'

import { CreatePageDrawerCloseButton } from '~features/admin-form/create/common/CreatePageDrawer'

import {
  respondentsSelector,
  setFocusSelector,
  stepsSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

import { RespondentCard } from './RespondentCard'

export const AddRespondentsPanel = (): JSX.Element => {
  const respondents = useWorkflowBuilderStore(respondentsSelector)
  const steps = useWorkflowBuilderStore(stepsSelector)
  const setFocus = useWorkflowBuilderStore(setFocusSelector)

  const handleBack = useCallback(() => {
    setFocus({ type: 'summary' })
  }, [setFocus])

  const handleAddNewRespondent = useCallback(() => {
    setFocus({ type: 'new_respondent' })
  }, [setFocus])

  // Check if all steps have at least one respondent
  const allStepsAssigned = useMemo(
    () => steps.length > 1 && steps.every((s) => s.respondentIds.length > 0),
    [steps],
  )

  return (
    <Flex
      h="100%"
      flexDir="column"
      borderRight="1px solid"
      borderColor="neutral.300"
    >
      {/* Header */}
      <Stack
        direction="row"
        pos="sticky"
        top={0}
        px="1.5rem"
        py="1rem"
        align="center"
        borderBottom="1px solid"
        borderColor="neutral.300"
        bg="white"
        zIndex={1}
      >
        <IconButton
          aria-label="Back to summary"
          icon={<BiLeftArrowAlt fontSize="1.25rem" />}
          variant="clear"
          colorScheme="secondary"
          size="sm"
          h="1.5rem"
          w="1.5rem"
          onClick={handleBack}
        />
        <Text
          textStyle="h4"
          as="h4"
          color="secondary.500"
          flex={1}
          textAlign="center"
        >
          Add respondents
        </Text>
        <CreatePageDrawerCloseButton />
      </Stack>

      {/* Scrollable content */}
      <Box flex={1} overflow="auto" px="1.5rem" pt="1rem" pb="1.5rem">
        <Text textStyle="body-2" color="secondary.400" mb="1.5rem">
          Add respondents to fill up fields or receive notifications
        </Text>

        {/* Respondent pool cards (exclude form_link - shown on Step 1 automatically) */}
        <Stack spacing="0.75rem">
          {respondents
            .filter((r) => r.type !== 'form_link')
            .map((r) => (
              <RespondentCard
                key={r.id}
                respondent={r}
                onEdit={
                  r.isCustom
                    ? () =>
                        setFocus({
                          type: 'edit_respondent',
                          respondentId: r.id,
                        })
                    : r.type === 'collaborator'
                      ? () => {
                          // Open collaborators modal (placeholder: navigate to collaborators page)
                          const collaboratorsButton = document.querySelector(
                            '[aria-label="Manage collaborators"]',
                          ) as HTMLButtonElement | null
                          collaboratorsButton?.click()
                        }
                      : undefined
                }
              />
            ))}
        </Stack>

        {/* Add new respondent link */}
        <Box
          as="button"
          type="button"
          w="100%"
          textAlign="start"
          borderRadius="8px"
          border="1px solid"
          borderColor="neutral.300"
          bg="white"
          p="1rem"
          mt="0.75rem"
          cursor="pointer"
          _hover={{ borderColor: 'primary.500', bg: 'primary.100' }}
          transition="border-color 0.2s, background 0.2s"
          onClick={handleAddNewRespondent}
        >
          <HStack spacing="0.75rem">
            <Icon
              as={BsFillPlusCircleFill}
              fontSize="1.5rem"
              color="primary.500"
              flexShrink={0}
            />
            <Text textStyle="subhead-1" color="primary.500">
              Add a new respondent to this workflow
            </Text>
          </HStack>
        </Box>

        {/* CTA */}
        <Divider mx="-1.5rem" w="auto" mt="1.5rem" />
        <Flex justify="flex-end" py="1rem">
          <Button colorScheme="primary" onClick={handleBack}>
            Done adding respondents
          </Button>
        </Flex>
      </Box>
    </Flex>
  )
}
