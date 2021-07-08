import { FieldBase } from './base'

export enum RatingShape {
  Heart = 'Heart',
  Star = 'Star',
}

export interface RatingFieldBase extends FieldBase {
  ratingOptions: {
    steps: number
    shape: RatingShape
  }
}
