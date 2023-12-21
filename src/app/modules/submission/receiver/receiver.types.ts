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

export const isBodyVersion3AndAbove = (
  body: ParsedMultipartForm<unknown>,
): body is ParsedMultipartForm<FieldResponsesV3> => {
  return (body.version ?? 0) >= 3
}

export const isBodyVersion2AndBelow = (
  body: ParsedMultipartForm<unknown>,
): body is ParsedMultipartForm<FieldResponse[]> => {
  return (body.version ?? 0) < 3
}

export const isBodyVersion3AndAbove = (
  body: ParsedMultipartForm<unknown>,
): body is ParsedMultipartForm<FieldResponsesV3> => {
  return (body.version ?? 0) >= 3
}
