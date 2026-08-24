# Can agents read your return window?

Checked: 2026-08-24.

Status: draft.

Merchant question: Can a buyer agent read whether a product can be returned, how long the window is, and who pays return shipping from public structured data?

Short answer: yes, if the merchant publishes `MerchantReturnPolicy` structured data with enough fields.

Short answer limit: the markup is evidence for the published policy, not proof that an order is eligible for a return.

## What primary sources say

Schema.org `Offer` has a `hasMerchantReturnPolicy` property.

Source: https://schema.org/Offer

Checked: 2026-08-24.

Schema.org says `hasMerchantReturnPolicy` specifies a `MerchantReturnPolicy` that may be applicable.

Source: https://schema.org/Offer

Checked: 2026-08-24.

Schema.org `MerchantReturnPolicy` includes `applicableCountry` for the country where the policy applies.

Source: https://schema.org/MerchantReturnPolicy

Checked: 2026-08-24.

Schema.org `MerchantReturnPolicy` includes `returnPolicyCategory` for the applicable return-policy enumeration.

Source: https://schema.org/MerchantReturnPolicy

Checked: 2026-08-24.

Schema.org `MerchantReturnPolicy` includes `merchantReturnDays` for the fixed return date or number of days from delivery when `returnPolicyCategory` is `MerchantReturnFiniteReturnWindow`.

Source: https://schema.org/MerchantReturnPolicy

Checked: 2026-08-24.

Schema.org `MerchantReturnPolicy` includes `returnFees` for the type of return fees.

Source: https://schema.org/MerchantReturnPolicy

Checked: 2026-08-24.

Schema.org `MerchantReturnPolicy` includes `refundType` for the refund type.

Source: https://schema.org/MerchantReturnPolicy

Checked: 2026-08-24.

Google Search Central says `MerchantReturnPolicy` structured data can specify a link to a return-policy page or details such as return conditions, methods, fees, refund options, and more.

Source: https://developers.google.com/search/docs/appearance/structured-data/return-policy

Checked: 2026-08-24.

Google Search Central says an organization-wide return policy can be nested under `Organization` using `hasMerchantReturnPolicy`.

Source: https://developers.google.com/search/docs/appearance/structured-data/return-policy

Checked: 2026-08-24.

Google Search Central says a product-specific override can be specified under `Offer`, but offer-level return policies support a more limited set of properties.

Source: https://developers.google.com/search/docs/appearance/structured-data/return-policy

Checked: 2026-08-24.

Google Search Central recommends validating structured data with the Rich Results Test.

Source: https://developers.google.com/search/docs/appearance/structured-data/return-policy

Checked: 2026-08-24.

Google Rich Results Test: https://search.google.com/test/rich-results

Checked: 2026-08-24.

## Working example

Use this when one product has a 30-day free-return policy for US buyers.

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "Product",
  "name": "Example wool cap",
  "url": "https://example.com/products/wool-cap",
  "offers": {
    "@type": "Offer",
    "url": "https://example.com/products/wool-cap",
    "price": "48.00",
    "priceCurrency": "USD",
    "availability": "https://schema.org/InStock",
    "hasMerchantReturnPolicy": {
      "@type": "MerchantReturnPolicy",
      "applicableCountry": "US",
      "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
      "merchantReturnDays": 30,
      "returnFees": "https://schema.org/FreeReturn",
      "refundType": "https://schema.org/FullRefund",
      "returnMethod": "https://schema.org/ReturnByMail"
    }
  }
}
</script>
```

## Minimal local test

Copy the block into an HTML file.

Parse the `application/ld+json` script.

Assert these paths exist:

- `offers.hasMerchantReturnPolicy.@type`
- `offers.hasMerchantReturnPolicy.applicableCountry`
- `offers.hasMerchantReturnPolicy.returnPolicyCategory`
- `offers.hasMerchantReturnPolicy.merchantReturnDays`
- `offers.hasMerchantReturnPolicy.returnFees`
- `offers.hasMerchantReturnPolicy.refundType`

Expected parsed policy:

```json
{
  "@type": "MerchantReturnPolicy",
  "applicableCountry": "US",
  "returnPolicyCategory": "https://schema.org/MerchantReturnFiniteReturnWindow",
  "merchantReturnDays": 30,
  "returnFees": "https://schema.org/FreeReturn",
  "refundType": "https://schema.org/FullRefund",
  "returnMethod": "https://schema.org/ReturnByMail"
}
```

Also run the same page through Google's Rich Results Test before relying on Google Search display.

Google Rich Results Test: https://search.google.com/test/rich-results

Checked: 2026-08-24.

## What an agent should not assume

Structured data does not prove the buyer is still inside the return window.

Structured data does not prove the buyer's item condition qualifies.

Structured data does not prove order history, receipt ownership, or payment refundability.

Structured data does not replace the merchant's live return flow.

A buyer agent should re-check the current policy page and require human approval before starting a return.

## Merchant Context gap found

The public repository mentions `MerchantReturnPolicy` in the protocol map.

Source: https://github.com/ihint/merchant-context/blob/main/docs/protocol-map.md

Checked: 2026-08-24.

The public checklist asks merchants to publish return and refund terms on stable URLs.

Source: https://github.com/ihint/merchant-context/blob/main/CHECKLIST.md

Checked: 2026-08-24.

The live beta home page and `llms.txt` do not include a worked return-window structured-data example.

Source: https://merchant.atomandbits.com/

Source: https://merchant.atomandbits.com/llms.txt

Checked: 2026-08-24.
