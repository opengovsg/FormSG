import { ObjectId } from 'bson-ext'
import mockAxios from 'jest-mock-axios'
import MockDate from 'mockdate'

import mockFile from 'tests/unit/frontend/helpers/mockFile'

import * as FileHandlerService from '../FileHandlerService'

jest.mock('axios', () => mockAxios)

describe('FileHandlerService', () => {
  afterEach(() => mockAxios.reset())

  describe('uploadImage', () => {
    it('should successfully return upload file data', async () => {
      // Arrange
      // Fix date for fileId creation.
      MockDate.set(new Date())
      const mockFormId = '123456'
      const mockImage = mockFile({ name: 'mockImageName' })
      const expectedFileId = `${mockFormId}-${Date.now()}-${mockImage.name.toLowerCase()}`

      const expected: FileHandlerService.UploadedFileData = {
        fileId: expectedFileId,
        fileMd5Hash: 'mock hash',
        name: mockImage.name,
        size: mockImage.size,
        url: 'https://mockurl.example.com',
      }

      const uploadSpy = jest
        .spyOn(FileHandlerService, 'uploadFile')
        .mockResolvedValueOnce(expected)

      // Act
      const actual = await FileHandlerService.uploadImage({
        formId: mockFormId,
        image: mockImage,
      })

      // Assert
      expect(actual).toEqual(expected)
      expect(uploadSpy).toHaveBeenCalledWith({
        url: `/api/v3/admin/forms/${mockFormId}/images/presign`,
        file: mockImage,
        fileId: expectedFileId,
      })

      MockDate.reset()
    })
  })

  describe('uploadLogo', () => {
    it('should successfully return upload file data', async () => {
      // Arrange
      // Fix date for fileId creation.
      MockDate.set(new Date())
      const mockFormId = '7654321'
      const mockLogo = mockFile({ name: 'mockLogoName' })
      // Logos don't have the formId.
      const expectedFileId = `${Date.now()}-${mockLogo.name.toLowerCase()}`

      const expected: FileHandlerService.UploadedFileData = {
        fileId: expectedFileId,
        fileMd5Hash: 'mock hash',
        name: mockLogo.name,
        size: mockLogo.size,
        url: 'https://mockurl2.example.com',
      }

      const uploadSpy = jest
        .spyOn(FileHandlerService, 'uploadFile')
        .mockResolvedValueOnce(expected)

      // Act
      const actual = await FileHandlerService.uploadLogo({
        formId: mockFormId,
        image: mockLogo,
      })

      // Assert
      expect(actual).toEqual(expected)
      expect(uploadSpy).toHaveBeenCalledWith({
        url: `/api/v3/admin/forms/${mockFormId}/logos/presign`,
        file: mockLogo,
        fileId: expectedFileId,
      })

      MockDate.reset()
    })
  })

  describe('uploadFile', () => {
    it('should return uploaded file data when successful', async () => {
      // Arrange
      const mockUpload = mockFile({ name: 'someMockUploadName' })
      const mockUrl = 'some/url'
      const mockPresignedUrl = 'another/url/'
      const mockFileId = 'mockFileId'
      const mockPostUrl = 'final/presigned/url/'
      const mockKeyReturned = `${String(new ObjectId())}-${mockFileId}`

      // Mock axios responses in sequence.
      mockAxios.post
        // POSTing to retrieve presigned data.
        .mockResolvedValueOnce({
          data: {
            fields: {
              fieldA: 'AValue',
              fieldB: 'BValue',
              key: mockKeyReturned,
            },
            url: mockPresignedUrl,
          },
        })
        // POSTing to presigned url.
        .mockResolvedValueOnce({
          config: {
            url: mockPostUrl,
          },
        })

      // Act
      const actual = await FileHandlerService.uploadFile({
        url: mockUrl,
        file: mockUpload,
        fileId: mockFileId,
      })

      // Assert
      const expectedPresignedDataParams = {
        fileId: mockFileId,
        fileMd5Hash: expect.any(String),
        fileType: mockUpload.type,
      }

      const expectedFinalValue: FileHandlerService.UploadedFileData = {
        url: `${mockPostUrl}/${mockKeyReturned}`,
        fileId: mockKeyReturned,
        fileMd5Hash: expect.any(String),
        name: mockUpload.name,
        size: mockUpload.size,
      }

      // Generate expected FormData
      const expectedFormData = new FormData()
      Object.entries({
        fieldA: 'AValue',
        fieldB: 'BValue',
        key: mockKeyReturned,
      }).forEach(([k, v]) => expectedFormData.append(k, v))
      expectedFormData.append('file', mockUpload)

      expect(mockAxios.post).toHaveBeenCalledTimes(2)
      // Assert retrieve presigned data call argument
      expect(mockAxios.post).toHaveBeenNthCalledWith(
        1,
        mockUrl,
        expectedPresignedDataParams,
        { cancelToken: undefined },
      )
      // Assert POSTing params
      expect(mockAxios.post).toHaveBeenNthCalledWith(
        2,
        mockPresignedUrl,
        expectedFormData,
        {
          cancelToken: undefined,
          headers: { 'Content-Type': '' },
          withCredentials: false,
        },
      )
      expect(actual).toEqual(expectedFinalValue)
    })
  })
})
