/**
 * Contains utility functions for IaC migration to support both old (pre-IaC) and new (IaC) environments.
 */
import fs from 'fs'

const isIacMigrated = process.env.NODE_ENV === 'stg-alt3'

/**
 * Retrieves the content of a file.
 * If the environment is post-IaC, the file content has been converted to base64 and stored in the SSM param store directly.
 * If the environment is pre-IaC, the file content is stored in the file system and needs to be read via the file path.
 *
 * Relies on convict validation to ensure that the arguments are not null based on the NODE_ENV.
 * @param preIacFilePath - The path to the file in the pre-IaC environment.
 * @param postIacBase64EncodedString - The base64 encoded string of the file in the IaC environment.
 * @returns The content of the file.
 */
export const retrieveFileContent = ({
  preIacFilePath,
  postIacBase64EncodedString,
}: {
  preIacFilePath: string
  postIacBase64EncodedString: string
}): string => {
  if (isIacMigrated) {
    return Buffer.from(postIacBase64EncodedString, 'base64').toString('utf-8')
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

export const validateIacStringParam = (val: string) => {
  if (isIacMigrated && typeof val !== 'string') {
    return new Error('Value must be a String')
  }
}

export const validateNonIacStringParam = (val: string) => {
  if (!isIacMigrated && typeof val !== 'string') {
    return new Error('Value must be a String')
  }
}
