import prisma from "../db.server";

const includeAll = {
  values: { orderBy: { position: "asc" as const } },
  products: true,
  conditions: true,
};

export type OptionWithRelations = Awaited<
  ReturnType<typeof getOptions>
>[number];

export async function getOptions(shop: string) {
  return prisma.productOption.findMany({
    where: { shop },
    orderBy: { position: "asc" },
    include: includeAll,
  });
}

export async function getOption(shop: string, id: string) {
  return prisma.productOption.findFirst({
    where: { id, shop },
    include: includeAll,
  });
}

export async function getSettings(shop: string) {
  return (
    (await prisma.shopSettings.findUnique({ where: { shop } })) ??
    (await prisma.shopSettings.create({
      data: { shop },
    }))
  );
}

export async function saveSettings(
  shop: string,
  data: { customCss?: string; customHtml?: string; locale?: string },
) {
  return prisma.shopSettings.upsert({
    where: { shop },
    create: { shop, ...data },
    update: data,
  });
}

export async function createOption(
  shop: string,
  input: {
    name: string;
    displayName: string;
    type: string;
  },
) {
  const count = await prisma.productOption.count({ where: { shop } });
  return prisma.productOption.create({
    data: {
      shop,
      name: input.name,
      displayName: input.displayName,
      type: input.type,
      position: count,
    },
    include: includeAll,
  });
}

export type OptionPayload = {
  name: string;
  displayName: string;
  type: string;
  enabled: boolean;
  required: boolean;
  helpText: string;
  placeholder: string;
  customCss: string;
  customHtml: string;
  giftWrap: boolean;
  hideOutOfStock: boolean;
  values: Array<{
    id?: string;
    label: string;
    value: string;
    color: string;
    imageUrl: string;
    priceAddon: number;
    enabled: boolean;
    outOfStock: boolean;
  }>;
  products: Array<{ productGid: string; productTitle: string }>;
  conditions: Array<{
    sourceOptionId: string;
    sourceValueId: string;
    operator: string;
  }>;
};

export async function updateOption(
  shop: string,
  id: string,
  payload: OptionPayload,
) {
  const existing = await getOption(shop, id);
  if (!existing) return null;

  await prisma.$transaction([
    prisma.optionValue.deleteMany({ where: { optionId: id } }),
    prisma.optionProduct.deleteMany({ where: { optionId: id } }),
    prisma.optionCondition.deleteMany({ where: { optionId: id } }),
    prisma.productOption.update({
      where: { id },
      data: {
        name: payload.name,
        displayName: payload.displayName,
        type: payload.type,
        enabled: payload.enabled,
        required: payload.required,
        helpText: payload.helpText,
        placeholder: payload.placeholder,
        customCss: payload.customCss,
        customHtml: payload.customHtml,
        giftWrap: payload.giftWrap,
        hideOutOfStock: payload.hideOutOfStock,
        values: {
          create: payload.values.map((value, position) => ({
            label: value.label,
            value: value.value || value.label,
            color: value.color || "",
            imageUrl: value.imageUrl || "",
            priceAddon: Number(value.priceAddon) || 0,
            enabled: value.enabled,
            outOfStock: value.outOfStock,
            position,
          })),
        },
        products: {
          create: payload.products.map((product) => ({
            productGid: product.productGid,
            productTitle: product.productTitle,
          })),
        },
        conditions: {
          create: payload.conditions.map((condition) => ({
            sourceOptionId: condition.sourceOptionId,
            sourceValueId: condition.sourceValueId,
            operator: condition.operator || "equals",
          })),
        },
      },
    }),
  ]);

  return getOption(shop, id);
}

export async function deleteOption(shop: string, id: string) {
  const existing = await getOption(shop, id);
  if (!existing) return null;
  await prisma.productOption.delete({ where: { id } });
  return existing;
}

export async function duplicateOption(shop: string, id: string) {
  const source = await getOption(shop, id);
  if (!source) return null;
  const count = await prisma.productOption.count({ where: { shop } });
  return prisma.productOption.create({
    data: {
      shop,
      name: `${source.name} copy`,
      displayName: source.displayName,
      type: source.type,
      enabled: false,
      required: source.required,
      position: count,
      helpText: source.helpText,
      placeholder: source.placeholder,
      customCss: source.customCss,
      customHtml: source.customHtml,
      giftWrap: source.giftWrap,
      hideOutOfStock: source.hideOutOfStock,
      values: {
        create: source.values.map((value) => ({
          label: value.label,
          value: value.value,
          color: value.color,
          imageUrl: value.imageUrl,
          priceAddon: value.priceAddon,
          enabled: value.enabled,
          outOfStock: value.outOfStock,
          position: value.position,
        })),
      },
      products: {
        create: source.products.map((product) => ({
          productGid: product.productGid,
          productTitle: product.productTitle,
        })),
      },
    },
    include: includeAll,
  });
}

export async function setOptionEnabled(
  shop: string,
  id: string,
  enabled: boolean,
) {
  const existing = await getOption(shop, id);
  if (!existing) return null;
  return prisma.productOption.update({
    where: { id },
    data: { enabled },
    include: includeAll,
  });
}

export async function reorderOptions(shop: string, orderedIds: string[]) {
  await prisma.$transaction(
    orderedIds.map((id, position) =>
      prisma.productOption.updateMany({
        where: { id, shop },
        data: { position },
      }),
    ),
  );
  return getOptions(shop);
}

export async function seedDemoOptions(shop: string) {
  const count = await prisma.productOption.count({ where: { shop } });
  if (count > 0) return getOptions(shop);

  const demos = [
    {
      name: "Size",
      displayName: "Select Size",
      type: "button",
      enabled: true,
      values: ["S", "M", "L", "XL"].map((label) => ({ label, value: label })),
    },
    {
      name: "Color",
      displayName: "Choose Color",
      type: "color_swatch",
      enabled: true,
      values: [
        { label: "Black", value: "Black", color: "#111111" },
        { label: "White", value: "White", color: "#ffffff" },
        { label: "Navy", value: "Navy", color: "#1e3a8a" },
        { label: "Red", value: "Red", color: "#b91c1c" },
      ],
    },
    {
      name: "Material",
      displayName: "Material",
      type: "dropdown",
      enabled: true,
      values: ["Cotton", "Linen", "Wool"].map((label) => ({
        label,
        value: label,
      })),
    },
    {
      name: "Style",
      displayName: "Style",
      type: "radio",
      enabled: false,
      values: ["Classic", "Modern"].map((label) => ({ label, value: label })),
    },
  ];

  for (const [index, demo] of demos.entries()) {
    await prisma.productOption.create({
      data: {
        shop,
        name: demo.name,
        displayName: demo.displayName,
        type: demo.type,
        enabled: demo.enabled,
        position: index,
        values: {
          create: demo.values.map((value, position) => ({
            label: value.label,
            value: value.value,
            color: "color" in value ? value.color : "",
            position,
          })),
        },
      },
    });
  }

  return getOptions(shop);
}

export function serializeStorefrontConfig(
  options: OptionWithRelations[],
  settings: { customCss: string; customHtml: string },
) {
  const enabled = options.filter((option) => option.enabled);
  return {
    customCss: settings.customCss,
    customHtml: settings.customHtml,
    options: enabled.map((option) => ({
      id: option.id,
      name: option.name,
      displayName: option.displayName,
      type: option.type,
      required: option.required,
      helpText: option.helpText,
      placeholder: option.placeholder,
      customCss: option.customCss,
      customHtml: option.customHtml,
      giftWrap: option.giftWrap,
      hideOutOfStock: option.hideOutOfStock,
      values: option.values
        .filter((value) => value.enabled)
        .map((value) => ({
          id: value.id,
          label: value.label,
          value: value.value,
          color: value.color,
          imageUrl: value.imageUrl,
          priceAddon: value.priceAddon,
          outOfStock: value.outOfStock,
        })),
      conditions: option.conditions.map((condition) => ({
        sourceOptionId: condition.sourceOptionId,
        sourceValueId: condition.sourceValueId,
        operator: condition.operator,
      })),
    })),
  };
}

export async function getConfigForProduct(shop: string, productGid: string) {
  const settings = await getSettings(shop);
  const options = await prisma.productOption.findMany({
    where: {
      shop,
      enabled: true,
      products: { some: { productGid } },
    },
    orderBy: { position: "asc" },
    include: includeAll,
  });
  return serializeStorefrontConfig(options, settings);
}
