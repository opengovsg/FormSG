import { IField, IFieldSchema } from './baseField'

export enum RatingShape {
  Heart = 'Heart',
  Star = 'Star',
}

export interface IRatingField extends IField {
  ratingOptions: {
    steps: number
    shape: RatingShape
  }
}

export interface IRatingFieldSchema extends IRatingField, IFieldSchema {}
