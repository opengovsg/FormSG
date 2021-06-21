import { Schema } from 'convict'

export enum FeatureNames {}

export type IFeatureManager = Record<string, unknown>

export interface RegisteredFeature<T extends FeatureNames> {
  isEnabled: boolean
  props?: IFeatureManager[T]
}

export interface RegisterableFeature<K extends FeatureNames> {
  name: K
  schema: Schema<IFeatureManager[K]>
}
