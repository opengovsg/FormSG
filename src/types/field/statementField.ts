import { IField, IFieldSchema } from './baseField'

export type IStatementField = IField

export interface IStatementFieldSchema extends IStatementField, IFieldSchema {}
