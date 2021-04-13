/**
 * Additional type declarations for mongoose to fit our use case,
 * to accommodate the non-standard but compatible use of types
 * in schema registration
 */
declare module 'mongoose' {
  namespace Schema {
    namespace Types {
      /**
       * A DocumentArray with a discriminator function that takes in a
       * type-generic Schema.
       */
      class DocumentArrayWithLooseDiscriminator extends DocumentArray {
        /**
         * In the built-in type declarations in
         * version 5.12 of mongoose, discriminator() expects a Schema
         * (and hence Schema<Document>). This does not work; a Schema
         * for a subtype of Document is not a Schema for a Document, as
         * Schema.methods expect to operate on the Schema's document type,
         * which is not necessarily a Document.
         *
         * Address this by overriding the definition and provide a type-generic
         * Schema argument.
         */
        discriminator<T extends Document>(
          name: string,
          schema: Schema<T>,
          tag?: string,
        ): unknown
      }
    }
  }
}
