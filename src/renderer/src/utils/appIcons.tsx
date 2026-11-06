import React from 'react'

export interface AppIconInfo {
  icon: React.JSX.Element
  name: string
  category: 'dev' | 'browser' | 'comm' | 'productivity' | 'system'
}

/**
 * Normaliza el nombre del proceso o ventana para buscar su icono correspondiente
 */
function normalizeAppName(rawName: string): string {
  if (!rawName) return ''
  return rawName.toLowerCase().replace(/\\.exe$/i, '').trim()
}

/**
 * Devuelve el SVG correspondiente a la aplicación detectada.
 * Si no coincide con ninguna conocida, retorna un icono genérico elegante de ventana de sistema.
 */
export function getAppIcon(rawName: string, className = 'w-5 h-5'): React.JSX.Element {
  const name = normalizeAppName(rawName)

  // 1. VS Code / Visual Studio Code
  if (name.includes('code') || name.includes('visual studio')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <path
          d="M17.5 2.5L7 10.5L3.5 7.5L2 8.5L5.5 12L2 15.5L3.5 16.5L7 13.5L17.5 21.5L22 19.5V4.5L17.5 2.5Z"
          fill="#007ACC"
        />
        <path
          d="M17.5 2.5L7 10.5L9.5 12.5L17.5 6V2.5Z"
          fill="#1F8AD2"
        />
        <path
          d="M17.5 21.5L7 13.5L9.5 11.5L17.5 18V21.5Z"
          fill="#0065A9"
        />
        <path
          d="M17.5 6L9.5 12L17.5 18V6Z"
          fill="#007ACC"
          fillOpacity="0.8"
        />
      </svg>
    )
  }

  // 2. Cursor AI Editor
  if (name.includes('cursor')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="5" fill="#18181B" />
        <path
          d="M6 5L17 12L11.5 13.5L8.5 19L6 5Z"
          fill="#F97316"
          stroke="#FFFFFF"
          strokeWidth="1.2"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  // 3. Google Chrome
  if (name.includes('chrome')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9.5" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="0.5" />
        {/* Red slice */}
        <path
          d="M12 2.5C14.7 2.5 17.1 3.6 18.9 5.5L14.5 13.1C14 12.4 13.1 12 12 12H4.1C4.7 6.6 9.3 2.5 12 2.5Z"
          fill="#EA4335"
        />
        {/* Green slice */}
        <path
          d="M21.5 12C21.5 16.7 18 20.6 13.4 21.4L9 13.8C9.5 13.3 9.8 12.7 9.8 12L14.5 3.9C18.6 5.5 21.5 9.4 21.5 12Z"
          fill="#34A853"
        />
        {/* Yellow slice */}
        <path
          d="M13.4 21.4C10.6 21.9 7.7 21.1 5.5 19.3L9.9 11.7C10.5 12.4 11.4 12.8 12.5 12.8L16.9 20.4C15.8 21 14.6 21.3 13.4 21.4Z"
          fill="#FBBC05"
        />
        {/* Center blue circle with white border */}
        <circle cx="12" cy="12" r="4.2" fill="#FFFFFF" />
        <circle cx="12" cy="12" r="3.2" fill="#4285F4" />
      </svg>
    )
  }

  // 4. Microsoft Edge
  if (name.includes('edge') || name.includes('msedge')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9.5" fill="#0078D7" />
        <path
          d="M12 4C8 4 5 7 5 11C5 13.5 6.5 15.7 8.7 16.7C7.8 15.5 7.5 14 8 12.8C8.7 11.2 10.4 10.3 12.1 10.8C13.5 11.2 14.5 12.3 14.8 13.7C15.2 15.7 13.8 17.5 11.8 17.9C10.8 18.1 9.8 17.9 9 17.4C10.2 19 12.2 20 14.5 20C17.5 20 20 17.5 20 14.5C20 9 15.5 4 12 4Z"
          fill="#50E6FF"
        />
        <path
          d="M12 8C15 8 17 10 17 13C17 15.5 15.5 17.5 13.5 18C15 16.8 15.5 15 15 13.5C14.5 12 13 11 11.5 11.2C10.5 11.3 9.7 11.8 9.2 12.5C9 11.5 9.5 9.8 10.8 8.8C11.2 8.3 11.6 8 12 8Z"
          fill="#83D944"
        />
      </svg>
    )
  }

  // 5. Mozilla Firefox
  if (name.includes('firefox')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="9.5" fill="#FF7139" />
        <circle cx="12" cy="12" r="6" fill="#0A84FF" />
        <path
          d="M6 13C6 9 9 5 13 4C11.5 6 11 8 12 10C13 12 15 12.5 16 12C17.5 11.2 18 9.5 18 9.5C18.5 11 18.5 13.5 17.5 15.5C16 18.5 13 20 9.5 19.5C6.5 19 5.5 16.5 6 13Z"
          fill="#FFE843"
        />
      </svg>
    )
  }

  // 6. JetBrains IDEs (IntelliJ IDEA, WebStorm, PyCharm, CLion, Rider, etc.)
  if (
    name.includes('idea') ||
    name.includes('pycharm') ||
    name.includes('webstorm') ||
    name.includes('clion') ||
    name.includes('rider') ||
    name.includes('jetbrains')
  ) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="5" fill="#21D789" />
        <path d="M4 4L16 2L20 9L11 14L4 4Z" fill="#F43059" />
        <path d="M20 9L15 22L7 20L11 14L20 9Z" fill="#087CFA" />
        <path d="M4 4L11 14L7 20L2 14L4 4Z" fill="#FE2857" />
        <rect x="5.5" y="5.5" width="13" height="13" rx="2" fill="#1E1F22" />
        <rect x="7" y="15" width="5" height="1.5" fill="#FFFFFF" />
        <path d="M7 8H9V13H7V8Z" fill="#FFFFFF" />
      </svg>
    )
  }

  // 7. Discord
  if (name.includes('discord')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="5" fill="#5865F2" />
        <path
          d="M17.5 7.5C16.3 6.9 15 6.5 13.7 6.4C13.5 6.7 13.3 7.1 13.2 7.5C11.8 7.3 10.4 7.3 9 7.5C8.9 7.1 8.7 6.7 8.5 6.4C7.2 6.5 5.9 6.9 4.7 7.5C2.5 10.8 1.9 14 2.2 17.2C3.7 18.3 5.1 19 6.5 19.4C6.9 18.9 7.2 18.3 7.5 17.7C7 17.5 6.5 17.3 6.1 17C6.2 16.9 6.3 16.8 6.4 16.7C9.3 18 12.9 18 15.8 16.7C15.9 16.8 16 16.9 16.1 17C15.7 17.3 15.2 17.5 14.7 17.7C15 18.3 15.3 18.9 15.7 19.4C17.1 19 18.5 18.3 20 17.2C20.3 13.5 19.4 10.3 17.5 7.5ZM8.5 15C7.7 15 7 14.3 7 13.5C7 12.7 7.7 12 8.5 12C9.3 12 10 12.7 10 13.5C10 14.3 9.3 15 8.5 15ZM15.5 15C14.7 15 14 14.3 14 13.5C14 12.7 14.7 12 15.5 12C16.3 12 17 12.7 17 13.5C17 14.3 16.3 15 15.5 15Z"
          fill="#FFFFFF"
        />
      </svg>
    )
  }

  // 8. Slack
  if (name.includes('slack')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="5" fill="#4A154B" />
        <path d="M7 11.5a1.5 1.5 0 0 1 1.5-1.5H10v1.5a1.5 1.5 0 0 1-3 0zm4.5 0V7a1.5 1.5 0 1 1 3 0v4.5a1.5 1.5 0 0 1-3 0z" fill="#E01E5A" />
        <path d="M12.5 7A1.5 1.5 0 0 1 14 5.5h1.5V7a1.5 1.5 0 0 1-3 0zm0 4.5h4.5a1.5 1.5 0 1 1 0 3H12.5a1.5 1.5 0 0 1 0-3z" fill="#36C5F0" />
        <path d="M17 12.5a1.5 1.5 0 0 1-1.5 1.5H14V12.5a1.5 1.5 0 0 1 3 0zm-4.5 0V17a1.5 1.5 0 1 1-3 0v-4.5a1.5 1.5 0 0 1 3 0z" fill="#2EB67D" />
        <path d="M11.5 17A1.5 1.5 0 0 1 10 18.5H8.5V17a1.5 1.5 0 0 1 3 0zm0-4.5H7a1.5 1.5 0 1 1 0-3h4.5a1.5 1.5 0 0 1 0 3z" fill="#ECB22E" />
      </svg>
    )
  }

  // 9. Spotify
  if (name.includes('spotify')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <circle cx="12" cy="12" r="10" fill="#1DB954" />
        <path
          d="M16.5 14.8c-.2 0-.4-.1-.6-.2-1.7-1-3.8-1.3-6.3-.7-.4.1-.8-.1-.9-.5-.1-.4.1-.8.5-.9 2.8-.6 5.2-.3 7.1.9.4.2.5.6.3 1-.1.2-.4.4-.6.4zm.8-2.4c-.2 0-.5-.1-.7-.3-2-1.2-5-1.6-7.4-.9-.5.1-.9-.2-1.1-.6-.1-.5.2-.9.6-1.1 2.8-.8 6.1-.4 8.5 1 .4.3.5.8.3 1.2-.1.5-.4.7-.7.7zm.2-2.6c-.3 0-.6-.1-.8-.3-2.4-1.4-6.4-1.6-8.7-.9-.6.2-1.1-.1-1.3-.7-.2-.6.1-1.1.7-1.3 2.8-.8 7.3-.7 10.1 1 .5.3.7 1 .4 1.5-.2.5-.6.7-.9.7z"
          fill="#FFFFFF"
        />
      </svg>
    )
  }

  // 10. Notion
  if (name.includes('notion')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="5" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="1" />
        <path
          d="M6 6.5C6.4 6.8 6.8 6.9 7.3 6.9L16 6.1C16.8 6 17.3 6.5 17.5 7.1L18 16.5C18.1 17.3 17.5 18 16.7 18.1L7.5 18.7C6.8 18.8 6.2 18.3 6.1 17.5L5.5 8C5.4 7.4 5.6 6.9 6 6.5Z"
          fill="#000000"
        />
        <path
          d="M8.2 8.5L14.8 8V16L8.2 16.5V8.5Z"
          fill="#FFFFFF"
        />
        <path
          d="M9.5 9.8V15.2L11.5 15.1V12.2L13.2 15L14.5 14.9V9.5L12.5 9.6V12.4L10.8 9.7L9.5 9.8Z"
          fill="#000000"
        />
      </svg>
    )
  }

  // 11. Figma
  if (name.includes('figma')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="5" fill="#1E1E1E" />
        <path d="M9 5h3v3.5H9a1.75 1.75 0 1 1 0-3.5z" fill="#F24E1E" />
        <path d="M12 5h3a1.75 1.75 0 0 1 0 3.5h-3V5z" fill="#FF7262" />
        <path d="M12 8.5h3a1.75 1.75 0 1 1 0 3.5h-3V8.5z" fill="#1ABCFE" />
        <path d="M9 8.5h3v3.5H9a1.75 1.75 0 0 1 0-3.5z" fill="#A259FF" />
        <path d="M9 12h3v1.75a1.75 1.75 0 1 1-3 0V12z" fill="#0ACF83" />
      </svg>
    )
  }

  // 12. Terminal / PowerShell / Windows Terminal / CMD / Bash
  if (
    name.includes('terminal') ||
    name.includes('powershell') ||
    name.includes('cmd') ||
    name.includes('bash') ||
    name.includes('wt') ||
    name.includes('warp') ||
    name.includes('alacritty')
  ) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="5" fill="#0F172A" />
        <path
          d="M6 8L10 12L6 16"
          stroke="#38BDF8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <line
          x1="12"
          y1="16"
          x2="17"
          y2="16"
          stroke="#F97316"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
    )
  }

  // 13. Microsoft Office (Word, Excel, PowerPoint, Outlook)
  if (name.includes('word') || name.includes('winword')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="5" fill="#185ABD" />
        <path
          d="M6.5 8L8.5 16H10.5L12 10.5L13.5 16H15.5L17.5 8H15.5L14.2 13.5L12.8 8H11.2L9.8 13.5L8.5 8H6.5Z"
          fill="#FFFFFF"
        />
      </svg>
    )
  }

  if (name.includes('excel')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none">
        <rect width="24" height="24" rx="5" fill="#107C41" />
        <path
          d="M8 8L11 12L8 16H10L12 13.2L14 16H16L13 12L16 8H14L12 10.8L10 8H8Z"
          fill="#FFFFFF"
        />
      </svg>
    )
  }

  // 14. Fallback: Icono de Ventana de Sistema elegante con paleta OptiFlow
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="#F97316"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  )
}

export default getAppIcon
