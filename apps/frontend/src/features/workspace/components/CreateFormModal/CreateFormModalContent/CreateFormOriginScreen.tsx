import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BiRightArrowAlt } from 'react-icons/bi'
import {
  Box,
  CheckboxGroup,
  Container,
  FormControl,
  FormHelperText,
  ModalBody,
  ModalHeader,
  Stack,
  Text,
} from '@chakra-ui/react'

import {
  CLIENT_CHECKBOX_OTHERS_INPUT_VALUE,
  FORM_ORIGIN_MEDIUM_OPTIONS,
  FORM_ORIGIN_OTHER_DETAIL_MAX_LENGTH,
} from 'formsg-shared/constants'

import Button from '~components/Button'
import Checkbox from '~components/Checkbox'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Radio from '~components/Radio'

import { useCreateFormWizard } from '../CreateFormWizardContext'

const ORIGIN_I18N_PREFIX = 'features.workspace.modals.forms.create.origin'

export const CreateFormOriginScreen = ({
  useCreateFormWizardParam = useCreateFormWizard,
}: {
  useCreateFormWizardParam?: typeof useCreateFormWizard
} = {}): JSX.Element => {
  const { t } = useTranslation()
  const {
    formMethods,
    handleCreateStorageModeOrMultirespondentForm,
    goToFormDetails,
    isLoading,
  } = useCreateFormWizardParam()
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = formMethods

  const formOriginProcess = watch('formOriginProcess')
  const formOrigins = watch('formOrigins')
  const isOthersSelected = (formOrigins?.value ?? []).includes(
    CLIENT_CHECKBOX_OTHERS_INPUT_VALUE,
  )
  const otherDetailLength = (formOrigins?.othersInput ?? '').length

  return (
    <>
      <ModalHeader color="secondary.700">
        <Container maxW="45rem" p={0}>
          {t(`${ORIGIN_I18N_PREFIX}.topicSentence`)}
        </Container>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap">
        <Container maxW="45rem" p={0}>
          <FormControl
            isRequired
            isInvalid={!!errors.formOriginProcess}
            mb="1.5rem"
          >
            <FormLabel>{t(`${ORIGIN_I18N_PREFIX}.q1.label`)}</FormLabel>
            <Controller
              name="formOriginProcess"
              control={control}
              rules={{
                required: t(`${ORIGIN_I18N_PREFIX}.errors.q1Required`),
              }}
              render={({ field: { value, onChange } }) => (
                <Radio.RadioGroup value={value ?? ''} onChange={onChange}>
                  <Stack spacing="0.5rem">
                    <Radio value="new">
                      {t(`${ORIGIN_I18N_PREFIX}.q1.options.new`)}
                    </Radio>
                    <Radio value="existing">
                      {t(`${ORIGIN_I18N_PREFIX}.q1.options.existing`)}
                    </Radio>
                  </Stack>
                </Radio.RadioGroup>
              )}
            />
            <FormErrorMessage>
              {errors.formOriginProcess?.message}
            </FormErrorMessage>
          </FormControl>

          <Controller
            name="formOrigins.value"
            control={control}
            defaultValue={[]}
            rules={{
              validate: (value) =>
                formOriginProcess !== 'existing' ||
                (Array.isArray(value) && value.length > 0) ||
                t(`${ORIGIN_I18N_PREFIX}.errors.atLeastOne`),
            }}
            render={({ field: { value, onChange } }) =>
              formOriginProcess === 'existing' ? (
                <FormControl
                  isRequired
                  isInvalid={!!errors.formOrigins?.value}
                  mb="1rem"
                >
                  <FormLabel>{t(`${ORIGIN_I18N_PREFIX}.q2.label`)}</FormLabel>
                  <CheckboxGroup value={value ?? []} onChange={onChange}>
                    <Stack spacing="0.5rem">
                      {FORM_ORIGIN_MEDIUM_OPTIONS.map((code) => (
                        <Checkbox key={code} value={code}>
                          {t(`${ORIGIN_I18N_PREFIX}.q2.options.${code}`)}
                        </Checkbox>
                      ))}
                      <>
                        <Checkbox value={CLIENT_CHECKBOX_OTHERS_INPUT_VALUE}>
                          {t(`${ORIGIN_I18N_PREFIX}.q2.options.others`)}
                        </Checkbox>
                        {isOthersSelected && (
                          <Box pl="2.25rem">
                            <FormControl
                              isRequired
                              isInvalid={!!errors.formOrigins?.othersInput}
                            >
                              <Input
                                aria-label={t(
                                  `${ORIGIN_I18N_PREFIX}.otherInputLabel`,
                                )}
                                {...register('formOrigins.othersInput', {
                                  validate: (detail) =>
                                    !isOthersSelected ||
                                    !!detail?.trim() ||
                                    t(
                                      `${ORIGIN_I18N_PREFIX}.errors.otherRequired`,
                                    ),
                                  maxLength: {
                                    value: FORM_ORIGIN_OTHER_DETAIL_MAX_LENGTH,
                                    message: t(
                                      `${ORIGIN_I18N_PREFIX}.errors.otherMaxLength`,
                                      {
                                        maxLength:
                                          FORM_ORIGIN_OTHER_DETAIL_MAX_LENGTH,
                                      },
                                    ),
                                  },
                                })}
                              />
                              <FormErrorMessage>
                                {errors.formOrigins?.othersInput?.message}
                              </FormErrorMessage>
                              {!errors.formOrigins?.othersInput?.message &&
                              otherDetailLength > 0 ? (
                                <FormHelperText>
                                  {`(${otherDetailLength}/${FORM_ORIGIN_OTHER_DETAIL_MAX_LENGTH})`}
                                </FormHelperText>
                              ) : undefined}
                            </FormControl>
                          </Box>
                        )}
                      </>
                    </Stack>
                  </CheckboxGroup>
                  <FormErrorMessage>
                    {errors.formOrigins?.value?.message}
                  </FormErrorMessage>
                </FormControl>
              ) : (
                <></>
              )
            }
          />

          <Stack mt="2.5rem" spacing="0.75rem" align="center">
            <Button
              rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
              type="submit"
              isLoading={isLoading}
              onClick={handleCreateStorageModeOrMultirespondentForm}
              isFullWidth
              data-dd-action-name="dashboard.create.origin_next"
            >
              <Text lineHeight="1.5rem">
                {t(`${ORIGIN_I18N_PREFIX}.cta.next`)}
              </Text>
            </Button>
            <Button isFullWidth variant="clear" onClick={goToFormDetails}>
              <Text lineHeight="1.5rem">
                {t(`${ORIGIN_I18N_PREFIX}.cta.back`)}
              </Text>
            </Button>
          </Stack>
        </Container>
      </ModalBody>
    </>
  )
}
