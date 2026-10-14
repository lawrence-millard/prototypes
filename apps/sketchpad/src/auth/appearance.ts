export function clerkAppearance(dark: boolean) {
  const fg = dark ? '#e9e9e9' : '#0b0b0b'
  const bg = dark ? '#000000' : '#f6f6f6'
  const mute = dark ? '#a2a2a2' : '#5a5a5a'
  const line = dark ? 'rgba(110, 110, 110, 0.45)' : 'rgba(124, 124, 124, 0.45)'
  return {
    variables: {
      colorPrimary: fg,
      colorDanger: fg,
      colorSuccess: fg,
      colorWarning: fg,
      colorBackground: bg,
      colorInputBackground: bg,
      colorInputText: fg,
      colorText: fg,
      colorTextSecondary: mute,
      colorNeutral: mute,
      borderRadius: '8px',
      fontFamily: '"Open Runde", "SF Pro", ui-sans-serif, system-ui, sans-serif',
      fontFamilyButtons: '"Open Runde", "SF Pro", ui-sans-serif, system-ui, sans-serif',
      fontWeight: { normal: 500, medium: 500, bold: 500 },
    },
    elements: {
      rootBox: { width: '100%' },
      cardBox: { width: '100%', boxShadow: 'none' },
      card: {
        width: '100%',
        boxShadow: 'none',
        border: `1px solid ${line}`,
        background: bg,
        borderRadius: '10px',
      },
      headerTitle: {
        fontSize: '20px',
        fontWeight: 500,
        letterSpacing: '-0.03em',
        color: fg,
      },
      headerSubtitle: { color: mute, fontSize: '14px' },
      socialButtonsBlockButton: {
        border: `1px solid ${line}`,
        boxShadow: 'none',
        color: fg,
      },
      formButtonPrimary: {
        background: fg,
        color: bg,
        boxShadow: 'none',
        fontWeight: 500,
      },
      formFieldInput: {
        border: `1px solid ${line}`,
        boxShadow: 'none',
        background: bg,
        color: fg,
      },
      footerActionLink: { color: fg, fontWeight: 500 },
      dividerLine: { background: line },
      footer: { background: 'transparent' },
      logoBox: { display: 'none' },
    },
  }
}
