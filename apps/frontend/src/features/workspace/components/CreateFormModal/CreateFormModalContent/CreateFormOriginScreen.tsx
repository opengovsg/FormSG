import { Fragment } from 'react'
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
} from 'formsg-shared/constants'

import Button from '~components/Button'
import Checkbox from '~components/Checkbox'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Input from '~components/Input'

import { useCreateFormWizard } from '../CreateFormWizardContext'

// Paper-forms tracking: UI-only validation copy for the origin step. Option
// labels and the question text are sourced from i18n (keyed by FormOrigin code),
// matching the shipped backend which keeps display copy out of the shared
// constants; these error strings live alongside the field.
const FORM_ORIGIN_AT_LEAST_ONE_ERROR = 'Please select at least 1 option.'
const FORM_ORIGIN_OTHER_DETAIL_REQUIRED_ERROR =
  'Please specify a value for the "others" option'
// Mirrors the form-title cap (200 chars). Soft cap via a react-hook-form rule,
// matching useFormTitleValidationRules — the admin sees an error rather than
// being silently truncated.
const FORM_ORIGIN_OTHER_DETAIL_MAX_LENGTH = 200
const FORM_ORIGIN_OTHER_DETAIL_MAX_LENGTH_ERROR = `Please use ${FORM_ORIGIN_OTHER_DETAIL_MAX_LENGTH} characters or fewer.`

const ORIGIN_I18N_PREFIX = 'features.workspace.modals.forms.create.origin'

/**
 * Screen 2 of the post-MRF-cutover create flow (behind
 * `enablePaperTrackingSetUpPage`): asks where the form is being filled today as
 * a multi-select, then creates the form carrying the selected origins.
 *
 * The field value is the list of selected origin codes; "Other" is the
 * checkbox's built-in option, carried as the CLIENT_CHECKBOX_OTHERS_INPUT_VALUE
 * sentinel with its free text in `formOriginOtherDetail`. The provider maps
 * this to the backend's `{ value, othersInput }` shape on submit.
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
    goBackToDetails,
    isLoading,
  } = useCreateFormWizardParam()
  const {
    control,
    register,
    watch,
    formState: { errors },
  } = formMethods

  const isOthersSelected = (watch('formOrigins') ?? []).includes(
    CLIENT_CHECKBOX_OTHERS_INPUT_VALUE,
  )
  const otherDetailLength = (watch('formOriginOtherDetail') ?? '').length

  return (
    <>
      <ModalHeader color="secondary.700">
        <Container maxW="42.5rem" p={0}>
          {t(`${ORIGIN_I18N_PREFIX}.question`)}
        </Container>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap">
        <Container maxW="42.5rem" p={0}>
          <FormControl isRequired isInvalid={!!errors.formOrigins} mb="1rem">
            <Controller
              name="formOrigins"
              control={control}
              rules={{
                validate: (value) =>
                  (Array.isArray(value) && value.length > 0) ||
                  FORM_ORIGIN_AT_LEAST_ONE_ERROR,
              }}
              render={({ field: { value, onChange } }) => (
                <CheckboxGroup value={value ?? []} onChange={onChange}>
                  <Stack spacing="0.5rem">
                    {FORM_ORIGIN_OPTIONS.map((code) => (
                      <Checkbox key={code} value={code}>
                        {t(`${ORIGIN_I18N_PREFIX}.options.${code}`)}
                      </Checkbox>
                    ))}
                    <Fragment>
                      <Checkbox value={CLIENT_CHECKBOX_OTHERS_INPUT_VALUE}>
                        {t(`${ORIGIN_I18N_PREFIX}.options.others`)}
                      </Checkbox>
                      {isOthersSelected && (
                        <Box pl="2.25rem">
                          <FormControl
                            isRequired
                            isInvalid={!!errors.formOriginOtherDetail}
                          >
                            <Input
                              aria-label="Other source"
                              {...register('formOriginOtherDetail', {
                                validate: (detail) =>
                                  !isOthersSelected ||
                                  !!detail?.trim() ||
                                  FORM_ORIGIN_OTHER_DETAIL_REQUIRED_ERROR,
                                maxLength: {
                                  value: FORM_ORIGIN_OTHER_DETAIL_MAX_LENGTH,
                                  message:
                                    FORM_ORIGIN_OTHER_DETAIL_MAX_LENGTH_ERROR,
                                },
                              })}
                            />
                            <FormErrorMessage>
                              {errors.formOriginOtherDetail?.message}
                            </FormErrorMessage>
                            {/* Character count helper, mirroring the AI form
                                builder (magic-form-builder) text prompt: shown
                                only while there's input and no error. */}
                            {!errors.formOriginOtherDetail?.message &&
                            otherDetailLength > 0 ? (
                              <FormHelperText>
                                {`(${otherDetailLength}/${FORM_ORIGIN_OTHER_DETAIL_MAX_LENGTH})`}
                              </FormHelperText>
                            ) : undefined}
                          </FormControl>
                        </Box>
                      )}
                    </Fragment>
                  </Stack>
                </CheckboxGroup>
              )}
            />
            <FormErrorMessage>{errors.formOrigins?.message}</FormErrorMessage>
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
              <Text lineHeight="1.5rem">Next step</Text>
            </Button>
            {/* Back control sits below "Next step" and centred (placement per
                PM/design). The Back affordance itself is not in Figma Screen 2a;
                added to satisfy the slice's back-navigation requirement. */}
            <Button variant="clear" onClick={goBackToDetails}>
              <Text lineHeight="1.5rem">Back</Text>
            </Button>
          </Stack>
        </Container>
      </ModalBody>
    </>
  )
}
