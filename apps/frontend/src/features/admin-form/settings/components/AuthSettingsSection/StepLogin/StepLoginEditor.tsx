import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BiUndo } from 'react-icons/bi'
import {
  Box,
  Flex,
  FormControl,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'

import {
  AdminMultirespondentFormDto,
  FormAuthType,
  StepLoginAuthType,
} from 'formsg-shared/types'
import {
  isMyInfoAuthType,
  ResolvedStepAuth,
} from 'formsg-shared/utils/workflow-auth'

import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'
import Input from '~components/Input'
import Radio from '~components/Radio'
import { Tag } from '~components/Tag'
import Toggle from '~components/Toggle'

import { isMyInfo } from '~features/myinfo/utils'

import { EsrvcHelperText } from '../EsrvcHelperText'
import { SecretKeyDownloadWhitelistFileModal } from '../SecretKeyDownloadWhitelistFileModal'

import { StagedWhitelistField } from './StagedWhitelistField'
import {
  getRemovedMyInfoFieldIds,
  hasSavedWhitelistFor,
  StepLoginDraft,
  toStepLoginDraft,
  validateStepLoginDraft,
  WhitelistDraft,
} from './stepLoginDraft'
import { useSaveStepLogin } from './useSaveStepLogin'
import { STEP_LOGIN_COPY_KEY, useStepLoginLabels } from './useStepLoginLabels'

const EDITOR_KEY = `${STEP_LOGIN_COPY_KEY}.editor`
const WHITELIST_KEY = `${STEP_LOGIN_COPY_KEY}.whitelist`

const STEP_LOGIN_OPTIONS: StepLoginAuthType[] = [
  FormAuthType.NIL,
  FormAuthType.MyInfo,
  FormAuthType.CP,
]

interface StepLoginEditorProps {
  form: AdminMultirespondentFormDto
  // Zero-based step index; a form with no workflow edits index 0.
  stepIndex: number
  saved: ResolvedStepAuth
  onClose: () => void
}

/**
 * Inline editor for one step's login. Every change, including the eligible
 * respondent list, is staged until Save, which sends one request.
 */
export const StepLoginEditor = ({
  form,
  stepIndex,
  saved,
  onClose,
}: StepLoginEditorProps): JSX.Element => {
  const { t } = useTranslation()
  const { getTypeLabel } = useStepLoginLabels()
  const saveMutation = useSaveStepLogin()
  const [draft, setDraft] = useState<StepLoginDraft>(() =>
    toStepLoginDraft(saved),
  )
  // The Singpass draft to return to when Undo restores removed MyInfo fields.
  const [undoDraft, setUndoDraft] = useState<StepLoginDraft | null>(null)
  const [hasTriedSave, setHasTriedSave] = useState(false)
  const {
    isOpen: isDownloadOpen,
    onOpen: onDownloadOpen,
    onClose: onDownloadClose,
  } = useDisclosure()

  const isFirstStep = stepIndex === 0
  const stepNumber = stepIndex + 1
  const isSaving = saveMutation.isLoading
  const hasLogin = draft.authType !== FormAuthType.NIL
  const isCorppass = draft.authType === FormAuthType.CP
  const isLegacyProvider = !(STEP_LOGIN_OPTIONS as FormAuthType[]).includes(
    draft.authType,
  )
  const isPaymentsEnabled = !!form.payments_field?.enabled

  const removedMyInfoTitles = useMemo(() => {
    const removedIds = getRemovedMyInfoFieldIds(form, stepIndex, draft.authType)
    return form.form_fields
      .filter((field) => removedIds.includes(field._id))
      .map((field) => field.title)
  }, [form, stepIndex, draft.authType])

  const myInfoTitles = useMemo(
    () => form.form_fields.filter(isMyInfo).map((field) => field.title),
    [form.form_fields],
  )

  const validationError = validateStepLoginDraft(form, stepIndex, draft)
  const validationMessage = validationError
    ? t(`${EDITOR_KEY}.${validationError}`, {
        fields: myInfoTitles.join(', '),
      })
    : undefined

  const handleLoginChange = (next: string) => {
    const authType = next as StepLoginAuthType
    if (isMyInfoAuthType(draft.authType) && !isMyInfoAuthType(authType)) {
      setUndoDraft(draft)
    }
    if (isMyInfoAuthType(authType)) setUndoDraft(null)
    setDraft({
      ...draft,
      authType,
      // No login cannot keep ID collection or one response per identity.
      isSubmitterIdCollectionEnabled:
        authType !== FormAuthType.NIL && draft.isSubmitterIdCollectionEnabled,
      isSingleSubmission:
        authType !== FormAuthType.NIL && draft.isSingleSubmission,
      // A provider change drops the saved list, so start the list afresh.
      whitelist:
        authType === saved.authType ? draft.whitelist : { kind: 'saved' },
    })
  }

  const handleUndo = () => {
    if (!undoDraft) return
    setDraft(undoDraft)
    setUndoDraft(null)
  }

  const handleSave = () => {
    setHasTriedSave(true)
    if (validationError) return
    saveMutation.mutate(
      { form, stepIndex, saved, draft },
      { onSuccess: onClose },
    )
  }

  const hasSavedList = hasSavedWhitelistFor(saved, draft.authType)
  const whitelistPendingMessage = (() => {
    if (draft.whitelist.kind === 'new') {
      return hasSavedList ? t(`${WHITELIST_KEY}.replacesOnSave`) : undefined
    }
    if (draft.whitelist.kind === 'removed' && hasSavedList) {
      return t(`${WHITELIST_KEY}.removesOnSave`)
    }
    if (saved.isWhitelistEnabled && !hasSavedList && hasLogin) {
      return t(`${WHITELIST_KEY}.droppedWithProvider`)
    }
    return undefined
  })()
  const downloadFileName = isFirstStep
    ? `whitelist_${form._id}.csv`
    : `whitelist_${form._id}_step_${stepNumber}.csv`

  return (
    <Stack spacing="1.5rem">
      <SecretKeyDownloadWhitelistFileModal
        isOpen={isDownloadOpen}
        onClose={onDownloadClose}
        publicKey={form.publicKey}
        formId={form._id}
        downloadFileName={downloadFileName}
        stepNumber={isFirstStep ? undefined : stepIndex}
      />

      <FormControl isReadOnly={isSaving}>
        <FormLabel>{t(`${EDITOR_KEY}.loginLabel`)}</FormLabel>
        {isLegacyProvider ? (
          <InlineMessage mb="1rem">
            {t(`${EDITOR_KEY}.legacyProvider`, {
              provider: getTypeLabel(draft.authType),
            })}
          </InlineMessage>
        ) : null}
        <Radio.RadioGroup value={draft.authType} onChange={handleLoginChange}>
          {STEP_LOGIN_OPTIONS.map((authType) => (
            <Radio key={authType} value={authType} isDisabled={isSaving}>
              <Flex align="center" gap="0.5rem" wrap="wrap">
                {getTypeLabel(authType)}
                {authType === FormAuthType.MyInfo ? (
                  <Tag size="sm" variant="subtle">
                    {t(`${EDITOR_KEY}.free`)}
                  </Tag>
                ) : null}
              </Flex>
            </Radio>
          ))}
        </Radio.RadioGroup>
      </FormControl>

      {removedMyInfoTitles.length > 0 ? (
        <InlineMessage variant="warning">
          <Stack flex={1} minW={0} spacing="0.75rem">
            <Text textStyle="body-2">{t(`${EDITOR_KEY}.myInfoRemoved`)}</Text>
            <Flex gap="0.5rem" wrap="wrap">
              {removedMyInfoTitles.map((title, i) => (
                <Tag key={`${title}-${i}`} size="sm" variant="subtle">
                  {title}
                </Tag>
              ))}
            </Flex>
            {undoDraft ? (
              <Box>
                <Button
                  size="sm"
                  variant="outline"
                  colorScheme="secondary"
                  leftIcon={<BiUndo fontSize="1.25rem" />}
                  onClick={handleUndo}
                  isDisabled={isSaving}
                >
                  {t(`${EDITOR_KEY}.undo`)}
                </Button>
              </Box>
            ) : null}
          </Stack>
        </InlineMessage>
      ) : null}

      {isCorppass && form.esrvcId ? (
        <Text textStyle="body-2" color="secondary.500">
          {t(`${EDITOR_KEY}.esrvcIdLabel`)}: {form.esrvcId}
        </Text>
      ) : null}

      {isCorppass && !form.esrvcId ? (
        <FormControl
          isReadOnly={isSaving}
          isRequired
          isInvalid={
            hasTriedSave &&
            (validationError === 'esrvcIdRequired' ||
              validationError === 'esrvcIdWhitespace')
          }
        >
          <FormLabel description={t(`${EDITOR_KEY}.esrvcIdDescription`)}>
            {t(`${EDITOR_KEY}.esrvcIdLabel`)}
          </FormLabel>
          <Box maxW="20rem">
            <Input
              value={draft.esrvcId}
              onChange={(e) => setDraft({ ...draft, esrvcId: e.target.value })}
              placeholder={t(`${EDITOR_KEY}.esrvcIdPlaceholder`)}
            />
          </Box>
          <FormErrorMessage>{validationMessage}</FormErrorMessage>
          <Box mt="0.5rem">
            <EsrvcHelperText authType={FormAuthType.CP} />
          </Box>
        </FormControl>
      ) : null}

      {hasLogin ? (
        <Stack spacing="1.5rem">
          <Toggle
            isDisabled={isSaving}
            isChecked={draft.isSubmitterIdCollectionEnabled}
            onChange={() =>
              setDraft({
                ...draft,
                isSubmitterIdCollectionEnabled:
                  !draft.isSubmitterIdCollectionEnabled,
              })
            }
            label={t(
              `${EDITOR_KEY}.${isCorppass ? 'collectUen' : 'collectNric'}`,
            )}
          />
          {isFirstStep ? (
            <Toggle
              isDisabled={isSaving || isPaymentsEnabled}
              isChecked={draft.isSingleSubmission}
              onChange={() =>
                setDraft({
                  ...draft,
                  isSingleSubmission: !draft.isSingleSubmission,
                })
              }
              label={t(`${EDITOR_KEY}.singleSubmission`)}
              description={
                isPaymentsEnabled
                  ? t(`${EDITOR_KEY}.singleSubmissionPayments`)
                  : undefined
              }
            />
          ) : null}
          <StagedWhitelistField
            fieldId={`step-${stepIndex}-whitelist-csv-attachment-field`}
            title={t(
              `${WHITELIST_KEY}.${isCorppass ? 'uenTitle' : 'nricTitle'}`,
              {
                stepNumber,
              },
            )}
            description={t(
              `${WHITELIST_KEY}.${isCorppass ? 'uenDescription' : 'nricDescription'}`,
            )}
            hasSavedList={hasSavedList}
            draft={draft.whitelist}
            onDraftChange={(whitelist: WhitelistDraft) =>
              setDraft({ ...draft, whitelist })
            }
            savedFileName={downloadFileName}
            onDownloadSaved={onDownloadOpen}
            isDisabled={isSaving}
            pendingMessage={whitelistPendingMessage}
          />
        </Stack>
      ) : null}

      {/* MyInfo conflicts follow from the login choice, so show them straight away. */}
      {validationError === 'noStepsMyInfo' ||
      validationError === 'lastSingpassStep' ? (
        <InlineMessage variant="error">{validationMessage}</InlineMessage>
      ) : null}

      <Flex justify="flex-end" gap="1rem">
        <Button
          variant="clear"
          colorScheme="secondary"
          onClick={onClose}
          isDisabled={isSaving}
        >
          {t(`${EDITOR_KEY}.cancel`)}
        </Button>
        <Button onClick={handleSave} isLoading={isSaving}>
          {t(`${EDITOR_KEY}.save`)}
        </Button>
      </Flex>
    </Stack>
  )
}
