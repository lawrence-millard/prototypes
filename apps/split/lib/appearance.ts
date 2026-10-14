export function clerkAppearance(dark: boolean) {
  const bg = dark ? "rgb(0, 0, 0)" : "rgb(246, 246, 246)";
  const fg = dark ? "rgb(233, 233, 233)" : "rgb(11, 11, 11)";
  const mute = dark ? "rgb(162, 162, 162)" : "rgb(90, 90, 90)";
  const line = dark ? "rgba(110, 110, 110, 0.35)" : "rgba(124, 124, 124, 0.35)";
  return {
    variables: {
      colorBackground: bg,
      colorText: fg,
      colorPrimary: fg,
      colorPrimaryForeground: bg,
      colorInputBackground: bg,
      colorInputText: fg,
      colorNeutral: mute,
      colorTextSecondary: mute,
      borderRadius: "8px",
      fontFamily: '"Open Runde", "SF Pro", ui-sans-serif, system-ui, sans-serif',
      fontFamilyButtons: '"Open Runde", "SF Pro", ui-sans-serif, system-ui, sans-serif',
    },
    elements: {
      rootBox: { boxShadow: "none", width: "100%" },
      cardBox: { boxShadow: "none", width: "100%" },
      card: { boxShadow: "none", border: `1px solid ${line}`, background: bg },
      headerTitle: { fontWeight: "500" },
      formButtonPrimary: { boxShadow: "none" },
      footer: { boxShadow: "none" },
      socialButtonsBlockButton: { boxShadow: "none" },
    },
  };
}
