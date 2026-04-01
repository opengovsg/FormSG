import { ContainerProps, LinkProps } from '@react-email/components'

import { colorBaseContentStrong, textStyles } from './commonStyles'

export const mainStyle = {
  fontFamily: 'sans-serif',
  backgroundColor: '#E5E9F8', // formsg primary 100
}

export const containerStyle = {
  maxWidth: '100%',
  width: '720px',
  margin: 'auto',
  padding: '20px',
  borderRadius: '8px',
  backgroundColor: '#ffffff',
}

export const sectionStyle = {
  padding: '32px',
  marginBottom: '16px',
  background: '#F8F9FD',
  borderRadius: '8px',
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

// Column styles
export const halfWidthColumnStyle: NonNullable<LinkProps['style']> = {
  width: '50%',
  verticalAlign: 'top',
}

// Section/Card style variations
export const cardSectionStyle: NonNullable<LinkProps['style']> = {
  background: '#F8F9FD',
  borderRadius: '8px',
  marginBottom: '16px',
  paddingLeft: '16px',
  paddingRight: '16px',
}

/** Button style to be attached to the outer <Container> of a button */
export const buttonContainerStyle: NonNullable<ContainerProps['style']> = {
  border: '24px solid #445fcd',
  borderRadius: '4px',
  backgroundColor: '#445fcd',
  width: '100%',
  marginTop: '24px',
  marginBottom: '16px',
}
