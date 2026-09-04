import type {
  ActionFunctionArgs,
  HeadersFunction,
  LoaderFunctionArgs,
} from "react-router";
import { Form, redirect, useLoaderData, useNavigation } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";
import { optionTypeLabel } from "../lib/option-types";
import {
  deleteOption,
  duplicateOption,
  getOptions,
  reorderOptions,
  seedDemoOptions,
  setOptionEnabled,
} from "../models/options.server";
import { syncProductMetafields } from "../models/sync-metafields.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const { session } = await authenticate.admin(request);
  const options = await seedDemoOptions(session.shop);
  return { options };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin, session } = await authenticate.admin(request);
  const form = await request.formData();
  const intent = String(form.get("intent"));
  const id = String(form.get("id") || "");

  if (intent === "toggle" && id) {
    const enabled = form.get("enabled") === "true";
    const option = await setOptionEnabled(session.shop, id, enabled);
    if (option) {
      await syncProductMetafields(
        admin,
        session.shop,
        option.products.map((product) => product.productGid),
      );
    }
  }

  if (intent === "delete" && id) {
    const option = await deleteOption(session.shop, id);
    if (option) {
      await syncProductMetafields(
        admin,
        session.shop,
        option.products.map((product) => product.productGid),
      );
    }
  }

  if (intent === "duplicate" && id) {
    const copy = await duplicateOption(session.shop, id);
    if (copy) return redirect(`/app/options/${copy.id}`);
  }

  if (intent === "reorder") {
    const orderedIds = String(form.get("orderedIds") || "")
      .split(",")
      .filter(Boolean);
    await reorderOptions(session.shop, orderedIds);
    const options = await getOptions(session.shop);
    const productGids = options.flatMap((option) =>
      option.products.map((product) => product.productGid),
    );
    await syncProductMetafields(admin, session.shop, productGids);
  }

  return redirect("/app");
};

export default function VariantOptionsIndex() {
  const { options } = useLoaderData<typeof loader>();
  const navigation = useNavigation();
  const busy = navigation.state !== "idle";

  const move = (index: number, direction: -1 | 1) => {
    const next = [...options];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const [item] = next.splice(index, 1);
    next.splice(target, 0, item);
    const form = document.getElementById("reorder-form") as HTMLFormElement;
    const input = form.elements.namedItem("orderedIds") as HTMLInputElement;
    input.value = next.map((option) => option.id).join(",");
    form.requestSubmit();
  };

  return (
    <s-page heading="Variant Options">
      <s-button slot="primary-action" variant="primary" href="/app/options/new">
        Add Option
      </s-button>
      <s-button slot="secondary-actions" href="/app/help">
        Help Center
      </s-button>
      <s-button slot="secondary-actions" href="/app/settings">
        Settings
      </s-button>

      <s-section>
        <s-paragraph>
          Unlimited custom product options beyond Shopify&apos;s 3-option / 100
          variant limit. Enable the Product options app block on your product
          template after saving.
        </s-paragraph>
      </s-section>

      <Form id="reorder-form" method="post">
        <input type="hidden" name="intent" value="reorder" />
        <input type="hidden" name="orderedIds" value="" />
      </Form>

      <s-section heading="Options">
        {options.length === 0 ? (
          <s-box padding="large">
            No options yet. Create one to start customizing products.
          </s-box>
        ) : (
          <s-table>
            <s-table-header-row>
              <s-table-header>Reorder</s-table-header>
              <s-table-header>Status</s-table-header>
              <s-table-header>Option name</s-table-header>
              <s-table-header>Display name</s-table-header>
              <s-table-header>Type</s-table-header>
              <s-table-header>Products</s-table-header>
              <s-table-header>Actions</s-table-header>
            </s-table-header-row>
            <s-table-body>
              {options.map((option, index) => (
                <s-table-row key={option.id}>
                  <s-table-cell>
                    <s-stack direction="inline" gap="small">
                      <s-button
                        variant="tertiary"
                        disabled={index === 0 || busy}
                        onClick={() => move(index, -1)}
                      >
                        Up
                      </s-button>
                      <s-button
                        variant="tertiary"
                        disabled={index === options.length - 1 || busy}
                        onClick={() => move(index, 1)}
                      >
                        Down
                      </s-button>
                    </s-stack>
                  </s-table-cell>
                  <s-table-cell>
                    <Form method="post">
                      <input type="hidden" name="intent" value="toggle" />
                      <input type="hidden" name="id" value={option.id} />
                      <input
                        type="hidden"
                        name="enabled"
                        value={option.enabled ? "false" : "true"}
                      />
                      <s-switch
                        checked={option.enabled}
                        accessibilityLabel={`Toggle ${option.name}`}
                        onChange={(event: Event) => {
                          (event.currentTarget as HTMLElement)
                            .closest("form")
                            ?.requestSubmit();
                        }}
                      />
                    </Form>
                  </s-table-cell>
                  <s-table-cell>{option.name}</s-table-cell>
                  <s-table-cell>{option.displayName}</s-table-cell>
                  <s-table-cell>{optionTypeLabel(option.type)}</s-table-cell>
                  <s-table-cell>{option.products.length}</s-table-cell>
                  <s-table-cell>
                    <s-stack direction="inline" gap="small">
                      <s-button
                        variant="tertiary"
                        href={`/app/options/${option.id}`}
                      >
                        Edit
                      </s-button>
                      <Form method="post">
                        <input type="hidden" name="intent" value="duplicate" />
                        <input type="hidden" name="id" value={option.id} />
                        <s-button variant="tertiary" type="submit">
                          Duplicate
                        </s-button>
                      </Form>
                      <Form method="post">
                        <input type="hidden" name="intent" value="delete" />
                        <input type="hidden" name="id" value={option.id} />
                        <s-button
                          variant="tertiary"
                          tone="critical"
                          type="submit"
                        >
                          Delete
                        </s-button>
                      </Form>
                    </s-stack>
                  </s-table-cell>
                </s-table-row>
              ))}
            </s-table-body>
          </s-table>
        )}
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};
