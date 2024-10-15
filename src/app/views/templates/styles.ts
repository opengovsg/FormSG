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

const textStyles = {
  'body-1': {
    fontStyle: 'normal',
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    fontWeight: 400,
    fontSize: '1rem',
    lineHeight: '1.5rem',
    letterSpacing: '-0.011em',
    fontFeatureSettings: "'tnum' on, 'lnum' on, 'cv05' on",
  },
  h4: {
    fontWeight: 500,
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
    fontSize: '1.125rem',
    lineHeight: '1.5rem',
    letterSpacing: '-0.014em',
    fontFeatureSettings: "'tnum' on, 'lnum' on, 'cv05' on",
  },
}

export const mainStyle = {
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  backgroundColor: '#f8f9fd',
}

export const containerStyle = {
  maxWidth: '988px',
  margin: '0 auto',
  padding: '1.5rem',
  backgroundColor: '#ffffff',
}

export const headingTextStyle: NonNullable<LinkProps['style']> = {
  ...textStyles['h4'],
  color: '#1B1F2C',
  fontWeight: 600,
  lineHeight: '2rem',
  fontSize: '1.5rem',
}

export const titleTextStyle: NonNullable<LinkProps['style']> = {
  ...textStyles['body-1'],
  color: '#000000',
  fontWeight: 700,
}

export const bodyTextStyle: NonNullable<LinkProps['style']> = {
  ...textStyles['body-1'],
  color: '#474747',
}
