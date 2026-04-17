/**
 * Email template used to generate the HTML content of emails sent by FormSG using the react-email library.
 * The styles are defined in a separate file (emailStyles.ts) and imported here for use.
 * For mobile responsiveness, it utilizes a media-query styling approach.
 * Outlook rendering engine is notoriously difficult at handling modern CSS, so template utilises:
 * 1. Table-based layout for consistent structure across email clients
 * 2. Margins implemented using spacer rows for table-based components
 * 3. Fallback links provided for buttons to ensure accessibility in case buttons do not render correctly
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
  answerMargin,
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

export type EmailData = {
  emailTitle: string
  emailBody?: string
  formTitle: string
  responseId: string
  outcome?: WorkflowOutcome | undefined
  formQuestionAnswers?: QuestionAnswer[]
  paymentAmount?: number
  statusTrackerUrl?: string
  reviewUrl?: string
  paymentUrl?: string
  responseJson?: string
}

export enum WorkflowOutcome {
  APPROVED = 'Approved',
  NOT_APPROVED = 'Not approved',
}

export type QuestionAnswer = {
  question: string
  answer: string
}

export const EmailTemplate = ({
  emailTitle,
  emailBody,
  formTitle,
  responseId,
  outcome,
  formQuestionAnswers,
  paymentAmount,
  statusTrackerUrl,
  reviewUrl,
  paymentUrl,
  responseJson,
}: EmailData): JSX.Element => {
  const renderQuestionAnswer = (qa: QuestionAnswer) => (
    <>
      <Text style={{ ...primaryTextStyle, ...questionMargin }}>
        {qa.question}
      </Text>
      <Text style={{ ...secondaryTextStyle, ...answerMargin }}>
        {qa.answer}
      </Text>
    </>
  )

  const renderFallbackLink = (url: string) => (
    <>
      <Text style={{ ...secondaryTextStyle }}>
        If you are having trouble with the button above, copy and paste the link
        below into your browser:
      </Text>
      <Link href={url} style={{ ...linkStyle }}>
        {url}
      </Link>
    </>
  )

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
      <Preview>{emailTitle}</Preview>
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
            {/* Body Content */}
            <Text
              style={{
                ...secondaryTextStyle,
                marginBottom: '40px',
              }}
            >
              {emailBody?.split(/\r?\n/).map((line, i, arr) => (
                <React.Fragment key={i}>
                  {line}
                  {i < arr.length - 1 && <br />}
                </React.Fragment>
              ))}
            </Text>

            {/* Section - Form Title */}
            <Section style={cardSectionStyle}>
              <Text style={{ ...primaryTextStyle, ...questionMargin }}>
                Form title
              </Text>
              <Text style={{ ...secondaryTextStyle, ...answerMargin }}>
                {formTitle}
              </Text>
            </Section>
            {renderMargin(16)}
            {/* Section - Response ID */}
            <Section style={cardSectionStyle}>
              <Text style={{ ...primaryTextStyle, ...questionMargin }}>
                Response ID
              </Text>
              <Text style={{ ...secondaryTextStyle, ...answerMargin }}>
                {responseId}
              </Text>
            </Section>
            {renderMargin(16)}
            {/* Section - Outcome */}
            {outcome && (
              <>
                <Section style={cardSectionStyle}>
                  <Text style={{ ...primaryTextStyle, ...questionMargin }}>
                    Outcome
                  </Text>
                  <Text style={{ ...secondaryTextStyle, ...answerMargin }}>
                    {outcome}
                  </Text>
                </Section>
                {renderMargin(16)}
              </>
            )}
            {/* Section - Responses */}
            {formQuestionAnswers && (
              <>
                <Section style={cardSectionStyle}>
                  <>{formQuestionAnswers.map(renderQuestionAnswer)}</>
                </Section>
                {renderMargin(40)}
              </>
            )}
            {/* Section - Payment response */}
            {paymentAmount && (
              <>
                <Section style={cardSectionStyle}>
                  <Text style={{ ...primaryTextStyle, ...questionMargin }}>
                    Amount paid
                  </Text>
                  <Text style={{ ...secondaryTextStyle, ...answerMargin }}>
                    {`$${paymentAmount.toFixed(2)}`}
                  </Text>
                </Section>
              </>
            )}
            {/* Status tracker button*/}
            {statusTrackerUrl && (
              <Row>
                <Column>
                  <Container style={buttonContainerStyle}>
                    <a
                      href={statusTrackerUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={buttonInnerStyle}
                    >
                      Track your submission
                    </a>
                  </Container>
                  {renderFallbackLink(statusTrackerUrl)}
                </Column>
              </Row>
            )}
            {/* Review and complete button*/}
            {reviewUrl && (
              <Row>
                <Column>
                  <Container style={buttonContainerStyle}>
                    <a
                      href={reviewUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={buttonInnerStyle}
                    >
                      Click to review and complete
                    </a>
                  </Container>
                  {renderFallbackLink(reviewUrl)}
                </Column>
              </Row>
            )}

            {/* Payment button*/}
            {paymentUrl && (
              <Row>
                <Column>
                  <Container style={buttonContainerStyle}>
                    <a
                      href={paymentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={buttonInnerStyle}
                    >
                      View proof of payment
                    </a>
                  </Container>
                  {renderFallbackLink(paymentUrl)}
                </Column>
              </Row>
            )}

            {/* Email end */}
            <Text style={secondaryTextStyle}>
              For more details, please contact the respondent(s) or form
              administrator.
            </Text>

            {renderMargin(40)}

            {/* JSON Data Section */}
            {responseJson && (
              <>
                <p>-- Start of JSON --</p>
                <p>{responseJson}</p>
                <p>-- End of JSON --</p>
              </>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
