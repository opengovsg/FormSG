import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Controller,
  UnpackNestedValue,
  useForm,
  useWatch,
} from 'react-hook-form'
import { useMutation } from 'react-query'
import { useParams } from 'react-router-dom'
import { useDebounce } from 'react-use'
import {
  Box,
  Button,
  Divider,
  Flex,
  FormControl,
  FormLabel,
  Skeleton,
  Stack,
  Tabs,
  Text,
  Textarea,
  toast,
} from '@chakra-ui/react'
import { resetTelemetry } from '@datadog/browser-core'
import { cloneDeep, get, isEmpty } from 'lodash'

import {
  MAX_UPLOAD_FILE_SIZE,
  MB,
  VALID_UPLOAD_FILE_TYPES,
} from '~shared/constants/file'
import {
  CustomFormLogo,
  FormColorTheme,
  FormLogoState,
  FormStartPage,
} from '~shared/types'

import { useIsMobile } from '~hooks/useIsMobile'
import { useToast } from '~hooks/useToast'
import { UploadedFileData, uploadLogo } from '~services/FileHandlerService'
import Attachment from '~components/Field/Attachment'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import NumberInput from '~components/NumberInput'
import Radio from '~components/Radio'

import { useMutateFormPage } from '~features/admin-form/common/mutations'
import { useCreatePageSidebar } from '~features/admin-form/create/common/CreatePageSidebarContext'
import { useEnv } from '~features/env/queries'
import { getTitleBg } from '~features/public-form/components/FormStartPage/useFormHeader'

import { useCreateTabForm } from '../../useCreateTabForm'
import {
  CustomLogoMeta,
  customLogoMetaDataSelector,
  FormStartPageInput,
  resetCustomLogoMetaDataSelector,
  resetDesignStoreSelector,
  setCustomLogoFileSelector,
  setCustomLogoMetaDataSelector,
  setStartPageInputDataSelector,
  startPageInputDataSelector,
  useDesignStore,
} from '../../useDesignStore'
import { validateNumberInput } from '../../utils/validateNumberInput'
import { CreatePageDrawerCloseButton } from '../CreatePageDrawerCloseButton'
import { DrawerContentContainer } from '../EditFieldDrawer/edit-fieldtype/common/DrawerContentContainer'
import { FormFieldDrawerActions } from '../EditFieldDrawer/edit-fieldtype/common/FormFieldDrawerActions'
import { UploadImageInput } from '../EditFieldDrawer/edit-fieldtype/EditImage/UploadImageInput'

export const DesignDrawer = (): JSX.Element | null => {
  const { data: form } = useCreateTabForm()

  const isMobile = useIsMobile()
  const toast = useToast({ status: 'danger' })
  const { data: form } = useCreateTabForm()
  const { formId } = useParams()
  if (!formId) throw new Error('No formId provided')

  const { startPageMutation } = useMutateFormPage()
  const { data: { logoBucketUrl } = {} } = useEnv()
  const { handleClose } = useCreatePageSidebar()

  const [existingCustomLogoFetched, setExistingCustomLogoFetched] =
    useState<boolean>(startPage.logo.state !== FormLogoState.Custom)

  const isLoading = useMemo(
    () => startPageMutation.isLoading || !existingCustomLogoFetched,
    [startPageMutation.isLoading, existingCustomLogoFetched],
  )

  const {
    startPageData,
    customLogoMeta,
    setStartPageData,
    setCustomLogoFile,
    setCustomLogoMeta,
    resetCustomLogoMeta,
    resetDesignStore,
  } = useDesignStore((state) => ({
    startPageData: startPageInputDataSelector(state),
    customLogoMeta: customLogoMetaDataSelector(state),
    setStartPageData: setStartPageInputDataSelector(state),
    setCustomLogoFile: setCustomLogoFileSelector(state),
    setCustomLogoMeta: setCustomLogoMetaDataSelector(state),
    resetCustomLogoMeta: resetCustomLogoMetaDataSelector(state),
    resetDesignStore: resetDesignStoreSelector(state),
  }))

  const {
    register,
    formState: { errors, isDirty },
    control,
    handleSubmit,
    resetField,
    clearErrors,
    setError,
  } = useForm<FormStartPageInput>({
    mode: 'onBlur',
    defaultValues: { ...startPage, customLogoFile: {} },
  })

  // On mount, fetch custom logo file to display as part of attachment field.
  const setCustomLogoFileOnMount = useCallback(
    async (logo: CustomFormLogo) => {
      const srcUrl = `${logoBucketUrl}/${logo.fileId}`
      const customLogoBlob = await fetch(srcUrl).then((res) => res.blob())
      setCustomLogoFile({
        file: new File([customLogoBlob], logo.fileName),
        srcUrl,
      })
      setExistingCustomLogoFetched(true)
    },
    [logoBucketUrl, setCustomLogoFile],
  )

  // Load existing start page and custom logo into form when user opens drawer
  useEffect(() => {
    setStartPageData({ ...startPage, customLogoFile: {} } as FormStartPageInput)
    if (startPage.logo.state === FormLogoState.Custom) {
      setCustomLogoFileOnMount(startPage.logo)
      setCustomLogoMeta(startPage.logo)
    }
    return () => resetDesignStore()
  }, [])

  useEffect(
    () =>
      resetField('customLogoFile', {
        defaultValue: startPageData?.customLogoFile,
      }),
    [existingCustomLogoFetched],
  )

  const watchedInputs = useWatch({
    control: control,
  }) as UnpackNestedValue<FormStartPageInput>

  const clonedWatchedInputs = useMemo(
    () => cloneDeep(watchedInputs),
    [watchedInputs],
  )

  useDebounce(
    () => {
      console.log(clonedWatchedInputs)
      setStartPageData(clonedWatchedInputs)
    },
    300,
    [clonedWatchedInputs],
  )

  // Save design functions
  const uploadLogoMutation = useMutation((image: File) =>
    uploadLogo({ formId, image }),
  )

  const handleUploadLogo = useCallback(
    (startPageData: FormStartPageInput): Promise<CustomLogoMeta> | null => {
      if (startPageData?.logo.state !== FormLogoState.Custom) return null
      if (
        !startPageData.customLogoFile.file ||
        !startPageData.customLogoFile.srcUrl
      )
        throw new Error('Design pre-submit validation failed')
      if (!startPageData.customLogoFile.srcUrl.startsWith('blob:')) return null
      return uploadLogoMutation
        .mutateAsync(startPageData.customLogoFile.file)
        .then((uploadedFileData) => {
          return {
            fileName: uploadedFileData.name,
            fileId: uploadedFileData.fileId,
            fileSizeInBytes: uploadedFileData.size,
          }
        })
    },
    [uploadLogoMutation],
  )

  const handleUpdateDesign = handleSubmit(
    async (startPageData: FormStartPageInput) => {
      const { logo, customLogoFile, estTimeTaken, ...rest } = startPageData
      const estTimeTakenTransformed =
        estTimeTaken === '' ? undefined : estTimeTaken
      if (logo.state !== FormLogoState.Custom)
        startPageMutation.mutate(
          {
            logo: { state: logo.state },
            estTimeTaken: estTimeTakenTransformed,
            ...rest,
          },
          { onSuccess: handleClose },
        )
      else {
        const customLogoMeta = await handleUploadLogo(startPageData)
        if (!customLogoMeta)
          throw new Error('Logo upload failed, please try again later')
        startPageMutation.mutate(
          {
            logo: { state: FormLogoState.Custom, ...customLogoMeta },
            estTimeTaken: estTimeTakenTransformed,
            ...rest,
          },
          { onSuccess: handleClose },
        )
      }
    },
  )

  const handleClick = useCallback(async () => {
    handleUpdateDesign().catch((error) => {
      toast({ description: error.message })
    })
  }, [handleUpdateDesign, toast])

  const handleCancel = useCallback(() => handleClose(), [handleClose])

  if (!startPageData) return null

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
          isReadOnly={isLoading}
          isInvalid={!isEmpty(errors.customLogoFile)}
        >
          <FormLabel>Logo</FormLabel>
          <Radio.RadioGroup
            value={startPageData.logo.state}
            isDisabled={isLoading}
          >
            <Radio value={FormLogoState.Default} {...register('logo.state')}>
              Default
            </Radio>
            <Radio value={FormLogoState.None} {...register('logo.state')}>
              None
            </Radio>
            <Radio value={FormLogoState.Custom} {...register('logo.state')}>
              Upload custom logo (jpg, png, or gif)
            </Radio>
          </Radio.RadioGroup>
          <Box ml="45px" mt="0.5rem">
            <Box
              hidden={
                startPageData.logo.state !== FormLogoState.Custom ||
                !existingCustomLogoFetched
              }
            >
              <Controller
                name="customLogoFile"
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
                      clearErrors('customLogoFile')
                      onChange(event)
                    }}
                    onError={(message) =>
                      setError('customLogoFile', { message })
                    }
                  />
                )}
              />
              <FormErrorMessage>
                {get(errors, 'customLogoFile.message')}
              </FormErrorMessage>
            </Box>
            <Skeleton w="100%" h="4.5rem" hidden={existingCustomLogoFetched} />
          </Box>
        </FormControl>

        <FormControl
          isReadOnly={isLoading}
          isInvalid={!isEmpty(errors.colorTheme)}
        >
          <FormLabel>Theme colour</FormLabel>
          <Radio.RadioGroup
            value={startPageData.colorTheme}
            isDisabled={isLoading}
          >
            <Stack spacing={0} direction="row" display="inline">
              {Object.values(FormColorTheme).map((color) => (
                <Radio
                  display="inline"
                  width="1rem"
                  value={color}
                  {...register('colorTheme')}
                  // CSS for inverted radio button
                  // TODO: anti-aliasing at interface of border and ::before
                  border="2px solid"
                  borderRadius="50%"
                  borderColor="white"
                  background={getTitleBg(color)}
                  _checked={{
                    borderColor: getTitleBg(color),
                  }}
                  _before={{
                    content: '""',
                    display: 'inline-block',
                    width: '20px',
                    height: '20px',
                    border: '2px solid',
                    borderColor: 'white',
                    borderRadius: '50%',
                  }}
                />
              ))}
            </Stack>
          </Radio.RadioGroup>
          <FormErrorMessage>{errors.colorTheme?.message}</FormErrorMessage>
        </FormControl>

        <FormControl isReadOnly={isLoading} isInvalid={!!errors.estTimeTaken}>
          <FormLabel>Time taken to complete form (minutes)</FormLabel>
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

        <FormControl isReadOnly={isLoading} isInvalid={!!errors.paragraph}>
          <FormLabel>Instructions for your form</FormLabel>
          <Textarea {...register('paragraph')} />
          <FormErrorMessage>{errors.paragraph?.message}</FormErrorMessage>
        </FormControl>

        <FormFieldDrawerActions
          isLoading={isLoading}
          isSaveEnabled={isDirty}
          handleClick={handleClick}
          handleCancel={handleCancel}
          buttonText="Save design"
        />
      </DrawerContentContainer>
    </Tabs>
  )
}
