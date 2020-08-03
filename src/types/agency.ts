import { Document } from 'mongoose'

export interface IAgency {
  shortName: string
  fullName: string
  emailDomain: string[]
  logo: string
  created: Date
  lastModified?: Date
}

export interface IAgencySchema extends IAgency, Document {}
