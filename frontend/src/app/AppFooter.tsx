import { APP_FOOTER_LINKS } from '~constants/externalLinks'
import Footer, { FooterProps } from '~components/Footer'

type AppFooterProps = Pick<
  FooterProps,
  'variant' | 'bg' | 'compactMonochromeLogos'
>
export const AppFooter = (props: AppFooterProps): JSX.Element => {
  return (
    <Footer
      appLink={window.location.origin}
      appName="Form"
      footerLinks={APP_FOOTER_LINKS}
      {...props}
    />
  )
}
