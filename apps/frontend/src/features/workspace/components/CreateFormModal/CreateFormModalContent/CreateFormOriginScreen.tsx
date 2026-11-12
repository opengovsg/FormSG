import { Controller } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BiRightArrowAlt } from 'react-icons/bi'
import {
  Container,
  FormControl,
  ModalBody,
  ModalHeader,
  Stack,
  Text,
} from '@chakra-ui/react'

import { FORM_ORIGIN_OPTIONS } from 'formsg-shared/constants'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
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
    formState: { errors },
  } = formMethods

  const question = t(`${ORIGIN_I18N_PREFIX}.question`)

  return (
    <>
      <ModalHeader color="secondary.700">
        <Container maxW="45rem" p={0}>
          {question}
        </Container>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap">
        <Container maxW="45rem" p={0}>
          <FormControl isRequired isInvalid={!!errors.formOrigin}>
            <Controller
              name="formOrigin"
              control={control}
              rules={{
                required: t(`${ORIGIN_I18N_PREFIX}.errors.required`),
              }}
              render={({ field: { value, onChange } }) => (
                <Radio.RadioGroup
                  aria-label={question}
                  value={value ?? ''}
                  onChange={onChange}
                >
                  <Stack spacing="0.5rem">
                    {FORM_ORIGIN_OPTIONS.map((code) => (
                      <Radio key={code} value={code}>
                        {t(`${ORIGIN_I18N_PREFIX}.options.${code}`)}
                      </Radio>
                    ))}
                  </Stack>
                </Radio.RadioGroup>
              )}
            />
            <FormErrorMessage>{errors.formOrigin?.message}</FormErrorMessage>
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
