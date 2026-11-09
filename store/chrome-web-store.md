# Chrome Web Store listing

Fields to fill in the developer dashboard. Upload `dist/trapradar-<version>.zip` (built by `scripts/package.sh`).

## Store listing

- **Name:** from the manifest (TrapRadar: anti dark pattern)
- **Summary:** from the manifest description
- **Description:** the `description.it` text in [`amo-metadata.json`](amo-metadata.json) (Italian is the default
  language; add the `en-US` text as an English translation)
- **Category:** Shopping (or Privacy & Security)
- **Language:** Italian
- **Icon:** `extension/icons/icon128.png`
- **Screenshots:** 1280x800, the popup on a checkout page with findings

## Privacy practices

- **Single purpose:** Warn the user about dark patterns (hidden subscriptions, checkout fees, fake countdowns,
  pre-ticked boxes, confirmshaming, hard cancellation) on the page they are viewing.
- **Permission justification, `storage`:** Remembers, on the user's device only, the first deadline seen for a
  countdown timer on a site, to detect timers that reset on every visit.
- **Permission justification, host permissions (`<all_urls>`):** The content script must read the visible text and
  form controls of any page the user visits to detect dark patterns; they can appear on any shop or subscription
  site. Nothing is sent anywhere.
- **Remote code:** No, all code is in the package.
- **Data usage:** collects none of the listed data types. Certify: not sold, not used for unrelated purposes, not
  used for creditworthiness.
- **Privacy policy URL:** https://github.com/AndreaAcanfora/trapradar/blob/main/PRIVACY.md
