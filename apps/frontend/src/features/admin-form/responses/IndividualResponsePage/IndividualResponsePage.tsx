import {
  memo,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { BiDownload, BiLinkExternal } from 'react-icons/bi'
import { useParams } from 'react-router-dom'
import {
  Box,
  Icon,
  Link,
  SimpleGrid,
  Skeleton,
  Stack,
  StackDivider,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react'

import { FormResponseMode } from 'formsg-shared/types'
import {
  getMultirespondentSubmissionEditPath,
  getStatusTrackerPath,
} from 'formsg-shared/utils/urls'

import Button from '~components/Button'
import Spinner from '~components/Spinner'
import { Tab } from '~components/Tabs'

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
import { WorkflowStatusBadge } from '../components/WorkflowStatusBadge'
import {
  MRF_PENDING_RESPONSE_AT_LABEL,
  MRF_STATUS_TRACKING_LABEL,
  MRF_WORKFLOW_STATUS_LABEL,
} from '../constants'
import { useStorageResponsesContext } from '../ResponsesPage/storage'
import {
  useWorkflowActionsGate,
  WorkflowActionsSection,
  WorkflowActivityLog,
} from '../workflowActions'

import { DecryptedRow } from './DecryptedRow'
import { getResponseScrollContainer } from './getResponseScrollContainer'
import { useMutateDownloadAttachments } from './mutations'
import { PaymentSection } from './PaymentSection'
import { useIndividualSubmission } from './queries'
import { ResponseOverview } from './ResponseOverview'

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
  children,
}: {
  label: string
  value: string
  children?: ReactNode
  isLoading: boolean
  isError: boolean
  statusTrackerUrl?: string
  linkLabel?: string
}) => {
  return (
    <Stack spacing="0.25rem" direction="column">
      <Text
        as="span"
        textStyle="subhead-1"
        whiteSpace="nowrap"
        data-dd-privacy="allow"
      >
        {label}
      </Text>
      {/* minW 0 lets the flex item shrink so long URLs wrap instead of overflowing the drawer. */}
      <Skeleton isLoaded={!isLoading && !isError} minW={0}>
        {children ? (
          children
        ) : statusTrackerUrl ? (
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
  const { submissionId, formId } = useParams()
  if (!submissionId) throw new Error('Missing submissionId')
  if (!formId) throw new Error('Missing formId')
  return (
    <IndividualResponseContent
      key={`${formId}/${submissionId}`}
      formId={formId}
      submissionId={submissionId}
    />
  )
}

const IndividualResponseContent = ({
  formId,
  submissionId,
}: {
  formId: string
  submissionId: string
}): JSX.Element => {
  const { t } = useTranslation()
  const [tab, setTab] = useState(0)
  const pageRef = useRef<HTMLDivElement>(null)
  const scrollToTop = useCallback(() => {
    const container = getResponseScrollContainer(pageRef.current)
    if (container) container.scrollTop = 0
  }, [])
  useEffect(scrollToTop, [scrollToTop])

  const { data: form } = useAdminForm()

  const hasWorkflow = hasWorkflowSteps(form)

  const { user } = useUser()
  const { secretKey } = useStorageResponsesContext()
  const { data, isLoading, isError } = useIndividualSubmission()
  const isWorkflowActionsOn = useWorkflowActionsGate()

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
  const isStopped = isWorkflowActionsOn && !!data?.mrf?.stoppedAt
  const responseMrfStatus = isStopped
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

  const overview = (
    <Stack spacing="1rem" textStyle="body-1">
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing="1rem">
        <StackRow
          label="Response ID"
          value={submissionId}
          isLoading={isLoading}
          isError={isError}
        />
        <StackRow
          label="Timestamp"
          value={
            data?.submissionTime ?? t('features.common.loadingWithEllipsis')
          }
          isLoading={isLoading}
          isError={isError}
        />
      </SimpleGrid>
      {hasWorkflow ? (
        <>
          <SimpleGrid columns={{ base: 1, md: 2 }} spacing="1rem">
            <StackRow
              label={MRF_WORKFLOW_STATUS_LABEL}
              value={responseMrfStatus}
              isLoading={isLoading}
              isError={isError}
            >
              {responseMrfStatus ? (
                <WorkflowStatusBadge status={responseMrfStatus} />
              ) : null}
            </StackRow>
            <StackRow
              label={MRF_PENDING_RESPONSE_AT_LABEL}
              value={
                isStopped ||
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
          </SimpleGrid>
          <StackRow
            label={MRF_STATUS_TRACKING_LABEL}
            value={''}
            statusTrackerUrl={`${window.location.origin}/${getStatusTrackerPath(formId, submissionId)}`}
            linkLabel={
              isWorkflowActionsOn
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
  )
  const responses = (
    <>
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
        </>
      )}
    </>
  )
  return (
    <Box
      ref={pageRef}
      px={{ base: '1.5rem', md: '1.75rem', lg: '2rem' }}
      data-dd-privacy="mask"
    >
      {hasWorkflow ? (
        <WorkflowActionsSection
          overview={overview}
          submissionId={submissionId}
          mrf={data?.mrf}
          history={data?.workflowHistory}
          submissionSecretKey={data?.submissionSecretKey}
          stepToken={data?.stepToken}
          isLoading={isLoading || isError}
        />
      ) : (
        <ResponseOverview>{overview}</ResponseOverview>
      )}
      {hasWorkflow && isWorkflowActionsOn ? (
        <Tabs
          index={tab}
          onChange={setTab}
          variant="line-light"
          isLazy
          lazyBehavior="keepMounted"
          mt="1.5rem"
        >
          <TabList>
            <Tab>
              {t(
                'features.adminForm.responses.individualResponse.responsesTab',
              )}
            </Tab>
            <Tab>
              {t('features.adminForm.responses.individualResponse.activityTab')}
            </Tab>
          </TabList>
          <TabPanels pt="1.5rem">
            <TabPanel>{responses}</TabPanel>
            <TabPanel>
              {isLoading || isError ? (
                <LoadingDecryption />
              ) : (
                <WorkflowActivityLog history={data?.workflowHistory} />
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      ) : (
        <Box mt="1.5rem">{responses}</Box>
      )}
    </Box>
  )
}
