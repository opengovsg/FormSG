import { Document, Model } from 'mongoose'

import { PublicView } from './database'

export interface IAgency {
  shortName: string
  fullName: string
  emailDomain: string[]
  logo: string
  created?: Date
  lastModified?: Date
}

// Make sure this is kept in sync with agency.server.model#AGENCY_PUBLIC_FIELDS.
export type PublicAgency = Pick<
  IAgencySchema,
  'shortName' | 'fullName' | 'emailDomain' | 'logo'
>

export interface IAgencySchema
  extends IAgency,
    Document,
    PublicView<PublicAgency> {}

export type IAgencyModel = Model<IAgencySchema>
