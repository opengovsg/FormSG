// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom'

import { setGlobalConfig } from '@storybook/testing-react'

import * as globalStorybookConfig from '../.storybook/preview'

// Required as jest will throw errors when attempting to call media query related
// functions since jest's environment may not contain the window object.
jest.mock('@chakra-ui/media-query')

// Fixes TypeError: window.matchMedia is not a function in Jest
// See https://github.com/ant-design/ant-design/issues/21096#issuecomment-725301551
global.matchMedia =
  global.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }
  }

setGlobalConfig(globalStorybookConfig)

// Mock the window.matchMedia function since jest environment may not contain it.
window.matchMedia =
  window.matchMedia ||
  function () {
    return {
      matches: false,
      addListener: jest.fn(),
      removeListener: jest.fn(),
    }
  }

global.ResizeObserver = require('resize-observer-polyfill')

jest.setTimeout(20000)
