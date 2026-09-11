/**
 * The chrome every FormSG email shares: the responsive shell, the logo and the
 * title beneath it. The Outlook constraints described in EmailTemplate apply
 * here too, so the layout is table-based and spacing uses spacer rows.
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
  /** Rendered inside <Body> but outside the white card. */
  belowContainer?: React.ReactNode
}

/** A spacer row: email clients drop vertical margins between table rows. */
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

/** Splits text on newlines into <br>-separated lines. */
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
 * A call-to-action button, followed by the same link in plain text: several
 * clients strip or fail to render the styled anchor.
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
            {/* Only when there is one to show. Three senders build EmailData
                without a title (the admin response notification, the MRF
                completion email and the respondent's copy), and an
                unconditional heading gave those an empty <h1> carrying a line
                box and 40px of margin at the top of the card. */}
            {emailTitle && (
              <Heading style={{ ...headingTextStyle, marginBottom: '40px' }}>
                {emailTitle}
              </Heading>
            )}
            {children}
          </Section>
        </Container>
        {belowContainer}
      </Body>
    </Html>
  )
}
