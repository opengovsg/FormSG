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

import { FORMSG_LOGO_URL } from '../../constants/formsg-logo'

import {
  answerMargin,
  cardSectionColumnStyle,
  cardSectionStyle,
  containerStyle,
  headingTextStyle,
  mainStyle,
  primaryTextStyle,
  questionMargin,
  secondaryTextStyle,
  sectionStyle,
} from './emailStyles'
import { buttonInnerStyle, linkStyle } from './styles'

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
  // const headingText = `${formTitle} has been completed by all respondents.`

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

  return (
    <Html>
      <Head>
        <style>{`
          @media only screen and (max-width: 600px) {
            .field-container {
              display: block !important;
              width: 100% !important;
              padding: 16px !important;
              margin-bottom: 16px !important;
            }
            .spacer-column {
              display: none !important;
              width: 0 !important;
            }
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
          <Section
            className="email-section"
            style={{ ...sectionStyle, backgroundColor: '#ffffff' }}
          >
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
                marginTop: '40px',
                whiteSpace: 'pre-line',
              }}
            >
              {emailBody}
            </Text>

            {/* Section - Form Name & ResponseID */}
            <Row
              style={{
                marginBottom: '16px',
                width: '100%',
                tableLayout: 'fixed',
              }}
            >
              <Column
                className="field-container"
                style={cardSectionColumnStyle}
              >
                <Text style={{ ...primaryTextStyle, ...questionMargin }}>
                  Form title
                </Text>
                <Text style={{ ...secondaryTextStyle, ...answerMargin }}>
                  {formTitle}
                </Text>
              </Column>
              <Column
                style={{ width: '16px' }}
                className="spacer-column"
              ></Column>
              <Column
                className="field-container"
                style={cardSectionColumnStyle}
              >
                <Text style={{ ...primaryTextStyle, ...questionMargin }}>
                  Response ID
                </Text>
                <Text style={{ ...secondaryTextStyle, ...answerMargin }}>
                  {responseId}
                </Text>
              </Column>
            </Row>
            {/* Section - Outcome */}
            {outcome && (
              <Section style={cardSectionStyle}>
                <Text style={{ ...primaryTextStyle, ...questionMargin }}>
                  Outcome
                </Text>
                <Text style={{ ...secondaryTextStyle, ...answerMargin }}>
                  {outcome}
                </Text>
              </Section>
            )}
            {/* Section - Responses */}
            <Section style={cardSectionStyle}>
              <>
                {formQuestionAnswers
                  ? formQuestionAnswers.map(renderQuestionAnswer)
                  : null}
              </>
            </Section>
            {/* Section - Payment response */}
            {paymentAmount ? (
              <Section style={cardSectionStyle}>
                <Text style={{ ...primaryTextStyle, ...questionMargin }}>
                  Amount paid
                </Text>
                <Text style={{ ...secondaryTextStyle, ...answerMargin }}>
                  $0.50
                </Text>
              </Section>
            ) : null}
            {/* Status tracker button*/}
            {statusTrackerUrl ? (
              <>
                <a
                  href={statusTrackerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    ...buttonInnerStyle,
                    marginBottom: '16px',
                  }}
                >
                  Track your submission
                </a>
                <Text style={{ ...secondaryTextStyle }}>
                  If you are having trouble with the button above, copy and
                  paste the link below into your browser:
                </Text>
                <Link href={statusTrackerUrl} style={{ ...linkStyle }}>
                  {statusTrackerUrl}
                </Link>
              </>
            ) : null}
            {/* Review and complete button*/}
            {reviewUrl ? (
              <>
                <a
                  href={reviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    ...buttonInnerStyle,
                    marginBottom: '16px',
                  }}
                >
                  Click to review and complete
                </a>
                <Text style={{ ...secondaryTextStyle }}>
                  If you are having trouble with the button above, copy and
                  paste the link below into your browser:
                </Text>
                <Link href={reviewUrl} style={{ ...linkStyle }}>
                  {reviewUrl}
                </Link>
              </>
            ) : null}

            {/* Payment button*/}
            {paymentUrl ? (
              <>
                <a
                  href={paymentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    ...buttonInnerStyle,
                    marginBottom: '16px',
                  }}
                >
                  View proof of payment
                </a>
                <Text style={{ ...secondaryTextStyle }}>
                  If you are having trouble with the button above, copy and
                  paste the link below into your browser:
                </Text>
                <Link href={paymentUrl} style={{ ...linkStyle }}>
                  {paymentUrl}
                </Link>
              </>
            ) : null}

            {/* Email end */}
            <Text style={{ ...secondaryTextStyle, marginTop: '24px' }}>
              For more details, please contact the respondent(s) or form
              administrator.
            </Text>

            {/* JSON Data Section */}
            {responseJson && (
              <Section style={{ marginTop: '40px' }}>
                <Text style={{ ...secondaryTextStyle, marginBottom: '8px' }}>
                  -- Start of JSON --
                </Text>
                <Text>{responseJson}</Text>
                <Text style={{ ...secondaryTextStyle, marginTop: '8px' }}>
                  -- End of JSON --
                </Text>
              </Section>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  )
}
