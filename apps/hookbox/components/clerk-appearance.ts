export function clerkAppearance(dark: boolean) {
  const bg = dark ? '#000000' : '#f6f6f6'
  const fg = dark ? '#e9e9e9' : '#0b0b0b'
  const mute = dark ? '#a2a2a2' : '#5a5a5a'
  return {
    variables: {
      colorBackground: bg,
      colorText: fg,
      colorPrimary: fg,
      colorInputBackground: bg,
      colorInputText: fg,
      colorNeutral: mute,
      borderRadius: '8px',
      fontFamily: '"Open Runde", "SF Pro", ui-sans-serif, system-ui, sans-serif',
      fontFamilyButtons: '"Open Runde", "SF Pro", ui-sans-serif, system-ui, sans-serif',
    },
  }
}
