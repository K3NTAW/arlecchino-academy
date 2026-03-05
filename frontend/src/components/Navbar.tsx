import { Flame, LogOut, Sparkles } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAppStore } from "../store/appStore";

export function Navbar() {
  const navigate = useNavigate();
  const name = useAppStore((state) => state.name);
  const language = useAppStore((state) => state.language);
  const setLanguage = useAppStore((state) => state.setLanguage);
  const clearSession = useAppStore((state) => state.clearSession);

  return (
    <nav className="academy-navbar">
      <div className="academy-navbar-left">
        <div className="academy-navbar-sigil">
          <Flame size={16} />
        </div>
        <span className="academy-navbar-title">House of the Hearth</span>
      </div>
      <div className="academy-navbar-right">
        <Link className="academy-nav-link" to="/wish">
          <Sparkles size={14} />
          Wish
        </Link>
        <span className="academy-player-name">{name || "Contractor"}</span>
        <div className="academy-lang-toggle">
          <button
            className={language === "en" ? "active" : ""}
            onClick={() => setLanguage("en")}
            type="button"
          >
            EN
          </button>
          <button
            className={language === "sr" ? "active" : ""}
            onClick={() => setLanguage("sr")}
            type="button"
          >
            SR
          </button>
        </div>
        <button
          className="academy-logout-btn"
          type="button"
          onClick={() => {
            clearSession();
            navigate("/");
          }}
          aria-label="Logout"
        >
          <LogOut size={16} />
        </button>
      </div>
    </nav>
  );
}
