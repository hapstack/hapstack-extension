/// <reference types="vitest" />

import path from 'node:path'

import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import webExtension, { readJsonFile } from 'vite-plugin-web-extension'

const rootDir = path.resolve(__dirname, 'src')
const pagesDir = path.resolve(rootDir, 'pages')
const outDir = path.resolve(__dirname, 'build')
const publicDir = path.resolve(__dirname, 'public')

type Mode = 'production' | 'development' | 'staging'

function generateManifest(mode: Mode) {
  const manifest = readJsonFile('src/manifest.json')
  const pkg = readJsonFile('package.json')
  const env = loadEnv(mode, rootDir, '')
  const stagingIconSuffix = mode !== 'production' ? '-staging' : ''

  return {
    name: `${pkg.displayName}${mode !== 'production' ? ' BETA' : ''}`,
    description: pkg.description,
    version: pkg.version,
    key: env.EXTENSION_KEY,
    icons: {
      '32': `icon/32${stagingIconSuffix}.png`,
      '48': `icon/48${stagingIconSuffix}.png`,
      '128': `icon/128${stagingIconSuffix}.png`,
    },
    host_permissions: [
      mode === 'development'
        ? 'http://localhost:3002/*'
        : 'https://*.hapstack.com/*',
    ],
    externally_connectable: {
      matches: [
        mode === 'development'
          ? 'http://localhost:3002/*'
          : 'https://*.hapstack.com/*',
      ],
    },
    ...manifest,
  }
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    root: rootDir,
    mode,
    plugins: [
      react(),
      webExtension({
        manifest: () => generateManifest(mode as Mode),
        disableAutoLaunch: true,
      }),
    ],
    resolve: {
      alias: {
        '@src': rootDir,
        '@pages': pagesDir,
      },
    },
    publicDir,
    envDir: rootDir,
    build: {
      outDir,
      emptyOutDir: true,
      sourcemap: mode !== 'production',
      watch: {
        include: './src/**',
      },
    },
    test: {
      globals: true,
      environment: 'node',
      include: ['**/*.test.{ts,tsx}'],
      exclude: ['node_modules'],
    },
  }
})
