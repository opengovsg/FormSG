import { Document } from 'mongoose'

export interface IAgency {
  shortName: string
  fullName: string
  emailDomain: string[]
  logo: string
  created: Date
  lastModified?: Date
  _id: any
}

export interface IAgencySchema extends IAgency, Document {}
