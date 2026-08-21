export * from './en-sg'

/**
 * Copy for the V5 landing page. Section-scoped, so a copy change touches one
 * block.
 *
 * Decorative micro-copy stays in the components rather than living here: the
 * die-cut sticker numbers, the cipher on the security document's underside and
 * the field labels inside the illustrations are ornament, not messaging.
 */
export interface LandingV5 {
  hero: {
    headlineBefore: string
    headlineStamped: string
    headlineAfter: string
    subhead: string
    cta: string
    builderCaption: string
    builderCaptionWide: string
    builderCaptionNarrow: string
    builderAlt: string
    formCaption: string
    formCaptionBody: string
    formIdle: string
    formTitle: string
    previousPanel: string
    nextPanel: string
  }
  proof: {
    title: string
    agencies: string
    forms: string
    responses: string
  }
  security: {
    title: string
    body: string
    clearance: string
    classificationLabel: string
    classificationValue: string
    sensitivityLabel: string
    sensitivityValue: string
    caption: string
  }
  capabilities: {
    title: string
    lede: string
    build: { title: string; body: string }
    workflow: { title: string; body: string }
  }
  examples: {
    title: string
    lede: string
    viewTemplate: string
    claims: { name: string; body: string }
    singpass: { name: string; body: string }
    event: { name: string; body: string }
  }
  close: {
    title: string
    cta: string
    guidePrefix: string
    guideLink: string
  }
  testimonial: {
    eyebrow: string
    quote: string
    name: string
    role: string
  }
}
