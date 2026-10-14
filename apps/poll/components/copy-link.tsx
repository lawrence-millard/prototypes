"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

export function CopyLink({ path }: { path: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      className="icon-btn"
      type="button"
      aria-label={copied ? "Copied" : "Copy link"}
      onClick={() => {
        const url = new URL(path, window.location.origin).href;
        void navigator.clipboard.writeText(url).then(() => {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 1200);
        });
      }}
    >
      {copied ? <Check size={15} strokeWidth={1.5} /> : <Copy size={15} strokeWidth={1.5} />}
    </button>
  );
}
