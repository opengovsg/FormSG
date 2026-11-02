import convict, { Schema } from 'convict'

export interface IUen {
  hiddenEntityTypes: string[]
}

const uenSchema: Schema<IUen> = {
  hiddenEntityTypes: {
    doc: 'Comma-separated UEN entity-type indicators accepted on top of the public list',
    format: Array,
    default: [],
    env: 'UEN_HIDDEN_ENTITY_TYPES',
  },
}

const { hiddenEntityTypes } = convict(uenSchema)
  .validate({ allowed: 'strict' })
  .getProperties()

export const uenConfig: IUen = {
  hiddenEntityTypes: hiddenEntityTypes
    .map((entityType) => entityType.trim().toUpperCase())
    .filter((entityType) => entityType.length > 0),
}
