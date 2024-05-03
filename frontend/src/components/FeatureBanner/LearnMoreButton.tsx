import { Button } from '@opengovsg/design-system-react'

import { textStyles } from '~theme/textStyles'

import { useFeatureBannerStyles } from './FeatureBannerContext'

interface LearnMoreButtonProps {
  learnMoreLink: string
  title?: string
}

export const LearnMoreButton = ({
  title,
  learnMoreLink,
}: LearnMoreButtonProps) => {
  const styles = useFeatureBannerStyles()

  return (
    <Button
      sx={{
        ...styles.button,
        ...(title ? textStyles['subhead-1'] : textStyles['subhead-2']),
        minHeight: 'auto',
      }}
      variant="outline"
      colorScheme="inverse"
      as="a"
      href={learnMoreLink}
      target="_blank"
    >
      Learn more
    </Button>
  )
}
