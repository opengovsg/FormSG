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
    fontWeight: 400,
    fontSize: '1rem',
    lineHeight: '1.5rem',
    letterSpacing: '-0.011em',
    fontFeatureSettings: "'tnum' on, 'lnum' on, 'cv05' on",
  },
  h4: {
    fontWeight: 500,
    fontSize: '1.125rem',
    lineHeight: '1.5rem',
    letterSpacing: '-0.014em',
    fontFeatureSettings: "'tnum' on, 'lnum' on, 'cv05' on",
  },
  h5: {
    fontWeight: 600,
    fontSize: '1.25rem',
    lineHeight: '1.75rem',
    letterSpacing: '-0.014em',
    fontFeatureSettings: "'tnum' on, 'lnum' on, 'cv05' on",
  },
}

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
  color: '#2C2E34',
  fontWeight: 600,
  lineHeight: '2rem',
  fontSize: '1.5rem',
}

export const outcomeTextStyle: NonNullable<LinkProps['style']> = {
  ...textStyles['h5'],
  color: '#2C2E34',
}

export const titleTextStyle: NonNullable<LinkProps['style']> = {
  ...textStyles['body-1'],
  color: '#2C2E34',
  fontWeight: 700,
}

export const bodyTextStyle: NonNullable<LinkProps['style']> = {
  ...textStyles['body-1'],
  color: '#474747',
}
