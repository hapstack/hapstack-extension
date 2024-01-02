import type { CSSProperties } from 'react'

const sharedStyles: CSSProperties = {
  borderRadius: '9999px',
  color: 'white',
  padding: '3px 10px',
}

const errorStyles: CSSProperties = {
  ...sharedStyles,
  backgroundColor: 'red',
}

const infoStyles: CSSProperties = {
  ...sharedStyles,
  backgroundColor: 'gray',
}

const successStyles: CSSProperties = {
  ...sharedStyles,
  backgroundColor: 'darkseagreen',
}

const warningStyles: CSSProperties = {
  ...sharedStyles,
  backgroundColor: 'orange',
}

const errorCSS = toRawCSS(errorStyles)
const infoCSS = toRawCSS(infoStyles)
const successCSS = toRawCSS(successStyles)
const warningCSS = toRawCSS(warningStyles)

export const logger = {
  info: (message: string) => {
    return console.log(`%c${message}`, infoCSS)
  },
  error: (message: string) => {
    return console.log(`%c${message}`, errorCSS)
  },
  success: (message: string) => {
    return console.log(`%c${message}`, successCSS)
  },
  warning: (message: string) => {
    return console.log(`%c${message}`, warningCSS)
  },
}

function toRawCSS(styles: CSSProperties): string {
  return Object.entries(styles)
    .map(([key, value]) => {
      // Convert camelCase to kebab-case
      const kebabKey = key
        .replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2')
        .toLowerCase()
      return `${kebabKey}: ${value};`
    })
    .join(' ')
}
