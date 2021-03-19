import { AxiosResponse } from 'axios'
import { promises as dns } from 'dns'
import ip from 'ip'

import config from '../../../config/config'
import { stringifySafe } from '../../../shared/util/stringify-safe'
import { isValidHttpsUrl } from '../../../shared/util/url-validation'
import { IWebhookResponse } from '../../../types'

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
    if (webhookUrlParsed.hostname === appUrlParsed.hostname) {
      return reject(
        new WebhookValidationError(
          `You cannot send responses back to ${config.app.appUrl}.`,
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
            `Error encountered during DNS resolution for ${webhookUrl}.` +
              ` Check that the URL is correct.`,
          ),
        )
      })
  })
}

/**
 * Formats a response object for update in the Submissions collection
 * @param {response} response Response object returned by axios
 */
export const formatWebhookResponse = (
  response?: AxiosResponse<unknown>,
): IWebhookResponse['response'] => ({
  status: response?.status ?? 0,
  statusText: response?.statusText ?? '',
  headers: stringifySafe(response?.headers) ?? '',
  data: stringifySafe(response?.data) ?? '',
})
