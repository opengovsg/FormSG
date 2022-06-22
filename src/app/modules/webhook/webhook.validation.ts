import { promises as dns } from 'dns'
import ip from 'ip'

import { isValidHttpsUrl } from '../../../../shared/utils/url-validation'
import config from '../../config/config'

import { WebhookValidationError } from './webhook.errors'

/**
 * Checks that a URL is valid for use in webhooks.
 * @param webhookUrl Webhook URL
 * @returns Resolves if URL is valid, otherwise rejects.
 * @throws {WebhookValidationError} If URL is invalid so webhook should not be attempted.
 */
export const validateWebhookUrl = (webhookUrl: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!isValidHttpsUrl(webhookUrl)) {
      return reject(
        new WebhookValidationError(`${webhookUrl} is not a valid HTTPS URL.`),
      )
    }
    const webhookUrlParsed = new URL(webhookUrl)
    const appUrlParsed = new URL(config.app.appUrl)
    if (
      webhookUrlParsed.hostname === appUrlParsed.hostname ||
      webhookUrlParsed.hostname.endsWith(`.${appUrlParsed.hostname}`)
    ) {
      return reject(
        new WebhookValidationError(
          `You cannot send responses back to ${config.app.appUrl} or its subdomain.`,
        ),
      )
    }

    dns
      .resolve(webhookUrlParsed.hostname)
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
            `Error encountered during DNS resolution for webhook URL: ${webhookUrl}.` +
              ` Check that the URL is correct or delete the webhook before proceeding.`,
          ),
        )
      })
  })
}
