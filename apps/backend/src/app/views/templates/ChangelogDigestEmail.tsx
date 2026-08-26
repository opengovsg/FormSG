/**
 * The biweekly product digest sent to FormSG form admins.
 *
 * Audience is form admins, not engineers. Nothing in here links to GitHub,
 * Linear, or any other internal tool, and items never carry version numbers or
 * feature flag names. Each item is a plain-language heading and a sentence or
 * two on what it does for the reader.
 *
 * Layout follows EmailTemplate.tsx: table-based structure, spacer rows instead
 * of margins, and a fallback link under the button, all for Outlook's benefit.
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
  cardSectionStyle,
  containerStyle,
  headingTextStyle,
  linkStyle,
  mainStyle,
  primaryTextStyle,
  questionMargin,
  secondaryTextStyle,
  sectionStyle,
} from './emailStyles'

export type ChangelogDigestItem = {
  /** Plain-language heading, written for a form admin. */
  title: string
  /** One or two sentences on what the change does for the reader. */
  body: string
}

export type ChangelogDigestHtmlData = {
  items: ChangelogDigestItem[]
  /** Where the call-to-action button points. */
  ctaUrl: string
  /** Omitted in preview sends, which have no list to unsubscribe from. */
  unsubscribeUrl?: string
}

const HEADING = "Here's what's new on FormSG!"
const CTA_LABEL = 'Make a form with FormSG'

export const ChangelogDigestEmail = ({
  items,
  ctaUrl,
  unsubscribeUrl,
}: ChangelogDigestHtmlData): JSX.Element => {
  const renderMargin = (height: number) => (
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
      <Preview>{HEADING}</Preview>
      <Body style={mainStyle}>
        <Container className="email-container" style={containerStyle}>
          <Section className="email-section" style={sectionStyle}>
            <Img
              style={{ height: '24px', marginBottom: '40px' }}
              src={FORMSG_LOGO_URL}
              alt="FormSG"
            />

            <Heading style={{ ...headingTextStyle, marginBottom: '32px' }}>
              {HEADING}
            </Heading>

            {items.map((item, i) => (
              <React.Fragment key={i}>
                <Section style={cardSectionStyle}>
                  <Text style={{ ...primaryTextStyle, ...questionMargin }}>
                    {item.title}
                  </Text>
                  <Text style={{ ...secondaryTextStyle, marginTop: '4px' }}>
                    {item.body}
                  </Text>
                </Section>
                {i < items.length - 1 && renderMargin(16)}
              </React.Fragment>
            ))}

            {renderMargin(40)}

            <Container style={buttonContainerStyle}>
              <a
                href={ctaUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={buttonInnerStyle}
              >
                {CTA_LABEL}
              </a>
            </Container>

            <Text style={{ ...secondaryTextStyle, marginTop: '24px' }}>
              If the button above does not work, copy and paste this link into
              your browser:
            </Text>
            <Link href={ctaUrl} style={linkStyle}>
              {ctaUrl}
            </Link>

            {renderMargin(32)}

            <Text style={{ ...secondaryTextStyle, fontSize: '14px' }}>
              You are receiving this because you have a FormSG account.
              {unsubscribeUrl ? (
                <>
                  {' '}
                  <Link href={unsubscribeUrl} style={linkStyle}>
                    Unsubscribe
                  </Link>
                </>
              ) : null}
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
