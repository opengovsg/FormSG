import { PackageMode } from '../types'

const STAGE: { [stage in PackageMode]: stage } = {
  staging: 'staging',
  production: 'production',
  development: 'development',
  test: 'test',
}

export default STAGE
