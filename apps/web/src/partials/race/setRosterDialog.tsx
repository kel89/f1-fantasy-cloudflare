import { useState, useEffect, forwardRef } from "react";
import Dialog from "@mui/material/Dialog";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import CloseIcon from "@mui/icons-material/Close";
import Slide from "@mui/material/Slide";
import type { TransitionProps } from "@mui/material/transitions";
import type { Driver, Roster } from "@f1/shared";
import { api, ApiError } from "../../api/client";
import RosterEditor from "./rosterEditor";

const Transition = forwardRef(function Transition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const TEAM_ORDER = [
  "McLaren", "Mercedes", "Red Bull", "Ferrari", "Williams",
  "Aston Martin", "Racing Bulls", "Haas", "Audi", "Alpine", "Cadillac",
];

function getDefaultOrder(drivers: Driver[]): string[] {
  return [...drivers]
    .sort((a, b) => {
      const ti = TEAM_ORDER.indexOf(a.team);
      const tj = TEAM_ORDER.indexOf(b.team);
      return (ti === -1 ? 100 : ti) - (tj === -1 ? 100 : tj);
    })
    .map((d) => d.abbreviation);
}

interface SetRosterDialogProps {
  open: boolean;
  setOpen: (open: boolean) => void;
  raceId: string;
  existingRoster: Roster | null;
  drivers: Driver[];
  onSaved: (roster: Roster) => void;
}

export default function SetRosterDialog({
  open,
  setOpen,
  raceId,
  existingRoster,
  drivers,
  onSaved,
}: SetRosterDialogProps) {
  const [driverOrder, setDriverOrder] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!drivers.length) return;
    if (existingRoster?.driver_order?.length) {
      setDriverOrder(existingRoster.driver_order);
    } else {
      setDriverOrder(getDefaultOrder(drivers));
    }
  }, [existingRoster, drivers, open]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      const roster = await api.rosters.set(raceId, { driver_order: driverOrder });
      onSaved(roster);
      setOpen(false);
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
      } else {
        setError("Failed to save roster");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      fullScreen
      open={open}
      onClose={() => setOpen(false)}
      TransitionComponent={Transition}
    >
      <AppBar sx={{ position: "relative", backgroundColor: "#e10600" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setOpen(false)}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>
          <Typography sx={{ ml: 2, flex: 1 }} variant="h6">
            {existingRoster ? "Edit Your Lineup" : "Set Your Lineup"}
          </Typography>
          <Button color="inherit" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </Toolbar>
      </AppBar>

      {error && (
        <div className="bg-red-50 text-red-700 px-4 py-2 text-sm">{error}</div>
      )}

      {drivers.length > 0 && driverOrder.length > 0 && (
        <RosterEditor
          driverData={drivers}
          driverOrder={driverOrder}
          setDriverOrder={setDriverOrder}
        />
      )}
    </Dialog>
  );
}
