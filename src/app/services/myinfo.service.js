const _ = require('lodash')
const bcrypt = require('bcrypt')
const CircuitBreaker = require('opossum')
const { CATEGORICAL_DATA_DICT } = require('@opengovsg/myinfo-gov-client')

const HASH_SALT_ROUNDS = 10

class MyInfoService {
  constructor(MyInfoGovClient, spCookieMaxAge) {
    this.spCookieMaxAge = spCookieMaxAge

    this.myInfoClientBreaker = new CircuitBreaker(
      (params) => MyInfoGovClient.getPersonBasic(params),
      {
        errorThresholdPercentage: 80,
        timeout: 5000,
      },
    )
  }

  /**
   * Fetches MyInfo person detail with given params.
   * This function has circuit breaking built into it, and will throw an error
   * if any recent usages of this function returned an error.
   * @param {object} params The params required to retrieve the data.
   * @param {string} params.uinFin The uin/fin of the person's data to retrieve.
   * @param {string[]} params.requestedAttributes The requested attributes to fetch.
   * @param {string} params.singpassEserviceId The eservice id of the form requesting the data.
   * @returns {Promise<object>} the person object retrieved.
   * @throws an error on fetch failure or if circuit breaker is in the opened state. Use {@link CircuitBreaker#isOurError} to determine if a rejection was a result of the circuit breaker or the action.
   */
  async fetchMyInfoPersonData(params) {
    return this.myInfoClientBreaker.fire(params)
  }

  /**
   * Prefill given current form fields with given MyInfo data, and returns it
   * along with read-only fields with hashed values.
   * @param {object} myInfoData
   * @param {object[]} currFormFields
   * @returns {{ prefilledFields: object[], readOnlyHashPromises: Record<string,Promise<string>>}} an object consisting of a prefilledFields field array, along with a readOnlyHashPromises object keyed by the MyInfo attribute.
   */
  prefillMyInfoFields(myInfoData, currFormFields) {
    /** @type {Record<string,Promise<string>>} */
    const readOnlyHashPromises = {} // json to store readOnly fields in

    const prefilledFields = currFormFields.map((field) => {
      if (!_.get(field, 'myInfo.attr', false)) return field

      const myInfoAttr = field.myInfo.attr
      const myInfoValue = this.getMyInfoValue(myInfoAttr, myInfoData)
      let isReadOnly = this.isFieldReadOnly(myInfoAttr, myInfoValue, myInfoData)

      const prefilledField = _.cloneDeep(field)
      prefilledField.fieldValue = myInfoValue

      // Disable field and add hashed state to readOnlyFields if field is
      // readonly.
      prefilledField.disabled = isReadOnly
      if (isReadOnly) {
        readOnlyHashPromises[myInfoAttr] = bcrypt.hash(
          myInfoValue.toString(),
          HASH_SALT_ROUNDS,
        )
      }

      return prefilledField
    })

    return { prefilledFields, readOnlyHashPromises }
  }

  /**
   * Retrieves the full MyInfo field value. If field is categorical, the
   * returned value is retrieved from MyInfo data dictionary. Otherwise, it is
   * parsed accordingly to construct the returned string.
   * @param  {string} myInfoAttr The MyInfo attribute
   * @param  {object} myInfoData MyInfo person data object returned from MyInfoGovAuthClient
   * @return {any} The full formatted values, if it exists, otherwise the myInfoKey is returned.
   */
  getMyInfoValue(myInfoAttr, myInfoData) {
    const attr = myInfoData[myInfoAttr]

    // Categorical data lookup
    if (CATEGORICAL_DATA_DICT[myInfoAttr]) {
      return _.get(
        CATEGORICAL_DATA_DICT,
        [myInfoAttr, attr.value, 'description'],
        '',
      )
    }

    // Not in category, return by case
    switch (myInfoAttr) {
      // Phone numbers
      case 'mobileno':
      case 'homeno':
        return this.formatPhoneNumber(attr)
      case 'regadd':
      case 'billadd':
      case 'mailadd':
        return this.formatAddress(attr)
      default:
        return _.get(attr, 'value', '')
    }
  }

  /**
   * Determine if frontend should lock the field to prevent it from being
   * editable. The field is locked if it is government-verified and if it
   * does not contain marriage-related information (decision by SNDGO & MSF due to
   * overseas unregistered marriages). An empty myInfo field will always evaluate
   * to false so that the field can be filled by form-filler.
   *
   * The affected marriage fields are:
   * - marital
   * - marriagedate
   * - divorcedate
   * - countryofmarriage
   * - marriagecertno
   *
   * The function also uses the provided "source" flag within each MyInfo field to
   * determine whether data is government verified.
   *
   * The mapping for "source" field is:
   *
   * 1 - Government-verified Data
   * 2 - User Provided Data
   * 3 - Not Applicable (e.g. CPF data for foreigners)
   * 4 - Data retrieved from SingPass (e.g. email, mobileno)
   * @param {string} myInfoAttr The MyInfo attribute
   * @param {string?} myInfoValue myInfoValue returned by getMyInfoValue
   * @param {object} myInfoData MyInfo person data object returned from MyInfoGovAuthClient
   * @returns {boolean} Whether the field is readonly.
   */
  isFieldReadOnly(myInfoAttr, myInfoValue, myInfoData) {
    if (!myInfoAttr || !myInfoValue || !myInfoData || !myInfoData[myInfoAttr]) {
      return false
    }
    return (
      !!myInfoValue &&
      myInfoData[myInfoAttr].source === '1' &&
      ![
        'marital',
        'marriagedate',
        'divorcedate',
        'countryofmarriage',
        'marriagecertno',
      ].includes(myInfoAttr)
    )
  }

  // Helper methods to format MyInfo returned values.

  /**
   * Formats MyInfo attribute as phone number
   * @param {{nbr?: string, prefix?: string, code?: string}} phone
   * @example +65 98654321
   * @returns Phone number if phone.nbr exists. Else return empty string.
   */
  formatPhoneNumber(phone) {
    if (!phone || !phone.nbr) return ''

    return phone.prefix && phone.code && phone.nbr
      ? `${phone.prefix}${phone.code} ${phone.nbr}`
      : phone.nbr
  }

  /**
   * Formats MyInfo attribute as address
   * @param {{building?: string, block?: string, street?: string, floor?: string,unit?: string, country?: string, postal?: string}} addr The address to format.
   * @example '411 CHUA CHU KANG AVE 3, #12-3, SINGAPORE 238823'
   * @returns Formatted address if minimally the `block`, `street`, `country`,and `postal` values are not empty in {@link addr}. Else return empty string.
   */
  formatAddress(addr) {
    // Early return if missing required props in address.
    if (!addr || !(addr.block && addr.street && addr.country && addr.postal)) {
      return ''
    }

    const { building, block, street, floor, unit, country, postal } = addr

    // Create an array of data in the order:
    // 1. building (if available),
    // 2. block,
    // 3. street,
    // 4. floor + unit (if available),
    // 5. country
    // 6. postal
    const buildingBlocks = []

    if (building) {
      buildingBlocks.push(`${building},`)
    }
    buildingBlocks.push(block)
    buildingBlocks.push(`${street},`)

    if (floor && unit) {
      buildingBlocks.push(`#${floor}-${unit},`)
    }

    buildingBlocks.push(
      _.get(
        CATEGORICAL_DATA_DICT,
        ['birthcountry', country, 'description'],
        // Return country as default value if it is not in the dictionary.
        country,
      ),
    )

    buildingBlocks.push(postal)

    // Return string form with each block being separated by a space.
    return buildingBlocks.join(' ')
  }
}

module.exports = MyInfoService
