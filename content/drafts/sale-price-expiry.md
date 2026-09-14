# How do I tell agents when a sale price expires?

Merchant question: How do I publish that a sale price stops being valid after a specific date?

Short answer: put the sale price in a Schema.org `Offer` and set `priceValidUntil` to the last valid date.

Do not use `priceValidUntil` to say when the product itself disappears.

Use `availabilityEnds` when the product or service stops being available.

Keep the human-visible page, JSON-LD, feeds, and APIs in agreement.

## Evidence

Schema.org defines `Offer` as an offer to transfer rights to an item or provide a service.

Source: https://schema.org/Offer

Checked: 2026-09-14.

Schema.org says `priceValidUntil` has expected type `Date`.

Source: https://schema.org/Offer

Checked: 2026-09-14.

Schema.org defines `priceValidUntil` as "The date after which the price is no longer available."

Source: https://schema.org/Offer

Checked: 2026-09-14.

Schema.org says `availabilityEnds` can be a `Date`, `DateTime`, or `Time`.

Source: https://schema.org/Offer

Checked: 2026-09-14.

Schema.org defines `availabilityEnds` as "The end of the availability of the product or service included in the offer."

Source: https://schema.org/Offer

Checked: 2026-09-14.

Merchant Context's current checklist says price should include expiry where expiry applies, but the public repo does not yet give a worked `priceValidUntil` example.

Source: https://github.com/ihint/merchant-context/blob/main/CHECKLIST.md

Checked: 2026-09-14.

The live beta home page, install page, arena page, `llms.txt`, and `merchant-context.json` do not currently explain how to publish an expiring sale price.

Sources:

- https://merchant.atomandbits.com/
- https://merchant.atomandbits.com/install
- https://merchant.atomandbits.com/arena
- https://merchant.atomandbits.com/llms.txt
- https://merchant.atomandbits.com/merchant-context.json

Checked: 2026-09-14.

## Example

This JSON-LD says the mug is in stock and the $19.00 sale price is no longer valid after 2026-10-01.

It does not say the mug is unavailable after 2026-10-01.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Blue enamel camp mug",
  "url": "https://example.com/products/blue-enamel-camp-mug",
  "offers": {
    "@type": "Offer",
    "url": "https://example.com/products/blue-enamel-camp-mug",
    "price": "19.00",
    "priceCurrency": "USD",
    "priceValidUntil": "2026-10-01",
    "availability": "https://schema.org/InStock",
    "seller": {
      "@type": "Organization",
      "name": "Example Outdoor Shop"
    }
  }
}
</script>
```

## Test

A small test should check that the page has one machine-readable sale-price expiry and that the value parses as a date.

```python
import json
from datetime import date

json_ld = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": "Blue enamel camp mug",
    "url": "https://example.com/products/blue-enamel-camp-mug",
    "offers": {
        "@type": "Offer",
        "url": "https://example.com/products/blue-enamel-camp-mug",
        "price": "19.00",
        "priceCurrency": "USD",
        "priceValidUntil": "2026-10-01",
        "availability": "https://schema.org/InStock",
        "seller": {
            "@type": "Organization",
            "name": "Example Outdoor Shop",
        },
    },
}

offer = json_ld["offers"]
assert offer["@type"] == "Offer"
assert offer["price"] == "19.00"
assert offer["priceCurrency"] == "USD"
assert date.fromisoformat(offer["priceValidUntil"]) == date(2026, 10, 1)
assert offer["availability"] == "https://schema.org/InStock"
print(json.dumps({"ok": True, "priceValidUntil": offer["priceValidUntil"]}))
```

Expected output:

```json
{"ok": true, "priceValidUntil": "2026-10-01"}
```

## Agent rule

If `priceValidUntil` is in the past, do not quote the sale price as current.

If the product can still be bought at another price, keep availability separate from price expiry.

If the date conflicts with the visible page or checkout, mark the price unknown and cite the conflict.

## Limits

This example does not prove that every buyer agent or search engine will use the field.

This example does not implement checkout, payment, inventory reservation, or human approval.

This example does not replace product-feed requirements for any marketplace or ad platform.
