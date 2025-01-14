import { useCallback, useEffect, useLayoutEffect, useMemo } from 'react'
import {
  Controller,
  UnpackNestedValue,
  useForm,
  useWatch,
} from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { useMutation } from 'react-query'
import { useParams } from 'react-router-dom'
import { useDebounce } from 'react-use'
import {
  Box,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Text,
  Textarea,
} from '@chakra-ui/react'
import { cloneDeep, get, isEmpty } from 'lodash'

import { FormColorTheme, FormLogoState, FormStartPage } from '~shared/types'

import { useToast } from '~hooks/useToast'
import { uploadLogo } from '~services/FileHandlerService'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import NumberInput from '~components/NumberInput'
import Radio from '~components/Radio'

import { useMutateFormPage } from '~features/admin-form/common/mutations'
import { useCreatePageSidebar } from '~features/admin-form/create/common/CreatePageSidebarContext'
import { useEnv } from '~features/env/queries'
import { getTitleBg } from '~features/public-form/components/FormStartPage/useFormHeader'

import {
  CustomLogoMeta,
  customLogoMetaSelector,
  DesignState,
  FormStartPageInput,
  resetDesignStoreSelector,
  setCustomLogoMetaSelector,
  setStartPageDataSelector,
  setStateSelector,
  startPageDataSelector,
  stateSelector,
  useDesignStore,
} from '../../../builder-and-design/useDesignStore'
import {
  setIsDirtySelector,
  useDirtyFieldStore,
} from '../../../builder-and-design/useDirtyFieldStore'
import { validateNumberInput } from '../../../builder-and-design/utils/validateNumberInput'
import { CreatePageDrawerContentContainer } from '../../../common'
import { CreatePageDrawerCloseButton } from '../../../common/CreatePageDrawer/CreatePageDrawerCloseButton'
import { FormFieldDrawerActions } from '../EditFieldDrawer/edit-fieldtype/common/FormFieldDrawerActions'
import {
  UploadedImage,
  UploadImageInput,
} from '../EditFieldDrawer/edit-fieldtype/EditImage/UploadImageInput'

type DesignDrawerProps = {
  startPage: FormStartPage
}

export const DesignInput = (): JSX.Element | null => {
  const { t } = useTranslation()
  const toast = useToast({ status: 'danger' })
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const { startPageMutation } = useMutateFormPage()
  const { handleClose } = useCreatePageSidebar()

  const {
    designState,
    setDesignState,
    startPageData,
    customLogoMeta,
    setStartPageData,
  } = useDesignStore(
    useCallback(
      (state) => ({
        designState: stateSelector(state),
        setDesignState: setStateSelector(state),
        startPageData: startPageDataSelector(state),
        customLogoMeta: customLogoMetaSelector(state),
        setStartPageData: setStartPageDataSelector(state),
      }),
      [],
    ),
  )

  const setIsDirty = useDirtyFieldStore(setIsDirtySelector)

  const setToEditingHeader = useCallback(
    () => setDesignState(DesignState.EditingHeader),
    [setDesignState],
  )
  const setToEditingInstructions = useCallback(
    () => setDesignState(DesignState.EditingInstructions),
    [setDesignState],
  )

  const {
    register,
    formState: { errors, isDirty },
    control,
    handleSubmit,
    clearErrors,
    setError,
    setFocus,
  } = useForm<FormStartPageInput>({
    mode: 'onBlur',
    defaultValues: startPageData,
  })

  // Update dirty state of builder so confirmation modal can be shown
  useEffect(() => {
    setIsDirty(isDirty)

    return () => {
      setIsDirty(false)
    }
  }, [isDirty, setIsDirty])

  const watchedInputs = useWatch({
    control: control,
  }) as UnpackNestedValue<FormStartPageInput>

  const clonedWatchedInputs = useMemo(
    () => cloneDeep(watchedInputs),
    [watchedInputs],
  )

  useDebounce(() => setStartPageData(clonedWatchedInputs), 300, [
    Object.values(clonedWatchedInputs),
  ])

  // Focus on paragraph field if state is editing instructions
  useLayoutEffect(() => {
    if (designState === DesignState.EditingInstructions) {
      // To guarantee focus is triggered even when focus is being set by
      // something else before this effect runs.
      setTimeout(() => setFocus('paragraph'), 80)
    }
  }, [designState, setFocus])

  // Save design handlers
  const uploadLogoMutation = useMutation((image: File) =>
    uploadLogo({ formId, image }),
  )

  const handleUploadLogo = useCallback(
    (attachment: UploadedImage): Promise<CustomLogoMeta> | CustomLogoMeta => {
      if (!attachment.file || !attachment.srcUrl) {
        throw new Error('Design pre-submit validation failed')
      }
      if (!attachment.srcUrl.startsWith('blob:')) {
        // Logo was not changed
        if (!customLogoMeta) {
          throw new Error('Design: customLogoMeta is undefined')
        }
        return customLogoMeta
      }
      return uploadLogoMutation
        .mutateAsync(attachment.file)
        .then((uploadedFileData) => {
          return {
            fileName: uploadedFileData.name,
            fileId: uploadedFileData.fileId,
            fileSizeInBytes: uploadedFileData.size,
          }
        })
    },
    [uploadLogoMutation, customLogoMeta],
  )

  const handleCloseDrawer = useCallback(() => handleClose(false), [handleClose])

  const handleUpdateDesign = handleSubmit(
    async (startPageData: FormStartPageInput) => {
      const { logo, attachment, estTimeTaken, ...rest } = startPageData
      const estTimeTakenTransformed =
        estTimeTaken === '' ? undefined : estTimeTaken
      if (logo.state !== FormLogoState.Custom) {
        startPageMutation.mutate(
          {
            logo: { state: logo.state },
            estTimeTaken: estTimeTakenTransformed,
            ...rest,
          },
          { onSuccess: handleCloseDrawer },
        )
      } else {
        const customLogoMeta = await handleUploadLogo(attachment)
        startPageMutation.mutate(
          {
            logo: { state: FormLogoState.Custom, ...customLogoMeta },
            estTimeTaken: estTimeTakenTransformed,
            ...rest,
          },
          { onSuccess: handleCloseDrawer },
        )
      }
    },
  )

  const handleClick = useCallback(async () => {
    handleUpdateDesign().catch((error) => {
      toast({ description: error.message })
    })
  }, [handleUpdateDesign, toast])

  if (!startPageData) return null

  return (
    <CreatePageDrawerContentContainer>
      <FormControl
        id="logo.state"
        isReadOnly={startPageMutation.isLoading}
        isInvalid={!isEmpty(errors.attachment)}
        onFocus={setToEditingHeader}
      >
        <FormLabel>Logo</FormLabel>
        <Radio.RadioGroup
          defaultValue={startPageData.logo.state}
          isDisabled={startPageMutation.isLoading}
        >
          <Radio
            allowDeselect={false}
            value={FormLogoState.Default}
            {...register('logo.state')}
          >
            {t('features.adminForm.sidebar.headerAndInstructions.logo.default')}
          </Radio>
          <Radio
            allowDeselect={false}
            value={FormLogoState.None}
            {...register('logo.state')}
          >
            {t('features.adminForm.sidebar.headerAndInstructions.logo.none')}
          </Radio>
          <Radio
            allowDeselect={false}
            value={FormLogoState.Custom}
            {...register('logo.state')}
          >
            {t('features.adminForm.sidebar.headerAndInstructions.logo.custom')}
          </Radio>
          <FormControl
            id="attachment"
            hidden={startPageData.logo.state !== FormLogoState.Custom}
            isInvalid={!isEmpty(errors.attachment)}
            ml="2.625rem"
            mt="0.5rem"
            w="auto"
          >
            <Controller
              name="attachment"
              control={control}
              rules={{
                validate: (val) => {
                  if (startPageData.logo.state !== FormLogoState.Custom)
                    return true
                  if (val?.file && val.srcUrl) return true
                  return 'Please upload a logo'
                },
              }}
              render={({ field: { onChange, ...rest } }) => (
                <UploadImageInput
                  {...rest}
                  onChange={(event) => {
                    clearErrors('attachment')
                    onChange(event)
                  }}
                  onError={(message) => setError('attachment', { message })}
                />
              )}
            />
            <FormErrorMessage>
              {get(errors, 'attachment.message')}
            </FormErrorMessage>
          </FormControl>
        </Radio.RadioGroup>
      </FormControl>

      <FormControl
        isReadOnly={startPageMutation.isLoading}
        isInvalid={!isEmpty(errors.colorTheme)}
        onFocus={setToEditingHeader}
      >
        <FormLabel>
          {t(
            'features.adminForm.sidebar.headerAndInstructions.themeColour.title',
          )}
        </FormLabel>
        <Radio.RadioGroup
          defaultValue={startPageData.colorTheme}
          isDisabled={startPageMutation.isLoading}
          flexDirection="row"
          display="inline-flex"
          flexWrap="wrap"
          maxW="100%"
        >
          {Object.values(FormColorTheme).map((color, idx) => (
            <Radio
              key={idx}
              flex={0}
              allowDeselect={false}
              value={color}
              {...register('colorTheme')}
              // CSS for inverted radio button
              border="2px solid"
              borderRadius="50%"
              borderColor="white"
              _checked={{ borderColor: getTitleBg(color) }}
              _before={{
                content: '""',
                display: 'inline-block',
                width: '16px',
                height: '16px',
                border: '2px solid',
                borderColor: 'white',
                borderRadius: '50%',
                background: getTitleBg(color),
              }}
            />
          ))}
        </Radio.RadioGroup>
        <FormErrorMessage>{errors.colorTheme?.message}</FormErrorMessage>
      </FormControl>

      <FormControl
        isReadOnly={startPageMutation.isLoading}
        isInvalid={!!errors.estTimeTaken}
        onFocus={setToEditingHeader}
      >
        <FormLabel>
          {t('features.adminForm.sidebar.headerAndInstructions.minutes')}
        </FormLabel>
        <Controller
          name="estTimeTaken"
          control={control}
          rules={{
            required: 'This field is required', //TODO: why is this field required? Seems a bit strange esp if we don't provide an initial value?
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
        <FormLabel>
          {t('features.adminForm.sidebar.headerAndInstructions.instruction')}
        </FormLabel>
        <Textarea
          onFocus={setToEditingInstructions}
          {...register('paragraph')}
        />
        <FormErrorMessage>{errors.paragraph?.message}</FormErrorMessage>
      </FormControl>

      <FormFieldDrawerActions
        isLoading={startPageMutation.isLoading}
        handleClick={handleClick}
        handleCancel={handleCloseDrawer}
        buttonText={t('features.adminForm.sidebar.headerAndInstructions.cta')}
      />
    </CreatePageDrawerContentContainer>
  )
}

export const DesignDrawer = ({
  startPage,
}: DesignDrawerProps): JSX.Element | null => {
  const { t } = useTranslation()
  const { data: { logoBucketUrl } = {} } = useEnv()

  const {
    startPageData,
    setStartPageData,
    setCustomLogoMeta,
    resetDesignStore,
  } = useDesignStore(
    useCallback(
      (state) => ({
        startPageData: startPageDataSelector(state),
        setStartPageData: setStartPageDataSelector(state),
        setCustomLogoMeta: setCustomLogoMetaSelector(state),
        resetDesignStore: resetDesignStoreSelector(state),
      }),
      [],
    ),
  )

  // Load existing start page and custom logo into drawer state
  useEffect(() => {
    setStartPageData({
      ...startPage,
      estTimeTaken: startPage.estTimeTaken || '',
      attachment:
        startPage.logo.state !== FormLogoState.Custom
          ? {}
          : {
              file: Object.defineProperty(
                new File([''], startPage.logo.fileName, {
                  type: 'image/jpeg',
                }),
                'size',
                { value: startPage.logo.fileSizeInBytes },
              ),
              srcUrl: `${logoBucketUrl}/${startPage.logo.fileId}`,
            },
    })
    if (startPage.logo.state === FormLogoState.Custom) {
      setCustomLogoMeta(startPage.logo)
    }
    return resetDesignStore
  }, [
    startPage,
    logoBucketUrl,
    resetDesignStore,
    setCustomLogoMeta,
    setStartPageData,
  ])

  if (!startPageData) return null

  return (
    <Flex pos="relative" h="100%" display="flex" flexDir="column">
      <Box pt="1rem" px="1.5rem" bg="white">
        <Flex justify="space-between">
          <Text textStyle="subhead-3" color="secondary.500" mb="1rem">
            {t('features.adminForm.sidebar.headerAndInstructions.title')}
          </Text>
          <CreatePageDrawerCloseButton />
        </Flex>
        <Divider w="auto" mx="-1.5rem" />
      </Box>
      <DesignInput />
    </Flex>
  )
}
