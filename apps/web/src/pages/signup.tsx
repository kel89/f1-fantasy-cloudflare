import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import { useAuthStore } from "../store/auth";

export default function Signup() {
  const navigate = useNavigate();
  const { signup, isLoading } = useAuthStore();
  const [form, setForm] = useState({
    email: "",
    password: "",
    given_name: "",
    family_name: "",
    nickname: "",
  });
  const [error, setError] = useState<string | null>(null);

  const handleChange = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    try {
      await signup(form);
      navigate("/");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Signup failed");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-sm">
        <h1 className="text-3xl font-[Racing_Sans_One] text-red-600 mb-6 text-center">
          F1 Fantasy
        </h1>
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Create Account</h2>

        {error && (
          <Alert severity="error" className="mb-4" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex gap-2">
            <TextField
              label="First Name"
              value={form.given_name}
              onChange={handleChange("given_name")}
              required
              fullWidth
              disabled={isLoading}
            />
            <TextField
              label="Last Name"
              value={form.family_name}
              onChange={handleChange("family_name")}
              required
              fullWidth
              disabled={isLoading}
            />
          </div>
          <TextField
            label="Nickname"
            value={form.nickname}
            onChange={handleChange("nickname")}
            required
            fullWidth
            disabled={isLoading}
            helperText="Displayed on the leaderboard"
          />
          <TextField
            label="Email"
            type="email"
            value={form.email}
            onChange={handleChange("email")}
            required
            fullWidth
            disabled={isLoading}
          />
          <TextField
            label="Password"
            type="password"
            value={form.password}
            onChange={handleChange("password")}
            required
            fullWidth
            disabled={isLoading}
            helperText="At least 8 characters"
          />
          <Button
            type="submit"
            variant="contained"
            color="error"
            fullWidth
            disabled={isLoading}
            loading={isLoading}
          >
            Create Account
          </Button>
        </form>

        <p className="text-center text-gray-500 mt-4 text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-red-600 hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
