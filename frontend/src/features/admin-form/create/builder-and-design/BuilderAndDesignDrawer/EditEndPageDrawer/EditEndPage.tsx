import { useCallback, useMemo } from 'react'
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
  setToInactiveSelector,
  useBuilderAndDesignStore,
} from '../../useBuilderAndDesignStore'
import { DrawerContentContainer } from '../EditFieldDrawer/edit-fieldtype/common/DrawerContentContainer'

import {
  setStateSelector,
  useEndPageBuilderStore,
} from './useEndPageBuilderStore'

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
  const { mutateFormEndPage } = useMutateFormPage()

  const closeBuilderDrawer = useBuilderAndDesignStore(setToInactiveSelector)
  const setEndPageBuilderState = useEndPageBuilderStore(setStateSelector)

  const {
    register,
    formState: { errors },
    control,
    handleSubmit,
  } = useForm<FormEndPage>({
    mode: 'onBlur',
    defaultValues: endPage,
  })

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
    mutateFormEndPage.mutate(endPage),
  )

  return (
    <DrawerContentContainer>
      <Stack gap="2rem">
        <FormControl isInvalid={!!errors.title}>
          <FormLabel isRequired>Title</FormLabel>
          <Input {...register('title', { required: REQUIRED_ERROR })} />
          <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
        </FormControl>
        <FormControl isInvalid={!!errors.paragraph}>
          <FormLabel isRequired>Follow-up instructions</FormLabel>
          <Textarea {...register('paragraph')} />
          <FormErrorMessage>{errors.paragraph?.message}</FormErrorMessage>
        </FormControl>
        <Stack direction={['column', 'row']} gap={['2rem', '1rem']}>
          <FormControl isInvalid={!!errors.buttonText}>
            <FormLabel isRequired>Button text</FormLabel>
            <Input
              placeholder="Submit another form"
              {...register('buttonText')}
            />
            <FormErrorMessage>{errors.buttonText?.message}</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors.buttonLink}>
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
        <Button isFullWidth={isMobile} onClick={handleUpdateEndPage}>
          Save field
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
  )
}

export const EditEndPage = (): JSX.Element => {
  const { data: form } = useAdminForm()

  return <>{form ? <EndPageBuilderInput endPage={form.endPage} /> : null}</>
}
