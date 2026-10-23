/// <reference types="vitest/globals" />

import './vitest-setup.thin'

import { setProjectAnnotations } from '@storybook/react-vite'

// Storybook's preview file location
import * as globalStorybookConfig from './.storybook/preview'

setProjectAnnotations(globalStorybookConfig)
