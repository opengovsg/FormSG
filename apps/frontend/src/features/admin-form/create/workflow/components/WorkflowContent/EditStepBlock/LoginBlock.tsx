import { useEffect, useState } from 'react'
import { FieldPath, FieldPathValue, UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BiUndo } from 'react-icons/bi'
import {
  Box,
  Flex,
  FormControl,
  ListItem,
  Stack,
  Text,
  UnorderedList,
  useDisclosure,
} from '@chakra-ui/react'

import { FormAuthType, FormStatus } from 'formsg-shared/types'
import {
  isMyInfoAuthType,
  isStepLoginAuthType,
  resolveAllStepAuths,
  resolveStepAuth,
  toStepLoginAuthType,
} from 'formsg-shared/utils/workflow-auth'

import { textStyles } from '~theme/textStyles'
import Button from '~components/Button'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'
import Input from '~components/Input'
import Radio from '~components/Radio'
import { Tag } from '~components/Tag'
import Toggle from '~components/Toggle'

import { useAdminForm } from '~features/admin-form/common/queries'
import { EsrvcHelperText } from '~features/admin-form/settings/components/AuthSettingsSection/EsrvcHelperText'
import { isMyInfo } from '~features/myinfo/utils'

import { useAdminFormWorkflow } from '../../../hooks/useAdminFormWorkflow'
import { EditStepInputs, FirstStepLoginDraft } from '../../../types'
import { ChangeEsrvcIdModal } from '../StepLogin/ChangeEsrvcIdModal'
import {
  getEditedLaterStepAuth,
  getEditedStepAuthType,
  toFirstStepLoginDraft,
} from '../StepLogin/editedStepLogin'
import { StepWhitelistAttachmentField } from '../StepLogin/StepWhitelistAttachmentField'
import { useStepLoginTypeLabel } from '../StepLogin/useStepLoginTypeLabel'
import { isFirstStepByStepNumber } from '../utils/isFirstStepByStepNumber'

import { FIELDS_TO_EDIT_NAME } from './EditStepBlock'
import { EditStepBlockContainer } from './EditStepBlockContainer'

const COPY_KEY = 'features.adminForm.sidebar.workflow.stepLogin'

// Radio padding + control + label margin, so sub-settings line up with the option's label.
const RADIO_LABEL_INDENT = '2.75rem'

// Staged values before leaving Singpass, restored by Undo.
interface RemovedMyInfoFields {
  fieldIds: string[]
  previous: Pick<
    EditStepInputs,
    'login_auth' | 'first_step_login' | 'esrvc_id' | 'whitelistCsvString'
  >
}

interface LoginBlockProps {
  formMethods: UseFormReturn<EditStepInputs>
  stepNumber: number
  isLoading: boolean
  // Step 1 of a no-steps MRF form fills every field, so its MyInfo fields can't be dropped.
  isNoStepsCard?: boolean
}

/** "How do they log in?": staged login edits, sent with the step save in one request. */
export const LoginBlock = ({
  formMethods,
  stepNumber,
  isLoading,
  isNoStepsCard = false,
}: LoginBlockProps): JSX.Element | null => {
  const { t } = useTranslation()
  const { data: form } = useAdminForm()
  const { formWorkflow = [] } = useAdminFormWorkflow()
  const getTypeLabel = useStepLoginTypeLabel()
  const {
    watch,
    setValue,
    register,
    unregister,
    trigger,
    getValues,
    formState: { errors, isSubmitted },
  } = formMethods
  const isFirstStep = isFirstStepByStepNumber(stepNumber)
  const loginInputName = isFirstStep ? 'first_step_login' : 'login_auth'

  useEffect(() => {
    if (!form) return
    register(loginInputName, {
      validate: () => {
        const authType = getEditedStepAuthType(form, isFirstStep, getValues())
        if (isMyInfoAuthType(authType)) return true
        const myInfoFields = form.form_fields.filter(isMyInfo)
        if (isNoStepsCard) {
          const pickedFieldIds = new Set(getValues(FIELDS_TO_EDIT_NAME) ?? [])
          const myInfoTitles = myInfoFields
            .filter((field) => pickedFieldIds.has(field._id))
            .map((field) => field.title)
          if (myInfoTitles.length === 0) return true
          return t(
            `${COPY_KEY}.noSteps.${
              myInfoTitles.length === 1
                ? 'myInfoNeedsSingpassOne'
                : 'myInfoNeedsSingpassMany'
            }`,
            { fields: myInfoTitles.join(', ') },
          )
        }
        // Removing the last Singpass login would strand the form's MyInfo fields.
        const workflow = 'workflow' in form ? form.workflow : []
        const resolved = resolveAllStepAuths(form, workflow)
        const wasMyInfo = isMyInfoAuthType(
          resolved[stepNumber]?.authType ?? FormAuthType.NIL,
        )
        const otherStepUsesMyInfo = resolved.some(
          (r, i) => i !== stepNumber && isMyInfoAuthType(r.authType),
        )
        if (myInfoFields.length > 0 && wasMyInfo && !otherStepUsesMyInfo) {
          return t(`${COPY_KEY}.editor.keepSingpassStep`)
        }
        return true
      },
    })
    return () => unregister(loginInputName, { keepValue: true })
  }, [
    form,
    getValues,
    isFirstStep,
    isNoStepsCard,
    loginInputName,
    register,
    stepNumber,
    t,
    unregister,
  ])

  const pickedFieldIds = watch(FIELDS_TO_EDIT_NAME)
  const loginError = errors[loginInputName]?.message
  useEffect(() => {
    // Re-check when the picked fields change, so removing the field clears it.
    if (loginError) void trigger(loginInputName)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pickedFieldIds])

  const {
    isOpen: isEsrvcIdModalOpen,
    onOpen: onEsrvcIdModalOpen,
    onClose: onEsrvcIdModalClose,
  } = useDisclosure()
  const [removedMyInfo, setRemovedMyInfo] =
    useState<RemovedMyInfoFields | null>(null)

  const savedAuth = watch('auth')
  const stagedAuth = watch('login_auth')
  const editedFirstStepLogin = watch('first_step_login')
  const editedEsrvcId = watch('esrvc_id')
  const stagedWhitelist = watch('whitelistCsvString')

  if (!form) return null

  const saved = resolveStepAuth(form, formWorkflow, stepNumber)
  const isFormPublic = form.status === FormStatus.Public
  const isDisabled = isLoading || isFormPublic
  const stage = <K extends FieldPath<EditStepInputs>>(
    name: K,
    value: FieldPathValue<EditStepInputs, K>,
  ) => setValue(name, value, { shouldDirty: true, shouldValidate: isSubmitted })

  const firstStepLogin: FirstStepLoginDraft =
    editedFirstStepLogin ?? toFirstStepLoginDraft(form)
  const laterAuth = getEditedLaterStepAuth({
    auth: savedAuth,
    login_auth: stagedAuth,
  })

  // Step 1 may still use a retired provider until the admin picks one of the three.
  const authType = isFirstStep
    ? firstStepLogin.authType
    : (laterAuth?.auth_type ?? FormAuthType.NIL)
  const isLegacyProvider = !isStepLoginAuthType(authType)
  const editorType = toStepLoginAuthType(authType)
  const collectsId = isFirstStep
    ? firstStepLogin.isSubmitterIdCollectionEnabled
    : !!laterAuth?.is_submitter_id_collection_enabled

  const handleLoginTypeChange = (next: string) => {
    const nextType = next as FormAuthType
    if (nextType === authType) return
    const previous = getValues([
      'login_auth',
      'first_step_login',
      'esrvc_id',
      'whitelistCsvString',
    ])
    const previousValues: RemovedMyInfoFields['previous'] = {
      login_auth: previous[0],
      first_step_login: previous[1],
      esrvc_id: previous[2],
      whitelistCsvString: previous[3],
    }
    // MyInfo fields are only listed for Singpass steps, so take them off.
    if (nextType !== FormAuthType.MyInfo && !isNoStepsCard) {
      const myInfoFieldIds = new Set(
        form.form_fields.filter(isMyInfo).map((field) => field._id),
      )
      const pickedIds = getValues(FIELDS_TO_EDIT_NAME) ?? []
      const keptIds = pickedIds.filter((id) => !myInfoFieldIds.has(id))
      if (keptIds.length !== pickedIds.length) {
        stage(FIELDS_TO_EDIT_NAME, keptIds)
        setRemovedMyInfo({
          fieldIds: pickedIds.filter((id) => myInfoFieldIds.has(id)),
          previous: previousValues,
        })
      }
    }
    if (nextType === FormAuthType.MyInfo) setRemovedMyInfo(null)
    // A staged list holds NRIC/FINs or UENs, so it doesn't carry over; the saved one applies again.
    if (stagedWhitelist !== undefined) stage('whitelistCsvString', undefined)
    // The e-service ID is only for Corppass; don't change the shared value from elsewhere.
    if (nextType !== FormAuthType.CP && editedEsrvcId !== undefined) {
      stage('esrvc_id', undefined)
    }
    if (isFirstStep) {
      stage(
        'first_step_login',
        nextType === FormAuthType.NIL
          ? {
              authType: FormAuthType.NIL,
              isSubmitterIdCollectionEnabled: false,
              isSingleSubmission: false,
            }
          : { ...firstStepLogin, authType: nextType },
      )
      return
    }
    stage(
      'login_auth',
      nextType === FormAuthType.NIL
        ? null
        : {
            auth_type: nextType as FormAuthType.MyInfo | FormAuthType.CP,
            is_submitter_id_collection_enabled: collectsId,
          },
    )
  }

  const handleUndoRemovedMyInfo = () => {
    if (!removedMyInfo) return
    const pickedIds = getValues(FIELDS_TO_EDIT_NAME) ?? []
    stage(FIELDS_TO_EDIT_NAME, [
      ...pickedIds,
      ...removedMyInfo.fieldIds.filter((id) => !pickedIds.includes(id)),
    ])
    const { previous } = removedMyInfo
    stage('login_auth', previous.login_auth)
    stage('first_step_login', previous.first_step_login)
    stage('esrvc_id', previous.esrvc_id)
    stage('whitelistCsvString', previous.whitelistCsvString)
    setRemovedMyInfo(null)
  }

  const removedMyInfoFields = removedMyInfo
    ? form.form_fields.filter((field) =>
        removedMyInfo.fieldIds.includes(field._id),
      )
    : []

  const handleCollectIdChange = () => {
    if (isFirstStep) {
      stage('first_step_login', {
        ...firstStepLogin,
        isSubmitterIdCollectionEnabled: !collectsId,
      })
      return
    }
    if (!laterAuth) return
    stage('login_auth', {
      ...laterAuth,
      is_submitter_id_collection_enabled: !collectsId,
    })
  }

  const handleEsrvcIdChange = (value: string) => {
    const esrvcId = value.trim()
    // Only send the e-service ID when it differs from the saved one.
    stage('esrvc_id', esrvcId === (form.esrvcId ?? '') ? undefined : esrvcId)
  }

  // The e-service ID is form-level, so every other Corppass step shares it.
  const otherCorppassSteps = resolveAllStepAuths(form, formWorkflow)
    .map((resolved, i) =>
      resolved.authType === FormAuthType.CP && i !== stepNumber ? i + 1 : null,
    )
    .filter((n): n is number => n !== null)
  const otherCorppassStepNames = otherCorppassSteps
    .map((n) => t(`${COPY_KEY}.esrvcIdModal.stepName`, { stepNumber: n }))
    .join(', ')

  // The server keeps a saved list only while the provider is unchanged.
  const savedListApplies =
    saved.isWhitelistEnabled && saved.authType === authType

  return (
    <EditStepBlockContainer>
      <FormControl
        isReadOnly={isLoading}
        isDisabled={isFormPublic}
        isRequired
        isInvalid={!!loginError}
      >
        <FormLabel style={textStyles.h4}>{t(`${COPY_KEY}.title`)}</FormLabel>
        {isFormPublic ? (
          <InlineMessage mb="1rem">
            {t(`${COPY_KEY}.editor.closeFormToEdit`)}
          </InlineMessage>
        ) : null}
        {isLegacyProvider ? (
          <InlineMessage mb="1rem">
            {t(`${COPY_KEY}.editor.legacyProvider`, {
              provider: getTypeLabel(authType),
            })}
          </InlineMessage>
        ) : null}
        <Radio.RadioGroup
          value={isLegacyProvider ? '' : authType}
          onChange={handleLoginTypeChange}
        >
          <Radio
            value={FormAuthType.NIL}
            allowDeselect={false}
            isDisabled={isFormPublic}
          >
            {getTypeLabel(FormAuthType.NIL)}
          </Radio>
          <Radio
            value={FormAuthType.MyInfo}
            allowDeselect={false}
            isDisabled={isFormPublic}
          >
            <Flex align="center" gap="1rem">
              {getTypeLabel(FormAuthType.MyInfo)}
              <Tag size="sm" variant="subtle">
                {t(`${COPY_KEY}.free`)}
              </Tag>
            </Flex>
          </Radio>
          <Radio
            value={FormAuthType.CP}
            allowDeselect={false}
            isDisabled={isFormPublic}
          >
            {getTypeLabel(FormAuthType.CP)}
          </Radio>
        </Radio.RadioGroup>

        {/* Directly under the Corppass option; once set, the e-service ID is shared. */}
        {authType === FormAuthType.CP ? (
          <Box pl={RADIO_LABEL_INDENT} pt="0.25rem" pb="0.5rem">
            {form.esrvcId ? (
              <Stack spacing="0.25rem">
                <ChangeEsrvcIdModal
                  isOpen={isEsrvcIdModalOpen}
                  onClose={onEsrvcIdModalClose}
                  value={editedEsrvcId ?? form.esrvcId}
                  otherCorppassSteps={otherCorppassSteps}
                  onConfirm={handleEsrvcIdChange}
                />
                <Text textStyle="subhead-2" color="secondary.700">
                  {t(`${COPY_KEY}.editor.esrvcIdLabel`)}
                </Text>
                <Flex
                  columnGap="1rem"
                  rowGap="0.25rem"
                  align="center"
                  wrap="wrap"
                >
                  <Text
                    textStyle="body-1"
                    color="secondary.700"
                    overflowWrap="anywhere"
                  >
                    {editedEsrvcId ?? form.esrvcId}
                  </Text>
                  <Button
                    variant="link"
                    isDisabled={isDisabled}
                    onClick={onEsrvcIdModalOpen}
                  >
                    {t(`${COPY_KEY}.editor.esrvcIdChange`)}
                  </Button>
                </Flex>
                <Text textStyle="body-2" color="secondary.400">
                  {otherCorppassSteps.length > 0
                    ? t(`${COPY_KEY}.editor.esrvcIdSharedWith`, {
                        steps: otherCorppassStepNames,
                      })
                    : t(`${COPY_KEY}.editor.esrvcIdSharedByEvery`)}
                  {editedEsrvcId !== undefined
                    ? ` ${t(`${COPY_KEY}.editor.esrvcIdSavesWithStep`)}`
                    : ''}
                </Text>
              </Stack>
            ) : (
              <FormControl isReadOnly={isLoading} isDisabled={isFormPublic}>
                <FormLabel
                  isRequired
                  description={t(`${COPY_KEY}.editor.esrvcIdDescription`)}
                >
                  {t(`${COPY_KEY}.editor.esrvcIdLabel`)}
                </FormLabel>
                <Box maxW="20rem">
                  <Input
                    value={editedEsrvcId ?? ''}
                    onChange={(e) => handleEsrvcIdChange(e.target.value)}
                    placeholder={t(`${COPY_KEY}.editor.esrvcIdPlaceholder`)}
                  />
                </Box>
                <Box mt="0.5rem">
                  <EsrvcHelperText authType={FormAuthType.CP} />
                </Box>
              </FormControl>
            )}
          </Box>
        ) : null}
        <FormErrorMessage>{loginError}</FormErrorMessage>
      </FormControl>

      {removedMyInfoFields.length > 0 ? (
        <InlineMessage variant="warning">
          <Stack spacing="0.75rem" flex={1} minW={0}>
            <Box>
              <Text textStyle="subhead-1">
                {t(
                  `${COPY_KEY}.editor.${
                    removedMyInfoFields.length === 1
                      ? 'myInfoRemovedOne'
                      : 'myInfoRemovedMany'
                  }`,
                )}
              </Text>
              <Text textStyle="body-2">
                {t(`${COPY_KEY}.editor.myInfoRemovedReason`)}
              </Text>
            </Box>
            <UnorderedList spacing="0.25rem" ml="1.25rem" textStyle="body-2">
              {removedMyInfoFields.map((field) => (
                <ListItem key={field._id} overflowWrap="anywhere">
                  {field.title}
                </ListItem>
              ))}
            </UnorderedList>
            <Button
              size="sm"
              variant="outline"
              colorScheme="secondary"
              alignSelf="flex-start"
              leftIcon={<BiUndo fontSize="1.25rem" />}
              onClick={handleUndoRemovedMyInfo}
            >
              {t(`${COPY_KEY}.editor.undo`)}
            </Button>
          </Stack>
        </InlineMessage>
      ) : null}

      {authType !== FormAuthType.NIL ? (
        <Stack spacing="2rem" pt="1.25rem">
          <Toggle
            isLoading={isLoading}
            isDisabled={isFormPublic}
            isChecked={collectsId}
            onChange={handleCollectIdChange}
            label={t(
              `${COPY_KEY}.editor.${
                editorType === FormAuthType.CP ? 'collectUen' : 'collectNric'
              }`,
            )}
            description={t(
              `${COPY_KEY}.editor.${
                editorType === FormAuthType.CP
                  ? 'collectUenDescription'
                  : 'collectNricDescription'
              }`,
              { stepNumber: stepNumber + 1 },
            )}
          />
          {isFirstStep ? (
            <Toggle
              isLoading={isLoading}
              isDisabled={isFormPublic}
              isChecked={firstStepLogin.isSingleSubmission}
              onChange={() =>
                stage('first_step_login', {
                  ...firstStepLogin,
                  isSingleSubmission: !firstStepLogin.isSingleSubmission,
                })
              }
              label={t(`${COPY_KEY}.editor.singleSubmission`)}
              description={t(`${COPY_KEY}.editor.singleSubmissionDescription`)}
            />
          ) : null}
          <StepWhitelistAttachmentField
            key={authType}
            stepNumber={stepNumber}
            isCorppass={editorType === FormAuthType.CP}
            savedListApplies={savedListApplies}
            stagedWhitelist={stagedWhitelist}
            onStage={(value) => stage('whitelistCsvString', value)}
            isDisabled={isDisabled}
          />
        </Stack>
      ) : null}

      <Text textStyle="body-2" color="secondary.400" pt="0.25rem">
        {t(`${COPY_KEY}.newSubmissionsOnly`)}
      </Text>
    </EditStepBlockContainer>
  )
}
