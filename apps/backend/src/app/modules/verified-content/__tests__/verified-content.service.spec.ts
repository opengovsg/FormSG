import formsgSdk from 'src/app/config/formsg-sdk'

import { FormAuthType } from '../../../../../shared/types'
import {
  EncryptVerifiedContentError,
  MalformedVerifiedContentError,
} from '../verified-content.errors'
import {
  encryptVerifiedContent,
  getVerifiedContent,
} from '../verified-content.service'
import {
  CpVerifiedContent,
  SgidVerifiedContent,
  SpVerifiedContent,
} from '../verified-content.types'

describe('verified-content.service', () => {
  describe('getVerifiedContent', () => {
    it('should return verified content for FormAuthType.SP data', async () => {
      // Arrange
      const mockData = {
        extraData: 'some extra data',
        uinFin: 'S1234567Z',
      }
      // Only contain uinFin key.
      const expected: SpVerifiedContent = {
        uinFin: mockData['uinFin'],
      }

      // Act
      const result = getVerifiedContent({
        type: FormAuthType.SP,
        data: mockData,
      })

      // Assert
      expect(result._unsafeUnwrap()).toEqual(expected)
    })

    it('should return verified content for FormAuthType.CP data', async () => {
      // Arrange
      const mockData = {
        extraData: 'some extra data again',
        uinFin: 'S1234567Z',
        userInfo: 'U987654323FORMSG',
      }
      const expected: CpVerifiedContent = {
        cpUen: mockData['uinFin'],
        cpUid: mockData['userInfo'],
      }

      // Act
      const result = getVerifiedContent({
        type: FormAuthType.CP,
        data: mockData,
      })

      // Assert
      expect(result._unsafeUnwrap()).toEqual(expected)
    })

    it('should return verified content for FormAuthType.SGID data', async () => {
      // Arrange
      const mockData = {
        extraData: 'some extra data again',
        uinFin: 'S1234567Z',
      }
      const expected: SgidVerifiedContent = {
        sgidUinFin: mockData['uinFin'],
      }

      // Act
      const result = getVerifiedContent({
        type: FormAuthType.SGID,
        data: mockData,
      })

      // Assert
      expect(result._unsafeUnwrap()).toEqual(expected)
    })

    it('should return error if retrieved SP data does not fit the expected shape', async () => {
      // Arrange
      const mockDataWithoutUin = {
        extraData: 'some data',
        anotherExtraData: 'more useless data',
      }

      // Act
      const result = getVerifiedContent({
        type: FormAuthType.SP,
        data: mockDataWithoutUin,
      })

      // Assert
      expect(result._unsafeUnwrapErr()).toEqual(
        new MalformedVerifiedContentError(),
      )
    })

    it('should return error if retrieved CP data does not fit the expected shape', async () => {
      // Arrange
      // Only contain userInfo and not uin
      const mockDataWithoutUin = {
        extraData: 'some data',
        anotherExtraData: 'more useless data',
        userInfo: 'GG238486828FORMSG',
      }

      // Act
      const result = getVerifiedContent({
        type: FormAuthType.CP,
        data: mockDataWithoutUin,
      })

      // Assert
      expect(result._unsafeUnwrapErr()).toEqual(
        new MalformedVerifiedContentError(),
      )
    })

    it('should return error if retrieved SGID data does not fit the expected shape', async () => {
      // Arrange
      const mockDataWithoutUin = {
        extraData: 'some data',
        anotherExtraData: 'more useless data',
      }

      // Act
      const result = getVerifiedContent({
        type: FormAuthType.SGID,
        data: mockDataWithoutUin,
      })

      // Assert
      expect(result._unsafeUnwrapErr()).toEqual(
        new MalformedVerifiedContentError(),
      )
    })
  })

  describe('encryptVerifiedContent', () => {
    beforeEach(() => jest.clearAllMocks())

    it('should successfully encrypt given verified content', async () => {
      // Arrange
      const mockVerifiedContent = {
        cpUen: 'S1234567Z',
        cpUid: 'U987654323FORMSG',
      }
      const mockEncryptedContent = 'abc-thisistotallyencrypted'
      // Mock return value of formsg sdk encrypt.
      const sdkSpy = jest
        .spyOn(formsgSdk.crypto, 'encrypt')
        .mockReturnValueOnce(mockEncryptedContent)

      // Act
      const result = encryptVerifiedContent({
        verifiedContent: mockVerifiedContent,
        formPublicKey: 'mockPublicKey',
      })

      // Assert
      expect(sdkSpy).toHaveBeenCalledTimes(1)
      expect(result._unsafeUnwrap()).toEqual(mockEncryptedContent)
    })

    it('should return EncryptVerifiedContentError when encryption error occurs', async () => {
      // Arrange
      const mockVerifiedContent = {
        uinFin: 'S1234567Z',
      }
      // Mock throw error in formsg sdk encrypt.
      const sdkSpy = jest
        .spyOn(formsgSdk.crypto, 'encrypt')
        .mockImplementationOnce(() => {
          throw new Error('some error')
        })

      // Act
      const result = encryptVerifiedContent({
        verifiedContent: mockVerifiedContent,
        formPublicKey: 'mockPublicKey',
      })

      // Assert
      expect(sdkSpy).toHaveBeenCalledTimes(1)
      expect(result._unsafeUnwrapErr()).toEqual(
        new EncryptVerifiedContentError(),
      )
    })
  })
})
