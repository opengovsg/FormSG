import { Dispatch, SetStateAction, useCallback, useState } from 'react'
import { BiFileBlank, BiPencil, BiRightArrowAlt } from 'react-icons/bi'
import { useNavigate } from 'react-router-dom'
import {
  Container,
  Flex,
  FormControl,
  ModalBody,
  ModalHeader,
  Progress,
  Spacer,
  Stack,
  Text,
} from '@chakra-ui/react'

import { ADMINFORM_ROUTE } from '~constants/routes'
import Badge from '~components/Badge'
import Button from '~components/Button'
import FormLabel from '~components/FormControl/FormLabel'
import Input from '~components/Input'
import Textarea from '~components/Textarea'
import Tile from '~components/Tile'

import { useReformMutations } from '~features/admin-form/reform/mutations'
import { parseModelOutput } from '~features/admin-form/reform/utils'
import { useUser } from '~features/user/queries'

import { Attachment } from '../../Attachment/Attachment'

enum ReformMode {
  Upload = 'upload',
  Write = 'write',
}

export const CreateReformScreen = ({
  setStandardFlow,
}: {
  setStandardFlow: Dispatch<SetStateAction<boolean>>
}): JSX.Element => {
  const [purpose, setPurpose] = useState('')

  const handlePurposeChange = (event: {
    target: { value: SetStateAction<string> }
  }) => setPurpose(event.target.value)

  const {
    getQuestionsListMutation,
    getFormFieldsMutation,
    getQuestionsListFromPdfMutation,
  } = useReformMutations()

  const [isFetchingQuestions, setIsFetchingQuestions] = useState(false)

  const [qnsList, setQnsList] = useState('')

  const [prevMessages, setPrevMessages] = useState<
    { role: string; content: string }[]
  >([])

  const handlePurposeEnter = useCallback(() => {
    setIsFetchingQuestions(true)
    return getQuestionsListMutation.mutate(purpose, {
      onSuccess: (data) => {
        setQnsList(parseModelOutput(data[data.length - 1].content))
        setPrevMessages(data)
      },
      onSettled: () => {
        setIsFetchingQuestions(false)
      },
    })
  }, [getQuestionsListMutation, purpose])

  const [formName, setFormName] = useState('')

  const handleFormNameChange = (event: {
    target: { value: SetStateAction<string> }
  }) => setFormName(event.target.value)

  const { user } = useUser()

  const navigate = useNavigate()

  const [isCreatingForm, setIsCreatingForm] = useState(false)

  const handleQuestionsChange = (event: {
    target: { value: SetStateAction<string> }
  }) => setQnsList(event.target.value)

  const handleCreateFormFromQnsList = useCallback(() => {
    setIsCreatingForm(true)
    return getFormFieldsMutation.mutate(
      {
        purpose,
        prevMessages,
        questions: qnsList,
        formName,
        email: user?.email ?? 'example@open.gov.sg',
      },
      {
        onSuccess: (data) => {
          navigate(`${ADMINFORM_ROUTE}/${data._id}`)
        },
        onSettled: () => {
          setIsCreatingForm(false)
        },
      },
    )
  }, [
    formName,
    getFormFieldsMutation,
    navigate,
    prevMessages,
    purpose,
    qnsList,
    user?.email,
  ])

  const [selectedFile, setSelectedFile] = useState<File | undefined>(undefined)
  const [isProgress, setIsProgress] = useState<boolean>(false)

  let pdfjs
  ;(async function () {
    pdfjs = await import('pdfjs-dist/build/pdf')
    const pdfjsWorker = await import('pdfjs-dist/build/pdf.worker.entry')
    pdfjs.GlobalWorkerOptions.workerSrc = pdfjsWorker
  })()

  const handleFileUpload = async (file: any) => {
    setSelectedFile(file)
    setIsProgress(true)
    if (file !== undefined) {
      console.log('Uploaded file:', file)
      const arrayBuffer = await fileToArrayBuffer(file)
      console.log('ArrayBuffer:', arrayBuffer)
      try {
        const text = await pdfToText(arrayBuffer)
        console.log(text)
        getQuestionsListFromPdfMutation.mutate(text, {
          onSuccess: (data) => {
            console.log(data)
            setQnsList(parseModelOutput(data[data.length - 1].content))
            setPrevMessages(data)
            setIsProgress(false)
          },
          onError(error) {
            console.log(error)
            setIsProgress(false)
          },
        })
      } catch (e) {
        console.log(e)
      }
    }
  }

  const handleFileUploadError = (error: any) => {
    console.log('Error:', error)
  }
  async function pdfToText(data: any) {
    const loadingTask = pdfjs.getDocument(data)
    const pdf = await loadingTask.promise

    let combinedText = ''

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const content = await page.getTextContent()
      const text = content.items.map((item: { str: any }) => item.str).join(' ')
      combinedText += text + '\n\n' // Adding two new lines to separate pages.
    }
    console.log(combinedText.trim())
    return combinedText.trim()
  }

  function fileToArrayBuffer(file: File) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => resolve(reader.result)
      reader.onerror = (error) => reject(error)
      reader.readAsArrayBuffer(file)
    })
  }

  const [reformMode, setReformMode] = useState<ReformMode | false>(false)

  return (
    <>
      <ModalHeader color="secondary.700">
        <Container maxW="42.5rem" p={0}>
          <Text>Build your form with AI</Text>
          <Text textStyle="subhead-1">This will be an email mode form.</Text>
        </Container>
      </ModalHeader>
      <ModalBody whiteSpace="pre-wrap">
        <Container maxW="42.5rem" p={0}>
          <Flex direction="column">
            <FormControl isRequired mb="2.25rem">
              <FormLabel description="You can change this later">
                Form name
              </FormLabel>
              <Input
                value={formName}
                onChange={handleFormNameChange}
                isDisabled={isCreatingForm}
              />
            </FormControl>
            <FormControl isRequired mb="2.25rem">
              <FormLabel>How do you want to build?</FormLabel>
              <Stack
                spacing="1rem"
                w="100%"
                direction={{ base: 'column', md: 'row' }}
              >
                <Tile
                  variant="complex"
                  icon={BiFileBlank}
                  badge={<Badge colorScheme="success">Recommended</Badge>}
                  isActive={reformMode === ReformMode.Upload}
                  onClick={() => setReformMode(ReformMode.Upload)}
                  isFullWidth
                  flex={1}
                  isDisabled={
                    isCreatingForm && reformMode !== ReformMode.Upload
                  }
                >
                  <Tile.Title>Upload a form</Tile.Title>
                  <Tile.Subtitle>Convert a paper or pdf form</Tile.Subtitle>
                </Tile>
                <Tile
                  variant="complex"
                  icon={BiPencil}
                  isActive={reformMode === ReformMode.Write}
                  onClick={() => setReformMode(ReformMode.Write)}
                  isFullWidth
                  flex={1}
                  isDisabled={isCreatingForm && reformMode !== ReformMode.Write}
                >
                  <Tile.Title>Write a prompt</Tile.Title>
                  <Tile.Subtitle>Build a form based on a prompt</Tile.Subtitle>
                </Tile>
              </Stack>
            </FormControl>
            {reformMode === ReformMode.Upload ? (
              <FormControl isRequired mb="2.25rem">
                <FormLabel>Upload your PDF form</FormLabel>
                <Attachment
                  onChange={handleFileUpload}
                  onError={handleFileUploadError}
                  value={selectedFile}
                  maxSize={2000000} // 2MB
                  name="file-upload"
                  accept=".pdf"
                ></Attachment>
                {isProgress ? (
                  <Progress size="md" isIndeterminate></Progress>
                ) : null}
              </FormControl>
            ) : reformMode === ReformMode.Write ? (
              <FormControl isRequired mb="2.25rem">
                <FormLabel>I want to create a form that...</FormLabel>
                <Stack direction="row">
                  <Input
                    placeholder="collects personal particulars for an event"
                    value={purpose}
                    onChange={handlePurposeChange}
                    isDisabled={isCreatingForm}
                  />
                  <Spacer />
                  <Button
                    onClick={handlePurposeEnter}
                    isLoading={isFetchingQuestions}
                    spinnerPlacement="end"
                    loadingText="Generating questions..."
                    isDisabled={isCreatingForm}
                  >
                    Enter
                  </Button>
                </Stack>
              </FormControl>
            ) : null}
            {qnsList ? (
              <FormControl isRequired mb="2.25rem">
                <FormLabel description="You may edit or add questions here">
                  Your generated questions
                </FormLabel>
                <Stack direction="row">
                  <Textarea
                    value={qnsList}
                    onChange={handleQuestionsChange}
                    isDisabled={isCreatingForm}
                  />
                </Stack>
              </FormControl>
            ) : null}
            <Stack direction="row-reverse">
              <Button
                rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
                type="submit"
                isLoading={isCreatingForm}
                loadingText="Creating form..."
                spinnerPlacement="end"
                isDisabled={!qnsList}
                onClick={handleCreateFormFromQnsList}
              >
                <Text lineHeight="1.5rem">Create form</Text>
              </Button>
              <Button
                type="submit"
                onClick={() => setStandardFlow(true)}
                variant="clear"
              >
                <Text lineHeight="1.5rem">Back</Text>
              </Button>
            </Stack>
          </Flex>
        </Container>
      </ModalBody>
    </>
  )
}
