import { useCallback, useEffect, useMemo } from 'react'
import {
  FieldValues,
  RegisterOptions,
  UnpackNestedValue,
  useForm,
  useWatch,
} from 'react-hook-form'
import { useDebounce } from 'react-use'
import { Box, Divider, Flex, FormControl, Stack, Text } from '@chakra-ui/react'
import {
  Button,
  FormErrorMessage,
  FormLabel,
  Input,
  Textarea,
} from '@opengovsg/design-system-react'
import { cloneDeep } from 'lodash'
import validator from 'validator'

import { FormEndPage, FormResponseMode } from '~shared/types'

import { REQUIRED_ERROR } from '~constants/validation'
import { useIsMobile } from '~hooks/useIsMobile'

import { useMutateFormPage } from '~features/admin-form/common/mutations'
import { useAdminForm } from '~features/admin-form/common/queries'

import {
  setIsDirtySelector,
  useDirtyFieldStore,
} from '../builder-and-design/useDirtyFieldStore'
import {
  CreatePageDrawerContentContainer,
  useCreatePageSidebar,
} from '../common'
import { CreatePageDrawerCloseButton } from '../common/CreatePageDrawer/CreatePageDrawerCloseButton'
import { CreatePageDrawerContainer } from '../common/CreatePageDrawer/CreatePageDrawerContainer'
import { CreatePageSideBarLayoutProvider } from '../common/CreatePageSideBarLayoutContext'

import {
  dataSelector,
  resetDataSelector,
  setDataSelector,
  setToInactiveSelector,
  useEndPageStore,
} from './useEndPageStore'

const buttonLinkRules: RegisterOptions<FormEndPage, 'buttonLink'> = {
  validate: (url: string) =>
    !url ||
    validator.isURL(url, {
      protocols: ['https', 'http'],
      require_protocol: true,
    }) ||
    'Please enter a valid URL (starting with https:// or http://)',
} as FieldValues

export const EndPageInput = ({
  isPayment = false,
}: {
  isPayment: boolean
}): JSX.Element => {
  const isMobile = useIsMobile()
  const { endPageMutation } = useMutateFormPage()

  const setIsDirty = useDirtyFieldStore(setIsDirtySelector)

  const { endPageData, setData, setToInactive } = useEndPageStore(
    useCallback(
      (state) => ({
        endPageData: dataSelector(state),
        setData: setDataSelector(state),
        setToInactive: setToInactiveSelector(state),
      }),
      [],
    ),
  )

  const { handleClose } = useCreatePageSidebar()

  const paymentDefaults = {
    paymentTitle: endPageData?.paymentTitle,
    paymentParagraph: endPageData?.paymentParagraph,
    buttonText: 'Save proof of payment',
  }

  const {
    register,
    formState: { errors, dirtyFields },
    control,
    handleSubmit,
  } = useForm<FormEndPage>({
    mode: 'onBlur',
    defaultValues: isPayment ? paymentDefaults : endPageData,
  })

  const formPlaceholder = isPayment
    ? 'Default proof of payment'
    : 'Default form link'

  // Update dirty state of builder so confirmation modal can be shown
  useEffect(() => {
    setIsDirty(Object.keys(dirtyFields).length !== 0)

    return () => {
      setIsDirty(false)
    }
  }, [dirtyFields, setIsDirty])

  const handleEndPageBuilderChanges = useCallback(
    (endPageInputs: FormEndPage) => {
      setData(endPageInputs)
    },
    [setData],
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

  const handleCloseDrawer = useCallback(() => handleClose(false), [handleClose])

  const handleUpdateEndPage = handleSubmit((endPage) => {
    return endPageMutation.mutate(endPage, {
      onSuccess: () => {
        setToInactive()
        handleCloseDrawer()
      },
    })
  })

  const paymentTitle = isPayment ? 'paymentTitle' : 'title'
  const paymentParagraph = isPayment ? 'paymentParagraph' : 'paragraph'

  return (
    <CreatePageDrawerContentContainer>
      <Stack gap="2rem">
        <FormControl
          isReadOnly={endPageMutation.isLoading}
          isInvalid={!!errors.title}
        >
          <FormLabel isRequired>Title</FormLabel>
          <Input
            autoFocus
            {...register(paymentTitle, { required: REQUIRED_ERROR })}
          />
          <FormErrorMessage>{errors.title?.message}</FormErrorMessage>
        </FormControl>
        <FormControl
          isReadOnly={endPageMutation.isLoading}
          isInvalid={!!errors.paragraph}
        >
          <FormLabel isRequired>Follow-up instructions</FormLabel>
          <Textarea {...register(paymentParagraph)} />
          <FormErrorMessage>{errors.paragraph?.message}</FormErrorMessage>
        </FormControl>
        <Stack direction={['column', 'row']} gap={['2rem', '1rem']}>
          <FormControl
            isReadOnly={endPageMutation.isLoading}
            isInvalid={!!errors.buttonText}
            isDisabled={isPayment}
          >
            <FormLabel isRequired>Button text</FormLabel>
            <Input
              placeholder="Submit another response"
              {...register('buttonText')}
            />
            <FormErrorMessage>{errors.buttonText?.message}</FormErrorMessage>
          </FormControl>
          <FormControl
            isReadOnly={endPageMutation.isLoading}
            isInvalid={!!errors.buttonLink}
            isDisabled={isPayment}
          >
            <FormLabel isRequired>Button redirect link</FormLabel>
            <Input
              placeholder={formPlaceholder}
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
          Save page
        </Button>
        <Button
          isFullWidth={isMobile}
          variant="clear"
          colorScheme="sub"
          isDisabled={endPageMutation.isLoading}
          onClick={() => handleCloseDrawer()}
        >
          Cancel
        </Button>
      </Stack>
    </CreatePageDrawerContentContainer>
  )
}

export const EndPageDrawer = (): JSX.Element | null => {
  const { data: form } = useAdminForm()
  const { endPageData, setData, resetData } = useEndPageStore(
    useCallback(
      (state) => ({
        endPageData: dataSelector(state),
        setData: setDataSelector(state),
        resetData: resetDataSelector(state),
      }),
      [],
    ),
  )

  const isPaymentEnabled =
    form?.responseMode === FormResponseMode.Encrypt &&
    form?.payments_field.enabled

  useEffect(() => {
    setData(form?.endPage)
    return resetData
  }, [form?.endPage, resetData, setData])

  if (!endPageData) return null

  return (
    <CreatePageSideBarLayoutProvider>
      <CreatePageDrawerContainer>
        <Flex pos="relative" h="100%" display="flex" flexDir="column">
          <Box pt="1rem" px="1.5rem" bg="white">
            <Flex justify="space-between">
              <Text textStyle="subhead-3" color="brand.secondary.500" mb="1rem">
                Edit thank you page
              </Text>
              <CreatePageDrawerCloseButton />
            </Flex>
            <Divider w="auto" mx="-1.5rem" />
          </Box>
          <EndPageInput isPayment={isPaymentEnabled} />
        </Flex>
      </CreatePageDrawerContainer>
    </CreatePageSideBarLayoutProvider>
  )
}
