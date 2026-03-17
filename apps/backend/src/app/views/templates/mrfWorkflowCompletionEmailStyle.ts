import { LinkProps } from '@react-email/components'

import { colorBaseContentStrong, textStyles } from './commonStyles'

export const mainStyle = {
  fontFamily: 'sans-serif',
  backgroundColor: '#f8f9fd',
}

export const containerStyle = {
  maxWidth: '100%',
  width: '720px',
  margin: 'auto',
  padding: '20px',
}

export const sectionStyle = {
  padding: '32px',
  backgroundColor: '#ffffff',
}

export const headingTextStyle: NonNullable<LinkProps['style']> = {
  ...textStyles['h4'],
  color: colorBaseContentStrong,
  fontWeight: 600,
  lineHeight: '32px',
  fontSize: '24px',
}

export const outcomeTextStyle: NonNullable<LinkProps['style']> = {
  ...textStyles['h5'],
  color: colorBaseContentStrong,
}

export const primaryTextStyle: NonNullable<LinkProps['style']> = {
  ...textStyles['body-1'],
  color: colorBaseContentStrong,
  fontWeight: 700,
}

export const secondaryTextStyle: NonNullable<LinkProps['style']> = {
  ...textStyles['body-1'],
  color: '#474747',
}

export const questionMargin: NonNullable<LinkProps['style']> = {
  marginBottom: '4px',
}

export const answerMargin: NonNullable<LinkProps['style']> = {
  marginTop: '4px',
}
