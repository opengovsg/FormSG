import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BiMessage } from 'react-icons/bi'
import { IoMdCloseCircle } from 'react-icons/io'
import { Box, FormControl, HStack, Icon, Stack, Text } from '@chakra-ui/react'
import { extend, pick } from 'lodash'

import { MobileFieldBase } from '~shared/types/field'

import { createBaseValidationRules } from '~utils/fieldValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Link from '~components/Link'
import Textarea from '~components/Textarea'
import Toggle from '~components/Toggle'

import { CreatePageDrawerContentContainer } from '../../../../../common'
import { FormFieldDrawerActions } from '../common/FormFieldDrawerActions'
import { EditFieldProps } from '../common/types'
import { useEditFieldForm } from '../common/useEditFieldForm'

const EDIT_MOBILE_KEYS = [
  'title',
  'description',
  'required',
  'isVerifiable',
  'allowIntlNumbers',
] as const

type EditMobileProps = EditFieldProps<MobileFieldBase>

type EditMobileInputs = Pick<MobileFieldBase, (typeof EDIT_MOBILE_KEYS)[number]>

const OTPVerificationTextStack = (): JSX.Element => {
  const { t } = useTranslation()
  return (
    <Stack mt={4} spacing={2}>
      <HStack>
        <Icon as={BiMessage} />
        <Text textStyle="body-2">
          {'0' + // TODO: update count with a call to DB
            t(
              'features.adminForm.sidebar.fields.mobileNo.otpVerification.smsUsed',
            )}
        </Text>
      </HStack>
      <HStack>
        <Icon as={IoMdCloseCircle} />
        <Text textStyle="body-2">
          {t(
            'features.adminForm.sidebar.fields.mobileNo.otpVerification.thresholdWarning',
          )}
        </Text>
        <Link
          textStyle="body-2"
          href={'https://go.gov.sg/form-support'}
          isExternal
        >
          {t(
            'features.adminForm.sidebar.fields.mobileNo.otpVerification.contact',
          )}
        </Link>
      </HStack>
    </Stack>
  )
}

export const EditMobile = ({ field }: EditMobileProps): JSX.Element => {
  const { t } = useTranslation()
  const {
    register,
    formState: { errors },
    buttonText,
    handleUpdateField,
    isLoading,
    handleCancel,
  } = useEditFieldForm<EditMobileInputs, MobileFieldBase>({
    field,
    transform: {
      input: (inputField) => pick(inputField, EDIT_MOBILE_KEYS),
      output: (formOutput, originalField) =>
        extend({}, originalField, formOutput),
    },
  })

  const requiredValidationRule = useMemo(
    () =>
      createBaseValidationRules<EditMobileInputs, 'title'>({
        required: true,
      }),
    [],
  )

  return (
    <>
      <CreatePageDrawerContentContainer>
        <FormControl
          isRequired
          isReadOnly={isLoading}
          isInvalid={!!errors.title}
        >
          <FormLabel>
            {t('features.adminForm.sidebar.fields.commonFieldComponents.title')}
          </FormLabel>
          <Input autoFocus {...register('title', requiredValidationRule)} />
          <FormErrorMessage>{errors?.title?.message}</FormErrorMessage>
        </FormControl>
        <FormControl
          isRequired
          isReadOnly={isLoading}
          isInvalid={!!errors.description}
        >
          <FormLabel>
            {t(
              'features.adminForm.sidebar.fields.commonFieldComponents.description',
            )}
          </FormLabel>
          <Textarea {...register('description')} />
          <FormErrorMessage>{errors?.description?.message}</FormErrorMessage>
        </FormControl>
        <FormControl isReadOnly={isLoading}>
          <Toggle
            {...register('required')}
            label={t(
              'features.adminForm.sidebar.fields.commonFieldComponents.required',
            )}
          />
        </FormControl>
        <FormControl isReadOnly={isLoading}>
          <Toggle
            {...register('allowIntlNumbers')}
            label={t(
              'features.adminForm.sidebar.fields.mobileNo.allowInternationalNumber',
            )}
          />
        </FormControl>
        <Box>
          <FormControl isReadOnly={isLoading}>
            <Toggle
              {...register('isVerifiable')}
              label={t(
                'features.adminForm.sidebar.fields.email.otpVerification.title',
              )}
              description={t(
                'features.adminForm.sidebar.fields.email.otpVerification.description',
              )}
            />
          </FormControl>
          <OTPVerificationTextStack />
        </Box>
        <FormFieldDrawerActions
          isLoading={isLoading}
          buttonText={buttonText}
          handleClick={handleUpdateField}
          handleCancel={handleCancel}
        />
      </CreatePageDrawerContentContainer>
    </>
  )
}
