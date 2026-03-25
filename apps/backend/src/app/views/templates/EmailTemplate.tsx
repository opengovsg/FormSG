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
  Section,
  Text,
} from '@react-email/components'

import { FORMSG_LOGO_URL } from '../../constants/formsg-logo'

import {
  answerMargin,
  buttonContainerStyle,
  cardSectionStyle,
  containerStyle,
  halfWidthColumnStyle,
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
      <Head />
      <Preview>{emailTitle}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          <Section style={{ ...sectionStyle, backgroundColor: '#ffffff' }}>
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
            <Section style={cardSectionStyle}>
              <Column style={halfWidthColumnStyle}>
                <Text style={{ ...primaryTextStyle, ...questionMargin }}>
                  Form title
                </Text>
                <Text style={{ ...secondaryTextStyle, ...answerMargin }}>
                  {formTitle}
                </Text>
              </Column>
              <Column style={halfWidthColumnStyle}>
                <Text style={{ ...primaryTextStyle, ...questionMargin }}>
                  Response ID
                </Text>
                <Text style={{ ...secondaryTextStyle, ...answerMargin }}>
                  {responseId}
                </Text>
              </Column>
            </Section>
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
              <Heading
                style={{
                  ...headingTextStyle,
                  marginTop: '16px',
                  marginBottom: '24px',
                }}
              >
                Responses for {formTitle}
              </Heading>
              {formQuestionAnswers
                ? formQuestionAnswers.map(renderQuestionAnswer)
                : null}
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
                <Section
                  style={{ ...buttonContainerStyle, marginBottom: '16px' }}
                >
                  <a
                    href={statusTrackerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={buttonInnerStyle}
                  >
                    Track your submission
                  </a>
                </Section>
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
                <Section
                  style={{ ...buttonContainerStyle, marginBottom: '16px' }}
                >
                  <a
                    href={reviewUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={buttonInnerStyle}
                  >
                    Click to review and complete
                  </a>
                </Section>
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
                <Section
                  style={{ ...buttonContainerStyle, marginBottom: '16px' }}
                >
                  <a
                    href={paymentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={buttonInnerStyle}
                  >
                    View proof of payment
                  </a>
                </Section>
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
          </Section>
          {/* TODO: JSON */}
        </Container>
      </Body>
    </Html>
  )
}
