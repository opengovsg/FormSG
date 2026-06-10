import { useMemo } from 'react'
import { Box, Flex, Stack, Text } from '@chakra-ui/react'

import { useAdminForm } from '~features/admin-form/common/queries'
import { StartPageView } from '~features/admin-form/create/builder-and-design/BuilderAndDesignContent/StartPageView'
import { useDesignColorTheme } from '~features/admin-form/create/builder-and-design/utils/useDesignColorTheme'
import { useBgColor } from '~features/public-form/components/PublicFormWrapper'

import { getStepColourThemes } from '../../types'
import {
  focusStateSelector,
  stepsSelector,
  useWorkflowBuilderStore,
} from '../../workflowBuilderStore'

import { FormFieldCard } from './FormFieldCard'

const EmptyFieldsPlaceholder = (): JSX.Element => (
  <Flex
    direction="column"
    align="center"
    justify="center"
    py="3rem"
    border="1px dashed"
    borderColor="neutral.300"
    borderRadius="4px"
  >
    <Text textStyle="body-1" color="secondary.500">
      No fields yet
    </Text>
    <Text textStyle="body-2" color="secondary.400" mt="0.25rem">
      Create fields in the Fields tab and choose which step to put them in
    </Text>
  </Flex>
)

export const FormCanvas = (): JSX.Element => {
  const { data: form } = useAdminForm()
  const steps = useWorkflowBuilderStore(stepsSelector)
  const focusState = useWorkflowBuilderStore(focusStateSelector)

  const colorTheme = useDesignColorTheme()
  const formBg = useBgColor({ colorTheme })

  const isStepEdit = focusState.type === 'step_edit'

  const activeStep = useMemo(() => {
    if (!isStepEdit) return null
    return steps.find((s) => s.id === focusState.stepId) ?? null
  }, [isStepEdit, focusState, steps])

  const stepColourThemes = useMemo(
    () => getStepColourThemes(colorTheme),
    [colorTheme],
  )

  const activeStepColourTheme = activeStep
    ? stepColourThemes[activeStep.order % stepColourThemes.length]
    : undefined

  const fields = form?.form_fields ?? []

  return (
    <Flex flex={1} overflow="auto">
      <Flex
        mb={0}
        flex={1}
        bg="neutral.200"
        mt={{ base: 0, md: '1rem' }}
        pt={{ base: 0, md: '1rem' }}
        pb={{ base: 0, md: '2rem' }}
        px={{ base: 0, md: '2rem' }}
        justify="center"
      >
        <Stack
          direction="column"
          w="100%"
          h="fit-content"
          spacing={{ base: 0, md: '1.5rem' }}
          bg={formBg}
        >
          <StartPageView />

          <Flex
            flexDir="column"
            alignSelf="center"
            w="100%"
            px={{ base: 0, md: '1.5rem', lg: '2.5rem' }}
          >
            {/* Mode banner when editing a step */}
            {isStepEdit && activeStep && activeStepColourTheme && (
              <Box
                bg={`${activeStepColourTheme}.100`}
                borderRadius="4px"
                px="1rem"
                py="0.5rem"
                mb="0.5rem"
                maxW="57rem"
                alignSelf="center"
                w="100%"
              >
                <Text textStyle="body-2" color={`${activeStepColourTheme}.500`}>
                  Editing: {activeStep.name} — check fields to assign
                </Text>
              </Box>
            )}

            <Box
              bg="white"
              w="100%"
              maxW="57rem"
              alignSelf="center"
              px={{ base: '1.5rem', md: '1.625rem' }}
              py={{ base: '1.5rem', md: '2.5rem' }}
            >
              {fields.length === 0 ? (
                <EmptyFieldsPlaceholder />
              ) : (
                fields.map((field, i) => (
                  <FormFieldCard key={field._id} field={field} fieldIndex={i} />
                ))
              )}
            </Box>
          </Flex>
        </Stack>
      </Flex>
    </Flex>
  )
}
