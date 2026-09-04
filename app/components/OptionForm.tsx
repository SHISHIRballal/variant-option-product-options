import { useEffect, useMemo, useState } from "react";
import { Form, useNavigation } from "react-router";
import { useAppBridge } from "@shopify/app-bridge-react";
import { OPTION_TYPES, usesValues } from "../lib/option-types";
import { emptyValue } from "../lib/form";

type ValueDraft = ReturnType<typeof emptyValue> & { id?: string };
type ProductDraft = { productGid: string; productTitle: string };
type ConditionDraft = {
  sourceOptionId: string;
  sourceValueId: string;
  operator: string;
};

type SourceOption = {
  id: string;
  name: string;
  values: Array<{ id: string; label: string }>;
};

export function OptionForm({
  option,
  sourceOptions,
}: {
  option?: {
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
    values: ValueDraft[];
    products: ProductDraft[];
    conditions: ConditionDraft[];
  };
  sourceOptions: SourceOption[];
}) {
  const shopify = useAppBridge();
  const navigation = useNavigation();
  const saving = navigation.state !== "idle";

  const [type, setType] = useState(option?.type ?? "button");
  const [values, setValues] = useState<ValueDraft[]>(
    option?.values?.length ? option.values : [emptyValue()],
  );
  const [products, setProducts] = useState<ProductDraft[]>(
    option?.products ?? [],
  );
  const [conditions, setConditions] = useState<ConditionDraft[]>(
    option?.conditions ?? [],
  );

  useEffect(() => {
    if (!usesValues(type) && values.length) {
      setValues([]);
    }
    if (usesValues(type) && values.length === 0) {
      setValues([emptyValue()]);
    }
  }, [type, values.length]);

  const valuesJson = useMemo(() => JSON.stringify(values), [values]);
  const productsJson = useMemo(() => JSON.stringify(products), [products]);
  const conditionsJson = useMemo(
    () => JSON.stringify(conditions),
    [conditions],
  );

  const pickProducts = async () => {
    const selected = await shopify.resourcePicker({
      type: "product",
      multiple: true,
      action: "select",
      selectionIds: products.map((product) => ({ id: product.productGid })),
    });
    if (!selected) return;
    setProducts(
      selected.map((product) => ({
        productGid: product.id,
        productTitle: product.title,
      })),
    );
  };

  const updateValue = (index: number, patch: Partial<ValueDraft>) => {
    setValues((current) =>
      current.map((value, i) => (i === index ? { ...value, ...patch } : value)),
    );
  };

  return (
    <Form method="post">
      <input type="hidden" name="valuesJson" value={valuesJson} />
      <input type="hidden" name="productsJson" value={productsJson} />
      <input type="hidden" name="conditionsJson" value={conditionsJson} />

      <s-stack gap="large">
        <s-section heading="Option details">
          <s-stack gap="base">
            <s-text-field
              name="name"
              label="Option name"
              details="Internal name shown in this admin list."
              value={option?.name}
              required
            />
            <s-text-field
              name="displayName"
              label="Display name"
              details="Customer-facing label on the product page."
              value={option?.displayName}
              required
            />
            <s-select
              name="type"
              label="Type"
              value={type}
              onChange={(event: Event) => {
                const target = event.target as HTMLSelectElement;
                setType(target.value);
              }}
            >
              {OPTION_TYPES.map((item) => (
                <s-option key={item.value} value={item.value}>
                  {item.label}
                </s-option>
              ))}
            </s-select>
            <s-stack direction="inline" gap="large">
              <s-checkbox
                name="enabled"
                label="Enabled"
                defaultChecked={option?.enabled ?? true}
              />
              <s-checkbox
                name="required"
                label="Required"
                defaultChecked={option?.required ?? false}
              />
              <s-checkbox
                name="giftWrap"
                label="Gift wrap"
                defaultChecked={option?.giftWrap ?? false}
              />
              <s-checkbox
                name="hideOutOfStock"
                label="Hide out-of-stock values"
                defaultChecked={option?.hideOutOfStock ?? false}
              />
            </s-stack>
            <s-text-field
              name="helpText"
              label="Help text"
              value={option?.helpText}
            />
            <s-text-field
              name="placeholder"
              label="Placeholder"
              value={option?.placeholder}
            />
          </s-stack>
        </s-section>

        {usesValues(type) ? (
          <s-section heading="Option values">
            <s-stack gap="base">
              {values.map((value, index) => (
                <s-box
                  key={`${value.id ?? "new"}-${index}`}
                  padding="base"
                  borderWidth="base"
                  borderRadius="base"
                >
                  <s-stack gap="base">
                    <s-stack direction="inline" gap="base">
                      <s-text-field
                        label="Label"
                        value={value.label}
                        onInput={(event: Event) =>
                          updateValue(index, {
                            label: (event.target as HTMLInputElement).value,
                          })
                        }
                      />
                      <s-text-field
                        label="Value"
                        value={value.value}
                        onInput={(event: Event) =>
                          updateValue(index, {
                            value: (event.target as HTMLInputElement).value,
                          })
                        }
                      />
                      <s-text-field
                        label="Price add-on"
                        type="number"
                        value={String(value.priceAddon)}
                        onInput={(event: Event) =>
                          updateValue(index, {
                            priceAddon: Number(
                              (event.target as HTMLInputElement).value,
                            ),
                          })
                        }
                      />
                    </s-stack>
                    {type === "color_swatch" ? (
                      <s-text-field
                        label="Color"
                        value={value.color}
                        onInput={(event: Event) =>
                          updateValue(index, {
                            color: (event.target as HTMLInputElement).value,
                          })
                        }
                      />
                    ) : null}
                    {type === "image_swatch" ? (
                      <s-text-field
                        label="Image URL"
                        value={value.imageUrl}
                        onInput={(event: Event) =>
                          updateValue(index, {
                            imageUrl: (event.target as HTMLInputElement).value,
                          })
                        }
                      />
                    ) : null}
                    <s-stack direction="inline" gap="large">
                      <s-checkbox
                        label="Enabled"
                        checked={value.enabled}
                        onChange={() =>
                          updateValue(index, { enabled: !value.enabled })
                        }
                      />
                      <s-checkbox
                        label="Out of stock"
                        checked={value.outOfStock}
                        onChange={() =>
                          updateValue(index, { outOfStock: !value.outOfStock })
                        }
                      />
                      <s-button
                        variant="tertiary"
                        tone="critical"
                        onClick={() =>
                          setValues((current) =>
                            current.filter((_, i) => i !== index),
                          )
                        }
                      >
                        Remove
                      </s-button>
                    </s-stack>
                  </s-stack>
                </s-box>
              ))}
              <s-button
                onClick={() => setValues((current) => [...current, emptyValue()])}
              >
                Add value
              </s-button>
            </s-stack>
          </s-section>
        ) : null}

        <s-section heading="Conditional logic">
          <s-paragraph>
            Show this option only when another option matches a value.
          </s-paragraph>
          <s-stack gap="base">
            {conditions.map((condition, index) => {
              const source = sourceOptions.find(
                (item) => item.id === condition.sourceOptionId,
              );
              return (
                <s-stack key={index} direction="inline" gap="base">
                  <s-select
                    label="When option"
                    value={condition.sourceOptionId}
                    onChange={(event: Event) => {
                      const sourceOptionId = (event.target as HTMLSelectElement)
                        .value;
                      setConditions((current) =>
                        current.map((item, i) =>
                          i === index
                            ? { ...item, sourceOptionId, sourceValueId: "" }
                            : item,
                        ),
                      );
                    }}
                  >
                    <s-option value="">Select option</s-option>
                    {sourceOptions.map((item) => (
                      <s-option key={item.id} value={item.id}>
                        {item.name}
                      </s-option>
                    ))}
                  </s-select>
                  <s-select
                    label="Operator"
                    value={condition.operator}
                    onChange={(event: Event) => {
                      const operator = (event.target as HTMLSelectElement)
                        .value;
                      setConditions((current) =>
                        current.map((item, i) =>
                          i === index ? { ...item, operator } : item,
                        ),
                      );
                    }}
                  >
                    <s-option value="equals">equals</s-option>
                    <s-option value="not_equals">does not equal</s-option>
                    <s-option value="any">is any value</s-option>
                  </s-select>
                  <s-select
                    label="Value"
                    value={condition.sourceValueId}
                    onChange={(event: Event) => {
                      const sourceValueId = (event.target as HTMLSelectElement)
                        .value;
                      setConditions((current) =>
                        current.map((item, i) =>
                          i === index ? { ...item, sourceValueId } : item,
                        ),
                      );
                    }}
                  >
                    <s-option value="">Any</s-option>
                    {(source?.values ?? []).map((value) => (
                      <s-option key={value.id} value={value.id}>
                        {value.label}
                      </s-option>
                    ))}
                  </s-select>
                  <s-button
                    variant="tertiary"
                    onClick={() =>
                      setConditions((current) =>
                        current.filter((_, i) => i !== index),
                      )
                    }
                  >
                    Remove
                  </s-button>
                </s-stack>
              );
            })}
            <s-button
              onClick={() =>
                setConditions((current) => [
                  ...current,
                  {
                    sourceOptionId: sourceOptions[0]?.id ?? "",
                    sourceValueId: "",
                    operator: "equals",
                  },
                ])
              }
            >
              Add condition
            </s-button>
          </s-stack>
        </s-section>

        <s-section heading="Assign products">
          <s-paragraph>
            Customers see this option on assigned product pages. Config is
            stored on each product as a metafield for the theme block.
          </s-paragraph>
          <s-stack gap="base">
            {products.length ? (
              <s-unordered-list>
                {products.map((product) => (
                  <s-list-item key={product.productGid}>
                    {product.productTitle || product.productGid}
                  </s-list-item>
                ))}
              </s-unordered-list>
            ) : (
              <s-paragraph>No products assigned yet.</s-paragraph>
            )}
            <s-button onClick={pickProducts}>Choose products</s-button>
          </s-stack>
        </s-section>

        <s-section heading="Custom CSS and HTML">
          <s-stack gap="base">
            <s-text-area
              name="customCss"
              label="Custom CSS"
              value={option?.customCss}
            />
            <s-text-area
              name="customHtml"
              label="Custom HTML"
              value={option?.customHtml}
            />
          </s-stack>
        </s-section>

        <s-stack direction="inline" gap="base">
          <s-button
            type="submit"
            variant="primary"
            {...(saving ? { loading: true } : {})}
          >
            Save option
          </s-button>
          <s-button href="/app" variant="tertiary">
            Cancel
          </s-button>
        </s-stack>
      </s-stack>
    </Form>
  );
}
