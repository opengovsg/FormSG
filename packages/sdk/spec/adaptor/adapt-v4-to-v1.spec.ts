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
