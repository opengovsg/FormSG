import { APP_FOOTER_LINKS } from '~constants/externalLinks'
import Footer from '~components/Footer'

export const AppFooter = (): JSX.Element => {
  return (
    <Footer
      appName="Form"
      tagline="Build secure government forms in minutes"
      footerLinks={APP_FOOTER_LINKS}
    />
  )
}
