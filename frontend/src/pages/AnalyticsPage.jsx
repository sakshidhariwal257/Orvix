import { useEffect, useState } from 'react';
import { BarChart3 } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from 'recharts';
import { getTeams } from '../api/teams';
import { getTeamStats } from '../api/tasks';
import { usePageHeader } from '../components/layout/AppLayout';
import { Spinner, EmptyState } from '../components/common/Misc';

const STATUS_COLORS = { Todo: '#94a3b8', 'In Progress': '#3b82f6', Review: '#f59e0b', Done: '#22c55e' };
const PRIORITY_COLORS = { Low: '#22c55e', Medium: '#f59e0b', High: '#ef4444' };

export default function AnalyticsPage() {
  usePageHeader('Analytics', 'Task performance for a selected team.');

  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState('');
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getTeams()
      .then((list) => {
        setTeams(list);
        if (list.length > 0) setTeamId(list[0]._id);
        else setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!teamId) return;
    setLoading(true);
    setError('');
    getTeamStats(teamId)
      .then(setStats)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [teamId]);

  if (teams.length === 0 && !loading) {
    return <EmptyState icon={BarChart3} title="No teams yet" subtitle="Join or create a team to see analytics." />;
  }

  const statusData = stats ? Object.entries(stats.byStatus).map(([name, value]) => ({ name, value })) : [];
  const priorityData = stats ? Object.entries(stats.byPriority).map(([name, value]) => ({ name, value })) : [];

  return (
    <div className="flex flex-col gap-6">
      <select className="input max-w-[220px]" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
        {teams.map((t) => (
          <option key={t._id} value={t._id}>{t.name}</option>
        ))}
      </select>

      {error && <div className="error-banner">{error}</div>}
      {loading && <Spinner />}

      {!loading && stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-5">
            <MiniStat label="Total Tasks" value={stats.totalTasks} />
            <MiniStat label="Boards" value={stats.totalBoards} />
            <MiniStat label="Completed" value={stats.completed} color="text-green-400" />
            <MiniStat label="Overdue" value={stats.overdue} color="text-red-400" />
            <MiniStat label="Productivity" value={`${stats.productivity}%`} color="text-accent-2" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card p-6">
              <h3 className="text-[15px] font-semibold text-white mb-4">Tasks by Status</h3>
              {stats.totalTasks === 0 ? (
                <EmptyState title="No tasks yet" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80}>
                      {statusData.map((d) => (
                        <Cell key={d.name} fill={STATUS_COLORS[d.name]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0d1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card p-6">
              <h3 className="text-[15px] font-semibold text-white mb-4">Tasks by Priority</h3>
              {stats.totalTasks === 0 ? (
                <EmptyState title="No tasks yet" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={priorityData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="name" stroke="#5c6480" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#5c6480" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#0d1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                      {priorityData.map((d) => (
                        <Cell key={d.name} fill={PRIORITY_COLORS[d.name]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="card p-6">
              <h3 className="text-[15px] font-semibold text-white mb-4">Tasks by Member</h3>
              {stats.byMember.length === 0 ? (
                <EmptyState title="No assigned tasks yet" />
              ) : (
                <ResponsiveContainer width="100%" height={Math.max(180, stats.byMember.length * 36)}>
                  <BarChart data={stats.byMember} layout="vertical" margin={{ left: 10 }}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" horizontal={false} />
                    <XAxis type="number" stroke="#5c6480" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <YAxis dataKey="name" type="category" stroke="#9aa3c0" fontSize={12} tickLine={false} axisLine={false} width={100} />
                    <Tooltip contentStyle={{ background: '#0d1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Bar dataKey="count" fill="#7c5cff" radius={[0, 6, 6, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>

            <div className="card p-6">
              <h3 className="text-[15px] font-semibold text-white mb-4">Completed Per Week</h3>
              {stats.completedPerWeek.length === 0 ? (
                <EmptyState title="No completed tasks yet" />
              ) : (
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={stats.completedPerWeek}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="week" stroke="#5c6480" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#5c6480" fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                    <Tooltip contentStyle={{ background: '#0d1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Line type="monotone" dataKey="count" stroke="#7c5cff" strokeWidth={2.5} dot={{ r: 3, fill: '#7c5cff' }} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MiniStat({ label, value, color = 'text-white' }) {
  return (
    <div className="card p-4">
      <p className="text-[11.5px] text-text-dim mb-1.5">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value}</p>
    </div>
  );
}
