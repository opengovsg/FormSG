import { StatusCodes } from 'http-status-codes'

import { PostalCodeAddressDto } from 'formsg-shared/types'

import { ApiService, HttpError } from '~services/ApiService'

export type VerifyAddressResponse =
  | { success: true; data: PostalCodeAddressDto }
  | { success: false; isUnavailable: boolean }

export const verifyAddress = (
  postalCode: string,
): Promise<VerifyAddressResponse> =>
  ApiService.get<PostalCodeAddressDto>(
    `/address/postal-codes/${encodeURIComponent(postalCode)}`,
  )
    .then(({ data }): VerifyAddressResponse => ({ success: true, data }))
    .catch(
      (error: unknown): VerifyAddressResponse => ({
        success: false,
        isUnavailable: !(
          error instanceof HttpError && error.code === StatusCodes.NOT_FOUND
        ),
      }),
    )
