import { Navigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";
import { ReactNode } from "react";

interface ProtectedRouteProps {
  children: ReactNode;
  adminOnly?: boolean;
}

export function ProtectedRoute({ children, adminOnly = false }: ProtectedRouteProps) {
  const { user, isInitialized } = useAuthStore();

  if (!isInitialized) {
    return (
      <Box className="flex items-center justify-center min-h-screen">
        <CircularProgress color="error" />
      </Box>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && user.admin !== 1) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
