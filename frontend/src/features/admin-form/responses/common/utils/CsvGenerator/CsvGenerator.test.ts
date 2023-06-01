import { stringify } from 'csv-string'
import FileSaver from 'file-saver'
import { mocked } from 'jest-mock'

import { CsvGenerator } from './CsvGenerator'

const UTF8_BYTE_ORDER_MARK = '\uFEFF'

jest.mock('file-saver')
const MockFileSaver = mocked(FileSaver)

describe('CsvGenerator', () => {
  afterAll(() => {
    jest.clearAllMocks()
  })

  describe('Constructor', () => {
    it('should initialise the instance properties correctly with defaults if params are not passed to constructor', () => {
      // Arrange
      const csv = new CsvGenerator()

      // Assert
      expect(csv.expectedNumberOfRecords).toEqual(0)
      expect(csv.numOfMetaDataRows).toEqual(0)
      expect(csv.numOfHeaderRows).toEqual(1)
      expect(csv.lastCreatedAt).toEqual(0)
      expect(csv.startIdx).toEqual(2)
      expect(csv.idx).toEqual(2)
      expect(csv.records.length).toEqual(2)
      expect(csv.records[0]).toEqual(UTF8_BYTE_ORDER_MARK)
    })

    it('should initialise the instance properties correctly if params are passed to constructor', () => {
      // Arrange
      const expectedNumberOfRecords = 1
      const numOfMetaDataRows = 2
      const csv = new CsvGenerator(expectedNumberOfRecords, numOfMetaDataRows)

      // Assert
      expect(csv.expectedNumberOfRecords).toEqual(expectedNumberOfRecords)
      expect(csv.numOfMetaDataRows).toEqual(numOfMetaDataRows)
      expect(csv.numOfHeaderRows).toEqual(1)
      expect(csv.lastCreatedAt).toEqual(0)
      expect(csv.startIdx).toEqual(numOfMetaDataRows + 2)
      expect(csv.idx).toEqual(numOfMetaDataRows + 2)
      expect(csv.records.length).toEqual(
        expectedNumberOfRecords + numOfMetaDataRows + 2,
      )
      expect(csv.records[0]).toEqual(UTF8_BYTE_ORDER_MARK)
    })
  })

  describe('addLine', () => {
    it('should insert raw data of type string correctly', () => {
      // Arrange
      const expectedNumberOfRecords = 1
      const numOfMetaDataRows = 0
      const csv = new CsvGenerator(expectedNumberOfRecords, numOfMetaDataRows)
      const lineToAdd = ['a', 'b']
      const stringifiedData = stringify(lineToAdd)

      // Act
      csv.addLine(lineToAdd)

      // Assert
      expect(csv.idx).toEqual(numOfMetaDataRows + 3) // Add 3 because line added
      expect(csv.records.length).toEqual(
        expectedNumberOfRecords + numOfMetaDataRows + 2,
      )
      expect(csv.records[2]).toEqual(stringifiedData)
    })

    it('should insert raw data of type number correctly', () => {
      // Arrange
      const expectedNumberOfRecords = 1
      const numOfMetaDataRows = 0
      const csv = new CsvGenerator(expectedNumberOfRecords, numOfMetaDataRows)
      const lineToAdd = [1, 2]
      const stringifiedData = stringify(lineToAdd)

      // Act
      csv.addLine(lineToAdd)

      // Assert
      expect(csv.idx).toEqual(numOfMetaDataRows + 3) // Add 3 because line added
      expect(csv.records.length).toEqual(numOfMetaDataRows + 3)
      expect(csv.records[2]).toEqual(stringifiedData)
    })
  })

  describe('setHeader', () => {
    it('should set headers correctly', () => {
      // Arrange
      const expectedNumberOfRecords = 0
      const numOfMetaDataRows = 0
      const csv = new CsvGenerator(expectedNumberOfRecords, numOfMetaDataRows)
      const headers = ['field1', 'field2']
      const stringifiedHeaders = stringify(headers)

      // Act
      csv.setHeader(headers)

      // Assert
      expect(csv.records[1]).toEqual(stringifiedHeaders)
    })
  })

  describe('addMetaData', () => {
    it('should set metaData correctly for both string and numbers', () => {
      // Arrange
      const expectedNumberOfRecords = 1
      const numOfMetaDataRows = 3
      const csv = new CsvGenerator(expectedNumberOfRecords, numOfMetaDataRows)
      const metaData = [
        ['metaData1a', 'metaData1b'],
        [1, 2],
        ['metaData3a', 3],
      ]
      const stringifiedMetaData = metaData.map((data) => stringify(data))

      // Act
      csv.addMetaData(metaData)

      // Assert
      expect(csv.records[1]).toEqual(stringifiedMetaData[0])
      expect(csv.records[2]).toEqual(stringifiedMetaData[1])
      expect(csv.records[3]).toEqual(stringifiedMetaData[2])
    })
  })

  describe('triggerFileDownload', () => {
    it('should call triggerFileDownload with the correct parameters', () => {
      // Arrange
      const expectedNumberOfRecords = 1
      const numOfMetaDataRows = 0
      const csv = new CsvGenerator(expectedNumberOfRecords, numOfMetaDataRows)
      const lineToAdd = [1, 2]
      const blob = new Blob(csv.records, {
        type: 'text/csv;charset=utf-8',
      })

      // Act
      csv.addLine(lineToAdd)
      csv.triggerFileDownload('some filename')

      // Assert
      expect(MockFileSaver.saveAs).toHaveBeenCalledWith(blob, 'some filename')
    })
  })

  describe('length', () => {
    it('should corrently return length of csv file when header and meta data are empty', () => {
      // Arrange
      const expectedNumberOfRecords = 1
      const numOfMetaDataRows = 0
      const csv = new CsvGenerator(expectedNumberOfRecords, numOfMetaDataRows)
      const lineToAdd = [1, 2]

      // Act
      csv.addLine(lineToAdd)

      // Assert
      expect(csv.length()).toEqual(expectedNumberOfRecords)
    })

    it('should corrently return length of csv file when header and meta data are present', () => {
      // Arrange
      const expectedNumberOfRecords = 1
      const numOfMetaDataRows = 1
      const csv = new CsvGenerator(expectedNumberOfRecords, numOfMetaDataRows)
      const lineToAdd = [1, 2]
      const metaData = [['metaData1a', 'metaData1b']]
      const headers = ['field1', 'field2']

      // Act
      csv.addLine(lineToAdd)
      csv.setHeader(headers)
      csv.addMetaData(metaData)

      // Assert
      expect(csv.length()).toEqual(expectedNumberOfRecords)
    })
  })
})
