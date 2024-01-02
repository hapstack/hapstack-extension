import 'tailwind-config/tailwind.css'

import React from 'react'
import { createRoot } from 'react-dom/client'
// eslint-disable-next-line
import { iconSpriteHref } from 'ui'

import { Popup } from './Popup'

function init() {
  const rootContainer = document.querySelector('#root')
  if (!rootContainer) throw new Error("Can't find root element")
  const root = createRoot(rootContainer)
  root.render(
    <React.StrictMode>
      <Popup />
    </React.StrictMode>
  )
}

init()
