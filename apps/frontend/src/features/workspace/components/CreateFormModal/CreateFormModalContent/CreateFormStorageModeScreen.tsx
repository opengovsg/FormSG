import { useTranslation } from 'react-i18next'
import { BiArrowBack, BiRightArrowAlt } from 'react-icons/bi'
import { Container, Flex, ModalBody, ModalHeader, Text } from '@chakra-ui/react'

import Button from '~components/Button'
import IconButton from '~components/IconButton'

import { useCreateFormWizard } from '../CreateFormWizardContext'

import { FormTitleInput } from './FormTitleInput'

export const CreateFormStorageModeScreen = (): JSX.Element => {
  const { t } = useTranslation()
  const {
    handleCreateStorageModeOrMultirespondentForm,
    isLoading,
    isFetching,
    goToMrfDetails,
  } = useCreateFormWizard()

  return (
    <>
      <ModalHeader color="secondary.700">
        <Container maxW="45rem" p={0}>
          <Flex align="center">
            <IconButton
              variant="clear"
              aria-label="Back"
              icon={<BiArrowBack />}
              onClick={goToMrfDetails}
              mr="0.5rem"
            />
            Set up a Storage mode form
          </Flex>
        </Container>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap">
        <Container maxW="45rem" p={0}>
          <Text textStyle="body-2" color="secondary.500" mb="2rem">
            Storage mode is outdated and no longer receives new features. Only
            use this if you need a feature not yet available in the current
            version.
          </Text>
          <FormTitleInput mb="2.5rem" />
          <Button
            rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
            type="submit"
            isLoading={isLoading}
            isDisabled={isFetching}
            onClick={handleCreateStorageModeOrMultirespondentForm}
            isFullWidth
            data-dd-action-name="dashboard.create.create_encrypt"
          >
            <Text lineHeight="1.5rem">
              {t('features.workspace.modals.forms.create.details.create')}
            </Text>
          </Button>
        </Container>
      </ModalBody>
    </>
  )
}
