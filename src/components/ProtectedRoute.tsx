import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function ProtectedRoute({ children, redirectTo = "/auth" }: ProtectedRouteProps) {
  const { currentUser } = useAuth();

  if (!currentUser) {
    return <Navigate to={redirectTo} />;
  }

  return <>{children}</>;
}

export function PublicOnlyRoute({ children, redirectTo = "/" }: ProtectedRouteProps) {
  const { currentUser } = useAuth();

  if (currentUser) {
    return <Navigate to={redirectTo} />;
  }

  return <>{children}</>;
}
