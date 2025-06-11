import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, FormControl, useDisclosure } from '@chakra-ui/react'
import { extend, pick } from 'lodash'

import { SmsCountsDto } from '~shared/types'
import { MobileFieldBase } from '~shared/types/field'

import { createBaseValidationRules } from '~utils/fieldValidation'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Textarea from '~components/Textarea'
import Toggle from '~components/Toggle'

import { useSmsQuota } from '~features/admin-form/common/queries'

import { CreatePageDrawerContentContainer } from '../../../../../common'
import { FormFieldDrawerActions } from '../common/FormFieldDrawerActions'
import { EditFieldProps } from '../common/types'
import { useEditFieldForm } from '../common/useEditFieldForm'

import { ContactSupportMessage } from './ContactSupportMessage'
import { SmsCountMessage } from './SmsCountMessage'
import { SmsCountsModal } from './SmsCountsModal'

const EDIT_MOBILE_KEYS = [
  'title',
  'description',
  'required',
  'isVerifiable',
  'allowIntlNumbers',
] as const

type EditMobileProps = EditFieldProps<MobileFieldBase>

type EditMobileInputs = Pick<MobileFieldBase, (typeof EDIT_MOBILE_KEYS)[number]>

export const EditMobile = ({ field }: EditMobileProps): JSX.Element => {
  const { t } = useTranslation()
  const {
    register,
    formState: { errors },
    buttonText,
    handleUpdateField,
    isLoading,
    handleCancel,
    watch,
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

  const showOTPText = watch('isVerifiable')

  const { data: smsCount } = useSmsQuota()
  // const smsCount: SmsCountsDto = {
  //   quota: 10000,
  //   smsCounts: 5,
  // }

  const smsCountsDisclosure = useDisclosure()

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
              {...register('isVerifiable', {
                onChange: (e) => {
                  if (e.target.checked) {
                    smsCountsDisclosure.onOpen()
                  }
                },
              })}
              label={t(
                'features.adminForm.sidebar.fields.email.otpVerification.title',
              )}
              description={t(
                'features.adminForm.sidebar.fields.email.otpVerification.description',
              )}
            />
          </FormControl>
          {showOTPText && (
            <Box>
              <SmsCountMessage smsCount={smsCount} />
              <ContactSupportMessage />
            </Box>
          )}
        </Box>
        <FormFieldDrawerActions
          isLoading={isLoading}
          buttonText={buttonText}
          handleClick={handleUpdateField}
          handleCancel={handleCancel}
        />
      </CreatePageDrawerContentContainer>
      <SmsCountsModal
        smsCount={smsCount}
        isOpen={smsCountsDisclosure.isOpen}
        onClose={smsCountsDisclosure.onClose}
      />
    </>
  )
}
