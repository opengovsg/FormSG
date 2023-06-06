import { Router } from 'express'

// Handles legacy routes required for backward compatibility
export const LegacyRedirectRouter = Router()

/**
 * Redirect a form to the appropriate new frontend page.
 *
 * @route GET /:formId/publicform
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
 * @returns 302 - redirects the user to the appropriate new frontend route
 */
LegacyRedirectRouter.get('/:formId([a-fA-F0-9]{24})/publicform', (req, res) =>
  res.redirect(301, `/${req.params.formId}`),
)

LegacyRedirectRouter.get(
  '/:formId([a-fA-F0-9]{24})/:state(preview|template|use-template)',
  (req, res) => {
    const { formId, state } = req.params
    if (state === 'preview') {
      return res.redirect(301, `/admin/form/${formId}/preview`)
    }
    if (state === 'template' || state === 'use-template') {
      return res.redirect(301, `/admin/form/${formId}/use-template`)
    }
    return res.redirect(301, `/${formId}`)
  },
)

LegacyRedirectRouter.get('/:formId([a-fA-F0-9]{24})/embed', (req, res) =>
  res.redirect(301, `/${req.params.formId}`),
)

LegacyRedirectRouter.get(
  '/forms/:agency/:formId([a-fA-F0-9]{24})/:state(preview|template|use-template)?',
  (req, res) => {
    const { formId, state } = req.params
    if (state === 'preview') {
      return res.redirect(301, `/admin/form/${formId}/preview`)
    }
    if (state === 'template' || state === 'use-template') {
      return res.redirect(301, `/admin/form/${formId}/use-template`)
    }
    return res.redirect(301, `/${formId}`)
  },
)

LegacyRedirectRouter.get(
  '/forms/:agency/:formId([a-fA-F0-9]{24})/embed',
  (req, res) => res.redirect(301, `/${req.params.formId}`),
)
