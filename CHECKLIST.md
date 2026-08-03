# Agentic Commerce Readiness Checklist

Use this checklist to find the smallest changes that let buyer agents understand and use a merchant site. It is a working draft, not a certification.

## Level 0: discoverable

- [ ] The site has one canonical HTTPS host.
- [ ] `robots.txt` states which public paths crawlers may fetch.
- [ ] `sitemap.xml` lists current public pages.
- [ ] Important facts exist in server-rendered HTML, not only after client-side actions.
- [ ] The site uses Schema.org JSON-LD for the business, products or services, and offers.
- [ ] Each product or service has a stable URL.
- [ ] Changed URLs can be sent to search systems through their supported tools or IndexNow.
- [ ] An optional `llms.txt` gives agents a short map of key public sources without hiding facts from normal pages.

## Level 1: decision-ready

- [ ] Every offer has a stable ID, name, plain description, audience, and canonical URL.
- [ ] Price includes amount, currency, billing period, taxes, and expiry where these apply.
- [ ] Availability or capacity is current and has an update time.
- [ ] Claims link to evidence or a source page.
- [ ] Return, refund, cancellation, shipping, privacy, and support terms use stable URLs.
- [ ] Important limits and exclusions appear beside the offer.
- [ ] Data states its source and freshness.
- [ ] The same fact does not conflict across HTML, JSON-LD, feeds, and APIs.

## Level 2: action-ready

- [ ] Each action says what it does before an agent calls it.
- [ ] Checkout, booking, quote, and contact actions use stable HTTPS endpoints.
- [ ] Inputs and outputs have machine-readable schemas.
- [ ] Write actions support idempotency.
- [ ] Errors are structured and tell the caller what can be fixed.
- [ ] The flow states which step needs human review or approval.
- [ ] An agent can recover from expired price, lost stock, or changed terms without starting over.
- [ ] The merchant implements a supported commerce path, such as ACP or UCP, when its channel requires one.

## Level 3: trust-ready

- [ ] The merchant can tell an allowed agent from an unknown bot.
- [ ] The agent can verify the merchant and the action endpoint.
- [ ] Sensitive actions use scoped, short-lived authority.
- [ ] The system records consent, inputs, outputs, price, terms, and result.
- [ ] Logs can explain who acted, for whom, and under which rule.
- [ ] Rate limits and bot controls do not block allowed buyer agents by accident.
- [ ] Payment details stay with a payment provider or approved payment handler.
- [ ] Refunds, disputes, and support have a human path.

## Proof before a public claim

For every claimed integration, record:

1. the exact endpoint or file;
2. the standard and version;
3. a passing conformance or contract test;
4. a live request and response with secrets removed;
5. the date it was last checked; and
6. the known limits.
