import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { redirect, useLoaderData } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { OptionForm } from "../components/OptionForm";
import { parseOptionForm } from "../lib/form";
import { createOption, getOptions, updateOption } from "../models/options.server";
import { syncProductMetafields } from "../models/sync-metafields.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const options = await getOptions(session.shop);
  return {
    sourceOptions: options.map((option) => ({
      id: option.id,
      name: option.name,
      values: option.values.map((value) => ({
        id: value.id,
        label: value.label,
      })),
    })),
  };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const payload = parseOptionForm(await request.formData());
  if (!payload.name || !payload.displayName) {
    return { error: "Name and display name are required." };
  }
  const created = await createOption(session.shop, {
    name: payload.name,
    displayName: payload.displayName,
    type: payload.type,
  });
  await updateOption(session.shop, created.id, payload);
  await syncProductMetafields(
    admin,
    session.shop,
    payload.products.map((product) => product.productGid),
  );
  return redirect(`/app/options/${created.id}`);
};

export default function NewOptionPage() {
  const { sourceOptions } = useLoaderData<typeof loader>();
  return (
    <s-page heading="Add Option" backAction={{ href: "/app" }}>
      <OptionForm sourceOptions={sourceOptions} />
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
