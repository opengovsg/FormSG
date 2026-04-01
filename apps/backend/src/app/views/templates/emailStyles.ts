import { ContainerProps, LinkProps } from '@react-email/components'

import { colorBaseContentStrong, textStyles } from './commonStyles'

export const mainStyle = {
  fontFamily: 'sans-serif',
  backgroundColor: '#E5E9F8', // formsg primary 100
}

export const containerStyle = {
  maxWidth: '100%',
  width: '720px',
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

// Column styles - hybrid responsive approach
export const halfWidthColumnStyle: NonNullable<LinkProps['style']> = {
  maxWidth: '50%',
  verticalAlign: 'top',
}

export const leftColumnStyle: NonNullable<LinkProps['style']> = {
  ...halfWidthColumnStyle,
  paddingRight: '8px',
}

export const rightColumnStyle: NonNullable<LinkProps['style']> = {
  ...halfWidthColumnStyle,
  paddingLeft: '8px',
}

// Responsive field container - stacks on mobile
export const fieldContainerStyle: NonNullable<LinkProps['style']> = {
  display: 'inline-block',
  width: '50%',
  verticalAlign: 'top',
  minWidth: '250px',
  boxSizing: 'border-box',
}

// Section/Card style variations
export const cardSectionStyle: NonNullable<LinkProps['style']> = {
  background: '#F8F9FD',
  borderRadius: '8px',
  border: '1px solid #E9E9E9',
  marginBottom: '16px',
  padding: '0 16px', // padding on left & right only since React <Text> alr has default padding for top/down
  width: '100%',
  display: 'block',
  boxSizing: 'border-box',
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
