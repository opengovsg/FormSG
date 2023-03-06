import { RequestClient } from 'twilio'

import MailService from '../mail/mail.service'

export class PrismClient extends RequestClient {
  prismUrl: string
  requestClient: InstanceType<typeof RequestClient>
  constructor(
    prismUrl: string,
    requestClient: InstanceType<typeof RequestClient>,
  ) {
    super()
    this.prismUrl = prismUrl
    this.requestClient = requestClient
  }

  #sendInternalMail = async (msg: string): Promise<void> => {
    await MailService.sendLocalDevMail(msg)
  }

  request<TData>(opts: any) {
    opts.uri = opts.uri.replace(/^https:\/\/.*?\.twilio\.com/, this.prismUrl)
    const resp = this.requestClient.request<TData>(opts)

    this.#sendInternalMail(opts.data.Body).catch(console.error)
    return resp
  }
}
