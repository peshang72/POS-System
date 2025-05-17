// Try to import clsx normally, but provide fallback if it fails
let clsxModule;
try {
  clsxModule = require("clsx").default || require("clsx");
} catch (e) {
  // Simple fallback implementation if clsx import fails
  clsxModule = (...args) => args.filter(Boolean).join(" ");
}

import { twMerge } from "tailwind-merge";

export function cn(...inputs) {
  return twMerge(clsxModule(inputs));
}
