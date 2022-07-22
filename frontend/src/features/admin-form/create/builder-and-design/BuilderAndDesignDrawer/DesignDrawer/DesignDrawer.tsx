import { useCallback, useEffect, useMemo } from 'react'
import {
  Controller,
  UnpackNestedValue,
  useForm,
  useWatch,
} from 'react-hook-form'
import { useDebounce } from 'react-use'
import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Stack,
  Tabs,
  Text,
  Textarea,
} from '@chakra-ui/react'
import { cloneDeep } from 'lodash'

import { FormStartPage } from '~shared/types'

import { useIsMobile } from '~hooks/useIsMobile'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import NumberInput from '~components/NumberInput'

import { useMutateFormPage } from '~features/admin-form/common/mutations'

import {
  setToInactiveSelector,
  useBuilderAndDesignStore,
} from '../../useBuilderAndDesignStore'
import { useCreateTabForm } from '../../useCreateTabForm'
import {
  resetStartPageDataSelector,
  setStartPageDataSelector,
  useDesignStore,
} from '../../useDesignStore'
import { validateNumberInput } from '../../utils/validateNumberInput'
import { CreatePageDrawerCloseButton } from '../CreatePageDrawerCloseButton'
import { DrawerContentContainer } from '../EditFieldDrawer/edit-fieldtype/common/DrawerContentContainer'

export const DesignDrawer = (): JSX.Element | null => {
  const { data: form } = useCreateTabForm()

  const isMobile = useIsMobile()
  const { startPageMutation } = useMutateFormPage()

  const closeBuilderDrawer = useBuilderAndDesignStore(setToInactiveSelector)
  const { setDesignState, resetDesignState } = useDesignStore((state) => ({
    setDesignState: setStartPageDataSelector(state),
    resetDesignState: resetStartPageDataSelector(state),
  }))

  // Load the start page into the store when use opens the drawer
  useEffect(() => {
    if (form) setDesignState(form.startPage)
    return () => resetDesignState()
  }, [form, setDesignState, resetDesignState])

  const {
    register,
    formState: { errors },
    control,
    handleSubmit,
  } = useForm<FormStartPage>({
    mode: 'onBlur',
    defaultValues: form?.startPage,
  })

  // Save design functions
  const handleDesignChanges = useCallback(
    (startPageInputs) => {
      setDesignState({ ...(startPageInputs as FormStartPage) })
    },
    [setDesignState],
  )

  const watchedInputs = useWatch({
    control: control,
  }) as UnpackNestedValue<FormStartPage>

  const clonedWatchedInputs = useMemo(
    () => cloneDeep(watchedInputs),
    [watchedInputs],
  )

  useDebounce(() => handleDesignChanges(clonedWatchedInputs), 300, [
    Object.values(clonedWatchedInputs),
  ])

  const handleUpdateDesign = handleSubmit((startPage) =>
    startPageMutation.mutate(startPage),
  )

  if (!form) return null

  return (
    <Tabs pos="relative" h="100%" display="flex" flexDir="column">
      <Box pt="1rem" px="1.5rem" bg="white">
        <Flex justify="space-between">
          <Text textStyle="subhead-3" color="secondary.500" mb="1rem">
            Design
          </Text>
          <CreatePageDrawerCloseButton />
        </Flex>
        <Divider w="auto" mx="-1.5rem" />
      </Box>
      <DrawerContentContainer>
        <FormControl
          isReadOnly={startPageMutation.isLoading}
          isInvalid={!!errors.estTimeTaken}
        >
          <FormLabel>Time taken to complete form (minutes)</FormLabel>
          <Controller
            name="estTimeTaken"
            control={control}
            rules={{
              min: { value: 1, message: 'Cannot be less than 1' },
              max: { value: 1000, message: 'Cannot be more than 1000' },
            }}
            render={({ field: { onChange, ...rest } }) => (
              <NumberInput
                flex={1}
                inputMode="numeric"
                showSteppers={false}
                onChange={validateNumberInput(onChange)}
                {...rest}
              />
            )}
          />
          <FormErrorMessage>{errors.estTimeTaken?.message}</FormErrorMessage>
        </FormControl>

        <FormControl
          isReadOnly={startPageMutation.isLoading}
          isInvalid={!!errors.paragraph}
        >
          <FormLabel>Instructions for your form</FormLabel>
          <Textarea {...register('paragraph')} />
          <FormErrorMessage>{errors.paragraph?.message}</FormErrorMessage>
        </FormControl>

        <Stack
          direction={{ base: 'column', md: 'row-reverse' }}
          justifyContent="end"
          spacing="1rem"
        >
          <Button isFullWidth={isMobile} onClick={handleUpdateDesign}>
            Save design
          </Button>
          <Button
            isFullWidth={isMobile}
            variant="clear"
            colorScheme="secondary"
            onClick={closeBuilderDrawer}
          >
            Cancel
          </Button>
        </Stack>
      </DrawerContentContainer>
    </Tabs>
  )
}
