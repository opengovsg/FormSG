/**
 * Contains utility functions for IaC migration to support both old (pre-IaC) and new (IaC) environments.
 */
// TODO: (IaC Migration) Delete and remove all usage of thie file after IaC migration is fully completed
import fs from 'fs'

import config from '../config/config'

const isIacMigrated = config.iacMigration.isMigrated

/**
 * Retrieves the content of a file.
 * If the environment is post-IaC, the file content has been converted to base64 and stored in the SSM param store directly.
 * If the environment is pre-IaC, the file content is stored in the file system and needs to be read via the file path.
 *
 * Relies on convict validation to ensure that the arguments are not null based on the NODE_ENV.
 * @param preIacFilePath - The path to the file in the pre-IaC environment.
 * @param postIacFileContentString - The string contents of the file in the IaC environment. To use, extract out the string content in each pre-IaC file and paste them as value in the SSM param store.
 * @returns The content of the file.
 */
export const retrieveFileContent = ({
  preIacFilePath,
  postIacFileContentString,
}: {
  preIacFilePath: string
  postIacFileContentString: string
}): string => {
  if (isIacMigrated) {
    return postIacFileContentString
  }
  return fs.readFileSync(preIacFilePath).toString()
}

/**
 * Retrieves the content of a JSON file.
 * If the environment is post-IaC, the JSON string is stored in the SSM param store directly.
 * If the environment is pre-IaC, the JSON string is stored in the file system and needs to be read via the file path.
 *
 * Relies on convict validation to ensure that the arguments are not null based on the NODE_ENV.
 * @param preIacFilePath - The path to the file in the pre-IaC environment.
 * @param postIacJsonString - The JSON string of the file in the IaC environment.
 * @returns The content of the JSON file.
 */
export const retrieveJsonContent = ({
  preIacFilePath,
  postIacJsonString,
}: {
  preIacFilePath: string
  postIacJsonString: string
}) => {
  if (isIacMigrated) {
    return JSON.parse(postIacJsonString)
  }
  return JSON.parse(fs.readFileSync(preIacFilePath).toString())
}

export const validateIacStringParam = (val: unknown) => {
  if (isIacMigrated && typeof val !== 'string') {
    // eslint-disable-next-line typesafe/no-throw-sync-func
    throw new Error('Value must be a String')
  }
}

export const validateNonIacStringParam = (val: unknown) => {
  if (!isIacMigrated && typeof val !== 'string') {
    // eslint-disable-next-line typesafe/no-throw-sync-func
    throw new Error('Value must be a String')
  }
}
