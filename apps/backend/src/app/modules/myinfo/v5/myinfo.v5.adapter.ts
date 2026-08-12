import {
  IPerson,
  IPersonResponse,
  MyInfoAttribute as ExternalAttr,
} from '@opengovsg/myinfo-gov-client'

import { MyInfoData } from '../myinfo.adapter'

import type { MyInfoV5UserinfoClaims } from './myinfo.v5.types'

/**
 * Adapt a v5 userinfo claim set to the v3 `IPersonResponse` shape that
 * `MyInfoData` already understands. Keeps the downstream pipeline (formatters,
 * `getFieldValueForAttr`, hash computation) untouched.
 *
 * Two shapes need handling:
 *
 * 1) Mockpass / Singpass simple shape:
 *      { sub, iss, aud, iat, uinfin: {value,...}, name: {value,...}, ... }
 *    Each scope claim sits at the top level using the v3 attribute shape
 *    (`{ value, lastupdated, source, classification }`). Direct pass-through.
 *
 * 2) Singpass v5 production "person_info" envelope:
 *      { sub, iss, ..., person_info: { uinfin: {...}, name: {...}, ... } }
 *    or with `sub_attributes`. We unwrap into the same flat dict.
 *
 * Anything we don't recognise is kept on `data` as-is so the v3 adapter can
 * still try to format it. Unknown fields are tolerated, not erroneously
 * rejected — Singpass v5 may add fields between releases.
 */
export function v5ClaimsToPersonResponse(
  claims: MyInfoV5UserinfoClaims,
): IPersonResponse {
  const merged: Record<string, unknown> = {}

  // Unwrap an optional envelope.
  const envelope =
    (isObject(claims.person_info) && (claims.person_info as object)) ||
    (isObject(claims['sub_attributes']) &&
      (claims['sub_attributes'] as object)) ||
    null

  if (envelope) Object.assign(merged, envelope)

  // Top-level claims override / extend the envelope so mockpass-style flat
  // payloads still win.
  for (const [k, v] of Object.entries(claims)) {
    if (
      k === 'sub' ||
      k === 'iss' ||
      k === 'aud' ||
      k === 'iat' ||
      k === 'nonce'
    )
      continue
    if (k === 'person_info' || k === 'sub_attributes') continue
    merged[k] = v
  }

  const uinFin = extractUinFin(merged) ?? extractUinFinFromSub(claims.sub)
  return {
    uinFin: uinFin ?? '',
    // The v3 IPerson type is a strongly-typed open record; the v3 adapter
    // reads keys defensively via _formatFieldValue, so an unknown subset is
    // safe at the type boundary.
    data: merged as unknown as IPerson,
  }
}

function extractUinFin(claims: Record<string, unknown>): string | undefined {
  // v5 may expose uinfin as a typed claim {value,...} or as a bare string.
  const raw = claims['uinfin'] ?? claims['uinFin']
  if (typeof raw === 'string') return raw
  if (isObject(raw) && typeof (raw as { value?: unknown }).value === 'string') {
    return (raw as { value: string }).value
  }
  return undefined
}

function extractUinFinFromSub(sub: unknown): string | undefined {
  // Singpass `sub` is a UUID in v5. NRIC is no longer in `sub`. Returning
  // undefined here is the correct fallback when `uinfin` claim is absent —
  // the form will fail closed.
  void sub
  return undefined
}

function isObject(x: unknown): x is Record<string, unknown> {
  return typeof x === 'object' && x !== null && !Array.isArray(x)
}

/**
 * Convenience factory: claims → `MyInfoData` that the rest of FormSG already
 * uses for prefill, hashing, and read-only enforcement.
 */
export function v5ClaimsToMyInfoData(
  claims: MyInfoV5UserinfoClaims,
): MyInfoData {
  return new MyInfoData(v5ClaimsToPersonResponse(claims))
}

/**
 * Translate an internal FormSG attribute set into the OIDC scope set we need
 * to request from Singpass v5.
 *
 * Singpass v5 scopes are camelCase MyInfo attribute names (e.g. `mobileno`,
 * `regadd`), matching the existing `ExternalAttr` values. We always request
 * `openid` and `uinfin` (we need the NRIC for hashing / identifying the user).
 */
export function internalAttrListToV5Scopes(attrs: Iterable<string>): string[] {
  const scopes = new Set<string>(['openid', 'uinfin'])
  for (const attr of attrs) {
    const scope = internalAttrToV5Scope(attr)
    if (scope) scopes.add(scope)
  }
  return Array.from(scopes)
}

function internalAttrToV5Scope(attr: string): string | undefined {
  // For attributes whose internal name already matches the v5 scope, this is a
  // noop. We piggyback on the v3 mapping where it exists so we don't drift.
  switch (attr) {
    case 'name':
      return ExternalAttr.Name
    case 'mobileno':
      return ExternalAttr.MobileNo
    case 'regadd':
      return ExternalAttr.RegisteredAddress
    case 'dob':
      return ExternalAttr.DateOfBirth
    case 'sex':
      return ExternalAttr.Sex
    case 'race':
      return ExternalAttr.Race
    case 'nationality':
      return ExternalAttr.Nationality
    case 'birthcountry':
      return ExternalAttr.BirthCountry
    case 'residentialstatus':
      return ExternalAttr.ResidentialStatus
    case 'employment':
      return ExternalAttr.Employment
    case 'occupation':
      return ExternalAttr.Occupation
    case 'marital':
      return ExternalAttr.MaritalStatus
    case 'passportnumber':
      return ExternalAttr.PassportNumber
    // Fallback — pass internal name through; mockpass + prod v5 accept
    // the v3 attribute name as-is for most claims.
    default:
      return attr
  }
}
