import { Router } from 'express'
import { AdminDashboardFormMetaDto, ErrorDto } from 'shared/types'

import { withUserAuthentication } from '../../modules/auth/auth.middlewares'
import { ControllerHandler } from '../../modules/core/core.types'

import { AdminFormsRouter } from './v3/admin/forms'

export const handleCloudflareChallengeGeneration: ControllerHandler<
  unknown,
  AdminDashboardFormMetaDto[] | ErrorDto
> = async (req, res) => {
  console.log('Cloudflare challenge triggered', req.ip)
  return res
    .status(403)
    .header('server', 'cloudflare')
    .header('cf-mitigated', 'yup')
    .header('cf-ray', 'sun')
    .json({ message: 'cloudflare challenge' })
}

export const CloudflareRouter = Router()

// All routes in this handler should be protected by authentication.
AdminFormsRouter.use(withUserAuthentication)

CloudflareRouter.route('/challenge')
  /**
   * Trigger a Cloudflare challenge for the user
   *
   * @returns 403 forbiden always
   */
  .get(
    // limitRate({ max: rateLimitConfig.publicApi }),
    handleCloudflareChallengeGeneration,
  )
