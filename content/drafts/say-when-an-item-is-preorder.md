# Say when an item is preorder

Buyer agents should not treat a preorder as normal in-stock inventory.

The narrow merchant question is: can an agent tell that an item can be ordered now but will ship or become available later?

The short answer: use Schema.org `Offer.availability` with `https://schema.org/PreOrder`, and keep the Merchant Context record conservative because version 0.1 does not have a dedicated preorder availability value.

## Sources checked

- Schema.org `Offer`, checked 2026-10-05: https://schema.org/Offer
- Schema.org `ItemAvailability`, checked 2026-10-05: https://schema.org/ItemAvailability
- Schema.org `PreOrder`, checked 2026-10-05: https://schema.org/PreOrder
- Merchant Context public checklist, checked 2026-10-05: https://github.com/ihint/merchant-context/blob/main/CHECKLIST.md
- Merchant Context schema, checked 2026-10-05: https://github.com/ihint/merchant-context/blob/main/schema/merchant-context.schema.json
- Merchant Context beta homepage, checked 2026-10-05: https://merchant.atomandbits.com/

## What the primary sources say

Schema.org `Offer` has an `availability` property.

Schema.org describes `availability` as the availability of an item, for example in stock, out of stock, or preorder.

Source: https://schema.org/Offer

Checked: 2026-10-05.

Schema.org says the expected type for `Offer.availability` is `ItemAvailability`.

Source: https://schema.org/Offer

Checked: 2026-10-05.

Schema.org `ItemAvailability` is an enumeration type for possible product availability options.

Source: https://schema.org/ItemAvailability

Checked: 2026-10-05.

Schema.org lists `PreOrder` as an `ItemAvailability` member.

Source: https://schema.org/ItemAvailability

Checked: 2026-10-05.

Schema.org defines `PreOrder` as indicating that the item is available for preorder.

Source: https://schema.org/PreOrder

Checked: 2026-10-05.

Schema.org `Offer` also has `availabilityStarts` and `availabilityEnds` for the beginning and end of the availability of the product or service included in the offer.

Source: https://schema.org/Offer

Checked: 2026-10-05.

Merchant Context asks merchants to keep availability or capacity current and give it an update time.

Source: https://github.com/ihint/merchant-context/blob/main/CHECKLIST.md

Checked: 2026-10-05.

Merchant Context version 0.1 allows only these `offers[].availability` values: `available`, `limited`, `unavailable`, and `contact_merchant`.

Source: https://github.com/ihint/merchant-context/blob/main/schema/merchant-context.schema.json

Checked: 2026-10-05.

Merchant Context version 0.1 allows `offers[].limits` as an array of strings.

Source: https://github.com/ihint/merchant-context/blob/main/schema/merchant-context.schema.json

Checked: 2026-10-05.

The Merchant Context beta homepage links to the checklist, schema, service record, and live agent sources, but it does not currently publish a preorder example.

Source: https://merchant.atomandbits.com/

Checked: 2026-10-05.

## Recommended pattern

Use Schema.org for the exact public availability term.

Use Merchant Context version 0.1 for the agent-facing caution and next action.

Do not mark the item as simply `available` in Merchant Context if the timing or fulfillment rule is materially different from normal in-stock inventory.

Use `limited` when the preorder is orderable but has a timing, quantity, or fulfillment caveat.

Use `contact_merchant` when the merchant needs to confirm the preorder before the buyer or agent can proceed.

Put the preorder date, expected ship window, deposit rule, cancellation rule, or other caveat in `limits`.

Keep the product page, JSON-LD, Merchant Context record, and checkout copy consistent.

## Example

Product page JSON-LD:

```json
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Founders Batch Field Notebook",
  "offers": {
    "@type": "Offer",
    "url": "https://example.com/products/founders-batch-field-notebook",
    "price": "24.00",
    "priceCurrency": "USD",
    "availability": "https://schema.org/PreOrder",
    "availabilityStarts": "2026-11-15"
  }
}
```

Merchant Context version 0.1 record:

```json
{
  "version": "0.1",
  "merchant": {
    "name": "Example Merchant",
    "canonical_url": "https://example.com"
  },
  "offers": [
    {
      "id": "field-notebook-founders-batch",
      "name": "Founders Batch Field Notebook",
      "description": "A limited first batch notebook that can be preordered before fulfillment starts.",
      "canonical_url": "https://example.com/products/founders-batch-field-notebook",
      "price": {
        "amount": 24,
        "currency": "USD"
      },
      "availability": "limited",
      "limits": [
        "Preorder. Fulfillment is expected to start on 2026-11-15.",
        "Charge and cancellation terms must be checked on the product page before checkout."
      ],
      "updated_at": "2026-10-05T00:00:00Z"
    }
  ],
  "policies": [
    {
      "name": "Preorder and cancellation terms",
      "url": "https://example.com/policies/preorders"
    }
  ],
  "actions": [
    {
      "name": "checkout",
      "method": "GET",
      "url": "https://example.com/products/founders-batch-field-notebook",
      "human_confirmation_required": true
    }
  ],
  "provenance": {
    "generated_at": "2026-10-05T00:00:00Z",
    "source_urls": [
      "https://example.com/products/founders-batch-field-notebook",
      "https://example.com/policies/preorders"
    ]
  }
}
```

## Test

A simple test should pass all of these checks:

1. The product page JSON-LD parses as JSON.
2. The JSON-LD offer uses `availability: "https://schema.org/PreOrder"`.
3. The Merchant Context record parses as JSON.
4. The Merchant Context record validates against `schema/merchant-context.schema.json`.
5. The Merchant Context offer does not hide the preorder caveat.
6. The Merchant Context offer has an `updated_at` time.
7. The `limits` array says when fulfillment is expected or what the agent must verify.

## What this does not prove

This does not prove that Schema.org consumers will display preorder status in search results.

This does not add a dedicated `preorder` value to Merchant Context version 0.1.

This does not prove that the merchant can accept preorder payments, reserve stock, or fulfill the order.

This does not replace the product page, checkout terms, cancellation policy, or human approval when the agent is about to buy.
