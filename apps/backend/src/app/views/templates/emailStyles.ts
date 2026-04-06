import { ContainerProps, LinkProps } from '@react-email/components'

import { colorBaseContentStrong, textStyles } from './commonStyles'

export const mainStyle = {
  fontFamily: 'sans-serif',
  backgroundColor: '#E5E9F8', // formsg primary 100
}

export const containerStyle = {
  maxWidth: '720px',
  width: '100%',
  margin: '20px auto',
  padding: '20px',
}

export const sectionStyle = {
  padding: '32px',
  marginBottom: '16px',
  background: '#F8F9FD',
  borderRadius: '8px',
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

// Card sections used in column layout
export const cardSectionColumnStyle: NonNullable<LinkProps['style']> = {
  background: '#F8F9FD',
  borderRadius: '8px',
  border: '1px solid #E9E9E9',
  padding: '0 16px',
  verticalAlign: 'top',
  width: 'calc(50% - 8px)',
}

// Section/Card style variations
export const cardSectionStyle: NonNullable<LinkProps['style']> = {
  background: '#F8F9FD',
  borderRadius: '8px',
  border: '1px solid #E9E9E9',
  marginBottom: '16px',
  padding: '0 16px',
  width: '100%',
  display: 'block',
  boxSizing: 'border-box',
}

/** Button style to be attached to the outer <Container> of a button */
export const buttonContainerStyle: NonNullable<ContainerProps['style']> = {
  border: '1px solid #445fcd',
  borderRadius: '4px',
  backgroundColor: '#445fcd',
  width: '100%',
  marginTop: '24px',
  marginBottom: '16px',
}
