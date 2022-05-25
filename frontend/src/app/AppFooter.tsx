import { APP_FOOTER_LINKS } from '~constants/externalLinks'
import Footer, { FooterProps } from '~components/Footer'

interface AppFooterProps {
  variant: FooterProps['variant']
}

export const AppFooter = ({ variant }: AppFooterProps): JSX.Element => {
  return (
    <Footer variant={variant} appName="Form" footerLinks={APP_FOOTER_LINKS} />
  )
}
