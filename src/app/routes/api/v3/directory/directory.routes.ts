import { Router } from 'express'

import * as DirectoryController from '../../../../modules/directory/directory.controller'

export const DirectoryRouter = Router()

/**
 * Retrieves the the list of agencies to display as choices for form directory lookup.
 * @route GET /api/v3/directory/agencies
 * @returns 200
 * @returns 500 if a database error occurs
 */
DirectoryRouter.get('/agencies', DirectoryController.handleGetAgencies)

/**
 * Retrieves the the list of public forms belonging to an agency.
 * @route GET /api/v3/directory/agencies/:agency
 * @returns 200
 * @returns 500 if a database error occurs
 */
DirectoryRouter.get(
  '/agencies/:agencyShortName',
  DirectoryController.handleGetAgencyForms,
)
