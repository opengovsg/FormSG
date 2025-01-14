import { memo, useCallback, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { BiDownload } from 'react-icons/bi'
import { useParams } from 'react-router-dom'
import {
  Box,
  Flex,
  Skeleton,
  Stack,
  StackDivider,
  Text,
} from '@chakra-ui/react'
import simplur from 'simplur'

import { FormResponseMode } from '~shared/types'
import { getMultirespondentSubmissionEditPath } from '~shared/utils/urls'

import Button from '~components/Button'
import Spinner from '~components/Spinner'

import { useAdminForm } from '~features/admin-form/common/queries'
import { FormActivationSvg } from '~features/admin-form/settings/components/FormActivationSvg'
import { useUser } from '~features/user/queries'

import { SecretKeyVerification } from '../components/SecretKeyVerification'
import { useStorageResponsesContext } from '../ResponsesPage/storage'

import { DecryptedRow } from './DecryptedRow'
import { IndividualResponseNavbar } from './IndividualResponseNavbar'
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
}: {
  label: string
  value: string
  isLoading: boolean
  isError: boolean
}) => {
  return (
    <Stack
      spacing={{ base: '0', md: '0.5rem' }}
      direction={{ base: 'column', md: 'row' }}
    >
      <Text as="span" textStyle="subhead-1" whiteSpace="nowrap">
        {label}:
      </Text>
      <Skeleton isLoaded={!isLoading && !isError}>{value}</Skeleton>
    </Stack>
  )
}

export const IndividualResponsePage = (): JSX.Element => {
  const { t } = useTranslation()
  const { submissionId, formId } = useParams()
  if (!submissionId) throw new Error('Missing submissionId')
  if (!formId) throw new Error('Missing formId')

  const { data: form } = useAdminForm()

  const { user } = useUser()
  const { secretKey } = useStorageResponsesContext()
  const { data, isLoading, isError } = useIndividualSubmission()

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
        ctaText="Unlock responses"
        label="Enter or upload Secret Key"
      />
    )

  const responseLinkWithKey = `${
    window.location.origin
  }/${getMultirespondentSubmissionEditPath(form?._id ?? '', submissionId, {
    key: data?.submissionSecretKey || '',
  })}`

  return (
    <Flex flexDir="column" marginTop={{ base: '-1.5rem', md: '-3rem' }}>
      <IndividualResponseNavbar />

      <Stack
        px={{ md: '1.75rem', lg: '2rem' }}
        spacing={{ base: '1.5rem', md: '2.5rem' }}
      >
        <Stack bg="primary.100" p="1.5rem" textStyle="monospace">
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
                Attachments:
              </Text>
              <Skeleton isLoaded={!isLoading && !isError}>
                <Button
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
                  {simplur`Download ${attachmentDownloadUrls.size} attachment[|s] as .zip`}
                </Button>
              </Skeleton>
            </Stack>
          )}
          {form?.responseMode === FormResponseMode.Multirespondent &&
            user?.betaFlags?.mrfAdminSubmissionKey && (
              <StackRow
                label="Response link"
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
          </>
        )}
      </Stack>
    </Flex>
  )
}
