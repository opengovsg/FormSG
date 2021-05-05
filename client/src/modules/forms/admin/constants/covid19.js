/**
 * COVID-19 Hardcoded Form Templates
 * =================================
 * 1. COVID-19 Employee Feedback Form
 * 2. Health and Travel Declaration
 * 3. Temperature Taking
 * 4. Volunteer Registration
 *
 * For each template, we remove the following top-level field:
 *  - _id
 *  - reponseMode (encrypt/email)
 *  - status (private/public)
 *
 * We also set admin.agency.logo to the FormSG logo URL
 * Also added '.' to all the first sentence in the title.
 */

const templates = [
  {
    admin: {
      agency: {
        logo:
          'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/formsg-logo.svg',
      },
    },
    authType: 'NIL',
    endPage: {
      title: 'We appreciate your feedback!',
      buttonText: 'Submit another form',
      buttons: [],
      buttonLink: '',
    },
    form_fields: [
      {
        fieldOptions: ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'],
        title:
          'How confident are you in fulfilling your work duties during this COVID-19 situation?',
        description: '(1 = very low, 10 = very high)',
        required: true,
        disabled: false,
        fieldType: 'dropdown',
        _id: '5e83fff04013e50011d30388',
      },
      {
        fieldOptions: ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'],
        title:
          'How well have you adapted to the changes in working arrangements and environment caused by  the COVID-19 situation?',
        description:
          'e.g. telecommuting, work-from-home, split-team implementation\n(1 = very low, 10 = very high)',
        required: true,
        disabled: false,
        fieldType: 'dropdown',
        _id: '5e84001c4013e50011d303cc',
        fieldValue: '',
      },
      {
        fieldOptions: ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'],
        title:
          "How clear has the Organisation's communication with you been regarding and throughout this COVID-19 situation?",
        description:
          "e.g. management emails, HR's instructions, supervisor's briefings\n(1 = very low, 10 = very high)",
        required: true,
        disabled: false,
        fieldType: 'dropdown',
        _id: '5e84006a433b3b0011385204',
        fieldValue: '',
      },
      {
        fieldOptions: ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'],
        title:
          'How comfortable do you feel raising any COVID-related issues or concerns to your supervisor?',
        description: '(1 = very low, 10 = very high)',
        required: true,
        disabled: false,
        fieldType: 'dropdown',
        _id: '5e8400964013e50011d30478',
        fieldValue: '',
      },
      {
        fieldOptions: ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'],
        title:
          'How well is the Organisation supporting you as an employee in this period?',
        description:
          'e.g. IT support, support for alternative work arrangements and volunteering, well-being support such as hand sanitiser\n(1 = very low, 10 = very high)',
        required: true,
        disabled: false,
        fieldType: 'dropdown',
        _id: '5e8400d84013e50011d304dc',
        fieldValue: '',
      },
      {
        fieldOptions: ['10', '9', '8', '7', '6', '5', '4', '3', '2', '1'],
        title:
          'How confident are you that the Organisation has taken the necessary precautions to protect your well-being amidst the outbreak?',
        description: '(1 = very low, 10 = very high)',
        required: true,
        disabled: false,
        fieldType: 'dropdown',
        _id: '5e8400fa433b3b00113852f4',
        fieldValue: '',
      },
      {
        ValidationOptions: {
          customMax: null,
          customMin: null,
          customVal: null,
          selectedValidation: null,
        },
        title:
          'Is there any additional support you need to carry out your work during this period?',
        description: '',
        required: false,
        disabled: false,
        fieldType: 'textarea',
        _id: '5e9614d878a996001147764b',
        fieldValue: '',
      },
      {
        ValidationOptions: {
          customMax: null,
          customMin: null,
          customVal: null,
          selectedValidation: null,
        },
        title: 'Any other feedback or concerns you would like to share?',
        description: '',
        required: false,
        disabled: false,
        fieldType: 'textarea',
        _id: '5e9614e70809d700111a239f',
        fieldValue: '',
      },
      {
        autoReplyOptions: {
          hasAutoReply: false,
          autoReplySubject: '',
          autoReplySender: '',
          autoReplyMessage: '',
          includeFormSummary: false,
        },
        isVerifiable: false,
        title:
          "Please provide your work email address if you don't mind being contacted about your feedback",
        description: '',
        required: false,
        disabled: false,
        fieldType: 'email',
        _id: '5e961d80fc26690011d0a0da',
        fieldValue: '',
      },
    ],
    form_logics: [],
    hasCaptcha: false,
    startPage: {
      colorTheme: 'grey',
      logo: {
        state: 'DEFAULT',
      },
      estTimeTaken: 10,
      paragraph:
        'How are employees coping with changes to working arrangements as we battle COVID-19?',
    },
    title: 'COVID-19 Employee Feedback Form',
  },
  {
    admin: {
      agency: {
        logo:
          'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/formsg-logo.svg',
      },
    },
    authType: 'NIL',
    endPage: {
      title: 'Thank you for submitting your declaration.',
      buttonText: 'Submit another form',
      buttons: [],
      buttonLink: '',
    },
    form_fields: [
      {
        title: 'Personal Particulars',
        description: '',
        required: true,
        disabled: false,
        fieldType: 'section',
        _id: '5e96041878a99600114773d4',
        fieldValue: '',
      },
      {
        ValidationOptions: {
          customMax: null,
          customMin: null,
          customVal: null,
          selectedValidation: null,
        },
        title: 'Full Name',
        description: '',
        required: true,
        disabled: false,
        fieldType: 'textfield',
        _id: '5e3be2bf0001c00011b436f8',
        fieldValue: '',
      },
      {
        fieldOptions: ['Singapore Citizen or Permanent Resident'],
        othersRadioButton: true,
        title: 'Nationality',
        description: '',
        required: true,
        disabled: false,
        fieldType: 'radiobutton',
        _id: '5e3d2cd44bfa3c001134fad9',
      },
      {
        title: 'NRIC / FIN',
        description: '',
        required: true,
        disabled: false,
        fieldType: 'nric',
        _id: '5e3d260b0001c00011b47d5f',
        fieldValue: '',
      },
      {
        autoReplyOptions: {
          hasAutoReply: false,
          autoReplySubject: '',
          autoReplySender: '',
          autoReplyMessage: '',
          includeFormSummary: false,
        },
        isVerifiable: false,
        title: 'Email Address',
        description: '',
        required: true,
        disabled: false,
        fieldType: 'email',
        _id: '5e960aaa78a996001147750b',
        fieldValue: '',
      },
      {
        title: 'Contact Number',
        description: 'Singapore mobile number',
        allowIntlNumbers: false,
        isVerifiable: false,
        required: true,
        disabled: false,
        fieldType: 'mobile',
        _id: '5e3d328bae17b00011e729fb',
        fieldValue: '',
      },
      {
        ValidationOptions: {
          customMax: null,
          customMin: null,
          customVal: null,
          selectedValidation: null,
        },
        title: 'Residential Address',
        description: 'Block, street name and unit number, where applicable',
        required: true,
        disabled: false,
        fieldType: 'textarea',
        _id: '5e3bd959c29ac50011eb8fbc',
        fieldValue: '',
      },
      {
        ValidationOptions: {
          customMax: 6,
          customMin: 6,
          customVal: 6,
          selectedValidation: 'Exact',
        },
        title: 'Postal Code',
        description: 'Singapore 6-digit postal code',
        required: true,
        disabled: false,
        fieldType: 'number',
        _id: '5e9604cb0809d700111a2185',
        fieldValue: '',
      },
      {
        title: 'Health Declaration',
        description: '',
        required: true,
        disabled: false,
        fieldType: 'section',
        _id: '5e3d310b4bfa3c001134fc2a',
        fieldValue: '',
      },
      {
        title:
          'Have you, or anyone living with you, been diagnosed with COVID-19?',
        description: '',
        required: true,
        disabled: false,
        fieldType: 'yes_no',
        _id: '5e3d3118e41f590012017548',
      },
      {
        title:
          'Are you, or anyone living with you, experiencing respiratory or flu-like symptoms?',
        description:
          'Fever, shortness of breath, cough, sore throat, runny nose, body ache, headache',
        required: true,
        disabled: false,
        fieldType: 'yes_no',
        _id: '5e3d3169f9a57600115a03a0',
      },
      {
        title:
          'Are you, or anyone living with you, under a Home Quarantine Order, Stay Home Notice, or Leave of Absence?',
        description: '',
        required: true,
        disabled: false,
        fieldType: 'yes_no',
        _id: '5e3d3123ebccff001168e9c3',
      },
      {
        title:
          'Within the past 14 days, have you or anyone living with you had close contact with',
        description:
          '- A confirmed COVID-19 case, or\n- Anyone under Home Quarantine Order?',
        required: true,
        disabled: false,
        fieldType: 'yes_no',
        _id: '5e3d31950408ad001131cf56',
      },
      {
        ValidationOptions: {
          customMax: null,
          customMin: null,
          customVal: null,
          selectedValidation: null,
        },
        title:
          "Please provide details for all the questions you checked '✓ Yes' to.",
        description: '',
        required: true,
        disabled: false,
        fieldType: 'textarea',
        _id: '5e3d31ddc29ac50011ebd973',
        fieldValue: '',
      },
      {
        title: 'Travel Declaration',
        description: '',
        required: true,
        disabled: false,
        fieldType: 'section',
        _id: '5e96069e78a9960011477452',
        fieldValue: '',
      },
      {
        title:
          'Have you, or anyone living with you, travelled overseas in the past 14 days?',
        description: '',
        required: true,
        disabled: false,
        fieldType: 'yes_no',
        _id: '5e3d3134f9a57600115a0391',
      },
      {
        ValidationOptions: {
          customMax: null,
          customMin: null,
          customVal: null,
          selectedValidation: null,
        },
        title:
          'For all locations travelled to, please list traveller details, country, city and travel dates (dd/mm/yyyy)',
        description:
          'e.g. Sister living with me, France, Paris, 01/02/2020 - 28/02/2020',
        required: true,
        disabled: false,
        fieldType: 'textarea',
        _id: '5e9609640809d700111a223c',
        fieldValue: '',
      },
      {
        dateValidation: {
          customMinDate: null,
          customMaxDate: null,
          selectedDateValidation: null,
        },
        title: 'Date of return to Singapore',
        description: '',
        required: true,
        disabled: false,
        fieldType: 'date',
        _id: '5e3ed8b45203c3001108bbc9',
        fieldValue: '',
      },
      {
        title: 'Last Temperature Recorded',
        description: '',
        required: true,
        disabled: false,
        fieldType: 'section',
        _id: '5e96092efc26690011d09e76',
        fieldValue: '',
      },
      {
        dateValidation: {
          customMinDate: null,
          customMaxDate: null,
          selectedDateValidation: null,
        },
        title: 'Date of last temperature recording',
        description: '',
        required: true,
        disabled: false,
        fieldType: 'date',
        _id: '5e960ad1fc26690011d09edc',
        fieldValue: '',
      },
      {
        ValidationOptions: {
          customMin: 35,
          customMax: 45,
        },
        validateByValue: true,
        title: 'Last temperature recorded',
        description:
          'Enter your last temperature recorded to the nearest decimal place (e.g. 36.5)',
        required: true,
        disabled: false,
        fieldType: 'decimal',
        _id: '5e960b0bfc26690011d09ee6',
        fieldValue: '',
      },
      {
        ValidationOptions: {
          customMin: null,
          customMax: null,
        },
        fieldOptions: [
          'I declare that all information provided above is true, correct and accurate.',
        ],
        othersRadioButton: false,
        validateByValue: false,
        title: 'Declaration',
        description: '',
        required: true,
        disabled: false,
        fieldType: 'checkbox',
        _id: '5e3cc7d7f1bd9500112b336c',
        fieldValue: [false, false],
      },
    ],
    form_logics: [
      {
        show: ['5e9609640809d700111a223c', '5e3ed8b45203c3001108bbc9'],
        logicType: 'showFields',
        conditions: [
          {
            ifValueType: 'single-select',
            _id: '2985',
            field: '5e3d3134f9a57600115a0391',
            state: 'is equals to',
            value: 'Yes',
          },
        ],
        _id: '5e3d338cf1bd9500112b5570',
      },
      {
        show: ['5e3d31ddc29ac50011ebd973'],
        logicType: 'showFields',
        conditions: [
          {
            ifValueType: 'single-select',
            _id: '36446',
            field: '5e3d3169f9a57600115a03a0',
            state: 'is equals to',
            value: 'Yes',
          },
        ],
        _id: '5e3d33a10001c00011b481d8',
      },
      {
        show: ['5e3d31ddc29ac50011ebd973'],
        logicType: 'showFields',
        conditions: [
          {
            ifValueType: 'single-select',
            _id: '72041',
            field: '5e3d31950408ad001131cf56',
            state: 'is equals to',
            value: 'Yes',
          },
        ],
        _id: '5e3d33b4c29ac50011ebd9fe',
      },
      {
        show: ['5e3d31ddc29ac50011ebd973'],
        logicType: 'showFields',
        conditions: [
          {
            ifValueType: 'single-select',
            _id: '63179',
            field: '5e3d3118e41f590012017548',
            state: 'is equals to',
            value: 'Yes',
          },
        ],
        _id: '5e960a29fc26690011d09ec7',
      },
      {
        show: ['5e3d31ddc29ac50011ebd973'],
        logicType: 'showFields',
        conditions: [
          {
            ifValueType: 'single-select',
            _id: '30746',
            field: '5e3d3123ebccff001168e9c3',
            state: 'is equals to',
            value: 'Yes',
          },
        ],
        _id: '5e960a4c78a99600114774fd',
      },
    ],
    hasCaptcha: true,
    startPage: {
      colorTheme: 'blue',
      logo: {
        state: 'DEFAULT',
      },
      estTimeTaken: 5,
      paragraph: 'For visitors, staff and event attendees.',
    },
    title: 'Health and Travel Declaration',
  },
  {
    admin: {
      agency: {
        logo:
          'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/formsg-logo.svg',
      },
    },
    authType: 'NIL',
    endPage: {
      title: 'Thank you for filling out the form.',
      buttonText: 'Submit another form',
      buttons: [],
      buttonLink: '',
      paragraph:
        'Please be reminded that you are to submit your daily temperature taken via this form.',
    },
    form_fields: [
      {
        ValidationOptions: {
          customMax: null,
          customMin: null,
          customVal: null,
          selectedValidation: null,
        },
        title: 'Full Name',
        description: '',
        required: true,
        disabled: false,
        fieldType: 'textfield',
        _id: '5e960d0a78a996001147755b',
        fieldValue: '',
      },
      {
        autoReplyOptions: {
          hasAutoReply: false,
          autoReplySubject: '',
          autoReplySender: '',
          autoReplyMessage: '',
          includeFormSummary: false,
        },
        isVerifiable: false,
        title: 'Work Email',
        description: '',
        required: true,
        disabled: false,
        fieldType: 'email',
        _id: '5e960f130809d700111a2309',
        fieldValue: '',
      },
      {
        dateValidation: {
          customMinDate: null,
          customMaxDate: null,
          selectedDateValidation: null,
        },
        title: 'Date',
        description: '',
        required: true,
        disabled: false,
        fieldType: 'date',
        _id: '5e41399e4d8c1600113a1738',
        fieldValue: '',
      },
      {
        fieldOptions: ['AM', 'PM'],
        othersRadioButton: false,
        title: 'Time',
        description: 'Please select either AM or PM',
        required: true,
        disabled: false,
        fieldType: 'radiobutton',
        _id: '5e4134ea4ed7dc00111c2aea',
        fieldValue: '',
      },
      {
        ValidationOptions: {
          customMin: 35,
          customMax: 45,
        },
        validateByValue: true,
        title: 'Temperature',
        description:
          'Enter your temperature in degrees Celsius (°C) to the nearest decimal place (e.g. 36.5)',
        required: true,
        disabled: false,
        fieldType: 'decimal',
        _id: '5e9611b378a99600114775f4',
        fieldValue: '',
      },
      {
        title: 'Are you experiencing any respiratory or flu-like symptoms?',
        description:
          'e.g. fever, shortness of breath, cough, sore throat, running nose, headache, body ache',
        required: true,
        disabled: false,
        fieldType: 'yes_no',
        _id: '5e45e9b190b2a700117bfcb5',
      },
      {
        ValidationOptions: {
          customMax: null,
          customMin: null,
          customVal: null,
          selectedValidation: null,
        },
        title: 'Please specify which symptoms',
        description: '',
        required: true,
        disabled: false,
        fieldType: 'textfield',
        _id: '5e4144d24d8c1600113a1914',
        fieldValue: '',
      },
    ],
    form_logics: [
      {
        show: ['5e4144d24d8c1600113a1914'],
        logicType: 'showFields',
        conditions: [
          {
            ifValueType: 'single-select',
            _id: '79576',
            field: '5e45e9b190b2a700117bfcb5',
            state: 'is equals to',
            value: 'Yes',
          },
        ],
        _id: '5e4647ee351f7400111dee15',
      },
    ],
    hasCaptcha: false,
    startPage: {
      colorTheme: 'green',
      logo: {
        state: 'DEFAULT',
      },
      estTimeTaken: 1,
      paragraph:
        'Submit daily temperature recordings via this form.\n\nFor automated alerts of ≥38°C and missing temperature reports, please onboard your agency using the TemperatureSG Whitelist Form.',
    },
    title: 'Temperature Taking',
  },
  {
    admin: {
      agency: {
        logo:
          'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/formsg-logo.svg',
      },
    },
    authType: 'NIL',
    endPage: {
      title: 'Thank you for registering your interest.',
      buttonText: 'Submit another form',
      buttons: [],
      buttonLink: '',
      paragraph:
        'Our volunteer management team will be in touch with you shortly.',
    },
    form_fields: [
      {
        title: 'Personal Particulars',
        description: '',
        required: true,
        disabled: false,
        fieldType: 'section',
        _id: '5e96041878a99600114773d4',
        fieldValue: '',
      },
      {
        ValidationOptions: {
          customMax: null,
          customMin: null,
          customVal: null,
          selectedValidation: null,
        },
        title: 'Full Name',
        description: '',
        required: true,
        disabled: false,
        fieldType: 'textfield',
        _id: '5e3be2bf0001c00011b436f8',
        fieldValue: '',
      },
      {
        autoReplyOptions: {
          hasAutoReply: false,
          autoReplySubject: '',
          autoReplySender: '',
          autoReplyMessage: '',
          includeFormSummary: false,
        },
        isVerifiable: false,
        title: 'Email Address',
        description: '',
        required: true,
        disabled: false,
        fieldType: 'email',
        _id: '5e960aaa78a996001147750b',
        fieldValue: '',
      },
      {
        title: 'Contact Number',
        description: 'Singapore mobile number',
        allowIntlNumbers: false,
        isVerifiable: false,
        required: true,
        disabled: false,
        fieldType: 'mobile',
        _id: '5e3d328bae17b00011e729fb',
        fieldValue: '',
      },
      {
        ValidationOptions: {
          customMax: null,
          customMin: null,
          customVal: null,
          selectedValidation: null,
        },
        title: 'Residential Address',
        description: 'Block, street name and unit number, where applicable',
        required: true,
        disabled: false,
        fieldType: 'textarea',
        _id: '5e3bd959c29ac50011eb8fbc',
        fieldValue: '',
      },
      {
        ValidationOptions: {
          customMax: 6,
          customMin: 6,
          customVal: 6,
          selectedValidation: 'Exact',
        },
        title: 'Postal Code',
        description: 'Singapore 6-digit postal code',
        required: true,
        disabled: false,
        fieldType: 'number',
        _id: '5e9604cb0809d700111a2185',
        fieldValue: '',
      },
      {
        title: 'Availability',
        description: '',
        required: true,
        disabled: false,
        fieldType: 'section',
        _id: '5e9619b178a99600114776bf',
        fieldValue: '',
      },
      {
        ValidationOptions: {
          customMin: 1,
          customMax: null,
        },
        fieldOptions: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
          'Sunday',
        ],
        othersRadioButton: false,
        validateByValue: true,
        title: 'Preferred Days',
        description: 'Check all that apply',
        required: true,
        disabled: false,
        fieldType: 'checkbox',
        _id: '5e961a8278a99600114776d6',
        fieldValue: [false, false, false, false, false, false, false, false],
      },
      {
        ValidationOptions: {
          customMin: 1,
          customMax: null,
        },
        fieldOptions: ['1 Jul 2020', '2 Jul 2020', '3 Jul 2020'],
        othersRadioButton: false,
        validateByValue: true,
        title: 'Preferred Dates',
        description: 'Check all that apply',
        required: true,
        disabled: false,
        fieldType: 'checkbox',
        _id: '5e961a3178a99600114776ca',
        fieldValue: [false, false, false, false],
      },
      {
        ValidationOptions: {
          customMin: 1,
          customMax: null,
        },
        fieldOptions: [
          '9.00am - 12.00pm',
          '1.00pm - 4.00pm',
          '6.00pm - 9.00pm',
        ],
        othersRadioButton: false,
        validateByValue: true,
        title: 'Preferred Timeslots',
        description: 'Check all that apply',
        required: true,
        disabled: false,
        fieldType: 'checkbox',
        _id: '5e961b410809d700111a244d',
        fieldValue: [false, false, false, false],
      },
      {
        ValidationOptions: {
          customMin: 1,
          customMax: null,
        },
        fieldOptions: ['North', 'South', 'East', 'West', 'Central'],
        othersRadioButton: false,
        validateByValue: true,
        title: 'Preferred Locations',
        description: 'Check all that apply',
        required: true,
        disabled: false,
        fieldType: 'checkbox',
        _id: '5e961b8d0809d700111a2458',
        fieldValue: [false, false, false, false, false, false],
      },
      {
        title: 'Health Declaration',
        description: '',
        required: true,
        disabled: false,
        fieldType: 'section',
        _id: '5e3d310b4bfa3c001134fc2a',
        fieldValue: '',
      },
      {
        title:
          'Have you, or anyone living with you, been diagnosed with COVID-19?',
        description: '',
        required: true,
        disabled: false,
        fieldType: 'yes_no',
        _id: '5e3d3118e41f590012017548',
      },
      {
        title:
          'Are you, or anyone living with you, experiencing respiratory or flu-like symptoms?',
        description:
          'Fever, shortness of breath, cough, sore throat, runny nose, body ache, headache',
        required: true,
        disabled: false,
        fieldType: 'yes_no',
        _id: '5e3d3169f9a57600115a03a0',
      },
      {
        title:
          'Are you, or anyone living with you, under a Home Quarantine Order, Stay Home Notice, or Leave of Absence?',
        description: '',
        required: true,
        disabled: false,
        fieldType: 'yes_no',
        _id: '5e3d3123ebccff001168e9c3',
      },
      {
        title:
          'Within the past 14 days, have you or anyone living with you had close contact with',
        description:
          '- A confirmed COVID-19 case, or\n- Anyone under Home Quarantine Order?',
        required: true,
        disabled: false,
        fieldType: 'yes_no',
        _id: '5e3d31950408ad001131cf56',
      },
      {
        ValidationOptions: {
          customMax: null,
          customMin: null,
          customVal: null,
          selectedValidation: null,
        },
        title:
          "Please provide details for all the questions you checked '✓ Yes' to.",
        description: '',
        required: true,
        disabled: false,
        fieldType: 'textarea',
        _id: '5e3d31ddc29ac50011ebd973',
        fieldValue: '',
      },
    ],
    form_logics: [
      {
        show: ['5e3d31ddc29ac50011ebd973'],
        logicType: 'showFields',
        conditions: [
          {
            ifValueType: 'single-select',
            _id: '36446',
            field: '5e3d3169f9a57600115a03a0',
            state: 'is equals to',
            value: 'Yes',
          },
        ],
        _id: '5e3d33a10001c00011b481d8',
      },
      {
        show: ['5e3d31ddc29ac50011ebd973'],
        logicType: 'showFields',
        conditions: [
          {
            ifValueType: 'single-select',
            _id: '72041',
            field: '5e3d31950408ad001131cf56',
            state: 'is equals to',
            value: 'Yes',
          },
        ],
        _id: '5e3d33b4c29ac50011ebd9fe',
      },
      {
        show: ['5e3d31ddc29ac50011ebd973'],
        logicType: 'showFields',
        conditions: [
          {
            ifValueType: 'single-select',
            _id: '63179',
            field: '5e3d3118e41f590012017548',
            state: 'is equals to',
            value: 'Yes',
          },
        ],
        _id: '5e960a29fc26690011d09ec7',
      },
      {
        show: ['5e3d31ddc29ac50011ebd973'],
        logicType: 'showFields',
        conditions: [
          {
            ifValueType: 'single-select',
            _id: '30746',
            field: '5e3d3123ebccff001168e9c3',
            state: 'is equals to',
            value: 'Yes',
          },
        ],
        _id: '5e960a4c78a99600114774fd',
      },
    ],
    hasCaptcha: true,
    startPage: {
      colorTheme: 'red',
      logo: {
        state: 'DEFAULT',
      },
      estTimeTaken: 5,
      paragraph:
        'Collect volunteer particulars, availability and health declarations.',
    },
    title: 'Volunteer Registration',
  },
]

module.exports = { templates }
