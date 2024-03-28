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
  color: '#1b1f2c',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '24px',
  fontWeight: 'bold',
}

export const textStyle: TextProps['style'] = {
  color: '#474747',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '16px',
  lineHeight: '20px',
}

export const buttonStyle: ButtonProps['style'] = {
  display: 'flex',
  justifyContent: 'center',
  borderRadius: '4px',
  width: '100%',
  backgroundColor: '#445fcd',
  padding: '8px',
}

export const linkStyle: LinkProps['style'] = {
  ...textStyle,
  wordBreak: 'break-all',
  color: '#445fcd',
}
