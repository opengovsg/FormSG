import config from '../../../config/config'
import { stripe } from '../../../loaders/stripe'
import { ControllerHandler } from '../../core/core.types'

export const handleConnectAccount: ControllerHandler<{
  formId: string
}> = async (req, res) => {
  const { formId } = req.params
  const account = await stripe.accounts.create({ type: 'standard' })
  const accountLink = await stripe.accountLinks.create({
    account: account.id,
    refresh_url: `${config.app.appUrl}/admin/form/${formId}/settings`,
    return_url: `${config.app.appUrl}/admin/form/${formId}/settings`,
    type: 'account_onboarding',
  })

  return res.json({ accountUrl: accountLink.url })
}
