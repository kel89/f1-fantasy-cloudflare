import { useState } from "react";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import { Layout } from "../utils/layout";
import { useAuthStore } from "../store/auth";
import { api } from "../api/client";

export default function Settings() {
  const { user, setUser } = useAuthStore();
  const [nickname, setNickname] = useState(user?.nickname ?? "");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    setSuccess(false);
    setError(null);
    try {
      const updated = await api.auth.updateMe({ nickname });
      setUser(updated);
      setSuccess(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to update nickname");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout pageName="Settings">
      <div className="p-6 grid sm:grid-cols-2 grid-cols-1 gap-8 bg-gray-100 dark:bg-gray-900 min-h-screen">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-lg">
          <h1 className="font-[Racing_Sans_One] text-xl text-gray-700 dark:text-gray-200 mb-4">
            Change Nickname
          </h1>

          {success && (
            <Alert severity="success" className="mb-3" onClose={() => setSuccess(false)}>
              Nickname updated!
            </Alert>
          )}
          {error && (
            <Alert severity="error" className="mb-3" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          <div className="flex flex-col gap-4">
            <TextField
              label="Nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              disabled={loading}
              fullWidth
              variant="standard"
            />
            <div className="max-w-xs">
              <Button
                variant="outlined"
                color="success"
                onClick={handleSave}
                disabled={loading || !nickname.trim()}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : undefined}
              >
                Save Nickname
              </Button>
            </div>
          </div>
        </div>

        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 shadow-lg">
          <h1 className="font-[Racing_Sans_One] text-xl text-gray-700 dark:text-gray-200 mb-2">Account</h1>
          <div className="text-gray-600 dark:text-gray-300 space-y-1 text-sm">
            <div><span className="font-medium">Name:</span> {user?.given_name} {user?.family_name}</div>
            <div><span className="font-medium">Email:</span> {user?.email}</div>
            <div><span className="font-medium">Total Points:</span> {user?.total_points}</div>
            {user?.admin === 1 && (
              <div className="mt-2">
                <span className="inline-block bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-semibold">
                  Admin
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
