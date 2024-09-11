import {
  FieldResponse,
  FieldResponsesV3,
  ResponseMetadata,
} from '../../../../../shared/types'

export type ParsedMultipartForm<ResponsesType> = {
  responses: ResponsesType
  responseMetadata: ResponseMetadata
  version?: number
  workflowStep?: number
}

export const isBodyVersion2AndBelow = (
  body: ParsedMultipartForm<unknown>,
): body is ParsedMultipartForm<FieldResponse[]> => {
  return (body.version ?? 0) < 3
}

/**
 * Checks if body is for Multirespondent forms which use version >=3.
 * @param body to check version for
 * @returns true if body is for Multirespondent forms, false otherwise
 */
export const isBodyVersion3AndAbove = (
  body: ParsedMultipartForm<unknown>,
): body is ParsedMultipartForm<FieldResponsesV3> => {
  return (body.version ?? 0) >= 3
}
