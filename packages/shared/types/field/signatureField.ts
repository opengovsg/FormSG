import { BasicField, FieldBase } from './base'

export interface SignatureFieldBase extends FieldBase {
  fieldType: BasicField.Signature
}

// perfect-freehand vector array type
// [x-coord, y-coord, pressure][points of a stroke][all strokes]
export type SignatureVectorArray = [number, number, number][][]
