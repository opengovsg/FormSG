/**
 * The agency logos shown in the proof marquee, pulled from the live
 * agency-logo bucket rather than committed into the repo.
 *
 * Why the keys are transcribed rather than derived: each agency document in
 * Mongo carries its own `logo` field, and the filename does not follow the
 * shortName. Three extensions appear across this set, and CPF Board is keyed
 * `cpfb`, not `cpf`. A URL built from a name would 403 on a subset, silently.
 *
 * Why hardcoded at all: there is no public agencies endpoint. `PublicAgencyDto`
 * only ever reaches the frontend nested inside the logged-in user, and bucket
 * listing is denied, so an anonymous landing page has no way to ask for a list.
 * Building one would also mean inventing a definition of "the top agencies"
 * that the data does not have. If this route graduates to `/`, a public
 * endpoint is the right replacement.
 *
 * The tradeoff being accepted: if an agency's `logo` field changes, the URL
 * 403s and `AgencyMarquee` drops that logo from the row.
 *
 * Order is the exploration's, which is deliberate rather than alphabetical.
 * Every key was verified live before being committed.
 */

const AGENCY_LOGO_BUCKET =
  'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg'

export interface AgencyLogo {
  /** The object key in the bucket, from the agency's `logo` field. */
  key: string
  /** Full agency name, used as the image's alt text. */
  name: string
}

export const AGENCY_LOGOS: readonly AgencyLogo[] = [
  { key: 'moe.png', name: 'Ministry of Education' },
  { key: 'mindef.png', name: 'Ministry of Defence' },
  { key: 'spf.png', name: 'Singapore Police Force' },
  { key: 'pa.jpg', name: "People's Association" },
  { key: 'nhg.png', name: 'National Healthcare Group' },
  { key: 'govtech.jpg', name: 'Government Technology Agency' },
  { key: 'msf.png', name: 'Ministry of Social and Family Development' },
  { key: 'lta.png', name: 'Land Transport Authority' },
  { key: 'pub.jpg', name: "PUB, Singapore's National Water Agency" },
  { key: 'scdf.png', name: 'Singapore Civil Defence Force' },
  { key: 'singhealth.jpeg', name: 'SingHealth' },
  { key: 'mom.png', name: 'Ministry of Manpower' },
  { key: 'ica.png', name: 'Immigration & Checkpoints Authority' },
  { key: 'hdb.png', name: 'Housing & Development Board' },
  { key: 'sgh.png', name: 'Singapore General Hospital' },
  { key: 'mha.png', name: 'Ministry of Home Affairs' },
  { key: 'cpfb.png', name: 'Central Provident Fund Board' },
  { key: 'sportsg.jpg', name: 'Sport Singapore' },
] as const

export const getAgencyLogoUrl = (key: string): string =>
  `${AGENCY_LOGO_BUCKET}/${key}`
