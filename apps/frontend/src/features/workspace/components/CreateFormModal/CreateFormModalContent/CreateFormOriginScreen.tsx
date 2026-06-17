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
  FORM_ORIGIN_OPTIONS,
  FORM_ORIGIN_OTHER_DETAIL_MAX_LENGTH,
} from 'formsg-shared/constants'

import Button from '~components/Button'
import Checkbox from '~components/Checkbox'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Input from '~components/Input'

import { useCreateFormWizard } from '../CreateFormWizardContext'

const ORIGIN_I18N_PREFIX = 'features.workspace.modals.forms.create.origin'

/**
 * Screen 2 of the post-MRF-cutover create flow (behind
 * `enablePaperTrackingSetUpPage`): asks where the form is being filled today as
 * a multi-select, then creates the form carrying the selected origins.
 *
 * The field is the backend's `CheckboxFieldResponsesV3` shape directly: the
 * selected origin codes (and the CLIENT_CHECKBOX_OTHERS_INPUT_VALUE sentinel
 * when "Other" is ticked) live in `formOrigins.value`, and the "Other" free
 * text in `formOrigins.othersInput`. No mapping happens on submit.
 */
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

  const formOrigins = watch('formOrigins')
  const isOthersSelected = (formOrigins?.value ?? []).includes(
    CLIENT_CHECKBOX_OTHERS_INPUT_VALUE,
  )
  const otherDetailLength = (formOrigins?.othersInput ?? '').length

  return (
    <>
      <ModalHeader color="secondary.700">
        <Container maxW="42.5rem" p={0}>
          {t(`${ORIGIN_I18N_PREFIX}.question`)}
        </Container>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap">
        <Container maxW="42.5rem" p={0}>
          <FormControl
            isRequired
            isInvalid={!!errors.formOrigins?.value}
            mb="1rem"
          >
            <Controller
              name="formOrigins.value"
              control={control}
              rules={{
                validate: (value) =>
                  (Array.isArray(value) && value.length > 0) ||
                  t(`${ORIGIN_I18N_PREFIX}.errors.atLeastOne`),
              }}
              render={({ field: { value, onChange } }) => (
                <CheckboxGroup value={value ?? []} onChange={onChange}>
                  <Stack spacing="0.5rem">
                    {FORM_ORIGIN_OPTIONS.map((code) => (
                      <Checkbox key={code} value={code}>
                        {t(`${ORIGIN_I18N_PREFIX}.options.${code}`)}
                      </Checkbox>
                    ))}
                    <>
                      <Checkbox value={CLIENT_CHECKBOX_OTHERS_INPUT_VALUE}>
                        {t(`${ORIGIN_I18N_PREFIX}.options.others`)}
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
                            {/* Character count helper, mirroring the AI form
                                builder (magic-form-builder) text prompt: shown
                                only while there's input and no error. */}
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
              )}
            />
            <FormErrorMessage>
              {errors.formOrigins?.value?.message}
            </FormErrorMessage>
          </FormControl>

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
            {/* Back control sits below "Next step" and centred (placement per
                PM/design). The Back affordance itself is not in Figma Screen 2a;
                added to satisfy the slice's back-navigation requirement. */}
            <Button variant="clear" onClick={goToFormDetails}>
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
