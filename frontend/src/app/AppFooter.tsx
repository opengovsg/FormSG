import { APP_FOOTER_LINKS } from '~constants/externalLinks'
import Footer from '~components/Footer'

export const AppFooter = (): JSX.Element => {
  return <Footer appName="Form" footerLinks={APP_FOOTER_LINKS} />
}
