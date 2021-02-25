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
 * @param file The file to generate an md5 hash for
 */
const generateFileMd5Hash = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    const spark = new SparkMD5.ArrayBuffer()

    reader.onload = function (e) {
      const arrayBuffer = e.target?.result
      if (!arrayBuffer) return
      spark.append(arrayBuffer as ArrayBuffer) // Append array buffer
      const md5Hash = spark.end()

      return resolve(md5Hash)
    }
    reader.onerror = () => reject(new Error(`Error while hashing!`))
    reader.readAsArrayBuffer(file)
  })
}

const fetchPresignedData = async (
  url: string,
  params: { fileId: string; fileMd5Hash: string; fileType: string },
  cancelToken?: CancelToken,
): Promise<{ fields: Record<string, string>; url: string }> => {
  return axios
    .post(url, params, {
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
    headers: { 'Content-Type': undefined },
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
  const fileMd5Hash = await generateFileMd5Hash(file)
  const presignedDataParams = {
    fileId,
    fileMd5Hash,
    fileType: file.type,
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

  const encodedFileId = encodeURIComponent(fileId)

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
 * @param arg.cancelUploadPromise On resolve, this will cancel the upload
 */
export const uploadImage = ({
  image,
  formId,
  cancelToken,
}: UploadImageParams): Promise<UploadedFileData> => {
  const fileId = `${formId}-${Date.now()}-${image.name.toLowerCase()}`

  return uploadFile({
    url: `/${formId}/adminform/images`,
    file: image,
    fileId,
    cancelToken,
  })
}

/**
 * Uploads a logo to the backend
 * @param arg.image The logo to upload.
 * @param arg.formId The form the upload is tied to.
 * @param arg.cancelUploadPromise On resolve, this will cancel the upload
 */
export const uploadLogo = ({
  image,
  formId,
  cancelToken,
}: UploadImageParams): Promise<UploadedFileData> => {
  const fileId = `${Date.now()}-${image.name.toLowerCase()}`

  return uploadFile({
    url: `/${formId}/adminform/logos`,
    file: image,
    fileId,
    cancelToken,
  })
}
