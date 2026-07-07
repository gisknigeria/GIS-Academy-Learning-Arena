import { Home, Map, MoveLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import logoMark from "../assets/gis-academy-logo.svg";

export function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <main className="not-found-page">
      <div className="not-found-inner">
        <div className="not-found-brand">
          <div className="brand-mark brand-mark--lg">
            <img src={logoMark} alt="" />
          </div>
          <span className="not-found-brand-name">GIS Academy</span>
        </div>

        <div className="not-found-visual" aria-hidden="true">
          <span className="not-found-code">404</span>
          <Map size={64} className="not-found-map-icon" strokeWidth={1.2} />
        </div>

        <div className="not-found-copy">
          <h1>You've wandered off the map.</h1>
          <p>
            This coordinate doesn't exist in the GIS Academy system. The page may
            have been moved, renamed, or the link could be incorrect.
          </p>
        </div>

        <div className="not-found-actions">
          <button
            className="secondary-button not-found-back-btn"
            onClick={() => navigate(-1)}
            type="button"
          >
            <MoveLeft size={17} />
            Go back
          </button>
          <Link to="/dashboard" className="primary-button not-found-home-btn">
            <Home size={17} />
            Back to dashboard
          </Link>
        </div>

        <p className="not-found-footer">
          If you believe this is a mistake, contact{" "}
          <a href="mailto:support@giskonsult.com">support@giskonsult.com</a>
        </p>
      </div>
    </main>
  );
}
