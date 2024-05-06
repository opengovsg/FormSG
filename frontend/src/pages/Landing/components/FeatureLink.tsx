import { Link, type LinkProps } from '@opengovsg/design-system-react'

export const FeatureLink = (props: LinkProps): JSX.Element => {
  return (
    <Link
      mt="2.5rem"
      w="fit-content"
      textStyle="subhead-1"
      isExternal
      variant="standalone"
      p={0}
      {...props}
    />
  )
}
