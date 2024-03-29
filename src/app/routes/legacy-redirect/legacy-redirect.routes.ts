import { Router } from 'express'
import { StatusCodes } from 'http-status-codes'
import querystring from 'querystring'

import { ControllerHandler } from 'src/app/modules/core/core.types'

// Helper function to copy queries over to new paths.
const buildPathWithQueryParams = (
  path: string,
  query: Record<string, string>,
) => {
  const queryString = querystring.stringify(query)
  if (queryString.length > 0) {
    return path + '?' + encodeURIComponent(queryString)
  }
  return path
}

/**
 * Handler to redirect frontend pages with /:formId or /forms/:agency prefixes.
 *
 * @param formId the form id referenced in the route
 * @param state one of ['preview', 'template', 'use-template', 'embed']
 *
 * @returns 301 with the new redirect route path
 */
const handleFormIdAndAgencyPrefixRedirect: ControllerHandler<
  {
    formId: string
    state: 'preview' | 'template' | 'use-template' | 'embed'
  },
  unknown,
  unknown,
  Record<string, string>
> = (req, res, next) => {
  const { formId, state } = req.params

  let redirectPath
  switch (state) {
    case 'preview':
      redirectPath = `/admin/form/${formId}/preview`
      break
    case 'template':
    case 'use-template':
      redirectPath = `/admin/form/${formId}/use-template`
      break
    case 'embed':
      redirectPath = `/${formId}`
      break
    default:
      // Fallback - should never get here!
      return next()
  }

  return res.redirect(
    StatusCodes.MOVED_PERMANENTLY,
    // Port query params over to the new URL as well
    buildPathWithQueryParams(redirectPath, req.query),
  )
}

// Handles legacy routes required for backward compatibility
export const LegacyRedirectRouter = Router()

/**
 * Redirect a form to the appropriate new frontend page.
 *
 * @route GET /:formId/preview
 * @route GET /:formId/template
 * @route GET /:formId/use-template
 * @route GET /:formId/embed
 * @route GET /forms/:agency/:formId
 * @route GET /forms/:agency/:formId/preview
 * @route GET /forms/:agency/:formId/template
 * @route GET /forms/:agency/:formId/use-template
 * @route GET /forms/:agency/:formId/embed
 *
 * @returns 301 - redirects the user to the appropriate new frontend route
 */
LegacyRedirectRouter.get(
  '/:formId([a-fA-F0-9]{24})/:state(preview|template|use-template|embed)',
  handleFormIdAndAgencyPrefixRedirect,
)

LegacyRedirectRouter.get(
  '/forms/:agency/:formId([a-fA-F0-9]{24})',
  (req, res) =>
    res.redirect(
      StatusCodes.MOVED_PERMANENTLY,
      // Port query params over to the new URL as well
      buildPathWithQueryParams(
        `/${req.params.formId}`,
        req.query as Record<string, string>,
      ),
    ),
)

LegacyRedirectRouter.get(
  '/forms/:agency/:formId([a-fA-F0-9]{24})/:state(preview|template|use-template|embed)',
  handleFormIdAndAgencyPrefixRedirect,
)
