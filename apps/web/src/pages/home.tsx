import { Layout } from "../utils/layout";
import RaceList from "../partials/home/raceList";
import Leaderboard from "../partials/home/leaderboard";

export default function Home() {
  return (
    <Layout pageName="Home">
      <div className="p-6 grid sm:grid-cols-2 grid-cols-1 gap-8 bg-gray-100 min-h-screen">
        <div>
          <RaceList />
        </div>
        <div>
          <Leaderboard />
        </div>
      </div>
    </Layout>
  );
}
