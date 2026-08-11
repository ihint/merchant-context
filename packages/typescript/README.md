# Merchant preflight TypeScript client

This zero-dependency client uses direct HTTP.

It calls free resolution and preflight routes.

It blocks paid refresh unless the caller passes `approved: true`.

Unit, tarball install, and preview preflight tests passed on 2026-08-11.

```js
import { MerchantPreflightClient } from "@atomandbits/merchant-preflight";
const client = new MerchantPreflightClient();
const result = await client.resolveMerchant("https://merchant.atomandbits.com");
```

Expected: sourced facts with freshness, stale labels, and unknown values. The service receives the public merchant URL plus any intent and constraints. Do not send secrets or buyer or payment data. Resolution and preflight are free. Refresh is paid and needs exact terms plus human approval. Remove the package with your package manager.
