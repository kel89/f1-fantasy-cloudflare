import { useState, useEffect, forwardRef } from "react";
import { Layout } from "../utils/layout";
import {
  Tabs,
  Tab,
  Box,
  Button,
  Dialog,
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Slide,
  TextField,
  Alert,
  Chip,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import LockOpenIcon from "@mui/icons-material/LockOpen";
import type { TransitionProps } from "@mui/material/transitions";
import type { Announcement, Race, Driver, User } from "@f1/shared";
import { api, ApiError } from "../api/client";
import RosterEditor from "../partials/race/rosterEditor";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { DateTimePicker } from "@mui/x-date-pickers/DateTimePicker";
import dayjs from "dayjs";

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// ─── Score Race Dialog ────────────────────────────────────────────────────────
function ScoreRaceDialog({
  race,
  drivers,
  open,
  onClose,
  onScored,
}: {
  race: Race | null;
  drivers: Driver[];
  open: boolean;
  onClose: () => void;
  onScored: () => void;
}) {
  const [driverOrder, setDriverOrder] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (drivers.length) {
      const TEAM_ORDER = ["McLaren", "Mercedes", "Red Bull", "Ferrari", "Williams", "Aston Martin", "Racing Bulls", "Haas", "Audi", "Alpine", "Cadillac"];
      const sorted = [...drivers].sort((a, b) => {
        const ti = TEAM_ORDER.indexOf(a.team);
        const tj = TEAM_ORDER.indexOf(b.team);
        return (ti === -1 ? 100 : ti) - (tj === -1 ? 100 : tj);
      });
      setDriverOrder(sorted.map((d) => d.abbreviation));
    }
    setConfirmed(false);
    setError(null);
  }, [drivers, open]);

  const handleScore = async () => {
    if (!race) return;
    setLoading(true);
    setError(null);
    try {
      const results = driverOrder.map((abbr, i) => ({
        driver_abbreviation: abbr,
        position: i + 1,
      }));
      await api.admin.scoreRace(race.id, { results });
      onScored();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to score race");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog fullScreen open={open} onClose={onClose} TransitionComponent={Transition}>
      <AppBar sx={{ position: "relative", backgroundColor: "#e10600" }}>
        <Toolbar>
          <IconButton edge="start" color="inherit" onClick={onClose}>
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6">
            Score Race: {race?.name}
          </Typography>
          {!confirmed ? (
            <Button color="inherit" onClick={() => setConfirmed(true)} disabled={loading}>
              Review
            </Button>
          ) : (
            <Button color="inherit" onClick={handleScore} disabled={loading}>
              {loading ? "Scoring..." : "Confirm & Score"}
            </Button>
          )}
        </Toolbar>
      </AppBar>

      {error && <Alert severity="error" className="m-4">{error}</Alert>}

      {!confirmed ? (
        <div>
          <div className="text-center py-3 text-gray-600 dark:text-gray-300 font-medium">
            Set finishing order (drag to reorder)
          </div>
          <RosterEditor
            driverData={drivers}
            driverOrder={driverOrder}
            setDriverOrder={setDriverOrder}
          />
        </div>
      ) : (
        <div className="p-4">
          <Alert severity="warning" className="mb-4">
            This will score all rosters and update leaderboard totals. This cannot be undone without using "Clear Results".
          </Alert>
          <h2 className="font-bold mb-2">Confirmed finishing order:</h2>
          <div className="flex flex-col gap-1">
            {driverOrder.slice(0, 10).map((abbr, i) => {
              const d = drivers.find((dr) => dr.abbreviation === abbr);
              return (
                <div key={abbr} className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-700 rounded">
                  <span className="font-bold w-6 text-right">{i + 1}</span>
                  <span>{d ? `${d.first_name} ${d.last_name}` : abbr}</span>
                </div>
              );
            })}
          </div>
          <Button
            variant="outlined"
            className="mt-4"
            onClick={() => setConfirmed(false)}
            disabled={loading}
          >
            Go Back
          </Button>
        </div>
      )}
    </Dialog>
  );
}

// ─── Edit Race Dialog ─────────────────────────────────────────────────────────
function EditRaceDialog({
  race,
  open,
  onClose,
  onUpdated,
}: {
  race: Race | null;
  open: boolean;
  onClose: () => void;
  onUpdated: (r: Race) => void;
}) {
  const [name, setName] = useState(race?.name ?? "");
  const [city, setCity] = useState(race?.city ?? "");
  const [country, setCountry] = useState(race?.country ?? "");
  const [date, setDate] = useState(dayjs(race?.race_date));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (race) {
      setName(race.name);
      setCity(race.city);
      setCountry(race.country);
      setDate(dayjs(race.race_date));
      setError(null);
    }
  }, [race, open]);

  const handleSave = async () => {
    if (!race) return;
    setLoading(true);
    try {
      const updated = await api.races.update(race.id, {
        name,
        city,
        country,
        race_date: date.toISOString(),
      });
      onUpdated(updated);
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to update race");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <AppBar sx={{ position: "relative", backgroundColor: "#e10600" }}>
          <Toolbar>
            <IconButton edge="start" color="inherit" onClick={onClose}><CloseIcon /></IconButton>
            <Typography sx={{ ml: 2, flex: 1 }} variant="h6">Edit Race</Typography>
            <Button color="inherit" onClick={handleSave} disabled={loading}>Save</Button>
          </Toolbar>
        </AppBar>
        <div className="p-4 flex flex-col gap-4">
          {error && <Alert severity="error">{error}</Alert>}
          <TextField label="Race Name" value={name} onChange={(e) => setName(e.target.value)} fullWidth disabled={loading} />
          <TextField label="City" value={city} onChange={(e) => setCity(e.target.value)} fullWidth disabled={loading} />
          <TextField label="Country" value={country} onChange={(e) => setCountry(e.target.value)} fullWidth disabled={loading} />
          <DateTimePicker label="Race Date" value={date} onChange={(v) => v && setDate(v)} disabled={loading} />
        </div>
      </Dialog>
    </LocalizationProvider>
  );
}

// ─── Races Tab ────────────────────────────────────────────────────────────────
function RacesTab() {
  const [races, setRaces] = useState<Race[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [scoreRace, setScoreRace] = useState<Race | null>(null);
  const [editRace, setEditRace] = useState<Race | null>(null);
  const [resetting, setResetting] = useState<string | null>(null);
  const [unlocking, setUnlocking] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.races.list(), api.drivers.list()]).then(([r, d]) => {
      setRaces(r.sort((a, b) => a.round - b.round));
      setDrivers(d);
      setLoading(false);
    });
  }, []);

  const handleClearResults = async (race: Race) => {
    if (!confirm(`Clear results for ${race.name}? This will subtract points from all users.`)) return;
    setResetting(race.id);
    setError(null);
    try {
      await api.admin.deleteResults(race.id);
      setRaces((rs) => rs.map((r) => (r.id === race.id ? { ...r, status: "upcoming" } : r)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to clear results");
    } finally {
      setResetting(null);
    }
  };

  const handleUnlock = async (race: Race) => {
    if (!confirm(`Unlock ${race.name} for 1 hour? Users will be able to edit rosters.`)) return;
    setUnlocking(race.id);
    setError(null);
    try {
      const updated = await api.admin.unlockRace(race.id);
      setRaces((rs) => rs.map((r) => (r.id === race.id ? updated : r)));
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to unlock race");
    } finally {
      setUnlocking(null);
    }
  };

  const STATUS_COLOR = { upcoming: "default", locked: "warning", scored: "success" } as const;

  if (loading) return <div className="flex justify-center py-8"><CircularProgress color="error" /></div>;

  return (
    <div>
      {error && <Alert severity="error" className="mb-3" onClose={() => setError(null)}>{error}</Alert>}
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>#</TableCell>
              <TableCell>Race</TableCell>
              <TableCell>Date</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {races.map((race) => (
              <TableRow key={race.id}>
                <TableCell>{race.round}</TableCell>
                <TableCell>{race.name}</TableCell>
                <TableCell className="text-sm text-gray-500">
                  {new Date(race.race_date).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Chip label={race.status} color={STATUS_COLOR[race.status] ?? "default"} size="small" />
                </TableCell>
                <TableCell>
                  <div className="flex gap-1 flex-wrap">
                    <Button size="small" onClick={() => setEditRace(race)}>Edit</Button>
                    {race.status !== "scored" && (
                      <Button size="small" color="error" onClick={() => setScoreRace(race)}>
                        Score
                      </Button>
                    )}
                    {race.status === "locked" && (
                      <Button
                        size="small"
                        color="info"
                        startIcon={<LockOpenIcon />}
                        onClick={() => handleUnlock(race)}
                        disabled={unlocking === race.id}
                      >
                        {unlocking === race.id ? "Unlocking..." : "Unlock"}
                      </Button>
                    )}
                    {race.status === "scored" && (
                      <Button
                        size="small"
                        color="warning"
                        onClick={() => handleClearResults(race)}
                        disabled={resetting === race.id}
                      >
                        {resetting === race.id ? "Clearing..." : "Clear Results"}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <ScoreRaceDialog
        race={scoreRace}
        drivers={drivers}
        open={!!scoreRace}
        onClose={() => setScoreRace(null)}
        onScored={() => {
          setRaces((rs) =>
            rs.map((r) => (r.id === scoreRace?.id ? { ...r, status: "scored" } : r))
          );
        }}
      />
      <EditRaceDialog
        race={editRace}
        open={!!editRace}
        onClose={() => setEditRace(null)}
        onUpdated={(updated) => {
          setRaces((rs) => rs.map((r) => (r.id === updated.id ? updated : r)));
        }}
      />
    </div>
  );
}

// ─── Users Tab ────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [editPoints, setEditPoints] = useState("");
  const [editNickname, setEditNickname] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.admin.getUsers().then((data) => {
      setUsers(data);
      setLoading(false);
    });
  }, []);

  const openEdit = (user: User) => {
    setEditUser(user);
    setEditPoints(String(user.total_points));
    setEditNickname(user.nickname);
    setError(null);
  };

  const handleSave = async () => {
    if (!editUser) return;
    setSaving(true);
    try {
      const updated = await api.admin.updateUser(editUser.id, {
        nickname: editNickname,
        total_points: parseInt(editPoints),
      });
      setUsers((us) => us.map((u) => (u.id === updated.id ? updated : u)));
      setEditUser(null);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to update user");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><CircularProgress color="error" /></div>;

  return (
    <div>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Nickname</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Points</TableCell>
              <TableCell>Admin</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.nickname}</TableCell>
                <TableCell className="text-sm text-gray-500">{user.email}</TableCell>
                <TableCell className="font-semibold">{user.total_points}</TableCell>
                <TableCell>{user.admin === 1 ? <Chip label="Admin" size="small" color="error" /> : "—"}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => openEdit(user)}>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={!!editUser} onClose={() => setEditUser(null)} fullWidth maxWidth="xs">
        <div className="p-4">
          <Typography variant="h6" className="mb-3">Edit User</Typography>
          {error && <Alert severity="error" className="mb-3">{error}</Alert>}
          <div className="flex flex-col gap-3">
            <TextField
              label="Nickname"
              value={editNickname}
              onChange={(e) => setEditNickname(e.target.value)}
              fullWidth
              disabled={saving}
            />
            <TextField
              label="Total Points"
              type="number"
              value={editPoints}
              onChange={(e) => setEditPoints(e.target.value)}
              fullWidth
              disabled={saving}
              helperText="Override total points directly"
            />
          </div>
          <div className="flex gap-2 mt-4">
            <Button variant="contained" color="error" onClick={handleSave} disabled={saving} startIcon={saving ? <CircularProgress size={20} color="inherit" /> : undefined}>
              Save
            </Button>
            <Button onClick={() => setEditUser(null)} disabled={saving}>Cancel</Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}

// ─── Banner Tab ──────────────────────────────────────────────────────────────
function BannerTab() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const load = () => {
    api.announcement.get().then(({ announcement: a }) => {
      setAnnouncement(a);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handlePost = async () => {
    if (!message.trim()) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const a = await api.admin.postAnnouncement({ message: message.trim() });
      setAnnouncement(a);
      setMessage("");
      setSuccess("Announcement posted");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to post announcement");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.admin.resetAnnouncementVisibility();
      load();
      setSuccess("Visibility reset — all users will see the banner again");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to reset visibility");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Delete the current announcement?")) return;
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await api.admin.deleteAnnouncement();
      setAnnouncement(null);
      setSuccess("Announcement deleted");
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Failed to delete announcement");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="flex justify-center py-8"><CircularProgress color="error" /></div>;

  return (
    <div className="max-w-lg">
      {error && <Alert severity="error" className="mb-3" onClose={() => setError(null)}>{error}</Alert>}
      {success && <Alert severity="success" className="mb-3" onClose={() => setSuccess(null)}>{success}</Alert>}

      <Paper className="p-4 mb-4">
        <Typography variant="subtitle2" color="text.secondary" className="mb-1">Current Announcement</Typography>
        {announcement ? (
          <>
            <Typography className="mb-2">{announcement.message}</Typography>
            <Typography variant="caption" color="text.secondary">
              Version {announcement.version} &middot; Updated {new Date(announcement.updated_at).toLocaleString()}
            </Typography>
            <div className="flex gap-2 mt-3">
              <Button size="small" variant="outlined" onClick={handleReset} disabled={saving}>
                Reset Visibility
              </Button>
              <Button size="small" variant="outlined" color="error" onClick={handleDelete} disabled={saving}>
                Delete
              </Button>
            </div>
          </>
        ) : (
          <Typography color="text.secondary">No active announcement</Typography>
        )}
      </Paper>

      <Paper className="p-4">
        <Typography variant="subtitle2" color="text.secondary" className="mb-2">Post New Announcement</Typography>
        <TextField
          label="Message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          fullWidth
          multiline
          minRows={2}
          disabled={saving}
          className="mb-3"
        />
        <Button variant="contained" color="error" onClick={handlePost} disabled={saving || !message.trim()}>
          {saving ? <CircularProgress size={20} color="inherit" /> : "Post"}
        </Button>
      </Paper>
    </div>
  );
}

// ─── Admin Page ───────────────────────────────────────────────────────────────
export default function Admin() {
  const [tab, setTab] = useState(0);

  return (
    <Layout pageName="Admin">
      <div className="p-6 bg-gray-100 dark:bg-gray-900 min-h-screen">
        <h1 className="font-[Racing_Sans_One] text-3xl text-gray-800 dark:text-gray-100 mb-4">Admin Dashboard</h1>

        <Box sx={{ borderBottom: 1, borderColor: "divider", mb: 2 }}>
          <Tabs value={tab} onChange={(_, v) => setTab(v)} indicatorColor="secondary">
            <Tab label="Races" />
            <Tab label="Users" />
            <Tab label="Banner" />
          </Tabs>
        </Box>

        {tab === 0 && <RacesTab />}
        {tab === 1 && <UsersTab />}
        {tab === 2 && <BannerTab />}
      </div>
    </Layout>
  );
}
