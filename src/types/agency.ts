import { EnforceDocument, Model } from 'mongoose'

import { AgencyBase, PublicAgencyDto } from '../../shared/types/agency'

import { PublicView } from './database'

export { PublicAgencyDto }

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
  AgencyInstanceMethods
>

// eslint-disable-next-line @typescript-eslint/ban-types
export type IAgencyModel = Model<IAgencyDocument, {}, AgencyInstanceMethods>
