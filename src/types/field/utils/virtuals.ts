import { Document } from 'mongoose'

// Types for virtuals for backwards compatibility after customMin and customMax were removed as part of #408
// TODO: Remove virtuals (#2039)
export type WithCustomMinMax<T> = T &
  Document & {
    customMin: number | null
    customMax: number | null
  }
