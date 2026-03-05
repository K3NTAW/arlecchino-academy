import { Navigate, Outlet } from "react-router-dom";
import { useAppStore } from "../store/appStore";

export function ProtectedRoute() {
  const name = useAppStore((state) => state.name);
  const token = useAppStore((state) => state.token);

  if (!name || !token) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
