import { useCallback, useMemo } from 'react'
import { UnpackNestedValue, useForm, useWatch } from 'react-hook-form'
import { useDebounce } from 'react-use'
import { FormControl, Skeleton, Stack } from '@chakra-ui/react'
import { cloneDeep } from 'lodash'
import validator from 'validator'

import { FormEndPage } from '~shared/types'

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

// TODO (hans): Refactor this based on end-page-builder-1 PR
export const EndPageBuilderInput = ({
  title,
  paragraph,
  buttonLink,
  buttonText,
}: FormEndPage): JSX.Element => {
  const isMobile = useIsMobile()
  const { mutateFormEndPage } = useMutateFormPage()

  const defaultParagraph = useMemo(() => paragraph ?? '', [paragraph])
  const defaultButtonLink = useMemo(() => buttonLink ?? '', [buttonLink])

  const closeBuilderDrawer = useBuilderAndDesignStore(setToInactiveSelector)
  const setEndPageBuilderState = useEndPageBuilderStore(setStateSelector)

  const {
    register,
    formState: { errors },
    control,
    handleSubmit,
  } = useForm<FormEndPage>({
    mode: 'onChange',
    defaultValues: {
      title: title,
      paragraph: defaultParagraph,
      buttonText: buttonText,
      buttonLink: defaultButtonLink,
    },
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

  const buttonLinkRegister = register('buttonLink', {
    validate: (url) =>
      !url ||
      validator.isURL(url, {
        protocols: ['https'],
        require_protocol: true,
      }) ||
      'Please enter a valid URL (starting with https://)',
  })

  const handleUpdateEndPage = useCallback(() => {
    return handleSubmit((endPage) => {
      return mutateFormEndPage.mutate(endPage)
    })()
  }, [handleSubmit, mutateFormEndPage])

  return (
    <DrawerContentContainer>
      <Stack gap="2rem">
        <FormControl isInvalid={false}>
          <FormLabel isRequired>Title</FormLabel>
          <Input {...register('title')} autoFocus />
          <FormErrorMessage>error</FormErrorMessage>
        </FormControl>
        <FormControl isInvalid={false}>
          <FormLabel isRequired>Follow-up paragraph</FormLabel>
          <Textarea {...register('paragraph')} />
          <FormErrorMessage>error</FormErrorMessage>
        </FormControl>
        <Stack direction={['column', 'row']} gap={['2rem', '1rem']}>
          <FormControl isInvalid={false}>
            <FormLabel isRequired>Button text</FormLabel>
            <Input {...register('buttonText')} />
            <FormErrorMessage>error</FormErrorMessage>
          </FormControl>
          <FormControl isInvalid={!!errors.buttonLink}>
            <FormLabel isRequired>Button redirect link</FormLabel>
            <Input placeholder="Default form link" {...buttonLinkRegister} />
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
  const { data: form, isLoading } = useAdminForm()

  return (
    <Skeleton isLoaded={!isLoading && !!form}>
      {form ? <EndPageBuilderInput {...form.endPage} /> : null}
    </Skeleton>
  )
}
