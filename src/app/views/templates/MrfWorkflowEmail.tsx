import {
  Body,
  Button,
  Column,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Row,
  Text,
} from '@react-email/components'
import { FORMSG_LOGO_URL } from '../../constants/formsg-logo'

import {
  buttonContainerStyle,
  buttonInnerStyle,
  headingStyle,
  innerContainerStyle,
  linkStyle,
  outerContainerStyle,
  textStyle,
} from './styles'

export type WorkflowEmailData = {
  formTitle: string
  responseId: string
  responseUrl: string
}

export const MrfWorkflowEmail = ({
  formTitle = 'Test form title',
  responseId = '64303c45828035f732088a41',
  responseUrl = 'https://form.gov.sg/6b8391fe9810da639463b61c/edit/6481ae09183785bf30b2d5ca?key=Qks08afjek3leF8d83j2nCd902rf=',
}: WorkflowEmailData): JSX.Element => {
  return (
    <Html>
      <Head />
      <Body style={outerContainerStyle}>
        <Container style={innerContainerStyle}>
          <Row>
            <Column>
              <Img src={FORMSG_LOGO_URL} alt="FormSG" />
            </Column>
          </Row>
          <Row style={{ paddingTop: '16px' }}>
            <Column>
              <Heading style={headingStyle}>
                Review and complete your part of {formTitle}.
              </Heading>
            </Column>
          </Row>
          <Row style={{ paddingTop: '16px' }}>
            <Column>
              <Text style={textStyle}>Response ID</Text>
            </Column>
            <Column style={textStyle}>
              <Text>{responseId}</Text>
            </Column>
          </Row>
          <Row style={{ paddingTop: '16px' }}>
            <Column>
              <Container style={buttonContainerStyle}>
                <a href={responseUrl} target="_blank" style={buttonInnerStyle}>
                  Click to review and complete
                </a>
              </Container>
            </Column>
          </Row>
          <Row style={{ paddingTop: '32px' }}>
            <Column>
              <Hr />
            </Column>
          </Row>
          <Row>
            <Column>
              <Text style={{ ...textStyle, fontSize: '14px' }}>
                If you are having trouble with the button above, copy and paste
                the link below into your browser:
              </Text>
            </Column>
          </Row>
          <Row>
            <Column>
              <Link
                href={responseUrl}
                style={{ ...linkStyle, fontSize: '14px' }}
              >
                {responseUrl}
              </Link>
            </Column>
          </Row>
        </Container>
      </Body>
    </Html>
  )
}

export default MrfWorkflowEmail
