import { ResponseMetadata } from '../../../../../shared/types'
import { FieldResponse } from '../../../../types'

export interface ParsedMultipartForm {
  responses: FieldResponse[]
  responseMetadata: ResponseMetadata
}
