# Can agents read shipping cost and delivery time from Schema.org?

Checked: 2026-08-17.

Status: draft.

## Short answer

Yes, if the product offer publishes `shippingDetails` as structured data.

Use `Offer.shippingDetails` for machine-readable shipping facts.

Use `OfferShippingDetails.shippingRate` for the shipping cost to a destination.

Use `OfferShippingDetails.shippingDestination` for the region that the rate applies to.

Use `OfferShippingDetails.deliveryTime` for the delay between order receipt and delivery.

This does not prove checkout support.

This does not prove live stock.

This does not prove the rate is still current at purchase time.

## Primary sources

Schema.org `Offer` lists `shippingDetails` as an `Offer` property.

Source: https://schema.org/Offer

Checked: 2026-08-17.

Schema.org `Offer` says `priceCurrency` should use standard formats such as ISO 4217 currency codes.

Source: https://schema.org/Offer

Checked: 2026-08-17.

Schema.org `OfferShippingDetails` represents information about shipping destinations.

Source: https://schema.org/OfferShippingDetails

Checked: 2026-08-17.

Schema.org `OfferShippingDetails` says multiple `OfferShippingDetails` entities can represent different shipping rates for different destinations.

Source: https://schema.org/OfferShippingDetails

Checked: 2026-08-17.

Schema.org `OfferShippingDetails.deliveryTime` expects `ShippingDeliveryTime`.

Source: https://schema.org/OfferShippingDetails

Checked: 2026-08-17.

Schema.org `OfferShippingDetails.shippingDestination` expects `DefinedRegion`.

Source: https://schema.org/OfferShippingDetails

Checked: 2026-08-17.

Schema.org `OfferShippingDetails.shippingRate` expects `MonetaryAmount` or `ShippingRateSettings`.

Source: https://schema.org/OfferShippingDetails

Checked: 2026-08-17.

Schema.org `ShippingDeliveryTime` provides information about delivery times for shipping.

Source: https://schema.org/ShippingDeliveryTime

Checked: 2026-08-17.

Schema.org `ShippingDeliveryTime.handlingTime` is the typical delay between order receipt and warehouse departure or pickup preparation.

Source: https://schema.org/ShippingDeliveryTime

Checked: 2026-08-17.

Schema.org `ShippingDeliveryTime.transitTime` is the typical delay between shipment and delivery to the customer.

Source: https://schema.org/ShippingDeliveryTime

Checked: 2026-08-17.

Google's merchant listing structured data guide includes a JSON-LD example with `shippingDetails`, `OfferShippingDetails`, `shippingRate`, `shippingDestination`, and `deliveryTime` inside a Product offer.

Source: https://developers.google.com/search/docs/appearance/structured-data/merchant-listing#shipping-details

Checked: 2026-08-17.

Google's merchant listing structured data guide tells publishers to validate structured data with the Rich Results Test and fix critical errors.

Source: https://developers.google.com/search/docs/appearance/structured-data/merchant-listing

Checked: 2026-08-17.

## Minimal example

This example says shipping to the United States costs USD 3.49.

This example says handling normally takes 0 to 1 business day.

This example says transit normally takes 1 to 5 days.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org/",
  "@type": "Product",
  "name": "Nice trinket",
  "offers": {
    "@type": "Offer",
    "url": "https://example.com/products/nice-trinket",
    "price": "39.99",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "shippingDetails": {
      "@type": "OfferShippingDetails",
      "shippingRate": {
        "@type": "MonetaryAmount",
        "value": 3.49,
        "currency": "USD"
      },
      "shippingDestination": {
        "@type": "DefinedRegion",
        "addressCountry": "US"
      },
      "deliveryTime": {
        "@type": "ShippingDeliveryTime",
        "handlingTime": {
          "@type": "QuantitativeValue",
          "minValue": 0,
          "maxValue": 1,
          "unitCode": "d"
        },
        "transitTime": {
          "@type": "QuantitativeValue",
          "minValue": 1,
          "maxValue": 5,
          "unitCode": "d"
        }
      }
    }
  }
}
</script>
```

## Local extraction test

Save a product page to `product.html`.

Run this command without calling checkout.

```sh
python3 - <<'PY'
from html.parser import HTMLParser
import json
from pathlib import Path

class JsonLdParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.in_jsonld = False
        self.blocks = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.in_jsonld = tag == "script" and attrs.get("type") == "application/ld+json"
    def handle_endtag(self, tag):
        if tag == "script":
            self.in_jsonld = False
    def handle_data(self, data):
        if self.in_jsonld:
            self.blocks.append(data)

parser = JsonLdParser()
parser.feed(Path("product.html").read_text(encoding="utf-8"))

for block in parser.blocks:
    data = json.loads(block)
    nodes = data if isinstance(data, list) else [data]
    for node in nodes:
        offer = node.get("offers", {}) if isinstance(node, dict) else {}
        details = offer.get("shippingDetails") if isinstance(offer, dict) else None
        if details:
            print(json.dumps(details, indent=2, sort_keys=True))
            raise SystemExit(0)

raise SystemExit("No Offer.shippingDetails found")
PY
```

Pass condition: the command prints an `OfferShippingDetails` object.

Pass condition: the object has `shippingRate.currency`, `shippingRate.value`, and `shippingDestination`.

Pass condition: the object has `deliveryTime.handlingTime` or `deliveryTime.transitTime` when delivery timing is promised.

Fail condition: the command prints `No Offer.shippingDetails found`.

## Rich-results check

Paste the page URL or code into Google's Rich Results Test.

Source: https://search.google.com/test/rich-results

Checked: 2026-08-17.

Pass condition: the test reports no critical structured-data errors for the product offer.

Google eligibility is not the same as agent readiness.

Agent readiness still needs stable source URLs, current data, and clear limits beside the offer.

## Merchant Context mapping

Copy the same shipping facts into `merchant-context.json` only if they are true for the offer.

Keep a source URL for the shipping policy or product page.

Keep an update time for the offer.

Return `unknown` instead of guessing if the shipping destination, cost, or timing depends on buyer address, carrier quote, inventory location, or checkout-time rules.

## Known limits

Schema.org structured data is a publishing format, not a checkout protocol.

A crawler can read `shippingDetails` without knowing whether the merchant will accept an order.

A buyer agent should re-check price, availability, shipping, taxes, and terms before any purchase action.

The live Merchant Context beta site is a SaaS/tool offer and does not publish a shippable product example.

The current public repo has a checklist item for shipping terms, but it did not have a dedicated shipping structured-data article before this draft.
