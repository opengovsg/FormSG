import { RequestClient } from 'twilio'

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

  request<TData>(opts: any) {
    opts.uri = opts.uri.replace(/^https:\/\/.*?\.twilio\.com/, this.prismUrl)
    const resp = this.requestClient.request<TData>(opts)
    resp
      .then((d) => console.log(JSON.stringify(d, null, 2)))
      .catch(console.error)
    return resp
  }
}
