import http, { RefinedResponse, ResponseType } from 'k6/http'
import { Rate } from 'k6/metrics'

import { optionalParam } from './params'
import { resolveTargetUrl } from './target'
import { THROTTLED_METRIC } from './thresholds'

const TARGET_URL = resolveTargetUrl()
const LOAD_TEST_KEY = optionalParam('LOAD_TEST_KEY', '')

const throttled = new Rate(THROTTLED_METRIC)

type Response = RefinedResponse<ResponseType>

export interface Request {
  name: string
  path: string
}

function buildHeaders(extra: Record<string, string> = {}) {
  const headers: Record<string, string> = { 'x-formsg-iac': 'true', ...extra }
  if (LOAD_TEST_KEY) {
    headers['x-load-test-key'] = LOAD_TEST_KEY
  }
  return headers
}

function track(res: Response): Response {
  throttled.add(res.status === 429)
  return res
}

export function apiGet(name: string, path: string): Response {
  return track(
    http.get(`${TARGET_URL}${path}`, {
      headers: buildHeaders(),
      tags: { name },
    }),
  )
}

export function apiGetBatch(requests: Request[]): Response[] {
  return http
    .batch(
      requests.map(({ name, path }) => ({
        method: 'GET',
        url: `${TARGET_URL}${path}`,
        params: { headers: buildHeaders(), tags: { name } },
      })),
    )
    .map(track)
}

export function apiPostMultipart(
  name: string,
  path: string,
  fields: Record<string, string>,
): Response {
  const boundary = `----formsg-load-test-${__VU}-${__ITER}`
  let body = ''
  for (const key in fields) {
    body += `--${boundary}\r\nContent-Disposition: form-data; name="${key}"\r\n\r\n${fields[key]}\r\n`
  }
  body += `--${boundary}--\r\n`
  return track(
    http.post(`${TARGET_URL}${path}`, body, {
      headers: buildHeaders({
        'Content-Type': `multipart/form-data; boundary=${boundary}`,
      }),
      tags: { name },
    }),
  )
}
