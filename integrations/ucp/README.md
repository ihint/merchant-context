# UCP mapping

This folder maps Merchant Context output to UCP inputs.

It does not claim a UCP service, checkout capability, or payment handler.

The live merchant profile keeps `services` and `payment_handlers` empty.

Where a UCP host permits custom request metadata, pass the signed token as `merchant_context_session`.

Do not put buyer data, payment data, prompts, credentials, or secrets in that field.

Test the map against a real UCP host before changing `status` from `mapping_only`.
