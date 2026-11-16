import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  FormControl,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Stack,
  Text,
  useBreakpointValue,
} from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags, FORM_ORIGIN_OPTIONS } from 'formsg-shared/constants'
import { FormOrigin, FormResponseMode } from 'formsg-shared/types/form/form'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Radio from '~components/Radio'

import { useMutateFormSettings } from '~features/admin-form/settings/mutations'

import { OPENED_FROM_DASHBOARD_STATE } from '../openedFromDashboard'
import { useAdminFormCollaborators } from '../queries'

// Same question and answers as the origin step when creating a form.
const ORIGIN_I18N_PREFIX = 'features.workspace.modals.forms.create.origin'

// The report card measures paper conversions from Jul 2025, so older forms
// aren't asked.
const ASK_FORMS_CREATED_FROM = new Date('2025-07-01T00:00:00+08:00')

/**
 * Asks how a form's information was collected before FormSG, when an owner
 * or editor opens a form with no saved origin from the dashboard.
 */
export const FormOriginOnEntryModal = (): JSX.Element | null => {
  const { t } = useTranslation()
  const { state, pathname } = useLocation()
  const navigate = useNavigate()
  const { formId } = useParams()
  const { form, hasEditAccess } = useAdminFormCollaborators(formId ?? '')
  const isPaperTrackingEnabled = useFeatureIsOn(
    featureFlags.enablePaperTrackingSetUpPage,
  )
  const { mutateFormOrigins } = useMutateFormSettings()
  const [answer, setAnswer] = useState<FormOrigin>()
  const [hasTriedSubmit, setHasTriedSubmit] = useState(false)
  const modalSize = useBreakpointValue({
    base: 'mobile',
    xs: 'mobile',
    md: 'md',
  })

  const hasDashboardMarker = !!(
    state as typeof OPENED_FROM_DASHBOARD_STATE | null
  )?.openedFromDashboard
  // Read the marker once. Browsers keep router state across a reload, so it
  // is cleared from the history entry straight away (as
  // OpenWorkflowTabOnArrival does) and remembered here instead.
  const [isOpenedFromDashboard, setIsOpenedFromDashboard] =
    useState(hasDashboardMarker)
  useEffect(() => {
    if (hasDashboardMarker) {
      navigate(pathname, { replace: true, state: null })
    }
  }, [hasDashboardMarker, navigate, pathname])

  const shouldAsk =
    isPaperTrackingEnabled &&
    isOpenedFromDashboard &&
    hasEditAccess &&
    !!form &&
    form.responseMode !== FormResponseMode.Email &&
    new Date(form.created) >= ASK_FORMS_CREATED_FROM &&
    !form.metadata?.formOrigins?.value.length

  if (!shouldAsk) return null

  // Stays closed until the next time the form is opened from the dashboard.
  const close = () => setIsOpenedFromDashboard(false)

  const handleSubmit = () => {
    setHasTriedSubmit(true)
    if (!answer) return
    mutateFormOrigins.mutate(answer, { onSuccess: close })
  }

  const question = t(`${ORIGIN_I18N_PREFIX}.question`)

  return (
    <Modal isOpen onClose={close} size={modalSize}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader color="secondary.700">{question}</ModalHeader>
        <ModalBody>
          <Stack spacing="1.5rem">
            <Text textStyle="body-2" color="secondary.500">
              {t('features.adminForm.modals.formOrigin.description')}
            </Text>
            <FormControl
              isRequired
              isInvalid={hasTriedSubmit && !answer}
              isDisabled={mutateFormOrigins.isLoading}
            >
              <Radio.RadioGroup
                aria-label={question}
                value={answer ?? ''}
                onChange={(value) => setAnswer(value as FormOrigin)}
              >
                <Stack spacing="0.5rem">
                  {FORM_ORIGIN_OPTIONS.map((code) => (
                    <Radio key={code} value={code}>
                      {t(`${ORIGIN_I18N_PREFIX}.options.${code}`)}
                    </Radio>
                  ))}
                </Stack>
              </Radio.RadioGroup>
              <FormErrorMessage>
                {t(`${ORIGIN_I18N_PREFIX}.errors.required`)}
              </FormErrorMessage>
            </FormControl>
          </Stack>
        </ModalBody>
        <ModalFooter>
          <Stack
            direction={{ base: 'column-reverse', md: 'row' }}
            w="100%"
            justify="flex-end"
          >
            <Button variant="clear" colorScheme="secondary" onClick={close}>
              {t('features.common.cancel')}
            </Button>
            <Button
              isLoading={mutateFormOrigins.isLoading}
              onClick={handleSubmit}
            >
              {t('features.common.submit')}
            </Button>
          </Stack>
        </ModalFooter>
      </ModalContent>
    </Modal>
  )
}
