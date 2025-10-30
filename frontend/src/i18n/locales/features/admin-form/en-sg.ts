import { enSG as responsesCharts } from './responses/charts'
import { enSG as responsesComponents } from './responses/components'
import { enSG as responsesIndividualResponse } from './responses/individual-response'
import { enSG as responsesResponsesPage } from './responses/responses-page'
import { enSG as feedback } from './feedback'
import { enSG as magicFormBuilder } from './magic-form-builder'
import { enSG as meta } from './meta'
import { enSG as modals } from './modals'
import { enSG as navbar } from './navbar'
import { enSG as previewFormBanner } from './preview-form-banner'
import { enSG as settings } from './settings'
import { enSG as sidebar } from './sidebar'
import { enSG as toasts } from './toasts'

export const enSG = {
  previewFormBanner,
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
  magicFormBuilder,
}
