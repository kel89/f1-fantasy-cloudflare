import { useState } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { useAuthStore } from "../store/auth";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const successMessage = (location.state as { message?: string } | null)?.message;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-950 to-gray-900 flex items-center justify-center px-4">
      <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-xl shadow-2xl p-8 w-full max-w-sm">
        <h1 className="text-4xl font-[Racing_Sans_One] text-red-600 mb-6 text-center">
          F1 Fantasy
        </h1>
        <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-200 mb-4">Sign In</h2>

        {successMessage && (
          <Alert severity="success" className="mb-4">
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert severity="error" className="mb-4" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            fullWidth
            disabled={isLoading}
          />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            disabled={isLoading}
          />
          <Button
            type="submit"
            variant="contained"
            color="error"
            fullWidth
            disabled={isLoading}
            startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : undefined}
          >
            Sign In
          </Button>
        </form>

        <p className="text-center text-gray-500 dark:text-gray-400 mt-4 text-sm">
          <Link to="/reset-password" className="text-red-600 hover:underline">
            Forgot password?
          </Link>
        </p>
        <p className="text-center text-gray-500 dark:text-gray-400 mt-2 text-sm">
          Don't have an account?{" "}
          <Link to="/signup" className="text-red-600 hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
