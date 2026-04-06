import {
  ButtonProps,
  ContainerProps,
  LinkProps,
  TextProps,
} from '@react-email/components'

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
  wordBreak: 'break-word',
}

// Section/Card style variations
export const cardSectionStyle: NonNullable<LinkProps['style']> = {
  background: '#F8F9FD',
  borderRadius: '8px',
  border: '1px solid #E9E9E9',
  padding: '0 16px',
  width: '100%',
  display: 'block',
  boxSizing: 'border-box',
  wordBreak: 'break-word',
}

export const textStyle: NonNullable<TextProps['style']> = {
  color: '#474747',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '16px',
}

/** Button style to be attached to the outer <Container> of a button */
export const buttonContainerStyle: NonNullable<ContainerProps['style']> = {
  borderRadius: '4px',
  backgroundColor: '#445fcd',
  width: '100%',
  maxWidth: '100%',
  textAlign: 'center',
}

/** Button style to be attached to the inner <a> tag of a button. */
export const buttonInnerStyle: NonNullable<ButtonProps['style']> = {
  ...textStyle,
  display: 'block',
  backgroundColor: '#445fcd',
  borderRadius: '4px',
  textAlign: 'center',
  textDecoration: 'none',
  color: '#ffffff',
  border: '24px solid #445fcd',
}

export const linkStyle: NonNullable<LinkProps['style']> = {
  ...textStyle,
  wordBreak: 'break-all',
  color: '#445fcd',
}
