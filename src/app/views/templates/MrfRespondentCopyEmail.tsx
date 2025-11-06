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
  sectionStyle,
  primaryTextStyle,
  questionMargin,
  answerMargin,
} from './mrfWorkflowCompletionEmailStyle'

export type QuestionAnswer = {
  question: string
  answer: string
}

export type RespondentCopyEmilData = {
    formTitle: string
    responseId: string
    formQuestionAnswers?: QuestionAnswer[]
    body: string
}

export const MrfRespondentCopyEmail = ({
    formTitle,
    responseId,
    formQuestionAnswers,
    body,
}: RespondentCopyEmilData): JSX.Element => {
    let headingText = 'Thank you for submitting this form'
  
    const renderQuestionAnswer = (qa: QuestionAnswer) => (
        <>
          <Text style={{ ...primaryTextStyle, ...questionMargin }}>{qa.question}</Text>
          <Text style={{ ...secondaryTextStyle, ...answerMargin }}>{qa.answer}</Text>
        </>
    )

    const renderResponseId = () => (
        <>
          <Text style={{ ...secondaryTextStyle, marginBottom: '40px' }}>{'---'}</Text>
          <Text style={{ ...primaryTextStyle, ...questionMargin }}>Response ID</Text>
          <Text style={{ ...secondaryTextStyle,  marginBottom: '40px' }}>{responseId}</Text>
          <Text style={{ ...secondaryTextStyle, marginBottom: '40px' }}>{'---'}</Text>
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
            <Text style={{ ...secondaryTextStyle, marginBottom: '40px', whiteSpace: 'pre-line' }}>
              {body}
            </Text>
            {renderResponseId()}
              {formQuestionAnswers ? (
                <>
                  <Text style={{ ...primaryTextStyle, ...answerMargin }}>Responses for {formTitle}</Text>
                  <>
                    {formQuestionAnswers.map(renderQuestionAnswer)}
                  </>
              </>
            ) : null}
            <Text style={{ ...secondaryTextStyle, marginTop: '24px' }}>
              For more details, please contact the respondent(s) or form administrator.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>        
    )
}