import { FlexProps } from '@chakra-ui/react'
import { SetOptional } from 'type-fest'

import { ThemeColorScheme } from '~theme/foundations/colours'

export type FooterLink = {
  label: string
  href: string
}

export type FooterLinkWithIcon = FooterLink & {
  Icon: (props: any) => JSX.Element
}

export interface FooterVariantProps {
  /** Application name to display in footer. */
  appName: string
  /** Tagline to display beside application name, if provided. */
  tagline?: string
  /** Link for footer icon. Defaults to OGP homepage. */
  footerIconLink: FooterLinkWithIcon
  /** Footer links to display, if provided. */
  footerLinks?: FooterLink[]
  /** Social media links to display, if provided. Defaults to OGP links. */
  socialMediaLinks: FooterLinkWithIcon[]
  /**
   * Colour scheme of the text in the footer.
   * Defaults to `secondary` if not provided.
   */
  textColorScheme: ThemeColorScheme
  /**
   * Background color of footer.
   * Defaults to `primary.100` if not provided.
   */
  bg: string
}

export interface FooterContainerProps extends FlexProps {
  children: React.ReactNode
}

export interface FooterProps
  extends SetOptional<
    FooterVariantProps,
    'socialMediaLinks' | 'textColorScheme' | 'footerIconLink' | 'bg'
  > {
  /**
   * The footer variant to display. Defaults to `full` if not provided.
   */
  variant?: 'full' | 'compact'
}
