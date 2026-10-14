export function clerkAppearance(dark: boolean) {
  const bg = dark ? "rgb(0, 0, 0)" : "rgb(246, 246, 246)";
  const fg = dark ? "rgb(233, 233, 233)" : "rgb(11, 11, 11)";
  const mute = dark ? "rgb(162, 162, 162)" : "rgb(90, 90, 90)";
  const dim = dark ? "rgba(110, 110, 110, 0.35)" : "rgba(124, 124, 124, 0.35)";
  const font = '"Open Runde", "SF Pro", ui-sans-serif, system-ui, sans-serif';
  return {
    variables: {
      colorBackground: bg,
      colorText: fg,
      colorPrimary: fg,
      colorPrimaryForeground: bg,
      colorDanger: fg,
      colorInputBackground: bg,
      colorInputText: fg,
      colorNeutral: mute,
      colorTextSecondary: mute,
      borderRadius: "8px",
      fontFamily: font,
      fontFamilyButtons: font,
      fontSize: "16px",
      fontWeight: { normal: 500, medium: 500, bold: 500 },
    },
    elements: {
      rootBox: { boxShadow: "none", width: "100%" },
      cardBox: { boxShadow: "none", width: "100%" },
      card: { boxShadow: "none", border: `1px solid ${dim}`, background: bg, borderRadius: "10px" },
      headerTitle: { fontWeight: 500, letterSpacing: "-0.4px", color: fg },
      headerSubtitle: { color: mute },
      formFieldLabel: { color: mute, fontSize: "14px", fontWeight: 500, textTransform: "none", letterSpacing: "-0.2px" },
      formFieldInput: { boxShadow: "none", border: `1px solid ${dim}`, borderRadius: "8px", background: bg, color: fg },
      formButtonPrimary: { boxShadow: "none", background: fg, color: bg, borderRadius: "8px", fontWeight: 500 },
      footer: { boxShadow: "none", background: "transparent" },
      footerActionLink: { color: fg, fontWeight: 500 },
      socialButtonsBlockButton: { boxShadow: "none", border: `1px solid ${dim}`, borderRadius: "8px" },
      dividerLine: { background: dim },
      userButtonPopoverCard: { boxShadow: "none", border: `1px solid ${dim}`, borderRadius: "10px", background: bg },
      userButtonPopoverActionButton: { color: fg },
      userButtonAvatarBox: { width: "28px", height: "28px" },
    },
  };
}
