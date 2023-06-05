import { AxiosResponse } from 'axios'
import SparkMD5 from 'spark-md5'

import { ApiService } from './ApiService'

export type UploadedFileData = {
  url: string
  fileId: string
  fileMd5Hash: string
  name: string
  size: number
}

type PresignUrlEndpoint =
  | `/admin/forms/${string}/images/presign`
  | `/admin/forms/${string}/logos/presign`

type UploadImageParams = {
  image: File
  formId: string
}

type PresignedData = { fields: Record<string, string>; url: string }

/**
 * Generates an md5 hash string from given file.
 * Retrieved from https://dev.to/qortex/compute-md5-checksum-for-a-file-in-typescript-59a4.
 * @param file The file to generate an md5 hash for
 */
const computeChecksumMd5 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const chunkSize = 2097152 // Read in chunks of 2MiB (1024^2 * 2)
    const spark = new SparkMD5.ArrayBuffer()
    const fileReader = new FileReader()

    let cursor = 0 // current cursor in file

    fileReader.onerror = () => {
      reject('MD5 computation failed - error reading the file')
    }

    // read chunk starting at `cursor` into memory
    const processChunk = (chunk_start: number): void => {
      const chunk_end = Math.min(file.size, chunk_start + chunkSize)
      fileReader.readAsArrayBuffer(file.slice(chunk_start, chunk_end))
    }

    fileReader.onload = (e) => {
      const arrayBuffer = e.target?.result
      if (!(arrayBuffer instanceof ArrayBuffer)) {
        return reject('Empty array buffer - error reading the file')
      }
      spark.append(arrayBuffer) // Accumulate chunk to md5 computation
      cursor += chunkSize // Move past this chunk

      if (cursor < file.size) {
        // Enqueue next chunk to be accumulated
        return processChunk(cursor)
      } else {
        // Computation ended, last chunk has been processed. Return as Promise value.
        // This returns the base64 encoded md5 hash, which is what cloud services expect.
        return resolve(btoa(spark.end(true)))
      }
    }

    return processChunk(0)
  })
}

const generatePresignedData = async (
  url: PresignUrlEndpoint,
  params: { fileId: string; fileMd5Hash: string; fileType: string },
): Promise<PresignedData> => {
  return ApiService.post<PresignedData>(url, params).then(({ data }) => data)
}

const postToPresignedUrl = async (
  presignedUrl: string,
  formData: FormData,
): Promise<AxiosResponse<never>> => {
  return ApiService.post(presignedUrl, formData, {
    headers: { 'Content-Type': '' },
    withCredentials: false,
  })
}

/**
 * Uploads a file by requesting a presignedUrl and posting to it.
 *
 * @param arg.url the url to fetch presigned data from
 * @param arg.file the file to upload
 * @param arg.fileId the identifier of the file
 */
const uploadFile = async ({
  url,
  file,
  fileId,
}: {
  url: PresignUrlEndpoint
  file: File
  fileId: string
}): Promise<UploadedFileData> => {
  const fileMd5Hash = await computeChecksumMd5(file)
  const presignedDataParams = {
    fileId,
    fileMd5Hash,
    fileType: file.type,
  }

  const postData = await generatePresignedData(url, presignedDataParams)

  // Generate formdata to post to the presigned url.
  const formData = new FormData()
  Object.entries(postData.fields).forEach(([k, v]) => formData.append(k, v))
  formData.append('file', file)

  // POST generated formData to presigned url.
  const response = await postToPresignedUrl(postData.url, formData)

  const encodedFileId = encodeURIComponent(postData.fields.key)

  const uploadedFileData: UploadedFileData = {
    url: `${response.config.url}/${encodedFileId}`,
    fileId: encodedFileId,
    fileMd5Hash,
    name: file.name,
    size: file.size,
  }

  return uploadedFileData
}

/**
 * Uploads an image to the backend
 * @param arg.image The image to upload.
 * @param arg.formId The form the upload is tied to.
 */
export const uploadImage = async ({
  image,
  formId,
}: UploadImageParams): Promise<UploadedFileData> => {
  const fileId = `${formId}-${Date.now()}-${image.name.toLowerCase()}`

  return uploadFile({
    url: `/admin/forms/${formId}/images/presign`,
    file: image,
    fileId,
  })
}

/**
 * Uploads a logo to the backend
 * @param arg.image The logo to upload.
 * @param arg.formId The form the upload is tied to.
 */
export const uploadLogo = async ({
  image,
  formId,
}: UploadImageParams): Promise<UploadedFileData> => {
  const fileId = `${Date.now()}-${image.name.toLowerCase()}`

  return uploadFile({
    url: `/admin/forms/${formId}/logos/presign`,
    file: image,
    fileId,
  })
}
