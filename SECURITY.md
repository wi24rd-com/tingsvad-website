# Security

If you find a vulnerability on tingsvad.dk or in this code, please use GitHub's
**Report a vulnerability** (Security tab → Private vulnerability reporting) rather than a
public issue. We reply as soon as the fog permits – in practice within a few days.

Worth knowing:

- All secrets are set with `wrangler secret put` and are not in the repo. The ids in
  `wrangler.toml` are resource addresses and grant no access without a token on the account.
- All AI text is validated against a schema and escaped in the browser; AI output never becomes
  HTML, SQL or tool calls. Guest text is quoted as content and never mixed with system instructions.
- Uploads are checked for signature and dimensions server-side, are not stored, and SVG is rejected.
- Daily quotas, rate limiting and Turnstile limit abuse; sessions are HttpOnly cookies with no personal data.
- CSP, HSTS, DNSSEC and `X-Content-Type-Options` are enabled; see `_headers`.

The cow case is not a vulnerability. It is merely adjourned.

The same contact is published as [`/.well-known/security.txt`](https://tingsvad.dk/.well-known/security.txt) (RFC 9116).
