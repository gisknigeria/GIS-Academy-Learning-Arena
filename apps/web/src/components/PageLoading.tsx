import logoMark from "../assets/gis-academy-logo.svg";

type PageLoadingProps = {
  /** Short label to show beneath the spinner */
  label?: string;
  /** Compact inline variant — no logo, smaller */
  inline?: boolean;
};

/**
 * Full-page branded loading screen.
 * Use `inline` for in-panel loaders.
 */
export function PageLoading({ label = "Loading…", inline = false }: PageLoadingProps) {
  if (inline) {
    return (
      <div className="page-loading" role="status" aria-label={label}>
        <span className="loading-spinner" aria-hidden="true" />
        <span>{label}</span>
      </div>
    );
  }

  return (
    <main className="full-page-loading" role="status" aria-label={label}>
      <div className="full-page-loading-inner">
        <div className="fpl-logo">
          <img src={logoMark} alt="Knowledge Hub" />
        </div>
        <div className="fpl-spinner" aria-hidden="true">
          <span className="fpl-ring" />
        </div>
        <p className="fpl-label">{label}</p>
      </div>
    </main>
  );
}
