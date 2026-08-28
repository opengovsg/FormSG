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
  Column,
  Container,
  Link,
  Row,
  Section,
  Text,
} from '@react-email/components'
import { BasicField } from 'formsg-shared/types'
import React from 'react'

import { EmailLayout, EmailMargin, renderLines } from './EmailLayout'
import {
  answerMargin,
  buttonContainerStyle,
  buttonInnerStyle,
  cardSectionStyle,
  jsonTextStyle,
  linkStyle,
  outcomeTextStyle,
  primaryTextStyle,
  questionMargin,
  secondaryTextStyle,
} from './emailStyles'

export type EmailData = {
  emailTitle?: string
  emailBody?: string
  formTitle: string
  responseId: string
  timestamp?: string
  outcome?: WorkflowOutcome | undefined
  formQuestionAnswers?: QuestionAnswer[]
  paymentAmount?: string
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
  fieldType?: string
}

export const EmailTemplate = ({
  emailTitle,
  emailBody,
  formTitle,
  responseId,
  timestamp,
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
      {qa.fieldType === BasicField.Section ? (
        <Text style={{ ...outcomeTextStyle, ...questionMargin }}>
          {qa.question}
        </Text>
      ) : (
        <Text style={{ ...primaryTextStyle, ...questionMargin }}>
          {qa.question}
        </Text>
      )}
      <Text style={{ ...secondaryTextStyle, ...answerMargin }}>
        {renderLines(qa.answer)}
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

  const renderMargin = (height: number) => <EmailMargin height={height} />

  return (
    <EmailLayout
      emailTitle={emailTitle}
      belowContainer={
        responseJson && (
          <>
            <p style={jsonTextStyle}>-- Start of JSON --</p>
            <p style={jsonTextStyle}>{responseJson}</p>
            <p style={jsonTextStyle}>-- End of JSON --</p>
            {renderMargin(20)}
          </>
        )
      }
    >
      {/* Body Content */}
      <Text
        style={{
          ...secondaryTextStyle,
          marginBottom: '40px',
        }}
      >
        {emailBody === undefined ? undefined : renderLines(emailBody)}
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
        <>
          <Text style={{ ...primaryTextStyle, ...questionMargin }}>
            Response ID
          </Text>
          <Text style={{ ...secondaryTextStyle, ...answerMargin }}>
            {responseId}
          </Text>
          {timestamp && (
            <>
              <Text style={{ ...primaryTextStyle, ...questionMargin }}>
                Timestamp
              </Text>
              <Text style={{ ...secondaryTextStyle, ...answerMargin }}>
                {timestamp}
              </Text>
            </>
          )}
        </>
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
              {paymentAmount}
            </Text>
          </Section>
          {renderMargin(16)}
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
    </EmailLayout>
  )
}
