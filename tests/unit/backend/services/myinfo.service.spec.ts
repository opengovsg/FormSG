import _ from 'lodash'

import MyInfoService from 'src/app/services/myinfo.service'

const MOCK_MYINFO_SUCCESS_RESPONSE = {
  name: {
    lastupdated: '2015-06-01',
    source: '1',
    classification: 'C',
    value: 'TAN XIAO HUI',
  },
  mobileno: {
    code: '65',
    prefix: '+',
    lastupdated: '2017-12-13',
    source: '4',
    classification: 'C',
    nbr: '97324992',
  },
  mailadd: {
    country: 'US',
    unit: '',
    street: '5TH AVENUE',
    lastupdated: '2016-03-11',
    block: '725',
    source: '2',
    postal: 'NY 10022',
    classification: 'C',
    floor: '',
    building: 'TRUMP TOWER',
  },
  employment: {
    lastupdated: '2017-10-11',
    source: '2',
    classification: 'C',
    value: 'ALPHA',
  },
}

const MOCK_MYINFO_DATA = {
  homeno: {
    code: '65',
    prefix: '+',
    lastupdated: '2017-11-20',
    source: '2',
    classification: 'C',
    nbr: '66132665',
  },
  mobileno: {
    code: '65',
    prefix: '+',
    lastupdated: '2017-12-13',
    source: '4',
    classification: 'C',
    nbr: '97324992',
  },
  regadd: {
    country: 'SG',
    unit: '128',
    street: 'BEDOK NORTH AVENUE 1',
    lastupdated: '2016-03-11',
    block: '548',
    source: '1',
    postal: '460548',
    classification: 'C',
    floor: '09',
    building: '',
  },
  mailadd: {
    country: 'US',
    unit: '',
    street: '5TH AVENUE',
    lastupdated: '2016-03-11',
    block: '725',
    source: '2',
    postal: 'NY 10022',
    classification: 'C',
    floor: '',
    building: 'TRUMP TOWER',
  },
  billadd: {
    country: 'SG',
    street: 'SERANGOON AVE 3',
    lastupdated: '2016-03-11',
    block: '329',
    source: '1',
    postal: '550329',
    classification: 'C',
    floor: '09',
    unit: '360',
    building: '',
  },
  workpassexpirydate: {
    lastupdated: '2018-03-02',
    source: '1',
    classification: 'C',
    value: '2018-12-31',
  },
}

const MOCK_FORM_FIELDS = [
  // Some MyInfo fields
  { fieldType: 'textfield', isVisible: true, myInfo: { attr: 'name' } },
  { fieldType: 'textfield', isVisible: true, myInfo: { attr: 'mobileno' } },
  { fieldType: 'textfield', isVisible: true, myInfo: { attr: 'homeno' } },
  { fieldType: 'textfield', isVisible: true, myInfo: { attr: 'mailadd' } },
  // Some non-MyInfo fields
  { fieldType: 'dropdown' },
  { fieldType: 'textfield' },
]

describe('MyInfoService', () => {
  const MyInfoGovClient = {
    getPersonBasic: jest.fn(),
  }
  const spCookieMaxAge = 200 * 1000
  let myInfoService = new MyInfoService(MyInfoGovClient, spCookieMaxAge)

  const mockFetchPersonDataParams = {
    uinFin: 'mockFin',
    requestedAttributes: ['mockAttr'],
    singpassEserviceId: 'mockEsrvcId',
  }

  beforeEach(() => {
    myInfoService = new MyInfoService(MyInfoGovClient, spCookieMaxAge)
    MyInfoGovClient.getPersonBasic.mockReset()
  })

  afterEach(() => {
    myInfoService.myInfoClientBreaker.close()
    myInfoService.myInfoClientBreaker.clearCache()
  })

  it('should be instantiated without errors', () => {
    expect(myInfoService).toBeTruthy()
  })

  describe('fetchMyInfoPersonData', () => {
    it('should fire MyInfoGovClient.getPersonBasic if success', async () => {
      // Arrange
      // Inject mock response to be retrieved.
      MyInfoGovClient.getPersonBasic.mockImplementationOnce(() => {
        return Promise.resolve(MOCK_MYINFO_SUCCESS_RESPONSE)
      })

      // Act
      const response = await myInfoService.fetchMyInfoPersonData(
        mockFetchPersonDataParams,
      )

      // Assert
      expect(MyInfoGovClient.getPersonBasic).toBeCalledTimes(1)
      expect(response).toEqual(MOCK_MYINFO_SUCCESS_RESPONSE)
    })

    it('should reject promise on first MyInfo fetch failure', async () => {
      // Arrange
      const mockError = new Error('Mock MyInfo server failure')
      MyInfoGovClient.getPersonBasic.mockImplementationOnce(() =>
        Promise.reject(mockError),
      )

      // Act + Assert
      await expect(
        myInfoService.fetchMyInfoPersonData(mockFetchPersonDataParams),
      ).rejects.toThrowError(mockError)
    })

    it('should throw circuit breaker error after first fetch failure', async () => {
      // Arrange
      const mockError = new Error('Mock MyInfo server failure')
      MyInfoGovClient.getPersonBasic.mockImplementationOnce(() =>
        Promise.reject(mockError),
      )

      // Act + Assert
      // Call fetch twice
      // First fetch should be correctly rejected
      await expect(
        myInfoService.fetchMyInfoPersonData(mockFetchPersonDataParams),
      ).rejects.toThrowError(mockError)

      // Second fetch should be circuit broken error, without needing to check
      // MyInfoGovClient.getPersonBasic.
      await expect(
        myInfoService.fetchMyInfoPersonData(mockFetchPersonDataParams),
      ).rejects.toThrowError(new Error('Breaker is open'))
      // Total number of calls to getPersonBasic should be only 1
      expect(MyInfoGovClient.getPersonBasic).toBeCalledTimes(1)
    })
  })

  describe('getMyInfoValue', () => {
    it('should return empty string if valid myInfoAttr does not exist in invalid myInfoData', () => {
      // Arrange
      const invalidData = {}

      // Act
      const actual = myInfoService.getMyInfoValue(
        'workpassexpirydate',
        invalidData,
      )

      // Assert
      expect(actual).toEqual('')
    })

    it('should return empty string if invalid myInfoAttr does not exist in valid myInfoData', () => {
      // Act
      const actual = myInfoService.getMyInfoValue('invalid', MOCK_MYINFO_DATA)

      // Assert
      expect(actual).toEqual('')
    })

    it('should correctly return attr.value', () => {
      // Act
      const actual = myInfoService.getMyInfoValue(
        'workpassexpirydate',
        MOCK_MYINFO_DATA,
      )

      // Assert
      expect(actual).toEqual(MOCK_MYINFO_DATA.workpassexpirydate.value)
    })

    describe('Phone numbers', () => {
      it('should correctly return formatted home phone numbers if valid', () => {
        // Arrange
        // code: '65',
        // prefix: '+',
        // nbr: '66132665',
        const expected = '+65 66132665'

        // Act
        const actual = myInfoService.getMyInfoValue('homeno', MOCK_MYINFO_DATA)

        // Assert
        expect(actual).toEqual(expected)
      })

      it('should correctly return formatted mobile phone numbers if valid', () => {
        // Arrange
        // code: '65',
        // prefix: '+',
        // nbr: '97324992',
        const expected = '+65 97324992'

        // Act
        const actual = myInfoService.getMyInfoValue(
          'mobileno',
          MOCK_MYINFO_DATA,
        )

        // Assert
        expect(actual).toEqual(expected)
      })
    })

    describe('Addresses', () => {
      it('should correctly return formatted registered addresses', () => {
        // Arrange
        // unit: '128',
        // street: 'BEDOK NORTH AVENUE 1',
        // block: '548',
        // postal: '460548',
        // floor: '09',
        // building: '',
        const expected = '548 BEDOK NORTH AVENUE 1, #09-128, SINGAPORE 460548'

        // Act
        const actual = myInfoService.getMyInfoValue('regadd', MOCK_MYINFO_DATA)

        // Assert
        expect(actual).toEqual(expected)
      })

      it('should correctly return formatted mailing addresses', () => {
        // Arrange
        // country: 'US',
        // unit: '',
        // street: '5TH AVENUE',
        // lastupdated: '2016-03-11',
        // block: '725',
        // source: '2',
        // postal: 'NY 10022',
        // classification: 'C',
        // floor: '',
        // building: 'TRUMP TOWER',
        const expected = 'TRUMP TOWER, 725 5TH AVENUE, UNITED STATES NY 10022'

        // Act
        const actual = myInfoService.getMyInfoValue('mailadd', MOCK_MYINFO_DATA)

        // Assert
        expect(actual).toEqual(expected)
      })

      it('should correctly return formatted billing addresses', () => {
        // Arrange
        // country: 'SG',
        // street: 'SERANGOON AVE 3',
        // block: '329',
        // postal: '550329',
        // floor: '09',
        // unit: '360',
        const expected = '329 SERANGOON AVE 3, #09-360, SINGAPORE 550329'

        // Act
        const actual = myInfoService.getMyInfoValue('billadd', MOCK_MYINFO_DATA)

        // Assert
        expect(actual).toEqual(expected)
      })

      it('should return empty string if address missing one of [block, street, country, postal] keys', () => {
        // Arrange
        const mockBillAdd = _.cloneDeep(MOCK_MYINFO_DATA.billadd)
        mockBillAdd.block = ''

        // Act
        const actual = myInfoService.getMyInfoValue('billadd', {
          billAdd: mockBillAdd,
        })

        // Assert
        expect(actual).toEqual('')
      })
    })
  })

  describe('prefillMyInfoFields', () => {
    it('should correctly return prefilledFields and readOnlyHashes', async () => {
      // Arrange
      // Inject mock response to be retrieved.
      MyInfoGovClient.getPersonBasic.mockImplementationOnce(() => {
        return Promise.resolve(MOCK_MYINFO_SUCCESS_RESPONSE)
      })
      const mockMyInfoData = await myInfoService.fetchMyInfoPersonData(
        mockFetchPersonDataParams,
      )

      // Act
      const {
        prefilledFields: actualPrefilled,
        readOnlyHashPromises: actualReadOnlyHashes,
      } = await myInfoService.prefillMyInfoFields(
        mockMyInfoData,
        MOCK_FORM_FIELDS,
      )

      // Assert
      // Requested MOCK_FORM_FIELDS form field order:
      // MyInfoName -> MyInfoMobileNo -> MyInfoHomeNo -> MyInfoMailAddr ->
      // normalDropdown -> normalTextField
      // MockMyInfoData should only contain `name`, `mobileno`, `mailadd`, and
      // `employment` attributes

      // Should have same length as before filled fields
      expect(actualPrefilled.length).toBe(MOCK_FORM_FIELDS.length)
      expect(actualPrefilled[0]).toEqual(
        expect.objectContaining({
          fieldValue: MOCK_MYINFO_SUCCESS_RESPONSE.name.value,
          disabled: true,
        }),
      )
      expect(actualPrefilled[1]).toEqual(
        expect.objectContaining({
          // Should be formatted mobile phone number
          fieldValue: '+65 97324992',
          disabled: false,
        }),
      )
      // MyInfoHomeNo is not returned in response, so field value should be
      // blank.
      expect(actualPrefilled[2]).toEqual(
        expect.objectContaining({
          fieldValue: '',
          disabled: false,
        }),
      )
      // Should be formatted mail address
      expect(actualPrefilled[3]).toEqual(
        expect.objectContaining({
          fieldValue: 'TRUMP TOWER, 725 5TH AVENUE, UNITED STATES NY 10022',
          disabled: false,
        }),
      )

      // Last two are non myinfo fields, should be same as original fields
      expect(actualPrefilled[4]).toEqual(MOCK_FORM_FIELDS[4])
      expect(actualPrefilled[5]).toEqual(MOCK_FORM_FIELDS[5])

      // Should only contain name since that is the only readonly field
      expect(Object.keys(actualReadOnlyHashes)).toEqual(['name'])
    })
  })
})
