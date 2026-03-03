import { ReactSortable } from "react-sortablejs";
import type { Driver } from "@f1/shared";
import { DriverImage } from "../../utils/driverImage";

// ReactSortable requires items to have an `id` field
interface SortableDriver {
  id: string; // abbreviation used as id
}

interface RosterEditorProps {
  driverData: Driver[];
  driverOrder: string[]; // abbreviations
  setDriverOrder: (order: string[]) => void;
}

const POSITION_COLORS = [
  "bg-amber-200", // 1st
  "bg-gray-200",  // 2nd
  "bg-yellow-600 text-white", // 3rd
];

export default function RosterEditor({
  driverData,
  driverOrder,
  setDriverOrder,
}: RosterEditorProps) {
  const sortableList: SortableDriver[] = driverOrder.map((abbr) => ({
    id: abbr,
  }));

  const handleSetList = (newList: SortableDriver[]) => {
    setDriverOrder(newList.map((item) => item.id));
  };

  return (
    <div className="flex justify-center py-4">
      <div className="w-full max-w-xs">
        <div className="text-center text-gray-600 mb-3">
          <p className="font-semibold">Drag to reorder</p>
          <p className="text-sm text-gray-400">(only top 10 earn points)</p>
        </div>
        <ReactSortable list={sortableList} setList={handleSetList}>
          {driverOrder.map((abbr, i) => {
            const driver = driverData.find((d) => d.abbreviation === abbr);
            const colorClass = POSITION_COLORS[i] ?? (i >= 10 ? "bg-gray-100" : "bg-white");
            return (
              <div
                key={abbr}
                className={`flex items-center gap-3 my-1 border border-gray-200 rounded px-3 py-2 shadow cursor-move select-none ${colorClass}`}
              >
                <span className="font-bold text-gray-700 w-6 text-right">{i + 1}</span>
                <DriverImage abbreviation={abbr} className="h-10 w-10 object-cover" />
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {driver ? `${driver.first_name} ${driver.last_name}` : abbr}
                  </div>
                  {driver && (
                    <div className="text-xs text-gray-500">{driver.team}</div>
                  )}
                </div>
                {i < 10 && (
                  <span className="text-xs text-gray-400">
                    {i === 0 ? "25pts" : i === 1 ? "18pts" : i === 2 ? "15pts" : ""}
                  </span>
                )}
              </div>
            );
          })}
        </ReactSortable>
      </div>
    </div>
  );
}
