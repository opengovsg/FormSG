import { promises as dns } from 'dns'
import { isValidHttpsUrl } from 'formsg-shared/utils/url-validation'
import ipaddr from 'ipaddr.js'

import config from '../../config/config'
import { createLoggerWithLabel } from '../../config/logger'

import { WebhookValidationError } from './webhook.errors'

const logger = createLoggerWithLabel(module)

/**
 * Determines whether a resolved IP address is a publicly routable (unicast)
 * address. Any other range — private, loopback, link-local, reserved,
 * carrier-grade NAT, multicast, etc. — is treated as unsafe so webhooks
 * cannot be pointed at internal infrastructure (SSRF).
 *
 * Replaces the unmaintained `ip` package (GHSA-2p57-rm9w-gvfp), whose range
 * checks could be bypassed by crafted address formats.
 */
const isPublicAddress = (address: string): boolean => {
  if (!ipaddr.isValid(address)) {
    return false
  }
  let parsed = ipaddr.parse(address)
  // Unwrap IPv4-mapped IPv6 (e.g. ::ffff:169.254.169.254) so the embedded
  // IPv4 range is classified, closing an SSRF bypass vector.
  if (
    parsed.kind() === 'ipv6' &&
    (parsed as ipaddr.IPv6).isIPv4MappedAddress()
  ) {
    parsed = (parsed as ipaddr.IPv6).toIPv4Address()
  }
  return parsed.range() === 'unicast'
}

/**
 * Checks that a URL is valid for use in webhooks.
 * @param webhookUrl Webhook URL
 * @returns Resolves if URL is valid, otherwise rejects.
 * @throws {WebhookValidationError} If URL is invalid so webhook should not be attempted.
 */
export const validateWebhookUrl = (webhookUrl: string): Promise<void> => {
  const logMeta = {
    action: 'validateWebhookUrl',
    webhookUrl,
  }
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

    // Use dns.lookup with `all: true` so BOTH IPv4 (A) and IPv6 (AAAA)
    // records are validated. dns.resolve only returns A records, which would
    // let a host with an internal-only AAAA record slip past the SSRF guard.
    // It also matches the addresses Node's HTTP client actually connects to.
    dns
      .lookup(webhookUrlParsed.hostname, { all: true })
      .then((lookupAddresses) => {
        const addresses = lookupAddresses.map(({ address }) => address)
        if (!addresses.length) {
          return reject(
            new WebhookValidationError(
              `${webhookUrl} does not resolve to any IP address.`,
            ),
          )
        }
        const privateIps = addresses.filter((addr) => !isPublicAddress(addr))
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
      .catch((error) => {
        logger.error({
          message: 'Webhook URL failed validation',
          meta: logMeta,
          error,
        })
        return reject(
          new WebhookValidationError(
            `Error encountered during DNS resolution for webhook URL: ${webhookUrl}.` +
              ` Check that the URL is correct or delete the webhook before proceeding.`,
          ),
        )
      })
  })
}
