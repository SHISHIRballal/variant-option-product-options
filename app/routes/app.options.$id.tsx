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
import { getOption, getOptions, updateOption } from "../models/options.server";
import { syncProductMetafields } from "../models/sync-metafields.server";

export const loader = async ({ request, params }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const option = await getOption(session.shop, String(params.id));
  if (!option) throw redirect("/app");
  const options = await getOptions(session.shop);
  return {
    option,
    sourceOptions: options
      .filter((item) => item.id !== option.id)
      .map((item) => ({
        id: item.id,
        name: item.name,
        values: item.values.map((value) => ({
          id: value.id,
          label: value.label,
        })),
      })),
  };
};

export const action = async ({ request, params }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const existing = await getOption(session.shop, String(params.id));
  if (!existing) throw redirect("/app");
  const payload = parseOptionForm(await request.formData());
  if (!payload.name || !payload.displayName) {
    return { error: "Name and display name are required." };
  }
  await updateOption(session.shop, existing.id, payload);
  await syncProductMetafields(admin, session.shop, [
    ...existing.products.map((product) => product.productGid),
    ...payload.products.map((product) => product.productGid),
  ]);
  return redirect("/app");
};

export default function EditOptionPage() {
  const { option, sourceOptions } = useLoaderData<typeof loader>();
  return (
    <s-page heading={`Edit ${option.name}`} backAction={{ href: "/app" }}>
      <OptionForm option={option} sourceOptions={sourceOptions} />
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
