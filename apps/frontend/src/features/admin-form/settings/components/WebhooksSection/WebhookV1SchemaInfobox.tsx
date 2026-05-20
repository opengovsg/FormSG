import InlineMessage from '~components/InlineMessage'

export const WebhookV1SchemaInfobox = (): JSX.Element => {
  return (
    <InlineMessage variant="info">
      This form uses webhooks V1, which is outdated. Switch to the latest
      version of FormSG unless your system requires v1.
    </InlineMessage>
  )
}
