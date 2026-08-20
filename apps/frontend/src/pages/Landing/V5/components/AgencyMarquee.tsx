import { useCallback, useState } from 'react'
import { Box } from '@chakra-ui/react'

import {
  AGENCY_LOGOS,
  AgencyLogo,
  getAgencyLogoUrl,
} from '../constants/agencyLogos'

export interface AgencyMarqueeProps {
  /**
   * Defaults to the real list. Overridable so the drop-on-error behaviour can
   * be demonstrated with a key that is known to 403.
   */
  logos?: readonly AgencyLogo[]
}

/**
 * The looping row of agency logos.
 *
 * The list is rendered twice and the track translates by exactly -50%, which is
 * what makes the loop seamless. Both halves come from the same filtered array,
 * so a dropped logo leaves the two halves identical and the maths holds.
 *
 * A logo that fails to load is removed rather than left as a broken-image box.
 * That shifts the row slightly, which is the lesser of the two evils, and it is
 * the failure mode to expect if an agency's `logo` field changes in Mongo.
 *
 * The images are lazy-loaded. They are well below the fold, and the bucket
 * serves agency-uploaded originals at print resolution rather than
 * web-optimised assets, so deferring them keeps them out of the initial load.
 */
export const AgencyMarquee = ({
  logos: allLogos = AGENCY_LOGOS,
}: AgencyMarqueeProps = {}): JSX.Element => {
  const [failedKeys, setFailedKeys] = useState<ReadonlySet<string>>(new Set())

  const handleError = useCallback((key: string) => {
    setFailedKeys((previous) => {
      if (previous.has(key)) return previous
      const next = new Set(previous)
      next.add(key)
      return next
    })
  }, [])

  const logos = allLogos.filter((logo) => !failedKeys.has(logo.key))

  const renderLogo = (
    logo: AgencyLogo,
    { isDuplicate }: { isDuplicate: boolean },
  ) => (
    <Box
      key={`${logo.key}${isDuplicate ? '-dup' : ''}`}
      as="img"
      src={getAgencyLogoUrl(logo.key)}
      /* The duplicated half is there to make the loop seamless; it is the same
         row again, so it must not be announced twice. */
      alt={isDuplicate ? '' : logo.name}
      aria-hidden={isDuplicate || undefined}
      loading="lazy"
      decoding="async"
      onError={() => handleError(logo.key)}
      h="2.75rem"
      w="auto"
      flexShrink={0}
      /* multiply drops the baked white box on the SingHealth and SGH JPEGs,
         which are served with no alpha channel. Against paper this close to
         white it leaves the transparent logos essentially untouched, so one
         rule covers the whole row rather than special-casing two files. */
      sx={{ mixBlendMode: 'multiply' }}
    />
  )

  return (
    <Box className="lv5-marquee" mt={{ base: '2.5rem', md: '3.75rem' }}>
      <Box className="lv5-marquee-track">
        {logos.map((logo) => renderLogo(logo, { isDuplicate: false }))}
        {logos.map((logo) => renderLogo(logo, { isDuplicate: true }))}
      </Box>
    </Box>
  )
}
