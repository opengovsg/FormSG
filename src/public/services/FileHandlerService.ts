import axios, { AxiosResponse, CancelToken } from 'axios'
import SparkMD5 from 'spark-md5'

export type UploadedFileData = {
  url: string
  fileId: string
  fileMd5Hash: string
  name: string
  size: number
}

type UploadImageParams = {
  image: File
  formId: string
  cancelToken?: CancelToken
}
/**
 * Generates an md5 hash string from given file.
 * Retrieved from https://dev.to/qortex/compute-md5-checksum-for-a-file-in-typescript-59a4.
 * @param file The file to generate an md5 hash for
 */
const computeChecksumMd5 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const chunkSize = 2097152 // Read in chunks of 2MB
    const spark = new SparkMD5.ArrayBuffer()
    const fileReader = new FileReader()

    let cursor = 0 // current cursor in file

    fileReader.onerror = function (): void {
      reject('MD5 computation failed - error reading the file')
    }

    // read chunk starting at `cursor` into memory
    function processChunk(chunk_start: number): void {
      const chunk_end = Math.min(file.size, chunk_start + chunkSize)
      fileReader.readAsArrayBuffer(file.slice(chunk_start, chunk_end))
    }

    fileReader.onload = function (e): void {
      const arrayBuffer = e.target?.result
      if (!arrayBuffer) {
        reject('Empty array buffer - error reading the file')
      }
      spark.append(arrayBuffer as ArrayBuffer) // Accumulate chunk to md5 computation
      cursor += chunkSize // Move past this chunk

      if (cursor < file.size) {
        // Enqueue next chunk to be accumulated
        processChunk(cursor)
      } else {
        // Computation ended, last chunk has been processed. Return as Promise value.
        // This returns the base64 encoded md5 hash, which is what cloud services expect.
        resolve(btoa(spark.end(true)))
      }
    }

    processChunk(0)
  })
}

type PresignedData = { fields: Record<string, string>; url: string }

const fetchPresignedData = async (
  url: string,
  params: {
    fileId: string
    fileMd5Hash: string
    fileType: string
    isNewClient: boolean // TODO (#128): Flag for server to know whether to append random object ID in front. To remove 2 weeks after release.
  },
  cancelToken?: CancelToken,
): Promise<PresignedData> => {
  return axios
    .post<PresignedData>(url, params, {
      cancelToken,
    })
    .then(({ data }) => data)
}

const postToPresignedUrl = async (
  presignedUrl: string,
  formData: FormData,
  cancelToken?: CancelToken,
): Promise<AxiosResponse<never>> => {
  return axios.post(presignedUrl, formData, {
    headers: { 'Content-Type': '' },
    withCredentials: false,
    cancelToken,
  })
}

/**
 * Exported for testing.
 * Uploads a file by requesting a presignedUrl and posting to it.
 *
 * @param arg.url the url to fetch presigned data from
 * @param arg.file the file to upload
 * @param arg.fileId the identifier of the file
 * @param arg.cancelToken optional. Allows for cancellation of the post request to the generated url in flight
 */
export const uploadFile = async ({
  url,
  file,
  fileId,
  cancelToken,
}: {
  url: string
  file: File
  fileId: string
  cancelToken?: CancelToken
}): Promise<UploadedFileData> => {
  const fileMd5Hash = await computeChecksumMd5(file)
  const presignedDataParams = {
    fileId,
    fileMd5Hash,
    fileType: file.type,
    isNewClient: true, // TODO (#128): Flag for server to know whether to append random object ID in front. To remove 2 weeks after release.
  }

  const postData = await fetchPresignedData(
    url,
    presignedDataParams,
    cancelToken,
  )

  // Generate formdata to post to the presigned url.
  const formData = new FormData()
  Object.entries(postData.fields).forEach(([k, v]) => formData.append(k, v))
  formData.append('file', file)

  // POST generated formData to presigned url.
  const response = await postToPresignedUrl(postData.url, formData, cancelToken)

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
 * @param arg.cancelToken optional. Allows for cancellation of the upload in flight
 */
export const uploadImage = async ({
  image,
  formId,
  cancelToken,
}: UploadImageParams): Promise<UploadedFileData> => {
  const fileId = `${formId}-${Date.now()}-${image.name.toLowerCase()}`

  return uploadFile({
    url: `/api/v3/admin/forms/${formId}/images/presign`,
    file: image,
    fileId,
    cancelToken,
  })
}

/**
 * Uploads a logo to the backend
 * @param arg.image The logo to upload.
 * @param arg.formId The form the upload is tied to.
 * @param arg.cancelToken optional. Allows for cancellation of the upload in flight
 */
export const uploadLogo = async ({
  image,
  formId,
  cancelToken,
}: UploadImageParams): Promise<UploadedFileData> => {
  const fileId = `${Date.now()}-${image.name.toLowerCase()}`

  return uploadFile({
    url: `/api/v3/admin/forms/${formId}/logos/presign`,
    file: image,
    fileId,
    cancelToken,
  })
}
