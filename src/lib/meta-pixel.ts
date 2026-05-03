// Meta Pixel helper — only loads if VITE_META_PIXEL_ID is set

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fbq: (...args: unknown[]) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    _fbq: unknown;
  }
}

let initialized = false;

export function initMetaPixel() {
  const pixelId = import.meta.env.VITE_META_PIXEL_ID;
  if (!pixelId || initialized) return;

  // Standard FB pixel snippet — disable lint for this block
  /* eslint-disable @typescript-eslint/no-explicit-any, prefer-spread, prefer-rest-params, @typescript-eslint/no-unused-expressions */
  (function (f: any, b: any, e: any, v: any) {
    if (f.fbq) return;
    const n: any = (f.fbq = function () {
      n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments);
    });
    if (!f._fbq) f._fbq = n;
    n.push = n;
    n.loaded = true;
    n.version = "2.0";
    n.queue = [];
    const t = b.createElement(e) as HTMLScriptElement;
    t.async = true;
    t.src = v;
    const s = b.getElementsByTagName(e)[0];
    s.parentNode?.insertBefore(t, s);
  })(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
  /* eslint-enable @typescript-eslint/no-explicit-any, prefer-spread, prefer-rest-params, @typescript-eslint/no-unused-expressions */

  window.fbq("init", pixelId);
  window.fbq("track", "PageView");
  initialized = true;
}

export function trackEvent(event: string, data?: Record<string, unknown>) {
  if (typeof window.fbq === "function") {
    window.fbq("track", event, data);
  }
}
