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
  containerStyle,
  headingTextStyle,
  mainStyle,
  primaryTextStyle,
  questionMargin,
  secondaryTextStyle,
  sectionStyle,
} from './emailStyles'
import { buttonContainerStyle, buttonInnerStyle, linkStyle } from './styles'

export type EmailData = {
  emailTitle: string
  emailBody: string
  formTitle: string
  responseId: string
  outcome?: WorkflowOutcome | undefined
  formQuestionAnswers: QuestionAnswer[]
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
  formTitle = 'Test form title',
  responseId = '64303c45828035f732088a41',
  emailBody = 'To whom it may concern,\n\nThank you for submitting this form.\n\nRegards,\n The FormSG team',
  formQuestionAnswers = [],
  outcome = WorkflowOutcome.APPROVED,
}: EmailData): JSX.Element => {
  const headingText = `${formTitle} has been completed by all respondents.`

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
      <Preview>{headingText}</Preview>
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
              {headingText}
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
                background: '#F8F9FD',
                borderRadius: '8px',
                marginBottom: '16px',
                paddingLeft: '16px',
                paddingRight: '16px',
              }}
            >
              <Column style={{ width: '50%', verticalAlign: 'top' }}>
                <Text style={{ ...primaryTextStyle, ...questionMargin }}>
                  Form title
                </Text>
                <Text style={{ ...secondaryTextStyle, ...answerMargin }}>
                  {formTitle}
                </Text>
              </Column>
              <Column style={{ width: '50%', verticalAlign: 'top' }}>
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
              <Section
                style={{
                  background: '#F8F9FD',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  paddingLeft: '16px',
                  paddingRight: '16px',
                }}
              >
                <Text style={{ ...primaryTextStyle, ...questionMargin }}>
                  Outcome
                </Text>
                <Text style={{ ...secondaryTextStyle, ...answerMargin }}>
                  {outcome}
                </Text>
              </Section>
            )}
            {/* Section - Responses */}
            <Section
              style={{
                background: '#F8F9FD',
                borderRadius: '8px',
                marginBottom: '16px',
                padding: '16px',
              }}
            >
              <Heading style={{ ...headingTextStyle, marginBottom: '24px' }}>
                Responses for {formTitle}
              </Heading>
              {formQuestionAnswers.map(renderQuestionAnswer)}
            </Section>
            {/* Section - Payment response */}
            <Section
              style={{
                background: '#F8F9FD',
                borderRadius: '8px',
                marginBottom: '24px',
                paddingLeft: '16px',
                paddingRight: '16px',
              }}
            >
              <Text style={{ ...primaryTextStyle, ...questionMargin }}>
                Amount paid
              </Text>
              <Text style={{ ...secondaryTextStyle, ...answerMargin }}>
                $0.50
              </Text>
            </Section>

            {/* Status tracker button*/}
            <Section style={{ ...buttonContainerStyle, marginBottom: '16px' }}>
              <a
                href={''}
                target="_blank"
                rel="noopener noreferrer"
                style={buttonInnerStyle}
              >
                Track your submission
              </a>
            </Section>
            {/* Review and complete button*/}
            <Section style={{ ...buttonContainerStyle, marginBottom: '16px' }}>
              <a
                href={''}
                target="_blank"
                rel="noopener noreferrer"
                style={buttonInnerStyle}
              >
                Click to review and complete
              </a>
            </Section>
            {/* Payment button*/}
            <Section style={{ ...buttonContainerStyle, marginBottom: '16px' }}>
              <a
                href={''}
                target="_blank"
                rel="noopener noreferrer"
                style={buttonInnerStyle}
              >
                View proof of payment
              </a>
            </Section>

            {/* Link helper + link */}
            <Text style={{ ...secondaryTextStyle }}>
              If you are having trouble with the button above, copy and paste
              the link below into your browser:
            </Text>
            <Link href={''} style={{ ...linkStyle }}>
              http://example.com/track-submission
            </Link>

            {/* Email end */}
            <Text style={{ ...secondaryTextStyle, marginTop: '24px' }}>
              For more details, please contact the respondent(s) or form
              administrator.
            </Text>
          </Section>
          {/* JSON */}
        </Container>
      </Body>
    </Html>
  )
}
