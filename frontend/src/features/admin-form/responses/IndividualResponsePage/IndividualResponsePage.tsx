import { memo, useCallback, useMemo } from 'react'
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

import Button from '~components/Button'
import Spinner from '~components/Spinner'

import { useAdminForm } from '~features/admin-form/common/queries'

import {
  SecretKeyVerification,
  useStorageResponsesContext,
} from '../ResponsesPage/storage'

import { DecryptedRow } from './DecryptedRow'
import { IndividualResponseNavbar } from './IndividualResponseNavbar'
import { useMutateDownloadAttachments } from './mutations'
import {
  useIndividualPaymentSubmission,
  useIndividualSubmission,
} from './queries'

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

export const IndividualResponsePage = (): JSX.Element => {
  const { submissionId } = useParams()
  if (!submissionId) throw new Error('Missing submissionId')

  const { secretKey } = useStorageResponsesContext()
  const { data, isLoading, isError } = useIndividualSubmission()
  const {
    data: paymentData,
    isLoading: isPaymentLoading,
    isError: isPaymentError,
  } = useIndividualPaymentSubmission()
  const { data: form } = useAdminForm()

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

  if (!secretKey) return <SecretKeyVerification />

  return (
    <Flex flexDir="column" marginTop={{ base: '-1.5rem', md: '-3rem' }}>
      <IndividualResponseNavbar />

      <Stack
        px={{ md: '1.75rem', lg: '2rem' }}
        spacing={{ base: '1.5rem', md: '2.5rem' }}
      >
        <Stack
          bg="primary.100"
          p="1.5rem"
          sx={{
            fontFeatureSettings: "'tnum' on, 'lnum' on, 'zero' on, 'cv05' on",
          }}
        >
          <Stack
            spacing={{ base: '0', md: '0.5rem' }}
            direction={{ base: 'column', md: 'row' }}
          >
            <Text as="span" textStyle="subhead-1">
              Response ID:
            </Text>
            <Text>{submissionId}</Text>
          </Stack>
          <Stack
            spacing={{ base: '0', md: '0.5rem' }}
            direction={{ base: 'column', md: 'row' }}
          >
            <Text as="span" textStyle="subhead-1">
              Timestamp:
            </Text>
            <Skeleton isLoaded={!isLoading && !isError}>
              {data?.submissionTime ?? 'Loading...'}
            </Skeleton>
          </Stack>
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
        </Stack>

        <Stack>
          {isLoading || isError ? (
            <LoadingDecryption />
          ) : (
            <Stack spacing="1.5rem" divider={<StackDivider />}>
              {data?.responses.map((r, idx) => (
                <DecryptedRow row={r} secretKey={secretKey} key={idx} />
              ))}
              <Box />
            </Stack>
          )}
        </Stack>

        {form?.payments?.enabled ? (
          <Stack>
            <Text
              textStyle="h2"
              as="h2"
              color="primary.500"
              mb="0.5rem"
              _notFirst={{ mt: '2.5rem' }}
            >
              Payment
            </Text>
            {isPaymentLoading || isPaymentError ? (
              <Text>Payment was not enabled when this form was submitted</Text>
            ) : (
              <>
                <Stack>
                  <Stack direction={{ base: 'column', md: 'row' }}>
                    <Text textStyle="subhead-1">Payment amount:</Text>
                    <Text>{paymentData?.amount}</Text>
                  </Stack>
                  <Stack direction={{ base: 'column', md: 'row' }}>
                    <Text textStyle="subhead-1">Payment status:</Text>
                    {/* TODO: Change this to actual status */}
                    <Text>Success</Text>
                  </Stack>
                  <Stack direction={{ base: 'column', md: 'row' }}>
                    <Text textStyle="subhead-1">Payment date:</Text>
                    {/* TODO: Change this to date of submission */}
                    <Text>{new Date().toLocaleDateString('en-sg')}</Text>
                  </Stack>
                  <Stack direction={{ base: 'column', md: 'row' }}>
                    <Text textStyle="subhead-1">Payment intent ID:</Text>
                    <Text>{paymentData?.paymentIntentId}</Text>
                  </Stack>
                  <Stack direction={{ base: 'column', md: 'row' }}>
                    <Text textStyle="subhead-1">Transaction fee:</Text>
                    {/* TODO: Change this to actual transaction fee */}
                    <Text>$0.06</Text>
                  </Stack>
                </Stack>
              </>
            )}
          </Stack>
        ) : null}
      </Stack>
    </Flex>
  )
}
