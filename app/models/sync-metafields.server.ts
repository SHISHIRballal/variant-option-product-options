import type { AdminApiContext } from "@shopify/shopify-app-react-router/server";
import {
  getOptions,
  getSettings,
  serializeStorefrontConfig,
  type OptionWithRelations,
} from "./options.server";

const METAFIELD = {
  namespace: "variant_options",
  key: "config",
};

export async function syncProductMetafields(
  admin: AdminApiContext,
  shop: string,
  previousProductGids: string[] = [],
) {
  const settings = await getSettings(shop);
  const options = await getOptions(shop);
  const configs = new Map<string, OptionWithRelations[]>();

  for (const option of options) {
    if (!option.enabled) continue;
    for (const product of option.products) {
      const list = configs.get(product.productGid) ?? [];
      list.push(option);
      configs.set(product.productGid, list);
    }
  }

  const allGids = new Set([...configs.keys(), ...previousProductGids]);
  const metafields = [...allGids].map((ownerId) => ({
    ownerId,
    namespace: METAFIELD.namespace,
    key: METAFIELD.key,
    type: "json",
    value: JSON.stringify(
      serializeStorefrontConfig(configs.get(ownerId) ?? [], settings),
    ),
  }));

  for (let i = 0; i < metafields.length; i += 25) {
    const chunk = metafields.slice(i, i + 25);
    if (chunk.length === 0) continue;
    await admin.graphql(
      `#graphql
        mutation SetOptionConfig($metafields: [MetafieldsSetInput!]!) {
          metafieldsSet(metafields: $metafields) {
            userErrors { field message }
          }
        }`,
      { variables: { metafields: chunk } },
    );
  }
}
