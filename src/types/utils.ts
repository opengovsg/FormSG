export type ExtractTypeFromArray<T> = T extends readonly (infer E)[] ? E : T
