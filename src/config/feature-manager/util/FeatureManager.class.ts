import convict from 'convict'
import validator from 'convict-format-with-validator'
import _ from 'lodash'

import { createLoggerWithLabel } from '../../logger'
import { FeatureNames, IFeatureManager, RegisterableFeature } from '../types'

const logger = createLoggerWithLabel(module)
convict.addFormat(validator.url)

interface RegisteredFeature<T extends FeatureNames> {
  isEnabled: boolean
  props: IFeatureManager[T]
}

export default class FeatureManager {
  public states: Partial<Record<FeatureNames, boolean>>
  // Map some feature names to some env vars
  private properties: Partial<IFeatureManager>
  constructor() {
    this.states = {}
    this.properties = {}
  }

  /**
   * Register values/fallbacks associated with feature if namespace is available
   * @param params
   * @param params.name Name of feature
   * @param params.schema Convict schema
   */
  register<K extends FeatureNames>({
    name,
    schema,
  }: RegisterableFeature<K>): void {
    // Check that namespace is available
    if (this.properties[name] || this.states[name]) {
      throw new Error(
        `A feature called ${name} already exists. Please choose another name!`,
      )
    }

    // Feature is only enabled if all required environment variables are present and defined
    const config = convict(schema)
    const properties = config.getProperties()
    const isEnabled = Object.keys(schema).every((variable) => {
      const val = _.get(properties, variable, null)
      // empty strings (i.e. '') are considered defined
      const isDefined = !_.isNil(val)
      return isDefined
    })

    // Update isEnabled state in instance property
    this.states[name] = isEnabled

    // Update properties in instance property if feature enabled
    // Validate configuration if feature enabled - Error will be thrown if validation fails
    if (isEnabled) {
      config.validate({ allowed: 'strict' })
      this.properties[name] = properties
    }

    // Inform whether feature is enabled or not
    if (isEnabled) {
      logger.info({
        message: `${name} feature will be enabled on app`,
        meta: {
          action: 'register',
        },
      })
    } else {
      logger.warn({
        message: `\n!!! WARNING !!! \nEnv vars for ${name} are not detected. \n${name} feature will be disabled on app`,
        meta: {
          action: 'register',
        },
      })
    }
  }

  /**
   * Return true if requested feature is enabled. Else, throw error.
   * @param name the feature name to check enabledness
   * @returns true iff feature is enabled
   * @throws {Error} if feature is not enabled
   */
  isEnabled(name: FeatureNames): boolean {
    const isInState = this.states[name]
    if (isInState) {
      return isInState
    }

    // Not enabled or not in state.
    throw new Error(`A feature called ${name} does not exist`)
  }

  /**
   * Return props registered for requested feature
   * @param name
   */
  props<K extends FeatureNames>(name: K) {
    const isInState = this.states[name]
    if (isInState) {
      return this.properties[name]!
    }

    // Not enabled or not in state.
    throw new Error(`A feature called ${name} does not exist`)
  }

  /**
   * Return properties registered for requested feature
   * and whether requested feature is enabled
   * @param name
   */
  get(name: FeatureNames): RegisteredFeature<FeatureNames> {
    return {
      isEnabled: this.isEnabled(name),
      props: this.props(name),
    }
  }
}
