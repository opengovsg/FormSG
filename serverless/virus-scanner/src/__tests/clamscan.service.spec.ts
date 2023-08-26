// Unit tests for clamscan.service
import internal from 'stream'

import { scanFileStream } from '../clamscan.service'

let scanResult: {
  isInfected: boolean
  viruses?: string[]
}

// Mock clamscan
jest.mock('clamscan', () => {
  return jest.fn().mockImplementation(() => {
    return {
      init: jest.fn().mockImplementation(() => {
        return {
          scanStream: jest.fn().mockImplementation(() => {
            return scanResult
          }),
        }
      }),
    }
  })
})

describe('clamscan.service', () => {
  describe('scanFileStream', () => {
    it('should return isMalicious true if virus found', async () => {
      // Arrange
      const mockStream = new internal.Readable()
      mockStream.push('virus')
      mockStream.push(null)

      scanResult = {
        isInfected: true,
        viruses: ['Eicar-Test-Signature'],
      }

      // Act

      const result = await scanFileStream(mockStream)

      // Assert
      expect(result.isMalicious).toBe(true)
    })

    it('should return virus metadata if virus found', async () => {
      // Arrange
      const mockStream = new internal.Readable()
      mockStream.push('virus')
      mockStream.push(null)

      scanResult = {
        isInfected: true,
        viruses: ['Eicar-Test-Signature'],
      }

      // Act
      const result = (await scanFileStream(mockStream)) as unknown as {
        isMalicious: true
        virusMetadata: string[]
      }

      // Assert
      expect(result.virusMetadata).toEqual(['Eicar-Test-Signature'])
    })

    it('should return isMalicious false if no virus found', async () => {
      // Arrange
      const mockStream = new internal.Readable()
      mockStream.push('no virus')
      mockStream.push(null)

      scanResult = {
        isInfected: false,
      }

      // Act
      const result = await scanFileStream(mockStream)

      // Assert
      expect(result.isMalicious).toBe(false)
    })

    it('should return empty virus metadata if no virus found', async () => {
      // Arrange
      const mockStream = new internal.Readable()
      mockStream.push('no virus')
      mockStream.push(null)

      scanResult = {
        isInfected: false,
      }

      // Act
      const result = (await scanFileStream(mockStream)) as unknown as {
        isMalicious: false
      }

      // Assert
      expect((result as any).virusMetadata).toBeUndefined()
    })
  })
})
