import { MyInfoAttribute as InternalAttr } from 'formsg-shared/types'
import type * as client from 'openid-client'

import {
  requestedAttrsToScopeString,
  userInfoToPersonResponse,
} from '../myinfo.fapi.adapter'
import { MyInfoFapiMissingUinFinError } from '../myinfo.fapi.errors'

const asClaims = (claims: Record<string, unknown>) =>
  claims as unknown as client.UserInfoResponse

describe('myinfo.fapi.adapter', () => {
  describe('requestedAttrsToScopeString', () => {
    it('should prepend openid and always include uinfin', () => {
      const scopes = requestedAttrsToScopeString([
        InternalAttr.Name,
        InternalAttr.MobileNo,
      ]).split(' ')

      expect(scopes[0]).toBe('openid')
      expect(scopes).toContain('uinfin')
      expect(scopes).toContain('name')
      expect(scopes).toContain('mobileno')
    })

    it('should emit the granular children scopes rather than a compound attribute', () => {
      const scopes = requestedAttrsToScopeString([
        InternalAttr.ChildName,
        InternalAttr.ChildDateOfBirth,
      ]).split(' ')

      expect(scopes).toContain('childrenbirthrecords.name')
      expect(scopes).toContain('childrenbirthrecords.dob')
    })

    it('should de-duplicate repeated attributes', () => {
      const scopes = requestedAttrsToScopeString([
        InternalAttr.Name,
        InternalAttr.Name,
      ]).split(' ')

      expect(scopes).toEqual(Array.from(new Set(scopes)))
    })
  })

  describe('userInfoToPersonResponse', () => {
    it('should map person_info onto v3 IPersonResponse shape', () => {
      const personInfo = {
        uinfin: {
          lastupdated: '2024-09-26',
          source: '1',
          classification: 'C',
          value: 'S9000001B',
        },
        name: {
          lastupdated: '2024-09-26',
          source: '1',
          classification: 'C',
          value: 'SOH HAO FENG',
        },
      }

      const result = userInfoToPersonResponse(
        asClaims({
          person_info: personInfo,
          iss: 'https://id.singpass.gov.sg/fapi',
          sub: 'd45d8f21-6178-4713-b962-8635ed2a945a',
          aud: 'T5sM5a53Yaw3URyDEv2y9129CbElCN2F',
          iat: 1746678089,
        }),
      )

      expect(result._unsafeUnwrap()).toEqual({
        uinFin: 'S9000001B',
        data: personInfo,
      })
    })

    it('should error rather than fall back to sub when uinfin is absent', () => {
      const result = userInfoToPersonResponse(
        asClaims({
          sub: 'a-pseudonymous-uuid',
          person_info: { name: { value: 'Test Person' } },
        }),
      )

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        MyInfoFapiMissingUinFinError,
      )
    })

    it('should error when person_info is absent entirely', () => {
      const result = userInfoToPersonResponse(
        asClaims({ sub: 'a-pseudonymous-uuid' }),
      )

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        MyInfoFapiMissingUinFinError,
      )
    })

    it('should error when uinfin is present but unavailable', () => {
      const result = userInfoToPersonResponse(
        asClaims({
          sub: 'a-pseudonymous-uuid',
          person_info: { uinfin: { unavailable: true } },
        }),
      )

      expect(result._unsafeUnwrapErr()).toBeInstanceOf(
        MyInfoFapiMissingUinFinError,
      )
    })
  })
})
