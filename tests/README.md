# Quality tests

Looks, accessibility and page errors across browser engines and screen sizes, run against a published address. The tests only read: no form is submitted.

Written for tingsvad.dk, but split so the general part works on any site: everything site-specific is in **one config file** and **one folder**.

## Use it on your own site

1. Copy the `tests/` folder (and `.github/workflows/kvalitet.yml` if you use GitHub Actions).
2. Replace `site.config.js` with your own – `site.config.eksempel.js` is the smallest working example (tested against https://playwright.dev).
3. Delete `specs/tingsvad/`.
4. Run:

```sh
cd tests
npm ci
npx playwright install chromium firefox webkit
npx playwright test                       # all browsers and devices
npx playwright test --project=desktop-chromium
npx playwright show-report
npx --yes @lhci/cli@0.15.1 autorun        # Lighthouse
```

`BASE_URL=https://… npx playwright test` tests another address without editing the config; `SITE_CONFIG=./other.config.js` picks another config file.

## What is tested

| Where | What |
|---|---|
| `specs/generelt/layout.spec.js` | Every page in `sider`: HTTP 200, `<html lang>` (if given), no horizontal scroll, exactly one `h1` that is not clipped, no broken images, no errors from the site's own files (`egneFiler`; third-party noise in `ignorerFejl` is skipped). A screenshot per page is attached to the report. Any `sideTjek` functions from the config run on the open page. |
| `specs/generelt/tilgaengelighed.spec.js` | axe-core (WCAG 2.1 A/AA by default) on every page; fails on the impact levels in `tilgaengelighed.fejlVed`. |
| `specs/generelt/tastatur.spec.js` | The first four Tab presses on `tastaturSide` land on an element with a visible focus indicator. |
| `lighthouserc.js` | Lighthouse (mobile profile) for `lighthouseSider`: accessibility ≥ 90 always, SEO ≥ 90 on the `produktion` address only; best practice and performance are warnings. |
| `specs/tingsvad/` | tingsvad.dk only: the shared top bar and marked menu item from the middleware, the header motif shown above 640 px and hidden below, old front-page anchors, the language switch and the theme button. |

Requests listed in `bloker` (here: Cloudflare Web Analytics) are answered empty, so test runs are not counted as visits.

Projects (`playwright.config.js`): desktop Chromium, Firefox and WebKit at 1440 px, iPad (WebKit), iPhone 13 (WebKit), Pixel 7 (Chromium) and Chromium in light theme. WebKit is the engine behind Safari, so it catches most Safari issues, but not everything a real iPhone does.

## GitHub Actions

`.github/workflows/kvalitet.yml` runs after each push to `main` or a feature branch. It waits until the site Worker (or its Worker Preview) serves that commit (the `?v=` asset hash in the page matches the repository), then tests the branch's address – `runde-9` at its preview address, `main` at tingsvad.dk – with one parallel job per browser/device plus Lighthouse. It can also be started by hand (Actions → Kvalitet → Run workflow) with any address. Reports with screenshots are attached to each run.
