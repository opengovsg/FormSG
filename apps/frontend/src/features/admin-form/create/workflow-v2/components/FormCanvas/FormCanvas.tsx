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
          pb={{ base: 0, md: '2.5rem' }}
          bg={formBg}
        >
          <StartPageView />

          <Flex
            flexDir="column"
            alignSelf="center"
            w="100%"
            px={{ base: 0, md: '1.5rem', lg: '2.5rem' }}
          >
            {/* Section label when editing a step */}
            {isStepEdit && activeStep && activeStepColourTheme && (
              <Flex maxW="57rem" alignSelf="center" w="100%" mb="-1px">
                <Flex
                  bg={`${activeStepColourTheme}.500`}
                  borderTopRadius="6px"
                  px="0.75rem"
                  py="0.25rem"
                  align="center"
                >
                  <Text textStyle="caption-1" color="white" fontWeight="500">
                    Select fields to be filled in for {activeStep.name}
                  </Text>
                </Flex>
              </Flex>
            )}

            <Box
              bg="white"
              w="100%"
              maxW="57rem"
              alignSelf="center"
              px={{ base: '1.5rem', md: '1.625rem' }}
              py={{ base: '1.5rem', md: '2.5rem' }}
              border={
                isStepEdit && activeStepColourTheme ? '2px solid' : undefined
              }
              borderColor={
                isStepEdit && activeStepColourTheme
                  ? `${activeStepColourTheme}.500`
                  : undefined
              }
              borderRadius={isStepEdit ? '4px' : undefined}
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
