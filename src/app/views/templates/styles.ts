import {
  ButtonProps,
  ContainerProps,
  HeadingProps,
  LinkProps,
  TextProps,
} from '@react-email/components'

export const outerContainerStyle: ContainerProps['style'] = {
  backgroundColor: '#f8f9fd',
  padding: '72px',
}

export const innerContainerStyle: ContainerProps['style'] = {
  backgroundColor: '#ffffff',
  padding: '48px',
  borderRadius: '16px',
}

export const headingStyle: HeadingProps['style'] = {
  display: 'flex',
  color: '#1b1f2c',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '24px',
  fontWeight: 'bold',
}

export const textStyle: TextProps['style'] = {
  display: 'flex',
  color: '#474747',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '16px',
}

/** Button style to be attached to the outer <a> tag of a button. */
export const buttonStyle: ButtonProps['style'] = {
  display: 'flex',
  justifyContent: 'center',
  borderRadius: '4px',
  backgroundColor: '#445fcd',
  padding: '24px',
  textDecoration: 'none',
}

/** Inner text style to be attached to the inner <div> tag of a button. */
export const innerButtonTextStyle: ContainerProps['style'] = {
  ...textStyle,
  display: 'inline-block',
  width: '100%',
  textAlign: 'center',
  color: '#ffffff',
}

export const linkStyle: LinkProps['style'] = {
  ...textStyle,
  wordBreak: 'break-all',
  color: '#445fcd',
}
