import { useState, useEffect } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import CircularProgress from "@mui/material/CircularProgress";
import type { Race } from "@f1/shared";
import { api } from "../../api/client";
import RaceCard from "./raceCard";

export default function RaceList() {
  const [expanded, setExpanded] = useState(true);
  const [races, setRaces] = useState<Race[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.races.list().then((data) => {
      setRaces(data);
      setLoading(false);
    });
  }, []);

  const sorted = [...races].sort((a, b) => a.round - b.round);
  const now = new Date();
  const nextRace = sorted.find((r) => new Date(r.race_date) >= now);

  return (
    <Accordion expanded={expanded} onChange={() => setExpanded(!expanded)}>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <h1 className="font-[Racing_Sans_One] text-2xl text-gray-700">Race List</h1>
      </AccordionSummary>
      <AccordionDetails sx={{ maxHeight: "700px", overflowY: "auto" }}>
        {loading ? (
          <div className="flex justify-center py-4">
            <CircularProgress color="error" size={32} />
          </div>
        ) : (
          <div>
            {nextRace && (
              <div className="mb-4 border-2 p-4 border-yellow-500 rounded-lg shadow-lg">
                <h2 className="font-bold text-gray-500 mb-2">Next Race</h2>
                <RaceCard data={nextRace} />
              </div>
            )}
            <h2 className="font-bold text-gray-500 mb-2">All Races</h2>
            <div className="flex flex-col gap-2">
              {sorted.map((race) => (
                <RaceCard data={race} key={race.id} />
              ))}
            </div>
          </div>
        )}
      </AccordionDetails>
    </Accordion>
  );
}
