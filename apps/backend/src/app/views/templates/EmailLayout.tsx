/**
 * The chrome every FormSG email shares: the responsive shell, the FormSG logo
 * and the title beneath it. Extracted from EmailTemplate so notification
 * emails can sit on the same furniture instead of each re-deriving it.
 *
 * The Outlook constraints described in EmailTemplate apply here too — the
 * layout is table-based and spacing is done with spacer rows rather than
 * margins, because Outlook's rendering engine honours neither reliably.
 */

import {
  Body,
  Column,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Text,
} from '@react-email/components'
import React from 'react'

import { FORMSG_LOGO_URL } from '../../constants/formsg-logo'

import {
  buttonContainerStyle,
  buttonInnerStyle,
  containerStyle,
  headingTextStyle,
  linkStyle,
  mainStyle,
  secondaryTextStyle,
  sectionStyle,
} from './emailStyles'

export type EmailLayoutProps = {
  /** Shown as the email's preview text, and as the heading under the logo. */
  emailTitle?: string
  children: React.ReactNode
  /**
   * Rendered inside <Body> but outside the white card. Only the response email
   * uses it, for the raw JSON block that is deliberately not part of the card.
   */
  belowContainer?: React.ReactNode
}

/**
 * A spacer row. Email clients drop vertical margins between table rows, so
 * space is an element rather than a style.
 */
export const EmailMargin = ({ height }: { height: number }): JSX.Element => (
  <Row>
    <Column
      style={{
        height: `${height}px`,
        lineHeight: `${height}px`,
        fontSize: '1px',
      }}
    >
      &nbsp;
    </Column>
  </Row>
)

/**
 * Splits text on newlines into <br>-separated lines. Plain `\n` collapses to a
 * space in HTML, so any multi-line copy passed as a single string needs this.
 */
export const renderLines = (text: string): JSX.Element[] => {
  const lines = text.split(/\r?\n/)
  return lines.map((line, i) => (
    <React.Fragment key={i}>
      {line}
      {i < lines.length - 1 && <br />}
    </React.Fragment>
  ))
}

/**
 * A call-to-action button, followed by the same link in plain text.
 *
 * The fallback is not belt and braces: several clients strip or fail to render
 * the styled anchor, and a recipient who cannot see the button has no other way
 * to reach the destination.
 */
export const EmailButton = ({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}): JSX.Element => (
  <Row>
    <Column>
      <Container style={buttonContainerStyle}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          style={buttonInnerStyle}
        >
          {children}
        </a>
      </Container>
      <Text style={{ ...secondaryTextStyle }}>
        If you are having trouble with the button above, copy and paste the link
        below into your browser:
      </Text>
      <Link href={href} style={{ ...linkStyle }}>
        {href}
      </Link>
    </Column>
  </Row>
)

export const EmailLayout = ({
  emailTitle,
  children,
  belowContainer,
}: EmailLayoutProps): JSX.Element => {
  return (
    <Html>
      <Head>
        <style>{`
          @media only screen and (max-width: 600px) {
            .email-container {
              padding: 12px !important;
            }
            .email-section {
              padding: 20px !important;
            }
          }
        `}</style>
      </Head>
      {emailTitle && <Preview>{emailTitle}</Preview>}
      <Body style={mainStyle}>
        <Container className="email-container" style={containerStyle}>
          <Section className="email-section" style={sectionStyle}>
            {/* Logo */}
            <Img
              style={{ height: '24px', marginBottom: '40px' }}
              src={FORMSG_LOGO_URL}
              alt="FormSG"
            />
            {/* Body Title */}
            <Heading style={{ ...headingTextStyle, marginBottom: '40px' }}>
              {emailTitle}
            </Heading>
            {children}
          </Section>
        </Container>
        {belowContainer}
      </Body>
    </Html>
  )
}
