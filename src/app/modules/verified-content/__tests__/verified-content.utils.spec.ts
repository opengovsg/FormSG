import { VerifiedKeys } from 'shared/utils/verified-content'

import { MalformedVerifiedContentError } from '../verified-content.errors'
import {
  getCpVerifiedContent,
  getSpVerifiedContent,
} from '../verified-content.utils'

describe('verified-content.utils', () => {
  describe('getSpVerifiedContent', () => {
    it('should successfully create SpVerifiedContent', async () => {
      // Arrange
      const correctDataWithExtra = {
        uinFin: 'something',
        extraData: 'extra',
      }

      // Act
      const actualResult = getSpVerifiedContent(correctDataWithExtra)

      // Assert
      expect(actualResult._unsafeUnwrap()).toEqual({
        [VerifiedKeys.SpUinFin]: correctDataWithExtra.uinFin,
      })
    })
    it('should return MalformedVerifiedContentError on invalid shape', async () => {
      // Arrange
      const incorrectData = {
        incorrect: 'something',
        extraData: 'extra',
      }

      // Act
      const actualResult = getSpVerifiedContent(incorrectData)

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new MalformedVerifiedContentError(),
      )
    })
  })

  describe('getCpVerifiedContent', () => {
    it('should successfully create CpVerifiedContent', async () => {
      // Arrange
      const correctDataWithExtra = {
        uinFin: 'something',
        userInfo: 'another',
        extraData: 'extra',
      }

      // Act
      const actualResult = getCpVerifiedContent(correctDataWithExtra)

      // Assert
      expect(actualResult._unsafeUnwrap()).toEqual({
        [VerifiedKeys.CpUen]: correctDataWithExtra.uinFin,
        [VerifiedKeys.CpUid]: correctDataWithExtra.userInfo,
      })
    })

    it('should return MalformedVerifiedContentError on partial shape', async () => {
      // Arrange
      // Has uinFin but not userInfo key
      const partialData = {
        uinFin: 'some uinFin',
        extraData: 'extra',
      }

      // Act
      const actualResult = getCpVerifiedContent(partialData)

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new MalformedVerifiedContentError(),
      )
    })

    it('should return MalformedVerifiedContentError on invalid shape', async () => {
      // Arrange
      const incorrectData = {
        incorrect: 'something',
        extraData: 'extra',
      }

      // Act
      const actualResult = getCpVerifiedContent(incorrectData)

      // Assert
      expect(actualResult._unsafeUnwrapErr()).toEqual(
        new MalformedVerifiedContentError(),
      )
    })
  })
})
