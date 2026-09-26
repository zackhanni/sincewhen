/**
 * How to add the app to the home screen, shared by the install hint, Settings and the intro.
 *
 * No browser offers a button a page can press on iOS, so the steps are written out. They are
 * general on purpose rather than picked per browser: Brave on iPhone has no "Add to Home Screen"
 * at all and does not name itself to the page, so it cannot be detected and pointed to Safari.
 * Where Safari hides Share also varies by iOS version (inside the ••• menu on iOS 26), hence
 * "or". See docs/pwa.md.
 */
export function InstallSteps() {
  return (
    <ul className="list-disc space-y-1 pl-5">
      <li>
        <strong>iPhone or iPad:</strong> in Safari, tap Share (on newer iPhones it is inside the &bull;&bull;&bull; menu),
        then View More, then &ldquo;Add to Home Screen&rdquo;.
      </li>
      <li>
        <strong>Android:</strong> open the browser menu, then &ldquo;Install app&rdquo; or &ldquo;Add to Home
        screen&rdquo;.
      </li>
      <li>
        Can&rsquo;t find it? Some browsers, such as Brave on iPhone, don&rsquo;t offer it. Open this page in Safari
        (iPhone, iPad) or Chrome (Android) instead.
      </li>
    </ul>
  );
}
