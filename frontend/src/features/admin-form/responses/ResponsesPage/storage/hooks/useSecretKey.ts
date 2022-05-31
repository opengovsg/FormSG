import { useEffect, useState } from 'react'
import { BroadcastChannel } from 'broadcast-channel'

import { useHasChanged } from '~hooks/useHasChanged'

const SECRETKEY_BROADCAST_KEY = 'formsg_private_key_sharing'

type SecretKeyBroadcastMessage =
  | {
      formId: string
      action: 'requestKey'
    }
  | {
      formId: string
      action: 'broadcastKey'
      secretKey: string
    }

// BroadcastChannel will only broadcast the message to scripts from the same origin
// (i.e. https://form.gov.sg in practice) so all data should be controlled by scripts
// originating from FormSG. This does not store any data in browser-based storage
// (e.g. cookies or localStorage) so secrets would not be retained past the user closing
// all Form tabs containing the form.
const secretKeyChannel = new BroadcastChannel<SecretKeyBroadcastMessage>(
  SECRETKEY_BROADCAST_KEY,
)

export const useSecretKey = (formId: string) => {
  const [secretKey, setSecretKey] = useState<string>()
  const hasSecretKeyChanged = useHasChanged(secretKey)

  // Request secret key on mount.
  useEffect(() => {
    if (secretKeyChannel.isClosed) return
    secretKeyChannel.postMessage({
      formId,
      action: 'requestKey',
    })
  }, [formId])

  // Broadcast when key changes.
  useEffect(() => {
    if (hasSecretKeyChanged && secretKey && !secretKeyChannel.isClosed) {
      secretKeyChannel.postMessage({
        formId,
        action: 'broadcastKey',
        secretKey,
      })
    }
  }, [secretKey, formId, hasSecretKeyChanged])

  // Message handling.
  useEffect(() => {
    secretKeyChannel.onmessage = (e) => {
      if (secretKeyChannel.isClosed) return
      switch (e.action) {
        case 'requestKey':
          if (secretKey && e.formId === formId) {
            secretKeyChannel.postMessage({
              formId,
              action: 'broadcastKey',
              secretKey,
            })
          }
          break
        case 'broadcastKey':
          if (!secretKey && formId === e.formId) {
            setSecretKey(e.secretKey)
          }
      }
    }
  }, [secretKey, formId])

  return [secretKey, setSecretKey] as const
}
