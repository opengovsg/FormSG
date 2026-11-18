import { GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import assert from 'assert/strict'

import { aws as AwsConfig } from 'src/app/config/config'
import { s3Operations } from 'src/app/utils/aws-s3'

/** An external S3 substitute: downloads fail unless the object was uploaded.
 * Snapshot serialization, attachment encryption and submission persistence stay real.
 * The URLs are opaque so assertions cannot reconstruct the signing implementation.
 */
export class FakeS3 {
  private objects = new Map<string, Buffer>()
  private downloads = new Map<string, { bucket: string; key: string }>()
  private beforeV1Upload: () => Promise<void> = async () => undefined

  install() {
    jest.spyOn(AwsConfig.s3, 'send').mockImplementation(async (command) => {
      if (command instanceof PutObjectCommand) {
        const { Bucket, Key, Body } = command.input
        if (Bucket === AwsConfig.submissionHistoryV1AttachmentS3Bucket) {
          await this.beforeV1Upload()
        }
        this.objects.set(
          `${Bucket}/${Key}`,
          Buffer.from(Body as string | Uint8Array),
        )
        return {}
      }
      if (command instanceof GetObjectCommand) {
        const { Bucket, Key } = command.input
        const body = this.read(Bucket!, Key!)
        return { Body: { transformToString: async () => body.toString() } }
      }
      return Promise.reject(new Error('Unexpected S3 operation'))
    })
    jest
      .spyOn(s3Operations, 'getSignedUrl')
      .mockImplementation(async ({ Bucket, Key }) => {
        const url = `https://attachments.example/download/${this.downloads.size}`
        this.downloads.set(url, { bucket: Bucket!, key: Key! })
        return url
      })
  }

  read(bucket: string, key: string): Buffer {
    const object = this.objects.get(`${bucket}/${key}`)
    assert(object, `No uploaded object at ${bucket}/${key}`)
    return object
  }

  download(url: string, expectedBucket: string): Buffer {
    const target = this.targetOf(url)
    assert.equal(
      target.bucket,
      expectedBucket,
      'Attachment URL targets the wrong bucket',
    )
    return this.read(target.bucket, target.key)
  }

  targetOf(url: string): { bucket: string; key: string } {
    const target = this.downloads.get(url)
    assert(target, `Unknown attachment URL: ${url}`)
    return target
  }

  objectsIn(bucket: string): Buffer[] {
    return [...this.objects.entries()]
      .filter(([key]) => key.startsWith(`${bucket}/`))
      .map(([, body]) => body)
  }

  failAfterOneV1Upload() {
    let first = true
    this.beforeV1Upload = async () => {
      if (!first)
        return Promise.reject(new Error('Attachment storage unavailable'))
      first = false
    }
  }

  pauseAfterOneV1Upload() {
    const started = deferred()
    const released = deferred()
    let first = true
    this.beforeV1Upload = async () => {
      if (first) {
        first = false
        return
      }
      started.resolve()
      await released.promise
    }
    return { started: started.promise, release: released.resolve }
  }
}

const deferred = () => {
  let resolve!: () => void
  const promise = new Promise<void>((done) => {
    resolve = done
  })
  return { promise, resolve }
}
