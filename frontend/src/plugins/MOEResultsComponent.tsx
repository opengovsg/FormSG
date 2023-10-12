import { HStack, Table, Tbody, Td, Text, Th, Thead, Tr } from '@chakra-ui/react'

import formPluginDataStore from '~contexts/PluginsSingleton'

import { PluginComponent } from './PluginComponent.class'

export class MOEResultsComponent extends PluginComponent {
  responseData: any
  MOEData: any
  selectedClass: any
  setSelectedClass: (selectedClass: any) => void
  constructor(
    responseData: any,
    selectedClass: any,
    setSelectedClass: (selectedClass: any) => void,
  ) {
    super()
    this.responseData = responseData
    this.MOEData = []
    this.selectedClass = selectedClass
    this.setSelectedClass = setSelectedClass
  }

  async initialise() {
    // fetch data from external DB?
    const HARDCODED_MOE_DATA = [
      {
        class: '1A',
        school: 'Red Rose Primary School',
        level: 'Primary 4',
        students: [
          { register_no: '111', identifier: 'S1234567D', name: 'ah boy' },
          { register_no: '112', identifier: 'S1234568B', name: 'another boy' },
        ],
      },
      {
        class: '1B',
        school: 'Red Rose Primary School',
        level: 'Primary 4',
        students: [
          { register_no: '113', identifier: 'S1234432E', name: 'ah girl' },
          { register_no: '114', identifier: 'S1234499F', name: 'another girl' },
        ],
      },
    ]
    // send MOE data to singleton

    formPluginDataStore.addPlugin({
      name: 'MOEResultsComponent',
      data: HARDCODED_MOE_DATA,
    })

    this.MOEData = HARDCODED_MOE_DATA
    // setState({ responseData, studentData }) // this is passed in from the parent
  }

  handleRowClick(selectedClass: any) {
    this.setSelectedClass(selectedClass)
  }

  getResponseIdentifiers() {
    let result = []
    if (this.responseData) {
      // We assume that the first element is the identifier
      const responseIdentifier = this.responseData?.map((response: any) => {
        return response?.responses[0].answer ?? ''
      })
      result = responseIdentifier
    }
    return result
  }

  // This is for CSV download
  generateSubmittedStudentsForInjection() {
    const identifiers = this.getResponseIdentifiers()
    const submittedStudentsForInjection = this.MOEData.map((classData) => {
      const { class: className, school, level, students } = classData
      const submittedStudents = students.filter((student) =>
        identifiers.includes(student.identifier),
      )

      const submittedStudentsByRow = submittedStudents.map((answer) => {
        return { ...answer, className, school, level }
      })

      return submittedStudentsByRow
    }).flat()

    return submittedStudentsForInjection
  }

  // This is for CSV download
  generateCSVFieldNames() {
    const fieldNames = [
      'Register No.',
      'NRIC',
      'Name',
      'Class',
      'School',
      'Level',
    ]
    return fieldNames
  }

  generateResponseCountByClass(identifiers: string[]) {
    // Application logic

    const results = this.MOEData.map((classData) => {
      const { class: className, students } = classData
      const submittedStudents = students.filter((student) =>
        identifiers.includes(student.identifier),
      )

      const count = submittedStudents.length

      return { className, count, submittedStudents }
    })

    // Add render logic
    // Return a table with the header 'Classes' and 'Responses'
    // and populate with className and count
    return (
      <HStack>
        <Table as="div" variant="solid" colorScheme="secondary">
          <Thead>
            <Tr>
              <Th>Class</Th>
              <Th>Number of submissions</Th>
            </Tr>
          </Thead>
          <Tbody>
            {results.map((result) => {
              const { className, count } = result
              return (
                <Tr
                  key={className}
                  cursor="pointer"
                  _hover={{ bgColor: 'secondary.100' }}
                  _active={{
                    bg: 'primary.200',
                  }}
                  onClick={() => {
                    this.handleRowClick(className)
                  }}
                >
                  <Td>{className}</Td>
                  <Td>{count}</Td>
                </Tr>
              )
            })}
          </Tbody>
        </Table>
        <Text>Selected Class: {this.selectedClass}</Text>
        {this.selectedClass ? (
          <Table

          // display students in selected class
          >
            <Thead>
              <Tr>
                <Th>Respondents</Th>
                <Th>Class</Th>
              </Tr>
            </Thead>
            <Tbody>
              {results
                .filter((result) => result.className === this.selectedClass)
                .map((classResult) => {
                  const { submittedStudents, className } = classResult
                  return submittedStudents.map((student) => {
                    return (
                      <Tr key={student.name}>
                        <Td>{student.name}</Td>
                        <Td>{className}</Td>
                      </Tr>
                    )
                  })
                })}
            </Tbody>
          </Table>
        ) : null}
      </HStack>
    )
  }

  render(): JSX.Element {
    const responseIdentifiers = this.getResponseIdentifiers()
    console.log('responsedata:', this.responseData)
    return <>{this.generateResponseCountByClass(responseIdentifiers)}</>
  }
}
