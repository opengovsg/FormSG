import { useCallback, useEffect, useMemo } from 'react'
import {
  FieldValues,
  RegisterOptions,
  UnpackNestedValue,
  useForm,
  useWatch,
} from 'react-hook-form'
import { useDebounce } from 'react-use'
import { FormControl, Stack } from '@chakra-ui/react'
import { cloneDeep } from 'lodash'
import validator from 'validator'

import { FormEndPage } from '~shared/types'

import { REQUIRED_ERROR } from '~constants/validation'
import { useIsMobile } from '~hooks/useIsMobile'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Textarea from '~components/Textarea'

import { useMutateFormPage } from '~features/admin-form/common/mutations'
import { useAdminForm } from '~features/admin-form/common/queries'

import {
  resetEndPageDataSelector,
  setEndPageDataSelector,
  useEndPageBuilderStore,
} from '../../useEndPageBuilderStore'
import {
  setIsDirtySelector,
  setToInactiveSelector,
  useFieldBuilderStore,
} from '../../useFieldBuilderStore'
import { DrawerContentContainer } from '../EditFieldDrawer/edit-fieldtype/common/DrawerContentContainer'

const buttonLinkRules: RegisterOptions<FormEndPage, 'buttonLink'> = {
  validate: (url: string) =>
    !url ||
    validator.isURL(url, {
      protocols: ['https'],
      require_protocol: true,
    }) ||
    'Please enter a valid URL (starting with https://)',
} as FieldValues

interface EndPageBuilderInputProps {
  endPage: FormEndPage
}

export const EndPageBuilderInput = ({
  endPage,
}: EndPageBuilderInputProps): JSX.Element => {
  const isMobile = useIsMobile()
  const { endPageMutation } = useMutateFormPage()

  const closeBuilderDrawer = useFieldBuilderStore(setToInactiveSelector)
  const setIsDirty = useFieldBuilderStore(setIsDirtySelector)

  const { setEndPageBuilderState, resetEndPageBuilderState } =
    useEndPageBuilderStore((state) => ({
      setEndPageBuilderState: setEndPageDataSelector(state),
      resetEndPageBuilderState: resetEndPageDataSelector(state),
    }))

  // Load the end page into the store when user opens customization page
  useEffect(() => {
    setEndPageBuilderState(endPage)
    return () => resetEndPageBuilderState()
  }, [endPage, setEndPageBuilderState, resetEndPageBuilderState])

  const {
    register,
    formState: { errors, isDirty },
    control,
    handleSubmit,
  } = useForm<FormEndPage>({
    mode: 'onBlur',
    defaultValues: endPage,
  })

  // Update dirty state of builder so confirmation modal can be shown
  useEffect(() => {
    setIsDirty(isDirty)

    return () => {
      setIsDirty(false)
    }
  }, [isDirty, setIsDirty])

  const handleEndPageBuilderChanges = useCallback(
    (endPageInputs) => {
      setEndPageBuilderState({ ...(endPageInputs as FormEndPage) })
    },
    [setEndPageBuilderState],
  )

  const watchedInputs = useWatch({
    control: control,
  }) as UnpackNestedValue<FormEndPage>

  const clonedWatchedInputs = useMemo(
    () => cloneDeep(watchedInputs),
    [watchedInputs],
  )

  useDebounce(() => handleEndPageBuilderChanges(clonedWatchedInputs), 300, [
    Object.values(clonedWatchedInputs),
  ])

  const handleUpdateEndPage = handleSubmit((endPage) =>
    endPageMutation.mutate(endPage, { onSuccess: closeBuilderDrawer }),
  )

  return (
    <DrawerContentContainer>
      <Stack gap="2rem">
        <FormControl
          isReadOnly={endPageMutation.isLoading}
          isInvalid={!!errors.title}
        >
          <FormLabel isRequired>Title</FormLabel>
          <Input {...register('title', { required: REQUIRED_ERROR })} />
          <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
        </FormControl>
        <FormControl
          isReadOnly={endPageMutation.isLoading}
          isInvalid={!!errors.paragraph}
        >
          <FormLabel isRequired>Follow-up instructions</FormLabel>
          <Textarea {...register('paragraph')} />
          <FormErrorMessage>{errors.paragraph?.message}</FormErrorMessage>
        </FormControl>
        <Stack direction={['column', 'row']} gap={['2rem', '1rem']}>
          <FormControl
            isReadOnly={endPageMutation.isLoading}
            isInvalid={!!errors.buttonText}
          >
            <FormLabel isRequired>Button text</FormLabel>
            <Input
              placeholder="Submit another form"
              {...register('buttonText')}
            />
            <FormErrorMessage>{errors.buttonText?.message}</FormErrorMessage>
          </FormControl>
          <FormControl
            isReadOnly={endPageMutation.isLoading}
            isInvalid={!!errors.buttonLink}
          >
            <FormLabel isRequired>Button redirect link</FormLabel>
            <Input
              placeholder="Default form link"
              {...register('buttonLink', buttonLinkRules)}
            />
            <FormErrorMessage>{errors.buttonLink?.message}</FormErrorMessage>
          </FormControl>
        </Stack>
      </Stack>

      <Stack
        direction={{ base: 'column', md: 'row-reverse' }}
        justifyContent="end"
        spacing="1rem"
      >
        <Button
          isFullWidth={isMobile}
          onClick={handleUpdateEndPage}
          isLoading={endPageMutation.isLoading}
        >
          Save field
        </Button>
        <Button
          isFullWidth={isMobile}
          variant="clear"
          colorScheme="secondary"
          isDisabled={endPageMutation.isLoading}
          onClick={() => closeBuilderDrawer()}
        >
          Cancel
        </Button>
      </Stack>
    </DrawerContentContainer>
  )
}

export const EditEndPage = (): JSX.Element | null => {
  const { data: form } = useAdminForm()

  return form ? <EndPageBuilderInput endPage={form.endPage} /> : null
}
