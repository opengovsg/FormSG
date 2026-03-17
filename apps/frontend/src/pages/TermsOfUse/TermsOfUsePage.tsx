import { useMemo } from 'react'
import {
  Box,
  Container,
  Flex,
  ListItem,
  ListItemProps,
  ListProps,
  OrderedList,
  Stack,
  Text,
} from '@chakra-ui/react'

import { AppFooter } from '~/app/AppFooter'
import { AppPublicHeader } from '~/app/AppPublicHeader'

import { FCC } from '~typings/react'

import { OSS_README } from '~constants/links'
import Link from '~components/Link'

interface listItemMarkerProps {
  prependSequenceMarker?: string
  isNumericMarker?: boolean
  isRomanMarker?: boolean
  sequenceMarkerOverride?: string
}

const SectionListItem: FCC<ListItemProps> = ({
  children,
  listStyleType = 'decimal',
}) => (
  <ListItem
    fontWeight={600}
    textStyle="h3"
    pl="1rem"
    listStyleType={listStyleType}
  >
    {children}
  </ListItem>
)

export const SubSectionOrderedList: FCC<ListProps> = ({
  children,
  ...props
}) => (
  <OrderedList
    spacing="1.5rem"
    marginInlineStart={0}
    sx={{ counterReset: 'section' }}
    {...props}
  >
    {children}
  </OrderedList>
)

export const SubSubSectionOrderedList: FCC<ListProps> = ({
  children,
  ...props
}) => (
  <SubSectionOrderedList marginInlineStart={0} {...props}>
    {children}
  </SubSectionOrderedList>
)

export const SubSectionListItem: FCC<ListItemProps & listItemMarkerProps> = ({
  children,
  prependSequenceMarker,
  sequenceMarkerOverride,
  isNumericMarker,
  isRomanMarker,
  ...props
}) => {
  const markerType = isNumericMarker
    ? 'numeric'
    : isRomanMarker
      ? 'lower-roman'
      : 'lower-alpha'
  const sequenceMarker = useMemo(() => {
    return `"${
      prependSequenceMarker ? prependSequenceMarker : '('
    }"counters(section, ".", ${markerType})"${
      prependSequenceMarker ? ' ' : ') '
    }"`
  }, [markerType, prependSequenceMarker])

  return (
    // this might seem a bit messy, but what this is doing
    // is allowing each list to have its own internal
    // counter. _before is the psuedo  css selector and content
    // is basically logic determining how the marker is displayed.
    // refer to https://developer.mozilla.org/en-US/docs/Web/CSS/counter
    // and https://developer.mozilla.org/en-US/docs/Web/CSS/counters
    // and https://developer.mozilla.org/en-US/docs/Web/CSS/CSS_Counter_Styles/Using_CSS_counters
    <ListItem
      textStyle="body-1"
      display="table"
      _before={{
        minWidth: '3rem',
        counterIncrement: 'section',
        content: sequenceMarkerOverride || sequenceMarker,
        display: 'table-cell',
        paddingRight: '0.5rem',
      }}
      listStyleType="none"
      {...props}
    >
      {children}
    </ListItem>
  )
}

const SectionTitle: FCC = ({ children }) => <Text mb="1.5rem">{children}</Text>

export const TermsOfUsePage = (): JSX.Element => {
  return (
    <Flex flexDir="column" bg="primary.100">
      <AppPublicHeader />
      <Container color="secondary.700" maxW="85ch" px="2rem" pb="5rem" flex={1}>
        <Stack spacing="5rem">
          <Box as="section">
            <Text textStyle="h1" as="h1" mb="2.5rem">
              Terms of Use
            </Text>
            <OrderedList spacing="1.5rem" marginInlineStart="1.5rem">
              <SectionListItem>
                <SectionTitle>General</SectionTitle>
                <SubSectionOrderedList>
                  <SubSectionListItem
                    prependSequenceMarker="1."
                    isNumericMarker
                  >
                    These Terms of Use govern your access to and use of our
                    services, including the application (whether as software or
                    as a website or otherwise), its contents (including APIs, if
                    any), push notifications and all other accompanying
                    materials as identified in the Schedule below (collectively,
                    the "<b>Service</b>”).
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="1."
                    isNumericMarker
                  >
                    This Service is provided to you by the Government Technology
                    Agency ("<b>GovTech</b>"). GovTech's office is located at 10
                    Pasir Panjang Road, #10-01, Mapletree Business City,
                    Singapore 117438.
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="1."
                    isNumericMarker
                  >
                    <Text>
                      By accessing or using any part of this Service, you
                      unconditionally agree and accept to be legally bound by
                      these Terms of Use and any amendments thereto from time to
                      time.{' '}
                      <b>
                        GovTech reserves the right to amend these Terms of Use
                        at its sole discretion and at any time, with or without
                        notice to you. Please read the Terms of Use carefully
                        each time you access or use any part of this Service as
                        (without prejudice to any other means your agreement to
                        the Terms of Use as amended may manifest) such access or
                        use shall constitute your agreement to the Terms of Use
                        and any amendments to it. Your failure to do so shall
                        not prejudice the effect or enforceability of the Terms
                        of Use or any amendments thereto.
                      </b>{' '}
                      GovTech may, at its sole discretion and without prejudice
                      to its other rights under this Clause 1.3, also amend
                      these Terms of Use by providing you with notice effective
                      immediately or such other time designated by GovTech, and
                      such notice may be provided by any means GovTech deems
                      appropriate (for example, by posting the notice through
                      the Service, any website related to the Service, or by
                      email).
                    </Text>
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="1."
                    isNumericMarker
                  >
                    <b>
                      If you do not agree to these Terms of Use, please do not
                      use this Service or any part of this Service.
                    </b>
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="1."
                    isNumericMarker
                  >
                    If you are accessing or using the Service for and on behalf
                    of another entity (such as your employer), you warrant and
                    represent that you have the necessary authority to bind such
                    entity to these Terms of Use.
                  </SubSectionListItem>
                </SubSectionOrderedList>
              </SectionListItem>
              <SectionListItem>
                <SectionTitle>Nature of this Service</SectionTitle>
                <Text textStyle="body-1">
                  Please see the Schedule for more information and terms
                  concerning this Service.
                </Text>
              </SectionListItem>
              <SectionListItem>
                <SectionTitle>Licence Terms and Restrictions</SectionTitle>
                <SubSectionOrderedList>
                  <SubSectionListItem
                    prependSequenceMarker="3."
                    isNumericMarker
                  >
                    The Service, including the materials made available on or
                    through the Service, is owned by, licensed to, managed or
                    controlled by GovTech. Please see clause 4 (Third Party
                    Materials) for more information.
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="3."
                    isNumericMarker
                  >
                    Subject to these Terms of Use, GovTech grants to you a
                    non-exclusive, revocable, and non-transferable right to
                    access and use the Service for personal or internal purposes
                    only, and only for such use permitted by the functions of
                    the Service and intended by GovTech.
                  </SubSectionListItem>
                  <SubSectionListItem
                    sequenceMarkerOverride={`"3.2A"`}
                    isNumericMarker
                    sx={{ counterSet: 'section' }}
                  >
                    You shall not, and shall not authorise or permit any third
                    party to:
                    <SubSubSectionOrderedList sx={{ counterSet: 'section' }}>
                      <SubSectionListItem
                        prependSequenceMarker="3.2A."
                        mt="1.5rem"
                        isNumericMarker
                      >
                        bypass or circumvent any technical restrictions or
                        digital protection measures in the Service or attempt to
                        circumvent any such restrictions;
                      </SubSectionListItem>
                      <SubSectionListItem
                        prependSequenceMarker="3.2A."
                        isNumericMarker
                      >
                        reverse engineer, decompile, disassemble, modify,
                        translate, adapt or create derivative works of the
                        Service (whether in relation to its source code, object
                        code, underlying structure, ideas, algorithms or
                        otherwise);
                      </SubSectionListItem>
                      <SubSectionListItem
                        prependSequenceMarker="3.2A."
                        isNumericMarker
                      >
                        reproduce, publish, distribute, transfer, publicly
                        display, resell, rent, lease, or sublicense the Service,
                        or loan, lend, pledge, assign, or otherwise encumber the
                        Service to or in favour of any third party;
                      </SubSectionListItem>
                      <SubSectionListItem
                        prependSequenceMarker="3.2A."
                        isNumericMarker
                      >
                        remove or obscure the copyright, trademark and other
                        proprietary notices contained on or in the Service;
                      </SubSectionListItem>
                      <SubSectionListItem
                        prependSequenceMarker="3.2A."
                        isNumericMarker
                      >
                        use the Service in any manner that is contrary to any
                        applicable laws or regulations or rights of third
                        parties (however arising and of whatever nature), or in
                        a manner that constitutes harmful, fraudulent, or
                        obscene activity;
                      </SubSectionListItem>
                      <SubSectionListItem
                        prependSequenceMarker="3.2A."
                        isNumericMarker
                      >
                        make the Service available in or through a network,
                        file-sharing service, service bureau or any similar
                        timesharing arrangement or as a managed service
                        provider;
                      </SubSectionListItem>
                      <SubSectionListItem
                        prependSequenceMarker="3.2A."
                        isNumericMarker
                      >
                        perform any benchmarking tests or analyses of the
                        Service;
                      </SubSectionListItem>
                      <SubSectionListItem
                        prependSequenceMarker="3.2A."
                        isNumericMarker
                      >
                        use the Service to create anything that would compete
                        with the Service;
                      </SubSectionListItem>
                      <SubSectionListItem
                        prependSequenceMarker="3.2A."
                        isNumericMarker
                      >
                        transfer, assign or permit the sharing of license keys
                        to or with a third party;
                      </SubSectionListItem>
                      <SubSectionListItem
                        prependSequenceMarker="3.2A."
                        isNumericMarker
                      >
                        use the Service to process or permit to be processed any
                        code of a third party;
                      </SubSectionListItem>
                      <SubSectionListItem
                        prependSequenceMarker="3.2A."
                        isNumericMarker
                      >
                        provide third party access to the Service; or
                      </SubSectionListItem>
                      <SubSectionListItem
                        prependSequenceMarker="3.2A."
                        isNumericMarker
                      >
                        export the Service in violation of any international
                        sanctions or laws applicable to US entities.
                      </SubSectionListItem>
                    </SubSubSectionOrderedList>
                  </SubSectionListItem>
                  <SubSectionListItem
                    sequenceMarkerOverride={`"3.2B"`}
                    isNumericMarker
                    sx={{ counterSet: 'section' }}
                  >
                    All express or implied rights to the Service not
                    specifically granted herein are expressly reserved to
                    GovTech.
                  </SubSectionListItem>
                  <SubSectionListItem
                    sx={{ counterSet: 'section 2' }}
                    prependSequenceMarker="3."
                    isNumericMarker
                  >
                    GovTech reserves the right to:
                    <SubSectionOrderedList>
                      <SubSectionListItem
                        prependSequenceMarker="3."
                        isNumericMarker
                        mt="1.5rem"
                      >
                        Update or modify this Service from time to time;
                      </SubSectionListItem>
                      <SubSectionListItem
                        prependSequenceMarker="3."
                        isNumericMarker
                      >
                        Deny or restrict access to or use of the Service by any
                        particular person without ascribing any reasons
                        whatsoever; and
                      </SubSectionListItem>
                      <SubSectionListItem
                        prependSequenceMarker="3."
                        isNumericMarker
                      >
                        Discontinue or terminate this Service at any time
                        without notice or liability to you whatsoever, whereupon
                        all rights granted to you hereunder shall also terminate
                        forthwith. You shall further upon notice from GovTech
                        return or destroy all copies of the Service or materials
                        therein that you may have been provided with.
                      </SubSectionListItem>
                    </SubSectionOrderedList>
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="3."
                    isNumericMarker
                  >
                    You will not interfere or attempt to interfere with the
                    proper working of the Service or otherwise do anything that
                    imposes an unreasonable or disproportionately large load on
                    GovTech's servers.
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="3."
                    isNumericMarker
                  >
                    You shall comply with all set-up procedures and
                    requirements, as well as all policies, guidelines, rules,
                    notices and instructions relating to the Service as may be
                    issued by and/or amended by GovTech from time to time.
                  </SubSectionListItem>
                </SubSectionOrderedList>
              </SectionListItem>
              <SectionListItem listStyleType="'3A. '">
                <SectionTitle>Account Access and Security</SectionTitle>
                <SubSectionOrderedList>
                  <SubSectionListItem
                    prependSequenceMarker="3A."
                    isNumericMarker
                  >
                    You are solely responsible for maintaining the
                    confidentiality and security of any authentication
                    credentials associated with your use of the Service,
                    including the security of any of your devices which store
                    the authentication credentials.
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="3A."
                    isNumericMarker
                  >
                    GovTech shall be entitled, but not obliged, to verify the
                    identity of the person using the Service. Without prejudice
                    to the foregoing, GovTech is not under any duty to verify
                    that any biometric identifier used with the Service, or on
                    your device, belongs to you.
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="3A."
                    isNumericMarker
                  >
                    GovTech shall have the sole and absolute discretion to
                    invalidate any authentication credentials at any time, or
                    require you to have to re-authenticate or refresh your
                    authentication credentials at any time, without having to
                    give any reason for the same.
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="3A."
                    isNumericMarker
                  >
                    GovTech shall be entitled, but not obliged, to act upon or
                    rely on any instructions, information, transmissions of
                    data, or communications received from the account or use of
                    the Service in relation to your authentication credentials,
                    as if such instructions, information, data or communications
                    were issued by you, whether or not the same was authorized
                    by you.
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="3A."
                    isNumericMarker
                  >
                    For the avoidance of doubt, you are solely responsible for
                    any loss of whatever nature arising from unauthorized or
                    unofficial modifications made to your device which permit or
                    escalate privileged access, or remove restrictions to such
                    access, which are not intended by the manufacturer or
                    provider of your device or operating system of your device
                    (e.g., "rooting" or "jailbreaking" your mobile phone).
                  </SubSectionListItem>
                </SubSectionOrderedList>
              </SectionListItem>
              <SectionListItem listStyleType="'4. '">
                <SectionTitle>Third Party Materials</SectionTitle>
                <SubSectionOrderedList>
                  <SubSectionListItem
                    prependSequenceMarker="4."
                    isNumericMarker
                  >
                    The Service may require, enable or facilitate access to or
                    use of software or services of a third party (“
                    <b>Third Party</b>”). In such an event, there may be terms
                    of use of the third party software or service (the “
                    <b>Third Party Terms</b>”). GovTech may be required under or
                    as a result of the Third Party Terms to notify you of
                    certain terms that apply to you (either directly as an end
                    user, or as a party whose acts or omissions could cause
                    GovTech to breach the Third Party Terms) when you use the
                    Services. An example of Third Party Terms may be open source
                    software terms or standard form terms of the distribution
                    platform from which you obtain any part of the Service (e.g.
                    Google Play Store or Apple App Store terms) which bind
                    GovTech as a developer or user of the distribution platform
                    (the “<b>Distribution Terms</b>”). Information on the Third
                    Party Terms are embedded in the Service, already accounted
                    for in these Terms of Use, publicly available (e.g the
                    Distribution Terms) or otherwise indicated in the Schedule
                    herein. For the avoidance of doubt, insofar as this Clause 4
                    relates to the Distribution Terms, the relevant Distribution
                    Terms are the terms of the specific platform from which you
                    obtained a copy of the software or application that is part
                    of the Service. For example, if you obtained the said copy
                    from the Google Play Store, then the relevant terms are
                    Google's Distribution Terms.
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="4."
                    isNumericMarker
                  >
                    <b>
                      It is your responsibility to check and read the most
                      up-to-date versions of these Third Party Terms and you are
                      deemed to have notice of the same.{' '}
                    </b>
                    In particular, you are deemed to have notice of the Third
                    Party Terms that GovTech (under the Third Party Terms) is
                    required to notify you, and you unconditionally agree to be
                    bound by all the obligations in the Third Party Terms which
                    are applicable to you (whether as end user, or as a party
                    whose acts or omissions could cause GovTech to breach the
                    Third Party Terms, or otherwise). For the avoidance of
                    doubt, where Third Party Terms are listed, such Third Party
                    Terms shall be deemed to include any privacy policies and
                    acceptable use policies as are applicable to you.
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="4."
                    isNumericMarker
                  >
                    If the Third Party Terms require you to enter into an
                    agreement directly with the Third Party, then you
                    unconditionally agree to enter into such agreement, and in
                    any event, to be legally bound by the Third Party Terms. For
                    the avoidance of doubt:
                    <SubSubSectionOrderedList mt="1.5rem">
                      <SubSectionListItem
                        prependSequenceMarker="4."
                        isNumericMarker
                      >
                        some Third Party Terms (particularly open-source terms)
                        permit either a direct licence to you from the Third
                        Party or a sublicence from GovTech to you. In such
                        cases, your licence is a direct licence from the Third
                        Party to you; and
                      </SubSectionListItem>
                      <SubSectionListItem
                        prependSequenceMarker="4."
                        isNumericMarker
                      >
                        the terms of your agreement with the Third Party will
                        govern your use of the relevant third party software or
                        service, and not these Terms of Use.
                      </SubSectionListItem>
                    </SubSubSectionOrderedList>
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="4."
                    isNumericMarker
                  >
                    If the Third Party Terms expressly or impliedly require
                    GovTech to incorporate certain terms in these Terms of Use
                    (inclusive of terms which impose any minimum or maximum
                    standards herein, and/or terms described in Clause 4.5
                    below), such terms are deemed to have been so incorporated
                    (the "<b>Incorporated Terms</b>"). Examples of Incorporated
                    Terms include provisions which require GovTech to give you
                    notice of certain rights and liabilities or require GovTech
                    to ensure that you acknowledge certain matters. Similarly,
                    if the Third Party Terms expressly or impliedly require
                    these Terms of Use to be altered such that the Third Party
                    Terms are complied with, the parties herein agree that the
                    Terms of Use shall be deemed to be so altered but only to
                    the extent necessary for compliance.
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="4."
                    isNumericMarker
                  >
                    Some Third Party Terms grant the Third Party, or require
                    GovTech to grant the Third Party, direct rights of
                    enforcement of these Terms of Use as a third party
                    beneficiary, against you. Such Third Party Terms are deemed
                    to have been incorporated into these Terms of Use as
                    Incorporated Terms, and you hereby agree to grant such Third
                    Party, such direct rights of enforcement against you.
                  </SubSectionListItem>
                  <SubSectionListItem
                    sequenceMarkerOverride={`"4.5A"`}
                    isNumericMarker
                  >
                    Unless the applicable Third Party Terms permit you to
                    commence legal proceedings against the relevant Third Party,
                    you shall not threaten or commence legal proceedings against
                    a Third Party without GovTech's prior written approval.
                  </SubSectionListItem>
                  <SubSectionListItem
                    sx={{ counterSet: 'section 5' }}
                    prependSequenceMarker="4."
                    isNumericMarker
                  >
                    For the avoidance of doubt, without prejudice to Clause 4.4,
                    to the extent of any inconsistency between these Terms of
                    Use and the Third Party Terms, the latter shall prevail
                    provided nothing in the Third Party Terms increases the
                    liability of GovTech beyond that stated in Clause 6.
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="4."
                    isNumericMarker
                  >
                    Without prejudice and in addition to the foregoing, GovTech
                    shall not be responsible for your use of any software or
                    service of a Third Party.
                  </SubSectionListItem>
                </SubSectionOrderedList>
              </SectionListItem>
              <SectionListItem listStyleType="'5. '">
                <SectionTitle>
                  Your Consent to Your Data and to Access Functions of Your
                  Device
                </SectionTitle>
                <SubSectionOrderedList>
                  <SubSectionListItem
                    prependSequenceMarker="5."
                    isNumericMarker
                    mt="1.5rem"
                  >
                    You hereby grant to GovTech a non-exclusive, worldwide,
                    perpetual and royalty-free right to collect, use, disclose,
                    process, modify, adapt, create derivative works of,
                    reproduce, and sublicense any and all information or data
                    submitted, uploaded or shared by you to the extent necessary
                    to provide the Service or for any other purpose expressly or
                    impliedly provided in these Terms of Use, or as permitted by
                    law.
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="5."
                    isNumericMarker
                  >
                    Use of the Service may require you to allow access by the
                    Service to certain functions of your device, such as push
                    notifications, the obtaining and/or sharing of your
                    location, or the collection of data from you in connection
                    with the Service. Your use of the Service shall constitute
                    your consent to the access by the Service of such functions
                    of your device as may be reasonably required by the Service.
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="5."
                    isNumericMarker
                  >
                    You further irrevocably and unconditionally waive, and shall
                    cause to be irrevocably and unconditionally waived, all
                    existing and future moral rights (including the right of
                    identification) wherever in the world in respect of any
                    information or data submitted, uploaded or shared by you
                    (including feedback, requests or suggestions concerning the
                    Services) to GovTech. Such waiver shall also extend to
                    GovTech's licencees, assigns and successors-in-title.
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="5."
                    isNumericMarker
                  >
                    Please also see clause 8 (Privacy Statement).
                  </SubSectionListItem>
                </SubSectionOrderedList>
              </SectionListItem>
              <SectionListItem listStyleType="'5A. '">
                <SectionTitle>
                  Ownership of Feedback/Requests/Suggestions
                </SectionTitle>
                <Text textStyle="body-1">
                  You agree that all title and interest in any feedback,
                  requests or suggestions from you concerning the Services
                  provided to GovTech shall be owned by GovTech and, without
                  prejudice and in addition to clause 5.3, you shall waive all
                  rights existing in or in respect of the same (including, for
                  the avoidance of doubt, any signature requirements).
                </Text>
              </SectionListItem>
              <SectionListItem listStyleType="'5B. '">
                <SectionTitle>Confidentiality</SectionTitle>
                <SubSectionOrderedList>
                  <SubSectionListItem
                    prependSequenceMarker="5B."
                    isNumericMarker
                  >
                    If you receive information or data (in whatever form) from
                    GovTech or a Third Party which is designated confidential or
                    proprietary or is otherwise reasonably understood to be
                    confidential or proprietary (collectively, "
                    <b>Confidential Information</b>"), you shall not use,
                    disclose or reproduce the Confidential Information except
                    for the purpose for which it was provided to you. If consent
                    to disclose the Confidential Information to a third party is
                    given by GovTech or the Third Party to you, any act or
                    omission in respect of the Confidential Information by that
                    person shall be deemed to be your act or omission and you
                    agree to be fully liable for the same. In all cases, you
                    shall protect the Confidential Information to the same
                    extent you protect your own confidential information but in
                    no event less than a reasonable standard of care. You shall
                    ensure that any recipients are bound by confidentiality
                    terms at least as restrictive as this Clause.
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="5B."
                    isNumericMarker
                  >
                    You shall destroy any Confidential Information immediately
                    upon request by GovTech or the Third Party.
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="5B."
                    isNumericMarker
                  >
                    In the event:
                    <SubSubSectionOrderedList mt="1.5rem">
                      <SubSectionListItem
                        prependSequenceMarker="5B."
                        isNumericMarker
                      >
                        you are, or likely to be, required by an order of court
                        to disclose Confidential Information; or
                      </SubSectionListItem>
                      <SubSectionListItem
                        prependSequenceMarker="5B."
                        isNumericMarker
                      >
                        you have reasonable grounds to suspect the unauthorised
                        use or disclosure or reproduction of Confidential
                        Information;
                      </SubSectionListItem>
                    </SubSubSectionOrderedList>
                    <Text mt="1.5rem">
                      you shall immediately notify GovTech or the Third Party of
                      the same and cooperate with GovTech or the Third Party to
                      prevent or limit such disclosure.
                    </Text>
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="5B."
                    isNumericMarker
                  >
                    Nothing in this Clause 5B shall prejudice GovTech's or the
                    Third Party's other rights at law.
                  </SubSectionListItem>
                </SubSectionOrderedList>
              </SectionListItem>
              <SectionListItem listStyleType="'6. '">
                <SectionTitle>Disclaimers and Indemnity</SectionTitle>
                <SubSectionOrderedList>
                  <SubSectionListItem
                    prependSequenceMarker="6."
                    isNumericMarker
                  >
                    <b>
                      The Service is provided on an "as is" and "as available"
                      basis without warranties of any kind. To the fullest
                      extent permitted by law, GovTech does not make any
                      representations or warranties of any kind whatsoever in
                      relation to the Service and hereby disclaims all express,
                      implied and/or statutory warranties of any kind to you or
                      any third party, whether arising from usage or custom or
                      trade or by operation of law or otherwise, including but
                      not limited to any representations or warranties:
                    </b>

                    <SubSubSectionOrderedList mt="1.5rem">
                      <SubSectionListItem
                        prependSequenceMarker="6."
                        isNumericMarker
                      >
                        <b>
                          as to the accuracy, completeness, correctness,
                          currency, timeliness, reliability, availability,
                          interoperability, security, non-infringement, title,
                          merchantability, quality or fitness for any particular
                          purpose of the Service; and/or
                        </b>
                      </SubSectionListItem>
                      <SubSectionListItem
                        prependSequenceMarker="6."
                        isNumericMarker
                      >
                        <b>
                          that the Service or any functions associated therewith
                          will be uninterrupted or error-free, or that defects
                          will be corrected or that this Service, website and
                          the server are and will be free of all viruses and/or
                          other malicious, destructive or corrupting code,
                          programme or macro.
                        </b>
                      </SubSectionListItem>
                    </SubSubSectionOrderedList>
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="6."
                    isNumericMarker
                  >
                    <b>
                      GovTech shall also not be liable to you or any third party
                      for any damage or loss of any kind whatsoever and
                      howsoever caused, including but not limited to any direct
                      or indirect, special or consequential damages, loss of
                      income, revenue or profits, lost or damaged data, or
                      damage to your computer, software or any other property,
                      whether or not arising directly or indirectly from –
                    </b>
                    <SubSubSectionOrderedList mt="1.5rem">
                      <SubSectionListItem
                        prependSequenceMarker="6."
                        isNumericMarker
                      >
                        <b>
                          your access to or use of this Service, or any part
                          thereof;
                        </b>
                      </SubSectionListItem>
                      <SubSectionListItem
                        prependSequenceMarker="6."
                        isNumericMarker
                      >
                        <b>
                          any loss of access or use of this Service or any part
                          of this Service, howsoever caused;
                        </b>
                      </SubSectionListItem>
                      <SubSectionListItem
                        prependSequenceMarker="6."
                        isNumericMarker
                      >
                        <b>
                          any inaccuracy or incompleteness in, or errors or
                          omissions in the transmission of, the Service;
                        </b>
                      </SubSectionListItem>
                      <SubSectionListItem
                        prependSequenceMarker="6."
                        isNumericMarker
                      >
                        <b>
                          any delay or interruption in the transmission of the
                          Service, whether caused by delay or interruption in
                          transmission over the internet or otherwise; or
                        </b>
                      </SubSectionListItem>
                      <SubSectionListItem
                        prependSequenceMarker="6."
                        isNumericMarker
                      >
                        <b>
                          any decision made or action taken by you or any third
                          party in reliance upon the Service, regardless of
                          whether GovTech has been advised of the possibility of
                          such damage or loss.
                        </b>
                      </SubSectionListItem>
                    </SubSubSectionOrderedList>
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="6."
                    isNumericMarker
                  >
                    <b>
                      Without prejudice and in addition to the foregoing,
                      insofar as the Service facilitates or requires the
                      provision, use or functioning of, or is provided in
                      conjunction with, other products, software, materials
                      and/or services not provided by GovTech, GovTech makes no
                      representation or warranty in relation to such products,
                      software, materials and/or services (including without
                      limitation any representation or warranties as to
                      timeliness, reliability, availability, interoperability,
                      quality, fitness for purpose, non-infringement,
                      suitability or accuracy).
                    </b>
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="6."
                    isNumericMarker
                  >
                    You shall not rely on any part of the Service to claim or
                    assert any form of legitimate expectation against GovTech,
                    whether or not arising out of or in connection with
                    GovTech's roles and functions as a public authority. GovTech
                    shall have no responsibility or liability to you or any
                    third party arising out of or in connection with any fraud,
                    phishing, or any other illegal act or omission by other
                    parties in relation to the Service and it is your own
                    responsibility to ensure that the Service you are using or
                    accessing is from a legitimate source.
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="6."
                    isNumericMarker
                  >
                    <b>
                      You agree to defend and indemnify and keep GovTech and its
                      officers, employees, agents and contractors harmless
                      against all liabilities, losses, damages, costs or
                      expenses (including legal costs on an indemnity basis)
                      howsoever arising out of or in connection with your access
                      or use of the Service (including third party software or
                      services) or your non-compliance with the Terms of Use,
                      Third Party Terms or Incorporated Terms, whether or not
                      you had been advised or informed of the nature or extent
                      of such liabilities, losses, damages, costs or expenses.
                      You warrant and represent that your access or use of the
                      Service does not and will not breach or violate any laws,
                      regulations, trade, economic and/or export sanctions
                      (wherever in the world) applicable to you, and that you
                      shall not transmit any malicious code, illegal, infringing
                      or undesirable content or materials to GovTech or its
                      agents or any Third Party.
                    </b>
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="6."
                    isNumericMarker
                  >
                    GovTech shall have the right to take any and all necessary
                    actions/omissions to protect its interests, including
                    complying with any legal requirements (such as taking down,
                    disabling and disabling access to, removing (permanently or
                    temporarily), and/or restoring (including restoring access
                    to) any materials contained in, accessed through, uploaded
                    to, and/or made available via the Service in response to any
                    take-down or restoration notices). You agree that GovTech is
                    not obliged to determine the merits of any take-down or
                    restoration notices. You further waive any rights arising as
                    a result of the actions/omissions taken by GovTech.
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="6."
                    isNumericMarker
                  >
                    Without prejudice and in addition to GovTech's other rights:
                    <SubSubSectionOrderedList mt="1.5rem">
                      <SubSectionListItem
                        prependSequenceMarker="6."
                        isNumericMarker
                      >
                        in no event shall GovTech's total cumulative liability
                        arising out of or in connection with these Terms of Use
                        to you exceed the amount of fees or payment received by
                        GovTech (and not paid or given to any Third Party by
                        GovTech) from you for the Service in the 12 months
                        preceding the date of the first cause of action; and
                      </SubSectionListItem>
                      <SubSectionListItem
                        prependSequenceMarker="6."
                        isNumericMarker
                      >
                        no action may be brought by you against GovTech arising
                        out of or in connection with these Terms of Use more
                        than one (1) year after the cause of action arose.
                      </SubSectionListItem>
                    </SubSubSectionOrderedList>
                  </SubSectionListItem>
                </SubSectionOrderedList>
              </SectionListItem>
              <SectionListItem listStyleType="'7. '">
                <SectionTitle>Hyperlinks</SectionTitle>
                <SubSectionOrderedList>
                  <SubSectionListItem
                    prependSequenceMarker="7."
                    isNumericMarker
                  >
                    Insofar as the Service provides a hyperlink to material not
                    maintained or controlled by GovTech, GovTech shall not be
                    responsible for the content of the hyperlinked material and
                    shall not be liable for any damages or loss arising from
                    access to the hyperlinked material. Use of the hyperlinks
                    and access to such hyperlinked materials are entirely at
                    your own risk. The hyperlinks are provided merely as a
                    convenience to you and do not imply endorsement by,
                    association or affiliation with GovTech of the contents of
                    or provider of the hyperlinked materials.
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="7."
                    isNumericMarker
                  >
                    Caching and hyperlinking to, and the framing of, any part of
                    the Service is prohibited save where you have obtained
                    GovTech's prior written consent. Such consent may be subject
                    to any conditions as may be determined by GovTech in its
                    sole discretion. If you hyperlink to or frame any part of
                    the Service, that shall constitute your acceptance of these
                    Terms of Use and all amendments thereto. If you do not
                    accept these Terms of Use as may be amended from time to
                    time, you must immediately discontinue linking to or framing
                    of any part of the Service.
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="7."
                    isNumericMarker
                  >
                    GovTech reserves all rights:
                    <SubSubSectionOrderedList mt="1.5rem">
                      <SubSectionListItem
                        prependSequenceMarker="7."
                        isNumericMarker
                      >
                        to disable any links to, or frames of, any materials
                        which are unauthorised (including without limitation
                        materials which imply endorsement by or association or
                        affiliation with GovTech, materials containing
                        inappropriate, profane, defamatory, infringing, obscene,
                        indecent or unlawful topics, names, or information that
                        violates any written law, any applicable intellectual
                        property, proprietary, privacy or publicity rights); and
                      </SubSectionListItem>
                      <SubSectionListItem
                        prependSequenceMarker="7."
                        isNumericMarker
                      >
                        to disclaim responsibility and/or liability for
                        materials that link to or frame any part of the Service.
                      </SubSectionListItem>
                    </SubSubSectionOrderedList>
                  </SubSectionListItem>
                </SubSectionOrderedList>
              </SectionListItem>
              <SectionListItem listStyleType="'8. '">
                <SectionTitle>Privacy Statement</SectionTitle>
                <Text textStyle="body-1">
                  You also agree to the terms of the Government Agency Privacy
                  Statement for this Service as may be amended from time to
                  time. The Government Agency Privacy Statement will form part
                  of these Terms of Use.
                </Text>
              </SectionListItem>
              <SectionListItem listStyleType="'9. '">
                <SectionTitle>Rights of Third Parties</SectionTitle>
                <Text textStyle="body-1">
                  Subject to the rights of the Third Party and/or Singapore
                  public sector agencies, a person who is not a party to this
                  Terms of Use shall have no right under the Contract (Rights of
                  Third Parties) Act or otherwise to enforce any of its terms.
                  Variation or rescission of these Terms of Use shall not
                  require the consent of any third party, including any Third
                  Party and/or other Singapore public sector agencies.
                </Text>
              </SectionListItem>
              <SectionListItem listStyleType="'10. '">
                <SectionTitle>Assignment</SectionTitle>
                <SubSectionOrderedList>
                  <SubSectionListItem
                    prependSequenceMarker="10."
                    isNumericMarker
                  >
                    You may not assign or sub-contract this Terms of Use without
                    the prior written consent of GovTech.
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="10."
                    isNumericMarker
                  >
                    GovTech may assign, novate, transfer, or sub-contract the
                    rights and liabilities in respect of the Service and this
                    Terms of Use, without notifying you and without further
                    reference to you. Your acceptance of this Terms of Use shall
                    also constitute your consent to such assignment, novation,
                    transfer or sub-contract.
                  </SubSectionListItem>
                </SubSectionOrderedList>
              </SectionListItem>
              <SectionListItem listStyleType="'10A. '">
                <SectionTitle>Severability</SectionTitle>
                <Text textStyle="body-1">
                  If any term of these Terms of Use is held by a court or
                  tribunal of competent jurisdiction to be invalid or
                  unenforceable, then these Terms of Use, including all of the
                  remaining terms, will remain in full force and effect as if
                  such invalid or unenforceable term had never been included
                  but, to the extent permissible, such invalid or unenforceable
                  terms shall be deemed to have been replaced by terms that are
                  (a) valid and enforceable and (b) express the intention or
                  produce the result closest to the original intention of the
                  invalid or unenforceable terms.
                </Text>
              </SectionListItem>
              <SectionListItem listStyleType="'10B. '">
                <SectionTitle>Order of Precedence</SectionTitle>
                <Text textStyle="body-1">
                  In the event of any conflict, inconsistency or ambiguity
                  between or in any one or more terms in these Terms of Use,
                  such conflict, inconsistency or ambiguity shall be resolved in
                  favour of GovTech and the provision or interpretation which is
                  more favourable to GovTech shall prevail. Notwithstanding any
                  other term, GovTech has the sole and absolute discretion to
                  determine which term or interpretation is more favourable to
                  it and such decision shall be binding on you.
                </Text>
              </SectionListItem>
              <SectionListItem listStyleType="'10C. '">
                <SectionTitle>Entire Agreement</SectionTitle>
                <Text textStyle="body-1">
                  These Terms of Use contains the entire and whole agreement
                  concerning the subject matter of these Terms of Use. The Terms
                  of Use supersedes all prior written or oral representations,
                  agreements and/or understandings between GovTech and yourself.
                  Except for amendments by GovTech under these Terms of Use, no
                  amendment to these Terms of Use shall be of any force unless
                  agreed upon in writing by both parties.
                </Text>
              </SectionListItem>
              <SectionListItem listStyleType="'10D. '">
                <SectionTitle>Waiver</SectionTitle>
                <SubSectionOrderedList>
                  <SubSectionListItem
                    prependSequenceMarker="10D."
                    isNumericMarker
                  >
                    Any delay, failure or omission on the part of GovTech in
                    enforcing any right, power, privilege, claim or remedy (“
                    <b>Remedy</b>”), which is conferred under the Terms of Use
                    or at law or in equity, or arises from any breach by you,
                    shall not (a) be deemed to be or be construed as a waiver or
                    variation of the Remedy, or of any other such Remedy, in
                    respect of the particular circumstances in question, or (b)
                    operate so as to bar the enforcement or exercise of the
                    Remedy, or of any other such Remedy in any other subsequent
                    instances.
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="10D."
                    isNumericMarker
                  >
                    No waiver by GovTech of any breach of the Terms of Use by
                    you shall be deemed to be a waiver of any other or of any
                    subsequent breach.
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="10D."
                    isNumericMarker
                  >
                    Any waiver by GovTech granted under the Terms of Use must be
                    in writing and may be given subject to conditions. Such
                    waiver under the Terms of Use shall be effective only in the
                    instance and for the purpose for which it is given.
                  </SubSectionListItem>
                </SubSectionOrderedList>
              </SectionListItem>
              <SectionListItem listStyleType="'11. '">
                <SectionTitle>
                  Governing Law and Dispute Resolution
                </SectionTitle>
                <SubSectionOrderedList>
                  <SubSectionListItem
                    prependSequenceMarker="11."
                    isNumericMarker
                  >
                    These Terms of Use shall be governed by and construed in
                    accordance with laws of Singapore.
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="11."
                    isNumericMarker
                  >
                    Subject to clause 11.3, any dispute arising out of or in
                    connection with these Terms of Use, including any question
                    regarding its existence, validity or termination, shall be
                    referred to and finally resolved in the Courts of the
                    Republic of Singapore and the parties hereby submit to the
                    exclusive jurisdiction of the Courts of the Republic of
                    Singapore.
                  </SubSectionListItem>
                  <SubSectionListItem
                    prependSequenceMarker="11."
                    isNumericMarker
                  >
                    GovTech may, at its sole discretion, refer any dispute
                    referred to in clause 11.2 above to arbitration administered
                    by the Singapore International Arbitration Centre ("
                    <b>SIAC</b>") in Singapore in accordance with the
                    Arbitration Rules of the SIAC ("<b>SIAC Rules</b>") for the
                    time being in force, which rules are deemed to be
                    incorporated by reference in this clause. Further:
                    <SubSubSectionOrderedList mt="1.5rem">
                      <SubSectionListItem
                        prependSequenceMarker="11."
                        isNumericMarker
                      >
                        The seat of the arbitration shall be Singapore.
                      </SubSectionListItem>
                      <SubSectionListItem
                        prependSequenceMarker="11."
                        isNumericMarker
                      >
                        The tribunal shall consist of one (1) arbitrator.
                      </SubSectionListItem>
                      <SubSectionListItem
                        prependSequenceMarker="11."
                        isNumericMarker
                      >
                        The language of the arbitration shall be English.
                      </SubSectionListItem>
                      <SubSectionListItem
                        prependSequenceMarker="11."
                        isNumericMarker
                      >
                        All information, pleadings, documents, evidence and all
                        matters relating to the arbitration shall be
                        confidential.
                      </SubSectionListItem>
                    </SubSubSectionOrderedList>
                    <Text mt="1.5rem">
                      Where GovTech is the defendant or respondent, it shall be
                      given at least 30 days before the commencement of any
                      legal action against it to elect to exercise the right
                      herein to have the dispute submitted to arbitration. This
                      right to elect shall not prejudice GovTech's right to a
                      limitation defence and the period to exercise the right
                      shall not be abridged by reason of any accrual of a
                      limitation defence in favour of GovTech during the said
                      period.
                    </Text>
                  </SubSectionListItem>
                </SubSectionOrderedList>
              </SectionListItem>
            </OrderedList>
            <Text mt="2rem">These Terms of Use are dated 30 Jan 2024.</Text>
          </Box>
          <Box as="section">
            <Text textStyle="h1" as="h1" mb="2.5rem">
              Schedule
            </Text>
            <OrderedList spacing="1.5rem" marginInlineStart="1.5rem">
              <SectionListItem>
                <SectionTitle>Name of Service: FormSG</SectionTitle>
              </SectionListItem>
              <SectionListItem>
                <SectionTitle>Nature of Service</SectionTitle>
                <SubSectionOrderedList>
                  <Text textStyle="body-1" mb="1.5rem" ml="-1.5rem">
                    If you are creating a form, (a) to (e) apply to you:
                  </Text>
                  <SubSectionListItem>
                    Notwithstanding anything in the Terms of Use, the Service is
                    intended for use by:
                    <SubSectionOrderedList>
                      <SubSectionListItem
                        sequenceMarkerOverride={`"i"`}
                        mt="1.5rem"
                      >
                        a Singapore public sector agency,
                      </SubSectionListItem>
                      <SubSectionListItem sequenceMarkerOverride={`"ii"`}>
                        an entity authorised by a Singapore public sector
                        agency,
                      </SubSectionListItem>
                      <SubSectionListItem sequenceMarkerOverride={`"iii"`}>
                        a healthcare institution that is under the National
                        Healthcare Group (“<b>NHG</b>”), Singapore Health
                        Services (“<b>SingHealth</b>”), or National University
                        Health System (“<b>NUHS</b>”); or
                      </SubSectionListItem>
                      <SubSectionListItem
                        sequenceMarkerOverride={`"iv"`}
                        mb="1.5rem"
                      >
                        an entity owned and operated by MOH Holdings (“
                        <b>MOHH</b>”).
                      </SubSectionListItem>
                    </SubSectionOrderedList>
                    "You" in (a) to (e) refers to such entities.
                  </SubSectionListItem>
                  <SubSectionListItem>
                    This Service is a form builder tool for the permitted
                    entities (listed in sub-paragraph (a) above) to build their
                    own online forms and, via the Payments feature, facilitate
                    the making of e-payments to permitted entities (listed in
                    sub-paragraph (a) above) by persons making payment to such
                    entities (the "<b>Payor</b>").
                  </SubSectionListItem>
                  <SubSectionListItem>
                    Please note that GovTech may collect, store and/or process
                    data that you collect using the forms created by the
                    Service.
                  </SubSectionListItem>
                  <SubSectionListItem>
                    You are responsible for any issues concerning the forms you
                    create and for replying to and/or dealing with the form
                    respondent or any other person concerning your form,
                    including without limitation the use, linking, or
                    publication of your own privacy policy/statement applying to
                    the form. GovTech is not responsible for your compliance
                    with the applicable rules or laws, or for any failure by you
                    to provide a privacy policy/statement.
                  </SubSectionListItem>
                  <SubSectionListItem>
                    GovTech shall have the right to give your form respondents
                    notice of GovTech's Terms of Use and Privacy Statement in
                    the forms you create.
                  </SubSectionListItem>
                  <Text textStyle="body-1" mb="1.5rem" ml="-1.5rem">
                    If you are responding to a form, (f) to (h) apply to you:
                  </Text>
                  <SubSectionListItem>
                    The Terms of Use apply to you.
                  </SubSectionListItem>
                  <SubSectionListItem>
                    Please note that GovTech may be collecting data on behalf of
                    the form creator. GovTech's Privacy Statement will also
                    apply to you.
                  </SubSectionListItem>
                  <SubSectionListItem>
                    GovTech's Terms of Use and Privacy Statement apply in
                    addition to any terms or privacy policy/statement of the
                    form creator.
                  </SubSectionListItem>
                </SubSectionOrderedList>
              </SectionListItem>
              <SectionListItem>
                <SectionTitle>Third party software/services</SectionTitle>
                <SubSectionOrderedList>
                  <SubSectionListItem>
                    <Text>
                      Please see this{' '}
                      <Link href={OSS_README} isExternal>
                        link
                      </Link>{' '}
                      for a list of open source components used in the Service.
                    </Text>
                  </SubSectionListItem>
                </SubSectionOrderedList>
              </SectionListItem>
              <SectionListItem>
                <SectionTitle>Special terms</SectionTitle>
                <SubSectionOrderedList>
                  <SubSectionListItem>
                    If you are a form creator using the Payments feature, the
                    following sub-sections apply to you.
                    <SubSubSectionOrderedList mt="1.5rem">
                      <SubSectionListItem sequenceMarkerOverride={`"i"`}>
                        You must have a pre-existing agreement with Stripe in
                        order to use the Service which will link to the services
                        provided by Stripe;
                      </SubSectionListItem>
                      <SubSectionListItem sequenceMarkerOverride={`"ii"`}>
                        You shall be responsible for binding the Payor to any
                        terms and conditions or privacy policies applicable to
                        the goods/services being paid for and any payment for
                        the same, including any third party terms such as any
                        account opening or API terms or privacy policies of
                        Stripe, prior to the Payor's use of the Service. These
                        terms must be consistent with these Terms of Use;
                      </SubSectionListItem>
                      <SubSectionListItem sequenceMarkerOverride={`"iii"`}>
                        You shall ensure that your terms with Stripe permit the
                        usage of the Service by you and GovTech's use of Stripe
                        software (such as any APIs) for your benefit or on your
                        behalf. Notwithstanding anything to the contrary
                        (including where GovTech obtains the APIs directly from
                        Stripe), you shall ensure that Stripe shall have no
                        claim, demand, or cause of action against GovTech
                        arising out of or in connection with the Service or
                        GovTech's use of the aforesaid software or Stripe and
                        that GovTech shall not be required to enter into any
                        agreement with Stripe. You are solely responsible for
                        compliance with the terms of Stripe if GovTech uses
                        Stripe or software from Stripe for your benefit or on
                        your behalf.
                      </SubSectionListItem>
                      <SubSectionListItem sequenceMarkerOverride={`"iv"`}>
                        {' '}
                        You shall be liable for any disputed payments made
                        through the Service.
                      </SubSectionListItem>
                    </SubSubSectionOrderedList>
                  </SubSectionListItem>
                  <SubSectionListItem>
                    If you are a Payor making payment to a permitted entity:
                    <SubSubSectionOrderedList mt="1.5rem">
                      <SubSectionListItem sequenceMarkerOverride={`"i"`}>
                        GovTech DOES NOT provide, own or operate the services or
                        goods that are being paid for and is not responsible for
                        the fulfilment or quality of the services or goods, or
                        any payments disputes arising therefrom;
                      </SubSectionListItem>
                      <SubSectionListItem sequenceMarkerOverride={`"ii"`}>
                        Please note that you may be bound by additional terms
                        and conditions or privacy policies in respect of the
                        goods/services as may be imposed by the permitted
                        entity;
                      </SubSectionListItem>
                      <SubSectionListItem sequenceMarkerOverride={`"iii"`}>
                        Any issues concerning payment (such as refunds or
                        cancellations) should be directed to the permitted
                        entity requesting payment;
                      </SubSectionListItem>
                      <SubSectionListItem sequenceMarkerOverride={`"iv"`}>
                        GovTech may withhold certain functions of the Service
                        from you which are unrelated to your capacity as Payor
                        (such as payment dashboards).
                      </SubSectionListItem>
                    </SubSubSectionOrderedList>
                  </SubSectionListItem>
                  <SubSectionListItem>
                    Certain image(s) or footage (as applicable) are used under
                    licence from Shutterstock.com.
                  </SubSectionListItem>
                </SubSectionOrderedList>
              </SectionListItem>
            </OrderedList>
          </Box>
        </Stack>
      </Container>
      <AppFooter />
    </Flex>
  )
}
