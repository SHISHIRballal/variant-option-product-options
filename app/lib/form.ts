import type { OptionPayload } from "../models/options.server";
import { usesValues } from "./option-types";

export function emptyValue() {
  return {
    label: "",
    value: "",
    color: "#000000",
    imageUrl: "",
    priceAddon: 0,
    enabled: true,
    outOfStock: false,
  };
}

export function parseOptionForm(form: FormData): OptionPayload {
  const type = String(form.get("type") || "button");
  let values: OptionPayload["values"] = [];
  let products: OptionPayload["products"] = [];
  let conditions: OptionPayload["conditions"] = [];

  try {
    values = JSON.parse(String(form.get("valuesJson") || "[]"));
  } catch {
    values = [];
  }
  try {
    products = JSON.parse(String(form.get("productsJson") || "[]"));
  } catch {
    products = [];
  }
  try {
    conditions = JSON.parse(String(form.get("conditionsJson") || "[]"));
  } catch {
    conditions = [];
  }

  if (!usesValues(type)) {
    values = [];
  }

  return {
    name: String(form.get("name") || "").trim(),
    displayName: String(form.get("displayName") || "").trim(),
    type,
    enabled: form.get("enabled") === "on",
    required: form.get("required") === "on",
    helpText: String(form.get("helpText") || ""),
    placeholder: String(form.get("placeholder") || ""),
    customCss: String(form.get("customCss") || ""),
    customHtml: String(form.get("customHtml") || ""),
    giftWrap: form.get("giftWrap") === "on",
    hideOutOfStock: form.get("hideOutOfStock") === "on",
    values,
    products,
    conditions,
  };
}
