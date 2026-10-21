# LAN printing through Print Bridge

The user-facing [installation and setup guide](https://github.com/JamesBolanos/print-bridge/blob/main/DOCS/sscc-labels-setup.md) lives in the Print Bridge repository. The public label guide and LAN printer settings explain the browser → local bridge → network printer flow and link there. Keep operating-system installation instructions in that guide; this document describes the label-maker integration.

In **Settings → LAN printer**, save the bridge address/HTTP port, printer IP or hostname, printer TCP port, and resolution. Defaults are `127.0.0.1:8080`, printer port `9100`, and `203` dpi. The printer hostname starts empty, so sending is disabled until configured. Settings belong to the signed-in account and are shared across its computers.

Download [Print Bridge from GitHub](https://github.com/JamesBolanos/print-bridge/releases/latest), choose the macOS Apple silicon DMG or Windows 64-bit MSI, install it, and run it on the same computer as the browser. New installations of v1.0.0-beta.4 or later already allow `https://sscc-labels.com` and `https://www.sscc-labels.com`. Upgrades preserve saved origins; add the website origin in bridge Settings if needed. Keep its listener on loopback. In the bridge, allow the exact website origin (scheme, hostname, and web port), choose Physical mode, and make sure the computer can reach the printer over the LAN. The browser may request local network permission. **Test bridge connection** checks `/ping` using the displayed settings; it neither checks the printer nor sends a label. Save the settings before printing.

In **Saved labels**, choose **Print via bridge**. The browser reads current saved settings, fetches the existing owner-scoped ZPL endpoint at the saved printer resolution, and sends the unchanged text to `POST /print` as `{ printerHostname, printerPort, text }`. This creates no label or SSCC. The existing download-resolution selector continues to control ZPL downloads; printing uses the saved printer resolution. PDF/ZPL exports and all label layouts remain unchanged.

The bridge writes to the network printer; the hosted application never attempts a connection to the user's LAN. The app permits only `127.0.0.1` and `localhost` as bridge hosts, and CSP allows HTTP connections to those hosts at configurable ports. The printer destination can be an IP address or DNS hostname. This flow requires a ZPL-compatible network printer and appropriately sized media.

## Outcomes and retries

- **Sent to the printer** means the bridge acknowledged transport. Check the actual output; it does not establish barcode quality or paper delivery.
- **Virtual mode** means the bridge captured the job without physically printing it.
- An unconfirmed delivery can follow a timeout or partial printer write. No automatic retry occurs. Check the printer before explicitly sending again.
- Buttons are disabled while an action is in progress. This prevents repeated clicks in the current component; separate tabs and explicit subsequent sends can still print additional copies.

The request timeout is 15 seconds, allowing the bridge's default 3-second connection and 5-second write windows. It covers response-body reading too. No durable job/attempt history or automatic printed-state update is added.

## Settings and deployment

Migration `0008_print_bridge_settings.sql` adds five defaulted columns only to `label_settings`: `print_bridge_host`, `print_bridge_port`, `printer_hostname`, `printer_port`, and `printer_dpi`. It does not alter labels or their templates.

Authenticated `PATCH /api/settings` saves only printer fields for the current user. It cannot change the SSCC sequence, company fields, or another user's settings. Existing `POST /api/settings` continues to save company/SSCC settings while preserving printer parameters.

Apply the migration before deploying this application version, following the [guarded migration procedure](../professional-delivery/PD-05_PREVIEW_ENVIRONMENT_RUNBOOK.md#schema-change-procedure). Test migration and settings persistence on the disposable nonproduction branch in CI, then verify the deployed HTTPS origin against an installed bridge and a physical printer. Local unit and mocked browser checks do not establish live database or printer compatibility.
