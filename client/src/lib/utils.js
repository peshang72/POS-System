// Try to import clsx normally, but provide fallback if it fails
let clsxModule;
try {
  clsxModule = require("clsx").default || require("clsx");
} catch (e) {
  // Simple fallback implementation if clsx import fails
  clsxModule = (...args) => args.filter(Boolean).join(" ");
}

// Try to import tailwind-merge normally, but provide fallback if it fails
let twMergeModule;
try {
  twMergeModule = require("tailwind-merge").twMerge;
} catch (e) {
  // Simple fallback implementation if tailwind-merge import fails
  twMergeModule = (classLists) => classLists;
}

export function cn(...inputs) {
  return twMergeModule(clsxModule(inputs));
}
