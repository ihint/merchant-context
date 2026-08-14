# Should robots.txt explicitly allow agent-facing merchant files?

Check date: 2026-08-10.

## Short answer

Yes, if the merchant wants crawlers and buyer agents to fetch those files.

`robots.txt` is the standard place to publish crawl rules for automated clients.

`robots.txt` is not access authorization.

The rule file applies to one host, protocol, and port.

A buyer agent that follows the Robots Exclusion Protocol chooses the matching `User-agent` group before applying rules.

If no matching named group exists, the agent uses the `User-agent: *` group when it exists.

`Allow` and `Disallow` rules are matched against URL paths.

The most specific matching path wins.

If an `Allow` rule and a `Disallow` rule are equivalent, the `Allow` rule should be used.

Google supports `user-agent`, `allow`, `disallow`, and `sitemap` fields in `robots.txt`.

Google says a `Sitemap:` line in `robots.txt` points to a fully qualified sitemap URL.

## Why this matters for merchants

Agents need stable public facts before they can compare offers.

A merchant can make the intended public machine files obvious without opening account, cart, checkout, or admin paths.

A merchant should not rely on `robots.txt` to protect private data.

Private data needs real access control outside `robots.txt`.

## Minimal example

This example keeps agent-facing files crawlable and keeps common transactional paths out of general crawling.

```txt
User-agent: *
Allow: /llms.txt
Allow: /merchant-context.json
Allow: /.well-known/ai-merchants
Allow: /.well-known/ucp
Disallow: /account/
Disallow: /cart/
Disallow: /checkout/
Disallow: /admin/

Sitemap: https://example.com/sitemap.xml
```

Expected rule outcomes:

- `/llms.txt` is allowed.
- `/merchant-context.json` is allowed.
- `/.well-known/ai-merchants` is allowed.
- `/.well-known/ucp` is allowed.
- `/cart/` is disallowed.
- `/checkout/` is disallowed.
- `/robots.txt` is implicitly allowed by RFC 9309.

## Stricter example for a site that blocks most crawling

This example blocks the site by default and then opens only the files that agents need.

```txt
User-agent: *
Disallow: /
Allow: /$
Allow: /robots.txt
Allow: /llms.txt
Allow: /merchant-context.json
Allow: /.well-known/ai-merchants
Allow: /.well-known/ucp

Sitemap: https://example.com/sitemap.xml
```

Expected rule outcomes:

- `/` is allowed because `/` with the end marker is more specific than `Disallow: /` for the root URL.
- `/merchant-context.json` is allowed because the `Allow` path is more specific than `Disallow: /`.
- `/checkout/` is disallowed because only `Disallow: /` matches it.

## Simple test

Fetch the live files before claiming that agents can use them.

```sh
curl -i https://example.com/robots.txt
curl -i https://example.com/llms.txt
curl -i https://example.com/merchant-context.json
curl -i https://example.com/.well-known/ai-merchants
curl -i https://example.com/.well-known/ucp
curl -i https://example.com/sitemap.xml
```

Pass condition:

- Each intended public file returns a 2xx HTTP status.
- `robots.txt` is plain UTF-8 text.
- `merchant-context.json` parses as JSON.
- `sitemap.xml` lists the public machine files that should be discoverable.
- No private cart, account, checkout, admin, customer, order, payment, or session URL is listed as an intended public source.

## Live beta check

Merchant Context has a live `robots.txt` at `https://merchant.atomandbits.com/robots.txt`.

Merchant Context has a live sitemap at `https://merchant.atomandbits.com/sitemap.xml`.

The sitemap lists `https://merchant.atomandbits.com/llms.txt`.

The sitemap lists `https://merchant.atomandbits.com/merchant-context.json`.

The sitemap lists `https://merchant.atomandbits.com/.well-known/ucp`.

The sitemap lists `https://merchant.atomandbits.com/.well-known/ai-merchants`.

Checked: 2026-08-10.

## Sources

- RFC 9309, Robots Exclusion Protocol.
  Source: https://www.rfc-editor.org/rfc/rfc9309.html
  Checked: 2026-08-10.
- RFC 9309 says the protocol rules are not a form of access authorization.
  Source: https://www.rfc-editor.org/rfc/rfc9309.html#section-1
  Checked: 2026-08-10.
- RFC 9309 defines groups, `user-agent`, `allow`, and `disallow` syntax.
  Source: https://www.rfc-editor.org/rfc/rfc9309.html#section-2.1
  Checked: 2026-08-10.
- RFC 9309 says crawlers must combine matching groups for the same product token.
  Source: https://www.rfc-editor.org/rfc/rfc9309.html#section-2.2.1
  Checked: 2026-08-10.
- RFC 9309 says crawlers use the `User-agent: *` group if no specific matching group exists.
  Source: https://www.rfc-editor.org/rfc/rfc9309.html#section-2.2.1
  Checked: 2026-08-10.
- RFC 9309 says the most specific `Allow` or `Disallow` path match must be used.
  Source: https://www.rfc-editor.org/rfc/rfc9309.html#section-2.2.2
  Checked: 2026-08-10.
- RFC 9309 says `/robots.txt` is implicitly allowed.
  Source: https://www.rfc-editor.org/rfc/rfc9309.html#section-2.2.2
  Checked: 2026-08-10.
- Google says `robots.txt` must be in the top-level directory of the site.
  Source: https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt
  Checked: 2026-08-10.
- Google says `robots.txt` rules apply only to the host, protocol, and port where the file is hosted.
  Source: https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt
  Checked: 2026-08-10.
- Google says it supports `user-agent`, `allow`, `disallow`, and `sitemap` fields.
  Source: https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt
  Checked: 2026-08-10.
- Google says `Sitemap:` uses a fully qualified URL and is not tied to a specific user agent.
  Source: https://developers.google.com/search/docs/crawling-indexing/robots/robots_txt
  Checked: 2026-08-10.
- Live Merchant Context `robots.txt`.
  Source: https://merchant.atomandbits.com/robots.txt
  Checked: 2026-08-10.
- Live Merchant Context sitemap.
  Source: https://merchant.atomandbits.com/sitemap.xml
  Checked: 2026-08-10.

## Known limits

`robots.txt` tells cooperative crawlers what they may fetch.

`robots.txt` does not prove that an agent may buy, spend, log in, or use checkout.

`robots.txt` does not replace authentication, authorization, rate limits, or payment controls.

The live beta check confirms public discovery files, not checkout support.
