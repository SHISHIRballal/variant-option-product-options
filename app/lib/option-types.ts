export const OPTION_TYPES = [
  { value: "button", label: "Button" },
  { value: "color_swatch", label: "Color Swatches" },
  { value: "image_swatch", label: "Image Swatches" },
  { value: "dropdown", label: "Dropdown" },
  { value: "radio", label: "Radio Buttons" },
  { value: "checkbox", label: "Checkboxes" },
  { value: "multi_select", label: "Multi-select" },
  { value: "short_text", label: "Short text" },
  { value: "long_text", label: "Long text" },
  { value: "number", label: "Number" },
  { value: "file_upload", label: "File upload" },
] as const;

export type OptionType = (typeof OPTION_TYPES)[number]["value"];

export const TEXT_TYPES: OptionType[] = [
  "short_text",
  "long_text",
  "number",
  "file_upload",
];

export function optionTypeLabel(type: string) {
  return OPTION_TYPES.find((item) => item.value === type)?.label ?? type;
}

export function usesValues(type: string) {
  return !TEXT_TYPES.includes(type as OptionType);
}
