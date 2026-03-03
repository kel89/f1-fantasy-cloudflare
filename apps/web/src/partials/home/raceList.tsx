import { useState, useEffect } from "react";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Skeleton from "@mui/material/Skeleton";
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
        <h1 className="font-[Racing_Sans_One] text-2xl text-gray-700 dark:text-gray-200">Race List</h1>
      </AccordionSummary>
      <AccordionDetails sx={{ maxHeight: "700px", overflowY: "auto" }}>
        {loading ? (
          <div className="flex flex-col gap-2">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} variant="rounded" height={72} />
            ))}
          </div>
        ) : races.length === 0 ? (
          <p className="text-gray-400 text-center py-6">No races scheduled yet.</p>
        ) : (
          <div>
            {nextRace && (
              <div className="mb-4 border-2 p-4 border-yellow-500 rounded-lg shadow-lg dark:bg-gray-800">
                <h2 className="font-bold text-gray-500 dark:text-gray-300 mb-2">Next Race</h2>
                <RaceCard data={nextRace} />
              </div>
            )}
            <h2 className="font-bold text-gray-500 dark:text-gray-300 mb-2">All Races</h2>
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
