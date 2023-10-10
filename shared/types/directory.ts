import { AgencyDto } from './agency'
import { FormDto } from './form'

export type DirectoryAgencyDto = {
  fullName: AgencyDto['fullName']
  shortName: AgencyDto['shortName']
}

export type DirectoryFormDto = {
  _id: FormDto['_id']
  title: FormDto['title']
}
