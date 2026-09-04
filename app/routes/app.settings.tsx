import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, redirect, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { getOptions, getSettings, saveSettings } from "../models/options.server";
import { syncProductMetafields } from "../models/sync-metafields.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const settings = await getSettings(session.shop);
  return { settings };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const form = await request.formData();
  await saveSettings(session.shop, {
    customCss: String(form.get("customCss") || ""),
    customHtml: String(form.get("customHtml") || ""),
    locale: String(form.get("locale") || "en"),
  });
  const options = await getOptions(session.shop);
  await syncProductMetafields(
    admin,
    session.shop,
    options.flatMap((option) =>
      option.products.map((product) => product.productGid),
    ),
  );
  return redirect("/app/settings");
};

export default function SettingsPage() {
  const { settings } = useLoaderData<typeof loader>();
  return (
    <s-page heading="Settings" backAction={{ href: "/app" }}>
      <Form method="post">
        <s-stack gap="large">
          <s-section heading="Storefront CSS and HTML">
            <s-paragraph>
              Applied on every product that has assigned options, in addition to
              each option&apos;s own CSS/HTML.
            </s-paragraph>
            <s-stack gap="base">
              <s-text-area
                name="customCss"
                label="Custom CSS"
                value={settings.customCss}
              />
              <s-text-area
                name="customHtml"
                label="Custom HTML"
                value={settings.customHtml}
              />
              <s-text-field
                name="locale"
                label="Translation locale"
                details="Storefront labels follow the shop locale. Use this as a default language code."
                value={settings.locale}
              />
            </s-stack>
          </s-section>
          <s-button type="submit" variant="primary">
            Save settings
          </s-button>
        </s-stack>
      </Form>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
