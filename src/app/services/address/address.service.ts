/**
 * Address service that calls oneMap API get local address fields based on postal code
 * // if success: {success: true, data: {} }
 * // if fail: {success: false} - no data is returned
 */

export interface VerifyAddressResponse {
  success: boolean
  data?: {
    postalCode: string
    blockNumber: string
    streetName: string
  }
}

const oneMapApiUrl = (value: string): string => {
  return `https://www.onemap.gov.sg/api/common/elastic/search?searchVal=${value}&returnGeom=Y&getAddrDetails=Y`
}

export async function verifyAddress(
  postalCode: string,
): Promise<VerifyAddressResponse> {
  const response = await fetch(oneMapApiUrl(postalCode), {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      Cookie: '_toffsuid=rB8uPWZEP/wp9bsoBHUZAg==', // check this
    },
  })

  if (response.ok) {
    const resp = await response.json()
    if (resp.found > 0) {
      const result = resp.results[0]
      const resultData = {
        postalCode: result.POSTAL,
        blockNumber: result.BLK_NO,
        streetName: result.ROAD_NAME,
      }
      return { success: true, data: resultData }
    }
  }
  return { success: false }
}
