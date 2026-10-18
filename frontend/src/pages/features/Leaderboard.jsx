import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_BASE } from '../../api';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl } from '../../utils/getImageUrl';
import { EmptyState, LoadingState, PageFrame, PageHero, SectionHeader, StatCard } from '../../components/ui/page';

function BoardTable({ headers, rows, tone = 'cyan' }) {
  const toneClass = tone === 'emerald' ? 'text-emerald-100' : tone === 'indigo' ? 'text-indigo-100' : 'text-cyan-100';
  return (
    <div className="overflow-x-auto rounded-[28px] border border-white/10 bg-white/[0.045] shadow-2xl backdrop-blur-xl">
      <table className="min-w-full text-left text-sm">
        <thead className={`bg-white/[0.06] text-xs uppercase tracking-[0.22em] ${toneClass}`}>
          <tr>
            {headers.map(header => (
              <th key={header} className="px-4 py-4">{header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows}
        </tbody>
      </table>
    </div>
  );
}

export default function Leaderboard() {
  const { token } = useAuth();
  const [players, setPlayers] = useState([]);
  const [sortBy, setSortBy] = useState('balance');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [gameBoards, setGameBoards] = useState({ rps: [], puzzleRush: [] });
  const [gamesLoading, setGamesLoading] = useState(true);

  useEffect(() => {
    const fetchPlayers = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/leaderboard/users?sort=${sortBy}`
        );
        setPlayers(res.data);
        setError(null);
      } catch {
        setError('Failed to load leaderboard');
      } finally {
        setLoading(false);
      }
    };
    fetchPlayers();
  }, [sortBy]);

  useEffect(() => {
    const fetchGameBoards = async () => {
      try {
        const res = await axios.get(
          `${API_BASE}/api/games/leaderboard`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setGameBoards(res.data);
      } catch {
      } finally {
        setGamesLoading(false);
      }
    };
    fetchGameBoards();
  }, [token]);

  if (loading) {
    return <LoadingState label="Loading leaderboard" />;
  }

  if (error) {
    return <PageFrame><EmptyState title="Leaderboard unavailable" description={error} /></PageFrame>;
  }

  return (
    <PageFrame className="bg-[radial-gradient(circle_at_12%_0%,rgba(34,211,238,0.14),transparent_32%),radial-gradient(circle_at_90%_8%,rgba(99,102,241,0.12),transparent_34%),linear-gradient(180deg,#020617_0%,#09090b_56%,#020202_100%)]">
      <div className="mx-auto max-w-6xl space-y-10">
        <PageHero
          title="Leaderboards"
          description="Track the strongest balances, match records, and daily puzzle runs across the economy."
          actions={(
            <>
              <StatCard label="Players" value={players.length} tone="text-cyan-100" />
              <StatCard label="RPS board" value={gameBoards.rps?.length || 0} tone="text-indigo-100" />
              <StatCard label="Puzzle board" value={gameBoards.puzzleRush?.length || 0} tone="text-emerald-100" />
            </>
          )}
        />

        <section>
          <SectionHeader
            title="Global standings"
            description="Sort the main board by balance, wins, or achievement progress."
            action={(
          <select
            value={sortBy}
            onChange={(e) => {
              setLoading(true);
              setSortBy(e.target.value);
            }}
                className="rounded-2xl border border-white/10 bg-black/35 px-4 py-3 text-sm text-white outline-hidden transition focus:border-cyan-200/50"
          >
            <option value="balance">Sort by Balance</option>
            <option value="wins">Sort by Wins</option>
            <option value="achievements">Sort by Achievements</option>
          </select>
            )}
          />

          <BoardTable
            headers={['#', 'Player', 'Balance', 'Wins', 'Achievements']}
            rows={players.map((player, index) => (
                <tr
                  key={player._id}
                  className="border-t border-white/10 hover:bg-white/10 transition"
                >
                  <td className="py-3 px-4 font-semibold">{index + 1}</td>
                  <td className="py-3 px-4 flex items-center gap-3">
                    <img
                      src={getImageUrl(player.profileImage)}
                      alt={player.username}
                      className="w-8 h-8 rounded-full object-cover"
                    />
                    <Link to={`/profile/${player.username}`} className="hover:underline">
                      {player.username}
                    </Link>
                  </td>
                  <td className="py-3 px-4 text-right">
                    {player.balance.toLocaleString()} coins
                  </td>
                  <td className="py-3 px-4 text-right">{player.betsWon || 0}</td>
                  <td className="py-3 px-4 text-right">
                    {player.achievements?.length || 0}
                  </td>
                </tr>
              ))}
          />
        </section>
        <section>
        <SectionHeader title="RPS standings" description="Wins and total games from the arena." />
        {gamesLoading ? (
          <p className="text-center text-white/50 animate-pulse">Loading RPS...</p>
        ) : (
          <BoardTable
            tone="indigo"
            headers={['#', 'Player', 'Wins', 'Games']}
            rows={gameBoards.rps.map((p, i) => (
                  <tr
                    key={p.username}
                    className="border-t border-white/10 hover:bg-white/10 transition"
                  >
                    <td className="py-3 px-4 font-semibold">{i + 1}</td>
                    <td className="py-3 px-4">{p.username}</td>
                    <td className="py-3 px-4 text-right">{p.wins}</td>
                    <td className="py-3 px-4 text-right">{p.games}</td>
                  </tr>
                ))}
          />
        )}
      </section>
      <section>
        <SectionHeader title="Puzzle Rush standings" description="Daily puzzle solves from the current board." />
        {gamesLoading ? (
          <p className="text-center text-white/50 animate-pulse">Loading Puzzle Rush...</p>
        ) : (
          <BoardTable
            tone="emerald"
            headers={['#', 'Player', 'Solves']}
            rows={gameBoards.puzzleRush.map((p, i) => (
                  <tr
                    key={p.username}
                    className="border-t border-white/10 hover:bg-white/10 transition"
                  >
                    <td className="py-3 px-4 font-semibold">{i + 1}</td>
                    <td className="py-3 px-4">{p.username}</td>
                    <td className="py-3 px-4 text-right">{p.wins}</td>
                  </tr>
                ))}
          />
        )}
      </section>
      </div>
    </PageFrame>
  );
}
