import { EnforceDocument, Model } from 'mongoose'

import { PublicView } from './database'

import { AgencyBase, PublicAgencyDto } from '~shared/types/agency'

export type PublicAgency = PublicAgencyDto

export type AgencyInstanceMethods = PublicView<PublicAgency>

export interface IAgencySchema extends AgencyBase {
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
