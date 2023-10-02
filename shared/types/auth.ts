export type SgidProfilesDto = {
  profiles: SgidPublicOfficerEmploymentList
}

export type SgidPublicOfficerEmployment = {
  agencyName: string
  departmentName: string
  employmentTitle: string
  employmentType: string
  workEmail: string
}
export type SgidPublicOfficerEmploymentList = Array<SgidPublicOfficerEmployment>
