import { ReactSortable } from "react-sortablejs";
import { POSITION_POINTS, type Driver } from "@f1/shared";
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
  "border-l-4 border-l-yellow-400 bg-yellow-50 dark:bg-yellow-900/20",   // 1st - gold
  "border-l-4 border-l-gray-400 bg-gray-50 dark:bg-gray-600/20",         // 2nd - silver
  "border-l-4 border-l-amber-600 bg-amber-50 dark:bg-amber-900/20",      // 3rd - bronze
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
        <div className="text-center text-gray-600 dark:text-gray-300 mb-3">
          <p className="font-semibold">Drag to reorder</p>
          <p className="text-sm text-gray-400 dark:text-gray-500">(only top 10 earn points)</p>
        </div>
        <ReactSortable list={sortableList} setList={handleSetList}>
          {driverOrder.map((abbr, i) => {
            const driver = driverData.find((d) => d.abbreviation === abbr);
            const colorClass = POSITION_COLORS[i] ?? (i >= 10 ? "border-l-4 border-l-transparent bg-gray-100 dark:bg-gray-800" : "border-l-4 border-l-transparent bg-white dark:bg-gray-700");
            return (
              <div
                key={abbr}
                className={`flex items-center gap-3 my-1 border border-gray-200 dark:border-gray-600 rounded px-3 py-2 shadow cursor-move select-none ${colorClass}`}
              >
                <span className="font-bold text-gray-700 dark:text-gray-200 w-6 text-right">{i + 1}</span>
                <DriverImage abbreviation={abbr} className="h-10 w-10 object-cover" />
                <div className="flex-1">
                  <div className="text-sm font-medium">
                    {driver ? `${driver.first_name} ${driver.last_name}` : abbr}
                  </div>
                  {driver && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">{driver.team}</div>
                  )}
                </div>
                {POSITION_POINTS[i + 1] !== undefined && (
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {POSITION_POINTS[i + 1]}pts
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
