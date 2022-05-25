import { APP_FOOTER_LINKS } from '~constants/externalLinks'
import Footer, { FooterProps } from '~components/Footer'

interface AppFooterProps {
  variant: FooterProps['variant']
  compactMonochromeLogos?: FooterProps['compactMonochromeLogos']
}

export const AppFooter = ({
  variant,
  compactMonochromeLogos,
}: AppFooterProps): JSX.Element => {
  return (
    <Footer
      variant={variant}
      compactMonochromeLogos={compactMonochromeLogos}
      appName="Form"
      footerLinks={APP_FOOTER_LINKS}
    />
  )
}
