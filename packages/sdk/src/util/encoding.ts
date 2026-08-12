import {
  decode as base64ToBytes,
  encode as bytesToBase64,
} from '@stablelib/base64'
import {
  decode as bytesToUtf8String,
  encode as utf8StringToBytes,
} from '@stablelib/utf8'

/**
 * Loop-based binary <-> string conversions, replacing tweetnacl-util.
 *
 * tweetnacl-util's decodeBase64 validates its input with a regex over the
 * entire payload; on engines with stack-bound regex backtracking (Hermes,
 * older JSC/V8) this throws "Maximum call stack size exceeded" for
 * multi-megabyte attachments. @stablelib decodes in a plain loop.
 *
 * Exported names keep tweetnacl-util's convention (decodeUTF8: string ->
 * bytes, encodeUTF8: bytes -> string), which is the reverse of
 * @stablelib/utf8's encode/decode naming.
 */
export const encodeBase64 = (arr: Uint8Array): string => bytesToBase64(arr)
export const decodeBase64 = (s: string): Uint8Array => base64ToBytes(s)
export const decodeUTF8 = (s: string): Uint8Array => utf8StringToBytes(s)
export const encodeUTF8 = (arr: Uint8Array): string => bytesToUtf8String(arr)
