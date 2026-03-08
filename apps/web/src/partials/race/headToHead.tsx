import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import type { Driver, RaceWithDetails } from "@f1/shared";
import { DriverImage } from "../../utils/driverImage";

type RaceRoster = RaceWithDetails["rosters"][number];

interface HeadToHeadProps {
  open: boolean;
  onClose: () => void;
  myRoster: RaceRoster;
  theirRoster: RaceRoster;
  race: RaceWithDetails;
  drivers: Driver[];
}

export default function HeadToHead({
  open,
  onClose,
  myRoster,
  theirRoster,
  race,
  drivers,
}: HeadToHeadProps) {
  const isScored = race.results.length > 0;

  const driverMap = new Map(drivers.map((d) => [d.abbreviation, d]));
  const resultMap = new Map(race.results.map((r) => [r.driver.abbreviation, r.position]));

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        <div className="flex items-center justify-between">
          <span className="font-[Racing_Sans_One] text-lg">Head-to-Head</span>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </div>
        {isScored && (
          <div className="text-sm mt-1 font-normal">
            <span
              className={
                (myRoster.total_points ?? 0) >= (theirRoster.total_points ?? 0)
                  ? "text-green-600 font-semibold"
                  : "text-red-600 font-semibold"
              }
            >
              You: {myRoster.total_points ?? 0} pts
            </span>
            {" vs "}
            <span
              className={
                (theirRoster.total_points ?? 0) >= (myRoster.total_points ?? 0)
                  ? "text-green-600 font-semibold"
                  : "text-red-600 font-semibold"
              }
            >
              {theirRoster.user.nickname}: {theirRoster.total_points ?? 0} pts
            </span>
          </div>
        )}
      </DialogTitle>
      <DialogContent>
        <div className="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)] gap-x-3 text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-2 mb-2">
          <div>#</div>
          <div className="font-semibold">You</div>
          <div className="font-semibold text-right">{theirRoster.user.nickname}</div>
        </div>

        <div className="flex flex-col">
          {myRoster.driver_order.slice(0, 10).map((myAbbr, i) => {
            const theirAbbr = theirRoster.driver_order[i];
            const myDriver = driverMap.get(myAbbr);
            const theirDriver = driverMap.get(theirAbbr);

            const myPts = myRoster.breakdown?.[i];
            const theirPts = theirRoster.breakdown?.[i];

            const myCorrect = resultMap.get(myAbbr) === i + 1;
            const theirCorrect = resultMap.get(theirAbbr) === i + 1;

            return (
              <div
                key={`${myAbbr}-${theirAbbr}-${i}`}
                className="grid grid-cols-[2rem_minmax(0,1fr)_minmax(0,1fr)] gap-x-3 items-stretch border-t border-gray-100 dark:border-gray-700 py-2"
              >
                <div className="font-bold text-gray-800 dark:text-gray-200 text-base text-right pt-2">
                  {i + 1}
                </div>

                <div
                  className={`rounded px-2 py-1 ${
                    isScored
                      ? myCorrect
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-red-50 dark:bg-red-900/30"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <DriverImage abbreviation={myAbbr} className="h-8 w-8 object-cover shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words leading-tight">
                        {myDriver ? `${myDriver.first_name} ${myDriver.last_name}` : myAbbr}
                      </div>
                      {myDriver && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 break-words leading-tight">
                          {myDriver.team}
                        </div>
                      )}
                    </div>
                    {isScored && (
                      <div className="ml-auto text-sm font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
                        {myPts !== undefined ? (myPts > 0 ? `+${myPts}` : "0") : ""}
                      </div>
                    )}
                  </div>
                </div>

                <div
                  className={`rounded px-2 py-1 ${
                    isScored
                      ? theirCorrect
                        ? "bg-green-100 dark:bg-green-900/30"
                        : "bg-red-50 dark:bg-red-900/30"
                      : ""
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <DriverImage abbreviation={theirAbbr} className="h-8 w-8 object-cover shrink-0" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 break-words leading-tight">
                        {theirDriver ? `${theirDriver.first_name} ${theirDriver.last_name}` : theirAbbr}
                      </div>
                      {theirDriver && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 break-words leading-tight">
                          {theirDriver.team}
                        </div>
                      )}
                    </div>
                    {isScored && (
                      <div className="ml-auto text-sm font-semibold text-gray-700 dark:text-gray-300 tabular-nums">
                        {theirPts !== undefined ? (theirPts > 0 ? `+${theirPts}` : "0") : ""}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
