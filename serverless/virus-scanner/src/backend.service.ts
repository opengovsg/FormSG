import axios, { AxiosInstance } from 'axios'

interface BackendServiceInterface {
  updateMaliciousStatus(
    isMalicious: boolean,
    uin: string,
    objectKey: string,
    virusMetadata: string[],
  ): Promise<void>
}

export class BackendService implements BackendServiceInterface {
  private axios: AxiosInstance
  constructor(baseURL: string, apiKey: string) {
    this.axios = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    })
  }

  async updateMaliciousStatus(
    isMalicious: boolean,
    uin: string,
    objectKey: string,
    virusMetadata: string[],
  ) {
    const encodedObjectKey = encodeURIComponent(objectKey)
    await this.axios.patch(
      `/patients/${uin}/documents/${encodedObjectKey}/s3Key`,
      {
        isMalicious,
        virusMetadata,
      },
    )
  }
}
