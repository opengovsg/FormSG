// Import through the package entrypoint: the adapter is public SDK surface.
import Crypto from '../../src/crypto'
import CryptoV3 from '../../src/crypto-v3'
import { adaptV4ToV1 } from '../../src/index'
import { FormField } from '../../src/types'
import { FieldResponsesV4 } from '../../src/types-v4'

/**
 * Round-trip parity harness: each case's answers are rendered both as the
 * V1 content a storage-mode submission would carry (follows the V1 producer's
 * transformInputsToOutputs rules) and as the V4 content an MRF submission
 * would carry, then encrypted and decrypted.
 * Finally, the adapter's output for the V4 side is verified to equal the decrypted V1 side.
 *
 * `section` is deliberately absent: the V1 producer emits isHeader: true,
 * while the adapter follows the frontend flatten (no isHeader).
 */
type ParityCase = {
  name: string
  id: string
  v1: FormField
  v4: FieldResponsesV4[string]
}

const parityCases: ParityCase[] = [
  {
    name: 'textfield',
    id: '6200000000000000000000a1',
    v1: {
      _id: '6200000000000000000000a1',
      question: 'Your name',
      fieldType: 'textfield',
      answer: 'TAN AH KOW',
    },
    v4: {
      fieldType: 'textfield',
      question: 'Your name',
      answer: { value: 'TAN AH KOW' },
      provenance: { stepNumber: 1 },
    },
  },
  {
    name: 'dropdown',
    id: '6200000000000000000000a2',
    v1: {
      _id: '6200000000000000000000a2',
      question: 'Citizenship',
      fieldType: 'dropdown',
      answer: 'SINGAPORE CITIZEN',
    },
    v4: {
      fieldType: 'dropdown',
      question: 'Citizenship',
      answer: { value: 'SINGAPORE CITIZEN' },
      provenance: { stepNumber: 1 },
    },
  },
  {
    name: 'yes_no',
    id: '6200000000000000000000a3',
    v1: {
      _id: '6200000000000000000000a3',
      question: 'Do you agree?',
      fieldType: 'yes_no',
      answer: 'Yes',
    },
    v4: {
      fieldType: 'yes_no',
      question: 'Do you agree?',
      answer: { value: 'Yes' },
      provenance: { stepNumber: 1 },
    },
  },
  {
    name: 'email (verified, with signature)',
    id: '6200000000000000000000a4',
    v1: {
      _id: '6200000000000000000000a4',
      question: 'Your email',
      fieldType: 'email',
      answer: 'user@example.com',
      signature: 'dGVzdC1zaWduYXR1cmU=',
    },
    v4: {
      fieldType: 'email',
      question: 'Your email',
      answer: { value: 'user@example.com', signature: 'dGVzdC1zaWduYXR1cmU=' },
      provenance: { stepNumber: 1 },
    },
  },
  {
    name: 'email (unverified, no signature)',
    id: '6200000000000000000000a5',
    v1: {
      _id: '6200000000000000000000a5',
      question: 'Alternate email',
      fieldType: 'email',
      answer: 'other@example.com',
    },
    v4: {
      fieldType: 'email',
      question: 'Alternate email',
      answer: { value: 'other@example.com' },
      provenance: { stepNumber: 1 },
    },
  },
  {
    name: 'mobile (verified, with signature)',
    id: '6200000000000000000000a6',
    v1: {
      _id: '6200000000000000000000a6',
      question: 'Your mobile',
      fieldType: 'mobile',
      answer: '+6598765432',
      signature: 'bW9iaWxlLXNpZw==',
    },
    v4: {
      fieldType: 'mobile',
      question: 'Your mobile',
      answer: { value: '+6598765432', signature: 'bW9iaWxlLXNpZw==' },
      provenance: { stepNumber: 1 },
    },
  },
  {
    name: 'mobile (unverified, no signature)',
    id: '6200000000000000000000a7',
    v1: {
      _id: '6200000000000000000000a7',
      question: 'Backup mobile',
      fieldType: 'mobile',
      answer: '+6591234567',
    },
    v4: {
      fieldType: 'mobile',
      question: 'Backup mobile',
      answer: { value: '+6591234567' },
      provenance: { stepNumber: 1 },
    },
  },
  {
    name: 'radiobutton (regular option)',
    id: '6200000000000000000000a8',
    v1: {
      _id: '6200000000000000000000a8',
      question: 'Favourite colour',
      fieldType: 'radiobutton',
      answer: 'Blue',
    },
    v4: {
      fieldType: 'radiobutton',
      question: 'Favourite colour',
      answer: { value: 'Blue', isOthersInput: false },
      provenance: { stepNumber: 1 },
    },
  },
  {
    name: 'radiobutton (Others selected)',
    id: '6200000000000000000000a9',
    v1: {
      _id: '6200000000000000000000a9',
      question: 'Favourite fruit',
      fieldType: 'radiobutton',
      answer: 'Others: durian',
    },
    v4: {
      fieldType: 'radiobutton',
      question: 'Favourite fruit',
      answer: { value: 'durian', isOthersInput: true },
      provenance: { stepNumber: 1 },
    },
  },
  {
    name: 'radiobutton (Others selected, empty input)',
    id: '6200000000000000000000aa',
    v1: {
      _id: '6200000000000000000000aa',
      question: 'Favourite veg',
      fieldType: 'radiobutton',
      answer: 'Others: ',
    },
    v4: {
      fieldType: 'radiobutton',
      question: 'Favourite veg',
      answer: { value: '', isOthersInput: true },
      provenance: { stepNumber: 1 },
    },
  },
  {
    name: 'checkbox (regular options)',
    id: '6200000000000000000000ab',
    v1: {
      _id: '6200000000000000000000ab',
      question: 'Toppings',
      fieldType: 'checkbox',
      answerArray: ['Cheese', 'Mushroom'],
    },
    v4: {
      fieldType: 'checkbox',
      question: 'Toppings',
      answer: { value: ['Cheese', 'Mushroom'] },
      provenance: { stepNumber: 1 },
    },
  },
  {
    name: 'checkbox (Others checked)',
    id: '6200000000000000000000ac',
    v1: {
      _id: '6200000000000000000000ac',
      question: 'Sauces',
      fieldType: 'checkbox',
      answerArray: ['Ketchup', 'Others: sambal'],
    },
    v4: {
      fieldType: 'checkbox',
      question: 'Sauces',
      answer: {
        value: ['Ketchup', '!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!'],
        othersInput: 'sambal',
      },
      provenance: { stepNumber: 1 },
    },
  },
  {
    name: 'checkbox (only Others checked)',
    id: '6200000000000000000000ad',
    v1: {
      _id: '6200000000000000000000ad',
      question: 'Allergies',
      fieldType: 'checkbox',
      answerArray: ['Others: pollen'],
    },
    v4: {
      fieldType: 'checkbox',
      question: 'Allergies',
      answer: {
        value: ['!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!'],
        othersInput: 'pollen',
      },
      provenance: { stepNumber: 1 },
    },
  },
  {
    name: 'checkbox (no options selected)',
    id: '6200000000000000000000ae',
    v1: {
      _id: '6200000000000000000000ae',
      question: 'Optional extras',
      fieldType: 'checkbox',
      answerArray: [],
    },
    v4: {
      fieldType: 'checkbox',
      question: 'Optional extras',
      answer: { value: [] },
      provenance: { stepNumber: 1 },
    },
  },
  {
    name: 'attachment',
    id: '6200000000000000000000af',
    v1: {
      _id: '6200000000000000000000af',
      question: 'Upload your CV',
      fieldType: 'attachment',
      answer: 'resume.pdf',
    },
    v4: {
      fieldType: 'attachment',
      question: 'Upload your CV',
      answer: {
        value: 'resume.pdf',
        hasBeenScanned: true,
        md5Hash: 'd41d8cd98f00b204e9800998ecf8427e',
      },
      provenance: { stepNumber: 1 },
    },
  },
  {
    name: 'table (rows out of record order)',
    id: '6200000000000000000000b0',
    v1: {
      _id: '6200000000000000000000b0',
      question: 'Employment history',
      fieldType: 'table',
      answerArray: [
        ['OGP', 'Engineer'],
        ['GovTech', 'Manager'],
      ],
    },
    v4: {
      fieldType: 'table',
      question: 'Employment history',
      answer: {
        // record order deliberately disagrees with rowNum order
        row2: { rowNum: 1, value: { col1: 'GovTech', col2: 'Manager' } },
        row1: { rowNum: 0, value: { col1: 'OGP', col2: 'Engineer' } },
      },
      provenance: { stepNumber: 1 },
    },
  },
  {
    name: 'address (all subfields)',
    id: '6200000000000000000000b1',
    v1: {
      _id: '6200000000000000000000b1',
      question: 'Home address',
      fieldType: 'address',
      // V1 producer order: postalCode last
      answerArray: [
        '123',
        'Main Street',
        'Sunshine Tower',
        '10',
        '01',
        '654321',
      ],
    },
    v4: {
      fieldType: 'address',
      question: 'Home address',
      answer: {
        postalCode: { value: '654321' },
        blockNumber: { value: '123' },
        streetName: { value: 'Main Street' },
        buildingName: { value: 'Sunshine Tower' },
        levelNumber: { value: '10' },
        unitNumber: { value: '01' },
      },
      provenance: { stepNumber: 1 },
    },
  },
  {
    name: 'address (empty optional subfields)',
    id: '6200000000000000000000b2',
    v1: {
      _id: '6200000000000000000000b2',
      question: 'Office address',
      fieldType: 'address',
      answerArray: ['1', 'Short Road', '', '', '', '111111'],
    },
    v4: {
      fieldType: 'address',
      question: 'Office address',
      answer: {
        postalCode: { value: '111111' },
        blockNumber: { value: '1' },
        streetName: { value: 'Short Road' },
        buildingName: { value: '' },
        levelNumber: { value: '' },
        unitNumber: { value: '' },
      },
      provenance: { stepNumber: 1 },
    },
  },
  {
    name: 'signature (drawn)',
    id: '6200000000000000000000b3',
    v1: {
      _id: '6200000000000000000000b3',
      question: 'Sign here',
      fieldType: 'signature',
      // V1 producer: [type, JSON-stringified vector array]
      answerArray: [
        'draw',
        JSON.stringify([
          [
            [1, 2, 0],
            [3, 4, 1],
          ],
        ]),
      ],
    },
    v4: {
      fieldType: 'signature',
      question: 'Sign here',
      answer: {
        type: 'draw',
        value: [
          [
            [1, 2, 0],
            [3, 4, 1],
          ],
        ],
      },
      provenance: { stepNumber: 1 },
    },
  },
  {
    name: 'signature (empty)',
    id: '6200000000000000000000b4',
    v1: {
      _id: '6200000000000000000000b4',
      question: 'Optional signature',
      fieldType: 'signature',
      // V1 producer renders an unsigned signature as ['', '']
      answerArray: ['', ''],
    },
    v4: {
      fieldType: 'signature',
      question: 'Optional signature',
      answer: { type: 'draw', value: [] },
      provenance: { stepNumber: 1 },
    },
  },
  {
    name: 'nric',
    id: '6200000000000000000000b6',
    v1: {
      _id: '6200000000000000000000b6',
      question: 'Your NRIC',
      fieldType: 'nric',
      answer: 'S1234567A',
    },
    v4: {
      fieldType: 'nric',
      question: 'Your NRIC',
      answer: { value: 'S1234567A' },
      provenance: { stepNumber: 1 },
    },
  },
  {
    name: 'children (one row per child, values only)',
    id: '6200000000000000000000b5',
    v1: {
      _id: '6200000000000000000000b5',
      question: 'Your children',
      fieldType: 'children',
      // V1 producer: answerArray is the child rows (values only, no attrs)
      answerArray: [
        ['ALICE TAN', 'T1234567A'],
        ['BOB TAN', 'T7654321B'],
      ],
    },
    v4: {
      fieldType: 'children',
      question: 'Your children',
      answer: {
        child1: {
          value: {
            name: { value: 'ALICE TAN', myInfo: { attr: 'childname' } },
            birthCertNo: { value: 'T1234567A' },
          },
        },
        child2: {
          value: {
            name: { value: 'BOB TAN' },
            birthCertNo: { value: 'T7654321B' },
          },
        },
      },
      provenance: { stepNumber: 1 },
    },
  },
]

const buildV1Content = (cases: ParityCase[]): FormField[] =>
  cases.map((c) => c.v1)

const buildV4Content = (cases: ParityCase[]): FieldResponsesV4 =>
  Object.fromEntries(cases.map((c) => [c.id, c.v4]))

describe('adaptV4ToV1', () => {
  describe('encrypt/decrypt round-trip parity with V1 content', () => {
    const crypto = new Crypto()
    const cryptoV3 = new CryptoV3()
    const { publicKey: formPublicKey, secretKey: formSecretKey } =
      crypto.generate()

    const decryptBothAndAdapt = (cases: ParityCase[]) => {
      // V1 content through the storage-mode envelope
      const v1Encrypted = crypto.encrypt(buildV1Content(cases), formPublicKey)
      const v1Decrypted = crypto.decrypt(formSecretKey, {
        encryptedContent: v1Encrypted,
        version: 1,
      })
      expect(v1Decrypted).not.toBeNull()

      // V4 content through the MRF envelope
      const v4Encrypted = cryptoV3.encrypt(buildV4Content(cases), formPublicKey)
      const v4Decrypted = cryptoV3.decrypt(formSecretKey, {
        encryptedContent: v4Encrypted.encryptedContent,
        encryptedSubmissionSecretKey: v4Encrypted.encryptedSubmissionSecretKey,
        version: 3,
      })
      expect(v4Decrypted).not.toBeNull()

      return {
        adapted: adaptV4ToV1(v4Decrypted!.responses as FieldResponsesV4),
        v1Responses: v1Decrypted!.responses,
      }
    }

    it.each(parityCases)(
      'should adapt the $name response to its decrypted V1 form',
      (parityCase) => {
        const { adapted, v1Responses } = decryptBothAndAdapt([parityCase])
        expect(adapted).toEqual(v1Responses)
      }
    )

    it('should adapt the full submission to its decrypted V1 form', () => {
      const { adapted, v1Responses } = decryptBothAndAdapt(parityCases)
      expect(adapted).toEqual(v1Responses)
    })
  })

  describe('direct adapter behaviour', () => {
    it('should replace the checkbox Others sentinel in place, following the frontend flatten', () => {
      // The V1 producer appends 'Others: x' at the end; the flatten replaces
      // the sentinel in place. The client always appends the sentinel last,
      // so the two agree in production; this unreachable case follows the
      // flatten.
      const v4: FieldResponsesV4 = {
        field1: {
          fieldType: 'checkbox',
          question: 'Q',
          answer: {
            value: ['!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!', 'B'],
            othersInput: 'first',
          },
          provenance: {},
        },
      }

      expect(adaptV4ToV1(v4)).toEqual([
        {
          _id: 'field1',
          question: 'Q',
          fieldType: 'checkbox',
          answerArray: ['Others: first', 'B'],
        },
      ])
    })

    it('should leave the checkbox Others sentinel untouched when no others input exists, following the frontend flatten', () => {
      const v4: FieldResponsesV4 = {
        field1: {
          fieldType: 'checkbox',
          question: 'Q',
          answer: {
            value: ['A', '!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!'],
          },
          provenance: {},
        },
      }

      expect(adaptV4ToV1(v4)).toEqual([
        {
          _id: 'field1',
          question: 'Q',
          fieldType: 'checkbox',
          answerArray: ['A', '!!FORMSG_INTERNAL_CHECKBOX_OTHERS_VALUE!!'],
        },
      ])
    })

    it('should adapt an empty record to an empty array', () => {
      expect(adaptV4ToV1({})).toEqual([])
    })

    it('should preserve the record insertion order, not field id or form order', () => {
      const v4: FieldResponsesV4 = {
        zzz999: {
          fieldType: 'textfield',
          question: 'Third question on the form',
          answer: { value: 'first inserted' },
          provenance: { stepNumber: 2 },
        },
        aaa111: {
          fieldType: 'textfield',
          question: 'First question on the form',
          answer: { value: 'second inserted' },
          provenance: { stepNumber: 1 },
        },
        mmm555: {
          fieldType: 'textfield',
          question: 'Second question on the form',
          answer: { value: 'third inserted' },
          provenance: { stepNumber: 1 },
        },
      }

      expect(adaptV4ToV1(v4).map((f) => f._id)).toEqual([
        'zzz999',
        'aaa111',
        'mmm555',
      ])
    })

    it('should drop myInfo and previousAnswers metadata from the output', () => {
      const withMetadata: FieldResponsesV4 = {
        field1: {
          fieldType: 'textfield',
          question: 'Name',
          answer: { value: 'TAN AH KOW' },
          provenance: { stepNumber: 2 },
          myInfo: { attr: 'name' },
          previousAnswers: [
            {
              answer: { value: 'OLD NAME' },
              provenance: { stepNumber: 1 },
            },
          ],
        },
      }
      const withoutMetadata: FieldResponsesV4 = {
        field1: {
          fieldType: 'textfield',
          question: 'Name',
          answer: { value: 'TAN AH KOW' },
          provenance: { stepNumber: 2 },
        },
      }

      expect(adaptV4ToV1(withMetadata)).toEqual(adaptV4ToV1(withoutMetadata))
      expect(adaptV4ToV1(withMetadata)).toEqual([
        {
          _id: 'field1',
          question: 'Name',
          fieldType: 'textfield',
          answer: 'TAN AH KOW',
        },
      ])
    })

    it('should pass through an unknown field type as a string answer', () => {
      const v4 = {
        field1: {
          fieldType: 'hologram',
          question: 'Future field',
          answer: { value: 'beamed' },
          provenance: {},
        },
      } as unknown as FieldResponsesV4

      expect(adaptV4ToV1(v4)).toEqual([
        {
          _id: 'field1',
          question: 'Future field',
          fieldType: 'hologram',
          answer: 'beamed',
        },
      ])
    })

    describe('malformed entries throw, so the decrypt layer can return null', () => {
      it('should throw when a string field answer value is missing', () => {
        const v4 = {
          field1: {
            fieldType: 'textfield',
            question: 'Q',
            answer: {},
            provenance: {},
          },
        } as unknown as FieldResponsesV4

        expect(() => adaptV4ToV1(v4)).toThrow()
      })

      it('should throw when a string field answer value has the wrong type', () => {
        const v4 = {
          field1: {
            fieldType: 'textfield',
            question: 'Q',
            answer: { value: 42 },
            provenance: {},
          },
        } as unknown as FieldResponsesV4

        expect(() => adaptV4ToV1(v4)).toThrow()
      })

      it('should throw when the answer is missing entirely', () => {
        const v4 = {
          field1: {
            fieldType: 'textfield',
            question: 'Q',
            provenance: {},
          },
        } as unknown as FieldResponsesV4

        expect(() => adaptV4ToV1(v4)).toThrow()
      })

      it('should throw when a checkbox answer value is not an array', () => {
        const v4 = {
          field1: {
            fieldType: 'checkbox',
            question: 'Q',
            answer: { value: 'not-an-array' },
            provenance: {},
          },
        } as unknown as FieldResponsesV4

        expect(() => adaptV4ToV1(v4)).toThrow()
      })

      it('should throw when a signature answer value is not an array', () => {
        const v4 = {
          field1: {
            fieldType: 'signature',
            question: 'Q',
            answer: { type: 'draw', value: 'scribble' },
            provenance: {},
          },
        } as unknown as FieldResponsesV4

        expect(() => adaptV4ToV1(v4)).toThrow()
      })

      it('should throw when an address answer is missing subfields', () => {
        const v4 = {
          field1: {
            fieldType: 'address',
            question: 'Q',
            answer: { postalCode: { value: '654321' } },
            provenance: {},
          },
        } as unknown as FieldResponsesV4

        expect(() => adaptV4ToV1(v4)).toThrow()
      })
    })

    it('should adapt a section response without isHeader, following the frontend flatten', () => {
      // Deviation from the V1 producer (which emits isHeader: true) — the
      // ADR 0001 fidelity contract prefers the frontend flatten's rendering
      // for production-reachable V4 inputs.
      const v4: FieldResponsesV4 = {
        field1: {
          fieldType: 'section',
          question: 'Part A',
          answer: { value: '' },
          provenance: {},
        },
      }

      expect(adaptV4ToV1(v4)).toEqual([
        {
          _id: 'field1',
          question: 'Part A',
          fieldType: 'section',
          answer: '',
        },
      ])
    })
  })
})
