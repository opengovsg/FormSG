import { EnforceDocument, Model } from 'mongoose'

import { AgencyBase, PublicAgencyDto } from '../../shared/types'

import { PublicView } from './database'

export type AgencyInstanceMethods = PublicView<PublicAgencyDto>

export interface IAgencySchema extends AgencyBase {
  _id: any
  created?: Date
  lastModified?: Date
}

export interface IAgencyDocument extends IAgencySchema {
  created: Date
  lastModified: Date
}

// Used to cast created documents whenever needed.
export type AgencyDocument = EnforceDocument<
  IAgencyDocument,
  AgencyInstanceMethods,
  Record<string, never>
>

export type IAgencyModel = Model<
  IAgencyDocument,
  Record<string, never>,
  AgencyInstanceMethods
>
