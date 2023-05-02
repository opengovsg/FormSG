import { StatusCodes } from 'http-status-codes'

export const isGoGovStatusValid = (status: StatusCodes) => {
  return status === StatusCodes.OK || status === StatusCodes.NOT_FOUND
}
