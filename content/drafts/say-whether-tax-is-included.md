# Say whether tax is included in the price

Buyer agents should not guess whether a displayed price already includes tax.

The narrow merchant question is: when a product page shows `$49.00`, can an agent tell whether tax is included?

The short answer: publish the amount, currency, and tax-included flag in structured data, then keep the same fact in your merchant-context record.

## Sources checked

- Schema.org `Offer`, checked 2026-09-28: https://schema.org/Offer
- Schema.org `PriceSpecification`, checked 2026-09-28: https://schema.org/PriceSpecification
- Merchant Context public checklist, checked 2026-09-28: https://github.com/ihint/merchant-context/blob/main/CHECKLIST.md
- Merchant Context schema, checked 2026-09-28: https://github.com/ihint/merchant-context/blob/main/schema/merchant-context.schema.json

## What the primary sources say

Schema.org `Offer` has a `priceSpecification` property.

Schema.org says `priceSpecification` is one or more detailed price specifications indicating the unit price and delivery or payment charges.

Source: https://schema.org/Offer

Checked: 2026-09-28.

Schema.org `PriceSpecification` has a `price` property.

Schema.org says `price` is the offer price of a product or a price component.

Source: https://schema.org/PriceSpecification

Checked: 2026-09-28.

Schema.org says to use `priceCurrency` with standard formats such as ISO 4217 currency codes instead of ambiguous symbols such as `$`.

Source: https://schema.org/PriceSpecification

Checked: 2026-09-28.

Schema.org `PriceSpecification` has a `valueAddedTaxIncluded` property.

Schema.org says `valueAddedTaxIncluded` specifies whether the applicable value-added tax is included in the price specification or not.

Source: https://schema.org/PriceSpecification

Checked: 2026-09-28.

Merchant Context asks merchants to state whether taxes are included where price applies.

Source: https://github.com/ihint/merchant-context/blob/main/CHECKLIST.md

Checked: 2026-09-28.

Merchant Context schema has an optional boolean `offers[].price.tax_included` field.

Source: https://github.com/ihint/merchant-context/blob/main/schema/merchant-context.schema.json

Checked: 2026-09-28.

## Recommended pattern

Use Schema.org `Offer.priceSpecification` for the public page.

Use `PriceSpecification.price` for the machine-readable amount.

Use `PriceSpecification.priceCurrency` for the currency code.

Use `PriceSpecification.valueAddedTaxIncluded` for the tax-included flag.

Mirror the same fact in `merchant-context.json` as `offers[].price.tax_included`.

Do not make an agent infer tax treatment from copy such as “only $49”.

Do not put `$49.00` in `price` when `49.00` plus `priceCurrency: "USD"` is available.

Do not use this field to claim checkout, tax calculation, or compliance.

It only states whether the listed price includes the applicable VAT or tax for that price specification.

## Example JSON-LD

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Founders audit",
  "offers": {
    "@type": "Offer",
    "url": "https://example.com/founders-audit",
    "availability": "https://schema.org/InStock",
    "priceSpecification": {
      "@type": "PriceSpecification",
      "price": "49.00",
      "priceCurrency": "USD",
      "valueAddedTaxIncluded": false
    }
  }
}
</script>
```

## Matching Merchant Context record

```json
{
  "id": "founders-audit",
  "name": "Founders audit",
  "canonical_url": "https://example.com/founders-audit",
  "price": {
    "amount": 49.0,
    "currency": "USD",
    "billing_period": "one_time",
    "tax_included": false
  },
  "availability": "available",
  "updated_at": "2026-09-28T00:00:00Z"
}
```

## Test

A lightweight page check can parse the JSON-LD and fail when the tax flag is missing or not boolean.

```js
const scripts = [...document.querySelectorAll('script[type="application/ld+json"]')];
const nodes = scripts.map((script) => JSON.parse(script.textContent));
const offers = nodes.flatMap((node) => Array.isArray(node.offers) ? node.offers : [node.offers]).filter(Boolean);
const pricedOffers = offers.filter((offer) => offer.priceSpecification);

for (const offer of pricedOffers) {
  const spec = offer.priceSpecification;
  if (typeof spec.valueAddedTaxIncluded !== 'boolean') {
    throw new Error(`${offer.url || 'offer'} is missing boolean valueAddedTaxIncluded`);
  }
  if (!spec.priceCurrency || /[$€£]/.test(String(spec.price))) {
    throw new Error(`${offer.url || 'offer'} should use price plus priceCurrency, not a currency symbol in price`);
  }
}
```

Expected result for the example above: the check passes.

Expected failure case: remove `valueAddedTaxIncluded` or set it to `"unknown"`; the check throws.

## Limits

`valueAddedTaxIncluded` is a Schema.org price-specification field, not a proof that the seller calculated every buyer's final tax.

Different jurisdictions may require different display rules.

If the listed price changes by buyer location, publish the applicable region and keep unsupported regions unknown.

If taxes are calculated only at checkout, say that plainly and do not mark the listed price as tax-included.
