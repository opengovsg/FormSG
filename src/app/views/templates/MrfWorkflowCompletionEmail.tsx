import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
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
} from './styles'

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
}

export const MrfWorkflowCompletionEmail = ({
  formTitle = 'Test form title',
  responseId = '64303c45828035f732088a41', 
  formQuestionAnswers = [], 
  outcome
}: WorkflowEmailData): JSX.Element => {
  const headingText =  
    outcome ? `The outcome for ${formTitle}` : `${formTitle} has been completed by all respondents.`

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
              <Img style={{height: '24px', marginBottom: '40px'}} src={FORMSG_LOGO_URL} alt="FormSG" />
              <Heading style={{...headingTextStyle, marginBottom: '40px'}}>
                {headingText}
              </Heading>
              {outcome && (
                <>
                  <Text style={{...outcomeTextStyle, ...questionMargin}}>Outcome</Text>
                  <Text style={{...outcomeTextStyle, fontWeight: 400, ...answerMargin}}>{outcome}</Text>
                </>
              )}
              <Hr style={{margin: '40px 0'}}/>
              <Heading style={{...headingTextStyle, marginBottom: '40px'}}>
                Responses for {formTitle} 
              </Heading>
              <Text style={{...primaryTextStyle, ...questionMargin}}>Response ID</Text>
              <Text style={{...secondaryTextStyle, ...answerMargin}}>{responseId}</Text>
              {formQuestionAnswers.map(renderQuestionAnswer)}
              <Text style={{...secondaryTextStyle, marginTop: '24px'}}> 
                For more details, please contact the respondent(s) or form administrator. 
              </Text>
            </Section> 
          </Container>
      </Body>
    </Html>
  )
}

export default MrfWorkflowCompletionEmail
