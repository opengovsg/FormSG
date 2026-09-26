/**
 * MyInfo Person API types, adapted from @opengovsg/myinfo-gov-client v4.1.2
 * and trimmed to the attributes FormSG reads.
 * https://github.com/opengovsg/myinfo-gov-client/tree/v4.1.2/src/types
 *
 * MIT License, Copyright (c) 2018 Data.gov.sg
 */

export enum MyInfoSource {
  GovtVerified = '1',
  UserProvided = '2',
  NotApplicable = '3',
  SingPassVerified = '4',
}

export enum MyInfoDataClassification {
  Confidential = 'C',
}

/**
 * Keys of data returned by Person API.
 */
export enum MyInfoAttribute {
  UinFin = 'uinfin',
  Name = 'name',
  Sex = 'sex',
  Race = 'race',
  Dialect = 'dialect',
  Nationality = 'nationality',
  DateOfBirth = 'dob',
  BirthCountry = 'birthcountry',
  ResidentialStatus = 'residentialstatus',
  PassportNumber = 'passportnumber',
  PassportExpiryDate = 'passportexpirydate',
  RegisteredAddress = 'regadd',
  HousingType = 'housingtype',
  HDBType = 'hdbtype',
  MobileNo = 'mobileno',
  MaritalStatus = 'marital',
  MarriageCertNumber = 'marriagecertno',
  CountryOfMarriage = 'countryofmarriage',
  MarriageDate = 'marriagedate',
  DivorceDate = 'divorcedate',
  ChildrenBirthRecords = 'childrenbirthrecords',
  SponsoredChildrenRecords = 'sponsoredchildrenrecords',
  Occupation = 'occupation',
  Employment = 'employment',
  PassStatus = 'passstatus',
  PassExpiryDate = 'passexpirydate',
  Vehicles = 'vehicles',
}

type SourceProp<T extends MyInfoSource> = {
  source: T
}

type MyInfoSourceDefault = Exclude<MyInfoSource, MyInfoSource.NotApplicable>

// Certain fields may not be applicable to specific groups of people. For
// example, Residential Status is not applicable to foreigners.
// For a full reference, see https://www.ndi-api.gov.sg/library/myinfo/implementation-myinfo-data
export type MyInfoNotApplicable = SourceProp<MyInfoSource.NotApplicable>

type MyInfoApplicable<S extends MyInfoSource> = {
  // The “lastupdated” field is not always non-empty currently, but under what circumstances this occurs is unknown
  lastupdated?: string
  classification: MyInfoDataClassification.Confidential
} & SourceProp<S>

type UnavailableProp<T> = {
  unavailable: T
}

// If it exists, "unavailable" is always true. It is typed as optional
// undefined on available fields so that `if (!data.unavailable)` compiles.
type MyInfoField<T, S extends MyInfoSource = MyInfoSourceDefault> =
  | (MyInfoApplicable<S> & UnavailableProp<true>)
  | (T & MyInfoApplicable<S> & Partial<UnavailableProp<undefined>>)

type StringValue = { value: string }
type NumberValue = { value: number }
type BooleanValue = { value: boolean }

type CodeAndDesc = {
  code: string
  desc: string
}

export type MyInfoValueField = MyInfoField<StringValue>

export type MyInfoCodeField = MyInfoField<CodeAndDesc>

export enum MyInfoAddressType {
  Singapore = 'SG',
  Unformatted = 'UNFORMATTED',
}

type MyInfoSingaporeAddress = {
  type: MyInfoAddressType.Singapore
  block: StringValue
  building: StringValue
  floor: StringValue
  unit: StringValue
  street: StringValue
  postal: StringValue
  country: CodeAndDesc
}

type MyInfoUnformattedAddress = {
  type: MyInfoAddressType.Unformatted
  line1?: StringValue
  line2?: StringValue
}

export type MyInfoAddress =
  | MyInfoField<MyInfoSingaporeAddress | MyInfoUnformattedAddress>
  | MyInfoNotApplicable

export type MyInfoPhoneNumber = MyInfoField<{
  prefix: StringValue
  areacode: StringValue
  nbr: StringValue
}>

export type MyInfoOccupation =
  | MyInfoField<StringValue, MyInfoSource.UserProvided>
  | MyInfoField<CodeAndDesc, MyInfoSource.GovtVerified>

type MyInfoChildFull = Partial<{
  birthcertno: StringValue
  name: StringValue
  hanyupinyinname: StringValue
  aliasname: StringValue
  hanyupinyinaliasname: StringValue
  marriedname: StringValue
  sex: CodeAndDesc
  race: CodeAndDesc
  secondaryrace: CodeAndDesc
  dialect: CodeAndDesc
  lifestatus: CodeAndDesc
  dob: StringValue
  tob: StringValue
  vaccinationrequirements: {
    requirement: CodeAndDesc
    fulfilled: BooleanValue
  }[]
}>

export type MyInfoChildBirthRecordBelow21 = MyInfoChildFull

export type MyInfoSponsoredChildFull = Partial<{
  nric: StringValue
  name: StringValue
  hanyupinyinname: StringValue
  aliasname: StringValue
  hanyupinyinaliasname: StringValue
  marriedname: StringValue
  sex: CodeAndDesc
  race: CodeAndDesc
  secondaryrace: CodeAndDesc
  dialect: CodeAndDesc
  dob: StringValue
  birthcountry: CodeAndDesc
  lifestatus: CodeAndDesc
  residentialstatus: CodeAndDesc
  nationality: CodeAndDesc
  scprgrantdate: StringValue
}>

export type MyInfoVehicleFull = Partial<{
  vehicleno: StringValue
  type: StringValue
  iulabelno: StringValue
  make: StringValue
  model: StringValue
  chassisno: StringValue
  engineno: StringValue
  motorno: StringValue
  yearofmanufacture: StringValue
  firstregistrationdate: StringValue
  originalregistrationdate: StringValue
  coecategory: StringValue
  coeexpirydate: StringValue
  roadtaxexpirydate: StringValue
  quotapremium: NumberValue
  openmarketvalue: NumberValue
  co2emission: NumberValue
  status: CodeAndDesc
  primarycolour: StringValue
  secondarycolour: StringValue
  attachment1: StringValue
  attachment2: StringValue
  attachment3: StringValue
  scheme: StringValue
  thcemission: NumberValue
  coemission: NumberValue
  noxemission: NumberValue
  pmemission: NumberValue
  enginecapacity: NumberValue
  powerrate: NumberValue
  effectiveownership: StringValue
  propellant: StringValue
  maximumunladenweight: NumberValue
  maximumladenweight: NumberValue
  minimumparfbenefit: NumberValue
  nooftransfers: NumberValue
  vpc: StringValue
}>

export type MyInfoVehicle = MyInfoField<MyInfoVehicleFull>

/**
 * Shape of data returned by the Person API.
 */
export type IPerson = Partial<{
  uinfin: MyInfoValueField
  name: MyInfoValueField
  sex: MyInfoCodeField
  race: MyInfoCodeField
  dialect: MyInfoCodeField
  nationality: MyInfoCodeField
  dob: MyInfoValueField
  birthcountry: MyInfoCodeField
  residentialstatus: MyInfoCodeField | MyInfoNotApplicable
  passportnumber: MyInfoValueField
  passportexpirydate: MyInfoValueField
  regadd: MyInfoAddress
  housingtype: MyInfoCodeField | MyInfoNotApplicable
  hdbtype: MyInfoCodeField | MyInfoNotApplicable
  mobileno: MyInfoPhoneNumber
  marital: MyInfoCodeField
  marriagecertno: MyInfoValueField | MyInfoNotApplicable
  countryofmarriage: MyInfoCodeField | MyInfoNotApplicable
  marriagedate: MyInfoValueField
  divorcedate: MyInfoValueField | MyInfoNotApplicable
  childrenbirthrecords: MyInfoField<
    MyInfoChildBirthRecordBelow21 | Pick<MyInfoChildFull, 'birthcertno'>
  >[]
  sponsoredchildrenrecords: MyInfoField<
    | MyInfoSponsoredChildFull
    | Pick<MyInfoSponsoredChildFull, 'nric'>
    | MyInfoNotApplicable
  >[]
  occupation: MyInfoOccupation
  employment: MyInfoValueField
  passstatus: MyInfoValueField | MyInfoNotApplicable
  passexpirydate: MyInfoValueField | MyInfoNotApplicable
  vehicles: MyInfoVehicle[]
}>

/**
 * Person data paired with the NRIC/FIN it belongs to.
 */
export interface IPersonResponse {
  uinFin: string
  data: IPerson
}

/**
 * Valid scopes (requested attributes) to get from MyInfo.
 */
export type MyInfoScope =
  | Exclude<
      keyof IPerson,
      | MyInfoAttribute.ChildrenBirthRecords
      | MyInfoAttribute.SponsoredChildrenRecords
      | MyInfoAttribute.Vehicles
    >
  | `${MyInfoAttribute.ChildrenBirthRecords}.${keyof MyInfoChildFull}`
  | `${MyInfoAttribute.SponsoredChildrenRecords}.${keyof MyInfoSponsoredChildFull}`
  | `${MyInfoAttribute.Vehicles}.${keyof MyInfoVehicleFull}`

// Check that IPerson includes all keys from MyInfoAttribute
type IPersonCheck = Exclude<MyInfoAttribute, keyof IPerson>
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type VerifyIPersonCheck<
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  Missing extends never = IPersonCheck,
> = never
