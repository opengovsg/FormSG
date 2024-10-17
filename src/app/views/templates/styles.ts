import {
  ButtonProps,
  ContainerProps,
  HeadingProps,
  LinkProps,
  TextProps,
} from '@react-email/components'

export const outerContainerStyle: NonNullable<ContainerProps['style']> = {
  backgroundColor: '#f8f9fd',
  padding: '72px',
}

export const innerContainerStyle: NonNullable<ContainerProps['style']> = {
  backgroundColor: '#ffffff',
  padding: '48px',
  borderRadius: '16px',
}

export const headingStyle: NonNullable<HeadingProps['style']> = {
  display: 'flex',
  color: '#1b1f2c',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '24px',
  fontWeight: 'bold',
}

export const textStyle: NonNullable<TextProps['style']> = {
  color: '#474747',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '16px',
}

/** Button style to be attached to the outer <Container> of a button */
export const buttonContainerStyle: NonNullable<ContainerProps['style']> = {
  border: '24px solid #445fcd',
  borderRadius: '4px',
  backgroundColor: '#445fcd',
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
}

export const linkStyle: NonNullable<LinkProps['style']> = {
  ...textStyle,
  wordBreak: 'break-all',
  color: '#445fcd',
}

export const textStyles = {
  'body-1': {
    fontStyle: 'normal',
    fontWeight: 400,
    fontSize: '16px',
    lineHeight: '24px',
    letterSpacing: '-0.176px',
    fontFeatureSettings: "'tnum' on, 'lnum' on, 'cv05' on",
  },
  h4: {
    fontWeight: 500,
    fontSize: '18px',
    lineHeight: '24px',
    letterSpacing: '-0.252px',
    fontFeatureSettings: "'tnum' on, 'lnum' on, 'cv05' on",
  },
  h5: {
    fontWeight: 600,
    fontSize: '20px',
    lineHeight: '28px',
    letterSpacing: '-0.28px',
    fontFeatureSettings: "'tnum' on, 'lnum' on, 'cv05' on",
  },
}

const colorBaseContentStrong = '#2C2E34'

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
