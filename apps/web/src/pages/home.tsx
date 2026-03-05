import { Layout } from "../utils/layout";
import RaceList from "../partials/home/raceList";
import Leaderboard from "../partials/home/leaderboard";
import { useAuthStore } from "../store/auth";

export default function Home() {
  const user = useAuthStore((s) => s.user);

  return (
    <Layout pageName="Home">
      <div className="f1-bg bg-gray-100 dark:bg-gray-900 min-h-screen">
        {user && (
          <div className="bg-gradient-to-r from-gray-900 via-red-900 to-gray-900 px-6 py-5">
            <p className="text-xs uppercase tracking-widest text-red-300 font-bold mb-1">
              F1 Fantasy 2026
            </p>
            <p className="text-white text-lg">
              Welcome back, <span className="font-semibold">{user.nickname}</span>
            </p>
          </div>
        )}
        <div className="p-6 grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <RaceList />
          </div>
          <div className="lg:col-span-2">
            <Leaderboard />
          </div>
        </div>
      </div>
    </Layout>
  );
}
