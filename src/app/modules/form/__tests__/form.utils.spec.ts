import { Permission } from 'src/types'

import { getCollabEmailsWithPermission } from '../form.utils'

const MOCK_EMAIL_1 = 'a@abc.com'
const MOCK_EMAIL_2 = 'b@def.com'

describe('form.utils', () => {
  describe('getCollabEmailsWithPermission', () => {
    it('should return empty array when no arguments are given', () => {
      expect(getCollabEmailsWithPermission()).toEqual([])
    })

    it('should return empty array when permissionList is undefined but writePermission is defined', () => {
      expect(getCollabEmailsWithPermission(undefined, true)).toEqual([])
    })

    it('should return all collaborators when writePermission is undefined', () => {
      const collabs: Permission[] = [
        { email: MOCK_EMAIL_1, write: true },
        { email: MOCK_EMAIL_2, write: false },
      ]
      const result = getCollabEmailsWithPermission(collabs)
      expect(result).toEqual([MOCK_EMAIL_1, MOCK_EMAIL_2])
    })

    it('should return write-only collaborators when writePermission is true', () => {
      const collabs: Permission[] = [
        { email: MOCK_EMAIL_1, write: true },
        { email: MOCK_EMAIL_2, write: false },
      ]
      const result = getCollabEmailsWithPermission(collabs, true)
      expect(result).toEqual([MOCK_EMAIL_1])
    })

    it('should return read-only collaborators when writePermission is false', () => {
      const collabs: Permission[] = [
        { email: MOCK_EMAIL_1, write: true },
        { email: MOCK_EMAIL_2, write: false },
      ]
      const result = getCollabEmailsWithPermission(collabs, false)
      expect(result).toEqual([MOCK_EMAIL_2])
    })
  })
})
