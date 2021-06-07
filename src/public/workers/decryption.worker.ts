/* eslint-env worker */

import formsgSdk from '@opengovsg/formsg-sdk'
import {
  FormField as VerifiedFormField,
  PackageMode,
} from '@opengovsg/formsg-sdk/dist/types'
import { decode as decodeBase64 } from '@stablelib/base64'
import axios from 'axios'
import JSZip from 'jszip'
import { flatMapDeep, isEmpty, join, omit } from 'lodash'
import { errAsync, ok, okAsync, Result, ResultAsync } from 'neverthrow'
import { default as PQueue } from 'p-queue'

import { TRANSACTION_EXPIRE_AFTER_SECONDS } from '../../shared/util/verification'
import {
  BasicField,
  IResponseWorker,
  WorkerError,
  WorkerErrorStates,
  WorkerState,
  WorkerSuccessStates,
} from '../../types'
import { processDecryptedContent } from '../modules/forms/helpers/process-decrypted-content'

type EncryptedAttachmentContent = {
  encryptedFile: {
    submissionPublicKey: string
    nonce: string
    binary: string
  }
}

type TResponse = {
  csvRecord: CsvRecord | WorkerError
}

type DecryptRequest = {
  line: string
  secretKey: string
  sdkMode: PackageMode
  downloadAttachments?: boolean
}

// Casted as any to allow TS to infer typings for self.
// This is required because otherwise, TS infers self as being of type Window.
// However, because workers run in a separate (and more restricted) context, this is not true.
// An important difference is in the postMessage API, which differs between Worker/Window
// Refer here: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const worker: IResponseWorker<DecryptRequest, TResponse> = self as any

// NOTE: These types are meant only for internal consumption and are not exposed.
// Because postMessage uses a structured clone to return data back to the main thread,
// the types on the main thread can differ.
// Hence, the calling API should declare its own types rather than relying on definitions here.
// Refer here for postMessage information: https://developer.mozilla.org/en-US/docs/Web/API/Worker/postMessage
type EncryptedSubmission = {
  encryptedContent: string
  verifiedContent: string
  created: string
  _id: string
  attachmentMetadata: Record<string, string>
}

type SubmissionMeta = Omit<
  EncryptedSubmission,
  'encryptedContent' | 'verifiedContent'
>

type AttachmentDownloadInfo = {
  url: string
  filename: string
}

type VerifiedFormFieldWithQuestionNumber = VerifiedFormField & {
  // NOTE: This is undefined when fieldType === section
  questionNumber?: number
}

type SubmissionData = {
  created: string
  submissionId: string
  record: VerifiedFormField[]
}

// Represents a csv record decrypted by a decryption worker
type CsvRecord = {
  status: WorkerSuccessStates.Success
  submissionData: SubmissionData
  id: string
  downloadBlob?: Blob
}

/**
 * This function generates the metadata for the downloaded records and acts as a sentinel value
 * This should be called and inserted at the front of every decrypted submission
 */
const generateDownloadMeta = (
  statusMessage: WorkerState,
): VerifiedFormFieldWithQuestionNumber => ({
  _id: '000000000000000000000000',
  fieldType: 'textfield',
  question: 'Download Status',
  answer: statusMessage,
  questionNumber: 1000000,
})

const generateCsvRecord = (
  meta: SubmissionMeta,
  decryptedSubmission: VerifiedFormFieldWithQuestionNumber[],
  downloadBlob?: Blob,
): CsvRecord => {
  const downloadStatus = generateDownloadMeta(WorkerSuccessStates.Success)
  const output = [downloadStatus, ...decryptedSubmission]

  return {
    status: WorkerSuccessStates.Success,
    submissionData: {
      created: meta.created,
      submissionId: meta._id,
      record: output,
    },
    downloadBlob,
    id: meta._id,
  }
}

/**
 * Triggers a download of a set of attachments as a zip file when given attachment metadata and a secret key
 * @param {Map} attachmentDownloadUrls Map of question number to individual attachment metadata (object with url and filename properties)
 * @param {String} secretKey An instance of EncryptionKey for decrypting the attachment
 * @returns {Promise} A Promise containing the contents of the ZIP file as a blob
 */
const downloadAndDecryptAttachmentsAsZip = async (
  attachmentDownloadUrls: Map<string, { url: string; filename: string }>,
  secretKey: string,
  FormSgSdk: ReturnType<typeof formsgSdk>,
): Promise<Blob> => {
  const zip = new JSZip()
  const downloadPromises = Array.from(attachmentDownloadUrls).map(
    async ([questionNum, { url, filename }]) => {
      // eslint-disable-next-line typesafe/no-await-without-trycatch
      const bytesArray = await downloadAndDecryptAttachment(
        url,
        secretKey,
        FormSgSdk,
      )
      const fileName = `Question ${questionNum} - ${filename}`
      return zip.file(fileName, bytesArray || [])
    },
  )

  return Promise.all(downloadPromises).then(() => {
    return zip.generateAsync({ type: 'blob' })
  })
}

/**
 * Triggers a download of a single attachment when given an S3 presigned url and a secretKey
 * @param {String} url URL pointing to the location of the encrypted attachment
 * @param {String} secretKey An instance of EncryptionKey for decrypting the attachment
 * @returns {Promise} A Promise containing the contents of the file as a Blob
 */
const downloadAndDecryptAttachment = (
  url: string,
  secretKey: string,
  FormSgSdk: ReturnType<typeof formsgSdk>,
): Promise<Uint8Array | null> => {
  return axios.get<EncryptedAttachmentContent>(url).then(({ data }) => {
    const decodedBinary = decodeBase64(data.encryptedFile.binary)
    return FormSgSdk.crypto.decryptFile(secretKey, {
      ...data.encryptedFile,
      binary: decodedBinary,
    })
  })
}

/**
 * Verifies that the signatures for every field that has a corresponding signature are valid.
 * If any one of them is invalid, append NOT VERIFIED to that record.
 * We do not retrieve the form to check if fields must be verifiable. Thus if a field is verifiable but does not have a signature,
 * we would not verify it here.
 * @param decryptedSubmission Array of JSON objects representing questions and answers
 * @param created Database timestamp of submission
 * @param FormSgSdk The sdk to verify the submission with
 * @returns true if signature is valid, false otherwise
 */
function verifySignature(
  decryptedSubmission: VerifiedFormField[],
  created: string,
  FormSgSdk: ReturnType<typeof formsgSdk>,
): boolean {
  const signatureFields = decryptedSubmission.filter((field) => field.signature)
  if (signatureFields.length === 0) return true
  const verified = signatureFields.map((field) => {
    const { signature: signatureString, _id: fieldId, answer } = field

    if (!signatureString || !answer) return false

    try {
      return FormSgSdk.verification.authenticate({
        signatureString,
        submissionCreatedAt: Date.parse(created),
        fieldId,
        answer,
      })
    } catch {
      return false
    }
  })
  return verified.every((v) => v)
}

const parseAsEncryptedSubmission = (line: string): EncryptedSubmission =>
  JSON.parse(line)

const safeJsonParse = (line: string) =>
  Result.fromThrowable(
    () => parseAsEncryptedSubmission(line),
    (): WorkerError => ({
      status: WorkerErrorStates.ParsingError,
    }),
  )()

// Flattens an array into a flat string separated by ,
const generateFieldName = (fieldAnswer?: string[] | string[][]): string => {
  const fieldAnswers = flatMapDeep(fieldAnswer)

  if (isEmpty(fieldAnswers)) {
    return ''
  }

  return join(fieldAnswers)
}

const generateAttachmentDownloadUrls = (
  decryptedSubmission: VerifiedFormField[],
  attachmentMetadata: Record<string, string>,
): Map<string, AttachmentDownloadInfo> => {
  const { map: attachmentDownloadUrls } = decryptedSubmission.reduce(
    ({ map, count }, field) => {
      if (field.fieldType !== BasicField.Section) {
        count++
      }

      if (attachmentMetadata[field._id]) {
        map.set(count, {
          url: attachmentMetadata[field._id],
          filename: field.answer || generateFieldName(field.answerArray),
        })
      }

      return { map, count }
    },
    { map: new Map(), count: 0 },
  )

  return attachmentDownloadUrls
}

const downloadAttachments = (
  secretKey: string,
  attachmentDownloadUrls: Map<string, AttachmentDownloadInfo>,
  FormSgSdk: ReturnType<typeof formsgSdk>,
): ResultAsync<Blob, WorkerError> => {
  const queue = new PQueue({ concurrency: 1 })
  const initializeDownloads = async () => {
    return queue.add(() =>
      downloadAndDecryptAttachmentsAsZip(
        attachmentDownloadUrls,
        secretKey,
        FormSgSdk,
      ),
    )
  }

  return ResultAsync.fromPromise(
    initializeDownloads(),
    (): WorkerError => {
      return {
        status: WorkerErrorStates.AttachmentDownloadError,
      }
    },
  )
}

const decryptIntoResult = (
  secretKey: string,
  FormSgSdk: ReturnType<typeof formsgSdk>,
  encryptedContent: string,
  verifiedContent?: string,
) =>
  Result.fromThrowable(
    () => {
      // NOTE: The decrypt function uses null to signal errors
      // Because processing is dependent on the fact that decryption is successful,
      // Short-circuit by throwing an error
      const decryptedContent = FormSgSdk.crypto.decrypt(secretKey, {
        encryptedContent,
        verifiedContent,
        // TODO(#2029): Use submission's own version number when server returns this.
        version: 1,
      })
      // NOTE: No custom error because signalling is done through WorkerError type
      if (!decryptedContent) throw new Error()
      return decryptedContent
    },
    (): WorkerError => ({
      status: WorkerErrorStates.DecryptionError,
      message: 'Decryption of the given content failed.',
    }),
  )()

/**
 * Decrypts given data into a {@link CsvRecord} and posts the result back to the
 * main thread.
 * @param data The data to decrypt into a csvRecord.
 */
const decryptIntoCsv = (data: DecryptRequest): ResultAsync<void, never> => {
  const {
    line,
    secretKey,
    downloadAttachments: shouldDownloadAttachments,
    sdkMode,
  } = data

  // Step 1: Check if the formsgSdk is initialised
  if (!sdkMode) {
    worker.postMessage({
      csvRecord: {
        status: WorkerErrorStates.InitializationError,
        message: 'Please ensure that the sdkMode has been specified!',
      },
    })
  }

  const FormSgSdk = formsgSdk({
    mode: sdkMode,
    verificationOptions: {
      transactionExpiry: TRANSACTION_EXPIRE_AFTER_SECONDS,
    },
  })

  return (
    // Step 2: Attempt to parse the line as JSON
    safeJsonParse(line)
      // Step 3: Decrypt the submission
      .andThen((encryptedSubmission) => {
        const { encryptedContent, verifiedContent } = encryptedSubmission
        return decryptIntoResult(
          secretKey,
          FormSgSdk,
          encryptedContent,
          verifiedContent,
        ).map((decryptedContent) => {
          const submissionMeta = omit(encryptedSubmission, [
            'encryptedContent',
            'verifiedContent',
          ])
          return { meta: submissionMeta, decrypted: decryptedContent }
        })
      })
      .asyncAndThen<CsvRecord, WorkerError>(({ decrypted, meta }) => {
        const decryptedSubmission = processDecryptedContent(decrypted)
        const isSignatureVerified = verifySignature(
          decryptedSubmission,
          meta.created,
          FormSgSdk,
        )

        // Step 4.1: Check if signatures are verified and short-circuit if not
        if (!isSignatureVerified) {
          return errAsync({
            status: WorkerErrorStates.UnverifiedSignatureError,
          })
        }

        // Step 4.2: Determine if we should generate attachments
        if (!shouldDownloadAttachments) {
          return okAsync(generateCsvRecord(meta, decryptedSubmission))
        }

        // Step 4.3: Generate and attempt to download the attachments
        const downloadUrlRecords = generateAttachmentDownloadUrls(
          decryptedSubmission,
          meta.attachmentMetadata,
        )

        return downloadAttachments(
          secretKey,
          downloadUrlRecords,
          FormSgSdk,
        ).map((downloadBlob) =>
          generateCsvRecord(meta, decryptedSubmission, downloadBlob),
        )
      })
      // Step 5: postMessage back to main thread with accumulated data
      .map((csvRecord) => worker.postMessage({ csvRecord }))
      .orElse((error) => {
        return ok(worker.postMessage({ csvRecord: error }))
      })
  )
}

worker.onmessage = ({ data }) => {
  if (data) {
    return decryptIntoCsv(data)
  }
}
export default worker
