import { promises as dns } from 'dns'
import ip from 'ip'

import { WebhookValidationError } from '../../app/utils/custom-errors'

import { isValidHttpsUrl } from './url-validation'

/**
 * Checks that a URL is valid for use in webhooks.
 * @param webhookUrl Webhook URL
 * @returns Resolves if URL is valid, otherwise rejects.
 * @throws {WebhookValidationError} If URL is invalid so webhook should not be attempted.
 */
export const validateWebhookUrl = (webhookUrl: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    if (!isValidHttpsUrl(webhookUrl)) {
      return reject(
        new WebhookValidationError(`${webhookUrl} is not a valid HTTPS URL.`),
      )
    }
    const urlParsed = new URL(webhookUrl)
    dns
      .resolve(urlParsed.hostname)
      .then((addresses) => {
        if (!addresses.length) {
          return reject(
            new WebhookValidationError(
              `${webhookUrl} does not resolve to any IP address.`,
            ),
          )
        }
        const privateIps = addresses.filter((addr) => ip.isPrivate(addr))
        if (privateIps.length) {
          return reject(
            new WebhookValidationError(
              `${webhookUrl} resolves to the following private IPs: ${privateIps.join(
                ', ',
              )}`,
            ),
          )
        }
        return resolve()
      })
      .catch(() => {
        return reject(
          new WebhookValidationError(
            `Error encountered during DNS resolution for ${webhookUrl}.` +
              ` Check that the URL is correct.`,
          ),
        )
      })
  })
}
