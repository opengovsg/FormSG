import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { FORMSG_LOGO_URL } from '../../constants/formsg-logo'

import {
  secondaryTextStyle,
  containerStyle,
  headingTextStyle,
  mainStyle,
  outcomeTextStyle,
  sectionStyle,
  primaryTextStyle,
  questionMargin,
  answerMargin,
} from './mrfWorkflowCompletionEmailStyle'

export enum WorkflowOutcome {
  APPROVED = 'Approved', 
  NOT_APPROVED = 'Not approved' 
}  

export type QuestionAnswer = {
  question: string, 
  answer: string 
}

export type WorkflowEmailData = {
  formTitle: string
  responseId: string
  formQuestionAnswers: QuestionAnswer[]
  outcome?: WorkflowOutcome | undefined 
  respondentCopy?: boolean | undefined
  statusTracker?: boolean | undefined
  formId?: string
}

export const MrfWorkflowCompletionEmail = ({
  formTitle = 'Test form title',
  responseId = '64303c45828035f732088a41', 
  formQuestionAnswers = [], 
  outcome,
  respondentCopy,
  statusTracker,
  formId,
}: WorkflowEmailData): JSX.Element => {
  let headingText =  
    outcome ? `The outcome for ${formTitle}.` : `${formTitle} has been completed by all respondents.`
  
  // if is respondent copy, replace header
  if (respondentCopy || statusTracker) {
    headingText = 'Thank you for submitting this form'
  }

  const responsesHeader = statusTracker && !respondentCopy ? `Track you response status for ${formTitle}` : `Responses for ${formTitle}`

  const renderQuestionAnswer = (qa: QuestionAnswer) => (
    <>
      <Text style={{...primaryTextStyle, ...questionMargin}}>{qa.question}</Text>
      <Text style={{...secondaryTextStyle, ...answerMargin}}>{qa.answer}</Text>
    </>
  )

  return (
    <Html>
      <Head /> 
      <Preview>{headingText}</Preview>
      <Body style={mainStyle}>
        <Container style={containerStyle}>
          <Section style={sectionStyle}>
            <Img style={{ height: '24px', marginBottom: '40px' }} src={FORMSG_LOGO_URL} alt="FormSG" />
            <Heading style={{ ...headingTextStyle, marginBottom: '40px' }}>
              {headingText}
            </Heading>
            {outcome && (
              <>
                <Text style={{ ...outcomeTextStyle, ...questionMargin }}>Outcome</Text>
                <Text style={{ ...outcomeTextStyle, fontWeight: 400, ...answerMargin }}>{outcome}</Text>
              </>
            )}
            <Hr style={{ margin: '40px 0' }} />
            <Section style={{ marginBottom: '40px' }}>
              <Heading style={{ ...headingTextStyle}}>
                {responsesHeader}
              </Heading>
              {statusTracker ? (
                // update this to match all envs
                <Link href={`${window.location.origin}/${formId}/status/${responseId}`} style={{
                  textDecoration: 'underline',
                  color: "blue.500",
                }}> 
                You can check the status of your response at the link here
                </Link>
              ) : null}
            </Section>
            {respondentCopy === false ? null : (
              <>
                <Text style={{ ...primaryTextStyle, ...questionMargin }}>Response ID</Text>
                <Text style={{ ...secondaryTextStyle, ...answerMargin }}>{responseId}</Text>
                {formQuestionAnswers.map(renderQuestionAnswer)}
              </>
              )}
            <Text style={{ ...secondaryTextStyle, marginTop: '24px' }}>
              For more details, please contact the respondent(s) or form administrator.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default MrfWorkflowCompletionEmail
