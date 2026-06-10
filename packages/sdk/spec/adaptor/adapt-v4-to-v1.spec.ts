import { adaptV4ToV1 } from '../../src/adapt-v4-to-v1'
import Crypto from '../../src/crypto'
import CryptoV3 from '../../src/crypto-v3'
import { FormField } from '../../src/types'
import { FieldResponsesV4 } from '../../src/types-v4'

/**
 * Round-trip parity harness.
 *
 * One source of answers is rendered twice: as the V1 content a storage-mode
 * submission would carry (per the V1 producer's transformInputsToOutputs
 * rules) and as the V4 content an MRF submission would carry. Both are
 * encrypted with their real envelopes and decrypted back, then the adapter's
 * output for the V4 side must equal the decrypted V1 side.
 *
 * `section` is deliberately absent here: the V1 producer renders it with
 * `isHeader: true`, while the adapter follows the admin frontend's flatten
 * (no isHeader) per the ADR 0001 fidelity contract. It is covered in the
 * direct tests below.
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
      // The V1 producer removes the sentinel and appends 'Others: x' at the
      // end; the frontend flatten replaces it in place. In production the
      // client always appends the sentinel last so the two agree — for the
      // unreachable not-last case, the fidelity contract follows the flatten.
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
