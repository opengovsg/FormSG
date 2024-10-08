import { HydratedDocument, Model } from 'mongoose'

import { AgencyBase, PublicAgencyDto } from '../../shared/types'

import { PublicView } from './database'

export type AgencyInstanceMethods = PublicView<PublicAgencyDto>

export interface IAgencySchema extends AgencyBase {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _id: any
  created?: Date
  lastModified?: Date
}

export interface IAgencyDocument extends IAgencySchema {
  created: Date
  lastModified: Date
}

// Used to cast created documents whenever needed.
export type AgencyDocument = HydratedDocument<
  IAgencyDocument,
  AgencyInstanceMethods
>

export type IAgencyModel = Model<IAgencySchema, object, AgencyInstanceMethods>
