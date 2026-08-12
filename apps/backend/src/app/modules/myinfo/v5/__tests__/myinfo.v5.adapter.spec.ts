import {
  internalAttrListToV5Scopes,
  v5ClaimsToMyInfoData,
  v5ClaimsToPersonResponse,
} from '../myinfo.v5.adapter'
import type { MyInfoV5UserinfoClaims } from '../myinfo.v5.types'

const baseClaim = (value: string) => ({
  lastupdated: '2024-01-01',
  source: '1',
  classification: 'C',
  value,
})

describe('v5 adapter', () => {
  describe('v5ClaimsToPersonResponse', () => {
    it('passes through a mockpass-shaped flat claim set', () => {
      const claims: MyInfoV5UserinfoClaims = {
        sub: 'uuid-1',
        iss: 'http://localhost:5156/singpass/v2',
        aud: 'mockClientId',
        iat: 1700000000,
        uinfin: baseClaim('S6005038D'),
        name: baseClaim('TAN XIAO HUI'),
      }
      const result = v5ClaimsToPersonResponse(claims)
      expect(result.uinFin).toBe('S6005038D')
      expect((result.data as Record<string, unknown>).name).toEqual(
        baseClaim('TAN XIAO HUI'),
      )
      // OIDC metadata claims should be stripped from the person payload.
      expect((result.data as Record<string, unknown>).sub).toBeUndefined()
      expect((result.data as Record<string, unknown>).iss).toBeUndefined()
    })

    it('unwraps a person_info envelope and merges top-level overrides', () => {
      const claims: MyInfoV5UserinfoClaims = {
        sub: 'uuid-1',
        iss: 'i',
        aud: 'a',
        iat: 1,
        person_info: {
          uinfin: baseClaim('S6005038D'),
          mobileno: { value: '97324992' },
        },
        // top-level wins so prod additions over the envelope keep working.
        mobileno: baseClaim('98765432'),
      }
      const result = v5ClaimsToPersonResponse(claims)
      expect(result.uinFin).toBe('S6005038D')
      expect(
        (result.data as { mobileno: { value: string } }).mobileno.value,
      ).toBe('98765432')
    })

    it('accepts a sub_attributes envelope', () => {
      const claims: MyInfoV5UserinfoClaims = {
        sub: 'uuid-1',
        iss: 'i',
        aud: 'a',
        iat: 1,
        sub_attributes: {
          uinfin: baseClaim('S1234567A'),
        },
      }
      expect(v5ClaimsToPersonResponse(claims).uinFin).toBe('S1234567A')
    })

    it('accepts uinfin as a bare string', () => {
      const claims: MyInfoV5UserinfoClaims = {
        sub: 'uuid-1',
        iss: 'i',
        aud: 'a',
        iat: 1,
        uinfin: 'S7654321B',
      }
      expect(v5ClaimsToPersonResponse(claims).uinFin).toBe('S7654321B')
    })

    it('returns empty uinFin when claim is missing', () => {
      const claims: MyInfoV5UserinfoClaims = {
        sub: 'uuid-only',
        iss: 'i',
        aud: 'a',
        iat: 1,
      }
      expect(v5ClaimsToPersonResponse(claims).uinFin).toBe('')
    })
  })

  describe('v5ClaimsToMyInfoData', () => {
    it('returns a MyInfoData that reads `name` via the v3 adapter pipeline', () => {
      const claims: MyInfoV5UserinfoClaims = {
        sub: 'uuid-1',
        iss: 'i',
        aud: 'a',
        iat: 1,
        uinfin: baseClaim('S6005038D'),
        name: baseClaim('TAN XIAO HUI'),
      }
      const data = v5ClaimsToMyInfoData(claims)
      expect(data.getUinFin()).toBe('S6005038D')
      const nameField = data.getFieldValueForAttr('name' as never)
      expect(nameField.fieldValue).toBe('TAN XIAO HUI')
      // source=1 means govt-verified — the read-only flag should be set.
      expect(nameField.isReadOnly).toBe(true)
    })
  })

  describe('internalAttrListToV5Scopes', () => {
    it('always includes openid + uinfin', () => {
      const scopes = internalAttrListToV5Scopes([])
      expect(scopes).toEqual(expect.arrayContaining(['openid', 'uinfin']))
    })

    it('maps known internal attrs to v5 scope names', () => {
      const scopes = internalAttrListToV5Scopes(['name', 'mobileno', 'regadd'])
      expect(scopes).toEqual(
        expect.arrayContaining([
          'openid',
          'uinfin',
          'name',
          'mobileno',
          'regadd',
        ]),
      )
    })

    it('dedupes', () => {
      const scopes = internalAttrListToV5Scopes(['name', 'name', 'uinfin'])
      const counted = scopes.filter((s) => s === 'name').length
      expect(counted).toBe(1)
    })
  })
})
