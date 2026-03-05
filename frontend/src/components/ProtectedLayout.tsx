import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Navbar } from "./Navbar";

export function ProtectedLayout() {
  const location = useLocation();
  const isLessonRoute = location.pathname.startsWith("/lesson/");

  return (
    <div className="academy-app">
      <div className="vignette-overlay" />
      <Navbar />
      <motion.main
        className={isLessonRoute ? "academy-page-shell lesson-shell-main" : "academy-page-shell"}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <Outlet />
      </motion.main>
    </div>
  );
}
