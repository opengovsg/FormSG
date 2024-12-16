import convict, { Schema } from 'convict'

type FormSgSdkJwks = {
  publicJwks: string
}

const formSgSdkJwksSchema: Schema<FormSgSdkJwks> = {
  publicJwks: {
    doc: 'JSON Web Key Set for FormSG SDK',
    format: String,
    default: null, // required field
    env: 'FORMSG_SDK_PUBLIC_JWKS',
  },
}
export const formSgSdkJwksConfig = convict(formSgSdkJwksSchema)
  .validate({ allowed: 'strict' })
  .getProperties()
