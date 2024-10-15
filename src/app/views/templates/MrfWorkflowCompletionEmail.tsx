import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Section,
  Text,
} from '@react-email/components'
import { FORMSG_LOGO_URL } from '../../constants/formsg-logo'

import {
  bodyTextStyle,
  containerStyle,
  headingTextStyle,
  mainStyle,
  outcomeTextStyle,
  sectionStyle,
  titleTextStyle,
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
  // Defaults are provided only for testing purposes in react-email-preview.
  formTitle = 'Test form title',
  responseId = '64303c45828035f732088a41', 
  formQuestionAnswers = [], 
  outcome
}: WorkflowEmailData): JSX.Element => {
  return (
    <Html>
      <Head /> 
      <Body style={mainStyle}>
          <Container style={containerStyle}>
            <Section style={sectionStyle}>
              <Img style={{height: '1.5rem', marginBottom: '2.5rem'}} src={FORMSG_LOGO_URL} alt="FormSG" />
              <Heading style={headingTextStyle}>
                {
                  outcome 
                    ? `The outcome for ${formTitle}` 
                    : `${formTitle} has been completed by all respondents.` 
                }
              </Heading>
              {
                outcome ? <>
                  <Text style={{...outcomeTextStyle, marginTop: '2.5rem', marginBottom: '0.25rem'}}>Outcome</Text>
                  <Text style={{...outcomeTextStyle, fontWeight: 400, marginTop: '0.25rem', color: '#474747'}}>{outcome}</Text>
                </> : null 
              }
              <Hr style={{marginTop: '2.5rem', marginBottom: '2.5rem'}}/>
              <Heading style={{...headingTextStyle, marginBottom: '2.5rem'}}>
                Responses for {formTitle} 
              </Heading>
              <Text style={{...titleTextStyle, marginBottom: '0.25rem'}}>Response ID</Text>
              <Text style={{...bodyTextStyle, marginTop: '0.25rem'}}>{responseId}</Text>
              { 
                formQuestionAnswers.map((qa) => {
                return <>
                  <Text style={{...titleTextStyle, marginBottom: '0.25rem'}}>{qa.question}</Text>
                  <Text style={{...bodyTextStyle, marginTop: '0.25rem'}}>{qa.answer}</Text>
                </>})
              }
              <Text style={{...bodyTextStyle, paddingTop: '2.5rem'}}> 
                For more details, please contact the respondent(s) or form administrator. 
              </Text>
            </Section> 
          </Container>
      </Body>
    </Html>
  )
}

export default MrfWorkflowCompletionEmail
