import { enSG as responsesCharts } from './responses/charts'
import { enSG as responsesComponents } from './responses/components'
import { enSG as responsesIndividualResponse } from './responses/individual-response'
import { enSG as responsesResponsesPage } from './responses/responses-page'
import { enSG as collaborator } from './collaborator'
import { enSG as featureTour } from './feature-tour'
import { enSG as feedback } from './feedback'
import { enSG as meta } from './meta'
import { enSG as modals } from './modals'
import { enSG as navbar } from './navbar'
import { enSG as settings } from './settings'
import { enSG as share } from './share'
import { enSG as sidebar } from './sidebar'
import { enSG as template } from './template'
import { enSG as toasts } from './toasts'

export const enSG = {
  backendErrors: {
    exports: {
      databaseRetrieval:
        'There was a problem retrieving the export data. Please try again.',
      feedback: {
        jsonConversion:
          'There was a problem preparing the feedback export. Please try again.',
      },
      issue: {
        jsonConversion:
          'There was a problem preparing the issue export. Please try again.',
      },
    },
    fields: {
      notFound: 'Field to modify not found',
      createFailed: 'Something went wrong. Please try creating fields again.',
    },
    whitelist: {
      missingPublicKey: 'Form does not have a public key',
      fileTooLarge:
        'You have exceeded the file size limit, please upload a file below {{limitKb}} kB.',
      invalidCharacters: 'Your csv has one or more invalid characters.',
      emptyCsv: 'Your csv is empty.',
      invalidFormId: 'Your form ID is invalid.',
    },
    template: {
      mustBePublic: 'Form must be public to be copied',
    },
    payments: {
      invalidAmount: 'Invalid payment amount',
      productAmountLimitExceeded:
        'Item and Quantity exceeded limit. Either lower your quantity or lower payment amount.',
    },
    endPage: {
      invalidUrl: 'Please enter a valid HTTP or HTTPS URI',
    },
    assets: {
      unsupportedFileType: 'Unsupported file type',
    },
  },
  responses: {
    charts: responsesCharts,
    components: responsesComponents,
    individualResponse: responsesIndividualResponse,
    responsesPage: responsesResponsesPage,
  },
  navbar,
  sidebar,
  meta,
  modals,
  toasts,
  settings,
  feedback,
  share,
  featureTour,
  collaborator,
  template,
}
