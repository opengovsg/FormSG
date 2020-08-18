import { IField, IFieldSchema } from './baseField'

export interface IStatementField extends IField {}

export interface IStatementFieldSchema extends IStatementField, IFieldSchema {}
