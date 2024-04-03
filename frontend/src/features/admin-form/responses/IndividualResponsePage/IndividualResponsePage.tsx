import { memo, ReactNode, useCallback, useMemo } from 'react'
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
  children,
  isLoading,
  isError,
}: {
  label: string
  children: ReactNode
  isLoading: boolean
  isError: boolean
}) => {
  return (
    <Stack
      spacing={{ base: '0', md: '0.5rem' }}
      direction={{ base: 'column', md: 'row' }}
      alignItems="center"
    >
      <Box minW="8rem">
        <Text as="span" textStyle="subhead-1" whiteSpace="nowrap">
          {label}:
        </Text>
      </Box>
      <Skeleton isLoaded={!isLoading && !isError}>
        <Box>{children}</Box>
      </Skeleton>
    </Stack>
  )
}

export const IndividualResponsePage = (): JSX.Element => {
  const { submissionId, formId } = useParams()
  if (!submissionId) throw new Error('Missing submissionId')
  if (!formId) throw new Error('Missing formId')

  const { data: form } = useAdminForm()
  const { secretKey } = useStorageResponsesContext()
  const { data, isLoading, isError } = useIndividualSubmission()

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
    if (attachmentDownloadUrls.size === 0 || !secretKey) return
    return downloadAttachmentsAsZipMutation.mutate({
      attachmentDownloadUrls,
      secretKey,
      fileName: `RefNo ${submissionId}.zip`,
    })
  }, [
    attachmentDownloadUrls,
    downloadAttachmentsAsZipMutation,
    secretKey,
    submissionId,
  ])

  if (!secretKey)
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
          <StackRow label="Response ID" isLoading={isLoading} isError={isError}>
            {submissionId}
          </StackRow>
          <StackRow label="Timestamp" isLoading={isLoading} isError={isError}>
            {data?.submissionTime ?? 'Loading...'}
          </StackRow>
          {attachmentDownloadUrls.size > 0 && (
            <>
              <StackRow
                label="Attachments"
                isLoading={isLoading}
                isError={isError}
              >
                <Button
                  pl="0"
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
              </StackRow>
            </>
          )}
          {form?.responseMode === FormResponseMode.Multirespondent && (
            <StackRow
              label="Response link"
              isLoading={isLoading}
              isError={isError}
            >
              {responseLinkWithKey}
            </StackRow>
          )}
        </Stack>
        {isLoading || isError ? (
          <LoadingDecryption />
        ) : (
          <>
            <Stack spacing="1.5rem" divider={<StackDivider />}>
              {data?.responses.map((r, idx) => (
                <DecryptedRow row={r} secretKey={secretKey} key={idx} />
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
