import { USE_TEMPLATE_REDIRECT_SUBROUTE } from '~constants/routes'

import { LANDING_V5_TEMPLATE_COLORS } from '../theme/tokens'

export interface TemplateField {
  label: string
  /** Placeholder text, so the field reads as empty and waiting. */
  ghost: string
}

export interface TemplateCard {
  /** i18n key suffix under `features.landingV5.examples`. */
  key: 'claims' | 'singpass' | 'event'
  /** Banner and submit colour, so the three read as three agencies' forms. */
  accent: string
  /** Tilt at rest. Straightens on hover and focus. */
  tilt: string
  /** Vertical offset at rest, staggering the row. */
  dy: string
  fields: readonly TemplateField[]
  /**
   * The published form this card opens as a template. Undefined until the real
   * forms exist, and the card renders as a non-interactive figure while it is —
   * see `ExampleCard`.
   */
  formId?: string
}

/**
 * Builds the public "use this as a template" URL for a form.
 *
 * Real, working route (`/:formId/use-template`), so these cards need no new
 * backend — only three published form ids.
 */
export const getUseTemplateUrl = (formId: string): string =>
  `/${formId}/${USE_TEMPLATE_REDIRECT_SUBROUTE}`

/**
 * The three template cards.
 *
 * Field labels and placeholders are ornament — they are a picture of a form,
 * not messaging — so they stay here rather than in the i18n bundle, matching
 * the security document and the builder mock. The card's name and description
 * are real copy and do live in i18n.
 */
export const TEMPLATE_CARDS: readonly TemplateCard[] = [
  {
    key: 'claims',
    accent: LANDING_V5_TEMPLATE_COLORS.claims,
    tilt: '-1.6deg',
    dy: '0px',
    fields: [
      { label: '1. Claim amount', ghost: 'e.g. $120.00' },
      { label: '2. What was it for', ghost: 'e.g. taxi to off-site' },
    ],
  },
  {
    key: 'singpass',
    accent: LANDING_V5_TEMPLATE_COLORS.singpass,
    tilt: '1.2deg',
    dy: '16px',
    fields: [
      { label: '1. Full Name', ghost: 'Tan Wei Ming' },
      { label: '2. Home Address', ghost: 'Blk 128 Bishan St 12, #05-33' },
    ],
  },
  {
    key: 'event',
    accent: LANDING_V5_TEMPLATE_COLORS.event,
    tilt: '-0.9deg',
    dy: '6px',
    fields: [
      { label: '1. Name', ghost: 'Your full name' },
      { label: '2. Email', ghost: 'you@agency.gov.sg' },
    ],
  },
]
