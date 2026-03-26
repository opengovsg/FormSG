import nacl from 'tweetnacl'
import { decodeBase64, encodeBase64 } from 'tweetnacl-util'

import { generateKeypair } from './util/crypto'
import { EncryptedFileContent } from './types'

export default class CryptoBase {
  /**
   * Generates a new keypair for encryption.
   * @returns The generated keypair.
   */
  generate = generateKeypair

  /**
   * Encrypt given binary file with a unique keypair for each submission.
   * @param binary The file to encrypt, should be a blob that is converted to Uint8Array binary
   * @param publicKey The base-64 encoded public key
   * @returns Promise holding the encrypted file
   * @throws error if any of the encrypt methods fail
   */
  encryptFile = async (
    binary: Uint8Array,
    publicKey: string
  ): Promise<EncryptedFileContent> => {
    const fileKeypair = this.generate()
    const nonce = nacl.randomBytes(24)
    return {
      //! NOTE: submissionPublicKey here is a misnomer as a new keypair is generated per file.
      // The naming is only retained for backward-compatibility purposes.
      submissionPublicKey: fileKeypair.publicKey,
      nonce: encodeBase64(nonce),
      binary: nacl.box(
        binary,
        nonce,
        decodeBase64(publicKey),
        decodeBase64(fileKeypair.secretKey)
      ),
    }
  }

  /**
   * Decrypt the given encrypted file content.
   * @param secretKey Secret key as a base-64 string
   * @param encrypted Object returned from encryptFile function
   * @param encrypted.submissionPublicKey The file's public key as a base-64 string
   * @param encrypted.nonce The nonce as a base-64 string
   * @param encrypted.blob The encrypted file as a Blob object
   */
  decryptFile = async (
    secretKey: string,
    {
      submissionPublicKey: filePublicKey,
      nonce,
      binary: encryptedBinary,
    }: EncryptedFileContent
  ): Promise<Uint8Array | null> => {
    return nacl.box.open(
      encryptedBinary,
      decodeBase64(nonce),
      decodeBase64(filePublicKey),
      decodeBase64(secretKey)
    )
  }
}
