export type SgidProfilesDto = {
  profiles: SgidPublicOfficerEmploymentList
}

export type SgidPublicOfficerEmployment = {
  agency_name: string
  department_name: string
  employment_title: string
  employment_type: string
  work_email: string
}
export type SgidPublicOfficerEmploymentList = Array<SgidPublicOfficerEmployment>
