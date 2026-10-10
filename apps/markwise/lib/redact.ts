const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE = /(?:\+44\s?|0)(?:\d[\s()-]?){9,12}/g;

export function redactForModel(text: string, displayName?: string) {
  let out = text.replace(EMAIL, "[email]").replace(PHONE, "[phone]");
  const name = displayName?.trim();
  if (name && name.length >= 2) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(`\\b${escaped}\\b`, "gi"), "[student]");
  }
  return out;
}

const CRISIS =
  /\b(kill myself|end my life|want to die|self[-\s]?harm|hurt myself|suicid(?:e|al))\b/i;

export function crisisReply(text: string) {
  if (!CRISIS.test(text)) return null;
  return "If you're in crisis or worried about someone, please talk to a person now. Childline is free on 0800 1111, and Samaritans are on 116 123. I'm only a revision tutor, so I can't help with that.";
}

export function wantsFullEssay(text: string) {
  return /\b(write|give|do|finish)\b.{0,40}\b(essay|model answer|full answer|paragraph)\b/i.test(text);
}
