# Draft Cloudflare OS Gatekeeper/Blueprint adapter

**Status: draft adapter, not a supported Cloudflare OS install.**

Current primary Cloudflare docs do not publish a stable install contract for a Cloudflare OS Gatekeeper or Blueprint package. This directory therefore supplies a useful policy model and a validation tool. It does not claim that Cloudflare accepts this file, and it must not be passed to an installer without checking the current public contract.

`blueprint.draft.json` states the intended controls:

- load free Merchant Context tools by default;
- run `resolve_merchant` before merchant facts or actions;
- forward `merchant_context_session` to WebMCP input;
- require human confirmation for consequential actions; and
- keep paid refresh and its compatibility alias out of the default tool set.

Run `npm test` for static validation. Once Cloudflare publishes a stable contract, translate these controls into that contract and replace the draft label only after an end-to-end review.
