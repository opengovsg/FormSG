import { Model } from 'mongoose'

export interface IGlobalBetaSchema {
  name: string
  enabled: boolean
}

export interface IGlobalBetaModel extends Model<IGlobalBetaSchema> {
  findFlag: (flag: string) => Promise<IGlobalBetaSchema>
}
