import { getResponseModeFilter } from 'src/app/modules/submission/submission.utils'

import { BasicField } from '../../../../../shared/types'

describe('submission.utils', () => {
  describe('getResponseModeFilter', () => {
    const ALL_FIELD_TYPES = Object.values(BasicField).map((fieldType) => ({
      fieldType,
    }))

    it('should return emailMode filter when encrypted=false is passed', async () => {
      // Act
      const modeFilter = getResponseModeFilter(false)
      const actual = modeFilter(ALL_FIELD_TYPES)

      // Assert
      expect(modeFilter.name).toEqual('clearResponseModeFilter')
      // Should filter out image and statement fields in email mode.
      const typesToBeFiltered = [BasicField.Image, BasicField.Statement]
      typesToBeFiltered.forEach((fieldType) => {
        expect(actual).not.toContainEqual(
          expect.objectContaining({
            fieldType,
          }),
        )
      })
      expect(actual.length).toEqual(
        ALL_FIELD_TYPES.length - typesToBeFiltered.length,
      )
    })

    it('should return encryptMode filter when encrypted=true is passed', async () => {
      // Act
      const modeFilter = getResponseModeFilter(true)
      const actual = modeFilter(ALL_FIELD_TYPES)

      // Assert
      expect(modeFilter.name).toEqual('encryptedResponseModeFilter')
      // Should only return verifiable fields.
      expect(actual).toEqual(
        expect.arrayContaining([
          { fieldType: BasicField.Mobile },
          { fieldType: BasicField.Email },
        ]),
      )
      expect(actual.length).toEqual(2)
    })
  })
})
