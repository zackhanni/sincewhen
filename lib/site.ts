/**
 * The app's one public address. Everything that needs an absolute URL reads it from here: the
 * redirect from the old address, page metadata (`metadataBase`), link previews and QR alt text.
 *
 * If it ever changes (the app getting a domain of its own), change it here, then remake
 * `public/qr-code.svg` (docs/pwa.md) and move the old address into RETIRED_HOSTS.
 */
export const SITE_URL = "https://sincewhen.webwizarddev.com";

/** Addresses the app used to live at. They only redirect to SITE_URL; never link to them. */
export const RETIRED_HOSTS = ["sincewhen-ruby.vercel.app"];

/** "sincewhen.webwizarddev.com", for text such as the QR code's description. */
export const SITE_HOST = new URL(SITE_URL).host;
