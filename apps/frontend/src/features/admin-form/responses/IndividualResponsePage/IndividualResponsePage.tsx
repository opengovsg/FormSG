import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BiDownload, BiLinkExternal } from 'react-icons/bi'
import { useParams } from 'react-router-dom'
import {
  Box,
  Icon,
  Link,
  Skeleton,
  Stack,
  StackDivider,
  Text,
} from '@chakra-ui/react'

import { FormResponseMode } from 'formsg-shared/types'
import {
  getMultirespondentSubmissionEditPath,
  getStatusTrackerPath,
} from 'formsg-shared/utils/urls'

import Button from '~components/Button'
import Spinner from '~components/Spinner'

import { useAdminForm } from '~features/admin-form/common/queries'
import { FormActivationSvg } from '~features/admin-form/settings/components/FormActivationSvg'
import { useUser } from '~features/user/queries'

import {
  getPendingResponseAtString,
  getStatusFromWorkflowStatus,
  hasWorkflowSteps,
  MRF_STATUS,
} from '../common/utils/mrfSubmissionView'
import { SecretKeyVerification } from '../components/SecretKeyVerification'
import {
  MRF_PENDING_RESPONSE_AT_LABEL,
  MRF_RESPONSE_TIMESTAMP_LABEL,
  MRF_STATUS_TRACKING_LABEL,
  MRF_WORKFLOW_STATUS_LABEL,
} from '../constants'
import { useStorageResponsesContext } from '../ResponsesPage/storage'
import {
  useIsWorkflowStopEnabled,
  useWorkflowStop,
  WorkflowActionsSection,
  WorkflowActivityLog,
} from '../workflowStop'

import { DecryptedRow } from './DecryptedRow'
import { useMutateDownloadAttachments } from './mutations'
import { PaymentSection } from './PaymentSection'
import { useIndividualSubmission } from './queries'

const LoadingDecryption = memo(() => {
  return (
    <Stack spacing="1.5rem" divider={<StackDivider />}>
      <Skeleton h="2rem" maxW="20rem" mb="0.5rem" />
      <Stack>
        <Skeleton h="1.5rem" maxW="32rem" />
        <Skeleton h="1.5rem" maxW="5rem" />
      </Stack>
      <Stack>
        <Skeleton h="1.5rem" maxW="12rem" />
        <Skeleton h="1.5rem" maxW="5rem" />
      </Stack>
      <Stack>
        <Skeleton h="1.5rem" maxW="24rem" />
        <Skeleton h="1.5rem" maxW="3rem" />
      </Stack>
      <Box />
    </Stack>
  )
})

const StackRow = ({
  label,
  value,
  isLoading,
  isError,
  statusTrackerUrl,
  linkLabel,
}: {
  label: string
  value: string
  isLoading: boolean
  isError: boolean
  statusTrackerUrl?: string
  /** Shown instead of the raw URL when set. The URL stays as the tooltip. */
  linkLabel?: string
}) => {
  return (
    <Stack
      spacing={{ base: '0', md: '0.5rem' }}
      direction={{ base: 'column', md: 'row' }}
    >
      <Text
        as="span"
        textStyle="subhead-1"
        whiteSpace="nowrap"
        data-dd-privacy="allow"
      >
        {label}:
      </Text>
      {/* minW 0 lets the flex item shrink so long URLs wrap instead of overflowing the drawer. */}
      <Skeleton isLoaded={!isLoading && !isError} minW={0}>
        {statusTrackerUrl ? (
          // Inline so the icon trails the last character of a wrapped URL.
          <Link
            target="_blank"
            href={statusTrackerUrl}
            title={linkLabel ? statusTrackerUrl : undefined}
            overflowWrap="anywhere"
            data-dd-action-name="Click on status tracker link"
          >
            {linkLabel ?? statusTrackerUrl}
            <Icon
              as={BiLinkExternal}
              fontSize="1.25rem"
              verticalAlign="text-bottom"
              ml="0.25rem"
            />
          </Link>
        ) : (
          <Text as="span" overflowWrap="anywhere">
            {value}
          </Text>
        )}
      </Skeleton>
    </Stack>
  )
}

export const IndividualResponsePage = (): JSX.Element => {
  const { t } = useTranslation()
  const { submissionId, formId } = useParams()
  if (!submissionId) throw new Error('Missing submissionId')
  if (!formId) throw new Error('Missing formId')

  const { data: form } = useAdminForm()

  const hasWorkflow = hasWorkflowSteps(form)

  const { user } = useUser()
  const { secretKey } = useStorageResponsesContext()
  const { data, isLoading, isError } = useIndividualSubmission()
  const isWorkflowStopEnabled = useIsWorkflowStopEnabled()
  const stop = useWorkflowStop(submissionId)

  // Logic to determine which key to use to decrypt attachments.
  const attachmentDecryptionKey =
    // If no submission secret key present, it is a storage mode form. So, use form secret key.
    !data?.submissionSecretKey
      ? secretKey
      : // It's an mrf, but old version
        !data.mrfVersion
        ? secretKey
        : data.submissionSecretKey

  const attachmentDownloadUrls = useMemo(() => {
    const attachmentDownloadUrls = new Map()
    data?.responses.forEach(({ questionNumber, downloadUrl, answer }) => {
      if (!questionNumber || !downloadUrl || !answer) return
      attachmentDownloadUrls.set(questionNumber, {
        url: downloadUrl,
        filename: answer,
      })
    })
    return attachmentDownloadUrls
  }, [data?.responses])

  const { downloadAttachmentsAsZipMutation } = useMutateDownloadAttachments()

  const handleDownload = useCallback(() => {
    if (attachmentDownloadUrls.size === 0 || !attachmentDecryptionKey) return
    return downloadAttachmentsAsZipMutation.mutate({
      attachmentDownloadUrls,
      secretKey: attachmentDecryptionKey,
      fileName: `RefNo ${submissionId}.zip`,
    })
  }, [
    attachmentDownloadUrls,
    downloadAttachmentsAsZipMutation,
    attachmentDecryptionKey,
    submissionId,
  ])

  if (!secretKey || !attachmentDecryptionKey)
    return (
      <SecretKeyVerification
        heroSvg={<FormActivationSvg />}
        ctaText={t(
          'features.adminForm.responses.individualResponse.secretKeyVerification.ctaText',
        )}
        label={t(
          'features.adminForm.responses.individualResponse.secretKeyVerification.label',
        )}
      />
    )

  const responseLinkWithKey = `${
    window.location.origin
  }/${getMultirespondentSubmissionEditPath(form?._id ?? '', submissionId, {
    key: data?.submissionSecretKey || '',
    stepToken: data?.stepToken,
  })}`

  const workflowStatus = data?.mrf?.workflowStatus
  const responseMrfStatus = stop
    ? MRF_STATUS.STOPPED
    : workflowStatus
      ? getStatusFromWorkflowStatus(workflowStatus)
      : ''

  // TODO(FRM-1933): disabled lastSubmittedAt as we are undecided on showing firstSubmission vs lastSubmittedAt
  // const lastSubmittedAt = data?.mrf?.lastSubmittedAt
  //   ? formatInTimeZone(
  //       data.mrf.lastSubmittedAt,
  //       'Asia/Singapore',
  //       'eee, d MMM yyyy, hh:mm:ss a',
  //     )
  //   : ''

  const workflowCurrentStepNumber = data?.mrf?.workflowCurrentStepNumber
  const workflowNumTotalSteps = data?.mrf?.workflowNumTotalSteps

  return (
    <Stack
      px={{ base: '1.5rem', md: '1.75rem', lg: '2rem' }}
      spacing={{ base: '1.5rem', md: '2.5rem' }}
      data-dd-privacy="mask"
    >
      {hasWorkflow ? (
        <WorkflowActionsSection
          submissionId={submissionId}
          workflowStatus={workflowStatus}
          hasNextStepRecipientEmails={!!data?.mrf?.hasNextStepRecipientEmails}
          history={data?.workflowHistory}
          responses={data?.responses}
          submissionSecretKey={data?.submissionSecretKey}
          stepToken={data?.stepToken}
          isLoading={isLoading || isError}
        />
      ) : null}
      <Stack bg="primary.100" p="1.5rem" textStyle="body-1">
        <StackRow
          label="Response ID"
          value={submissionId}
          isLoading={isLoading}
          isError={isError}
        />
        <StackRow
          label={hasWorkflow ? MRF_RESPONSE_TIMESTAMP_LABEL : 'Timestamp'}
          value={
            data?.submissionTime ?? t('features.common.loadingWithEllipsis')
          }
          isLoading={isLoading}
          isError={isError}
        />
        {hasWorkflow ? (
          <>
            <StackRow
              label={MRF_WORKFLOW_STATUS_LABEL}
              value={responseMrfStatus}
              isLoading={isLoading}
              isError={isError}
            />
            <StackRow
              label={MRF_PENDING_RESPONSE_AT_LABEL}
              value={
                stop ||
                workflowStatus === undefined ||
                workflowCurrentStepNumber === undefined ||
                workflowNumTotalSteps === undefined
                  ? '-'
                  : getPendingResponseAtString({
                      workflowStatus,
                      workflowCurrentStepNumber,
                      workflowNumTotalSteps,
                    })
              }
              isLoading={isLoading}
              isError={isError}
            />
            <StackRow
              label={MRF_STATUS_TRACKING_LABEL}
              value={''}
              statusTrackerUrl={`${window.location.origin}/${getStatusTrackerPath(formId, submissionId)}`}
              linkLabel={
                isWorkflowStopEnabled
                  ? t(
                      'features.adminForm.responses.individualResponse.statusTrackingLinkLabel',
                    )
                  : undefined
              }
              isLoading={isLoading}
              isError={isError}
            />
          </>
        ) : null}
        {attachmentDownloadUrls.size > 0 && (
          <Stack
            spacing={{ base: '0', md: '0.5rem' }}
            direction={{ base: 'column', md: 'row' }}
          >
            <Text
              as="span"
              textStyle="subhead-1"
              py={{ base: '0', md: '0.25rem' }}
            >
              {t('features.common.attachments')}:
            </Text>
            <Skeleton isLoaded={!isLoading && !isError}>
              <Button
                data-dd-action-name="Click on attachment field download button"
                variant="link"
                isDisabled={downloadAttachmentsAsZipMutation.isLoading}
                onClick={handleDownload}
                rightIcon={
                  downloadAttachmentsAsZipMutation.isLoading ? (
                    <Spinner fontSize="1.5rem" />
                  ) : (
                    <BiDownload fontSize="1.5rem" />
                  )
                }
              >
                {t(
                  'features.adminForm.responses.individualResponse.downloadAttachmentsAsZip',
                  { attachmentSize: attachmentDownloadUrls.size },
                )}
              </Button>
            </Skeleton>
          </Stack>
        )}
        {form?.responseMode === FormResponseMode.Multirespondent &&
          // Pre-mode-migration encrypt submissions have no submission secret
          // key, so no valid response link can be built for them.
          data?.submissionSecretKey &&
          user?.betaFlags?.mrfAdminSubmissionKey && (
            <StackRow
              label={t(
                'features.adminForm.responses.individualResponse.responseLinkLabel',
              )}
              value={responseLinkWithKey}
              isLoading={isLoading}
              isError={isError}
            />
          )}
      </Stack>
      {isLoading || isError ? (
        <LoadingDecryption />
      ) : (
        <>
          <Stack spacing="1.5rem" divider={<StackDivider />}>
            {data?.responses.map((r, idx) => (
              <DecryptedRow
                row={r}
                attachmentDecryptionKey={attachmentDecryptionKey}
                key={idx}
              />
            ))}
            <Box />
          </Stack>
          {data?.payment && (
            <PaymentSection payment={data.payment} formId={formId} />
          )}
          {hasWorkflow && isWorkflowStopEnabled ? (
            <WorkflowActivityLog
              submissionId={submissionId}
              submissionTime={data?.submissionTime}
              history={data?.workflowHistory}
            />
          ) : null}
        </>
      )}
    </Stack>
  )
}
