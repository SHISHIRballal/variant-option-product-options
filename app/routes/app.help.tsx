import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};

export default function HelpCenter() {
  return (
    <s-page heading="Help Center" backAction={{ href: "/app" }}>
      <s-section heading="What this app does">
        <s-paragraph>
          Variant Option Product Options lets customers personalize products
          with extra fields that are not Shopify variants. That bypasses the
          3-option / 100-variant limit while keeping inventory on real variants
          when you need it.
        </s-paragraph>
      </s-section>
      <s-section heading="Setup">
        <s-ordered-list>
          <s-list-item>Create options and values in this app.</s-list-item>
          <s-list-item>Assign each option to one or more products.</s-list-item>
          <s-list-item>
            In the theme editor, add the Product options app block on the
            product template.
          </s-list-item>
          <s-list-item>
            Enable the app embed if your theme uses it for global CSS.
          </s-list-item>
        </s-ordered-list>
      </s-section>
      <s-section heading="Option types">
        <s-unordered-list>
          <s-list-item>Buttons, dropdowns, radio buttons, checkboxes, multi-select</s-list-item>
          <s-list-item>Color swatches and image swatches</s-list-item>
          <s-list-item>Short text, long text, number, and file upload</s-list-item>
        </s-unordered-list>
      </s-section>
      <s-section heading="Pricing and logic">
        <s-paragraph>
          Price add-ons are shown live on the product page and stored on the
          cart line as properties. Conditional logic can show or hide an option
          based on another option&apos;s value.
        </s-paragraph>
      </s-section>
      <s-section heading="Cart properties">
        <s-paragraph>
          Selected values are submitted with Add to cart as line item
          properties, including file names, gift wrap, and the total add-on
          amount.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
