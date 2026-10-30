import { navigate, routeHref } from "../routes";

export default function NotFoundPage() {
  return (
    <section className="feature-page">
      <div className="page-intro">
        <div><p className="eyebrow">404</p><h2>Page not found</h2><p>This route does not exist.</p></div>
        <a href={routeHref("/")} onClick={(event) => { if (event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey) { event.preventDefault(); navigate("/"); } }}>Go home →</a>
      </div>
    </section>
  );
}
