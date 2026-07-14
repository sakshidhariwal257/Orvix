import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ListChecks, CheckCircle2, Clock, AlertTriangle, Activity } from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { getTeams } from '../api/teams';
import { getTeamStats, getTeamTasks } from '../api/tasks';
import { usePageHeader } from '../components/layout/AppLayout';
import { Spinner, EmptyState } from '../components/common/Misc';
import { formatShortDate } from '../utils/date';
import { useAuth } from '../context/AuthContext';

const STATUS_COLORS = {
  Todo: '#94a3b8',
  'In Progress': '#3b82f6',
  Review: '#f59e0b',
  Done: '#22c55e',
};

export default function DashboardPage() {
  const { user } = useAuth();
  usePageHeader(null, "Here's what's happening with your projects today");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [totals, setTotals] = useState({ total: 0, completed: 0, inProgress: 0, overdue: 0 });
  const [byStatus, setByStatus] = useState({ Todo: 0, 'In Progress': 0, Review: 0, Done: 0 });
  const [completedPerWeek, setCompletedPerWeek] = useState([]);
  const [deadlines, setDeadlines] = useState([]);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError('');
      try {
        const teams = await getTeams();

        const [statsList, taskLists] = await Promise.all([
          Promise.all(teams.map((t) => getTeamStats(t._id).catch(() => null))),
          Promise.all(teams.map((t) => getTeamTasks(t._id).catch(() => []))),
        ]);

        if (cancelled) return;

        const aggStatus = { Todo: 0, 'In Progress': 0, Review: 0, Done: 0 };
        let totalTasks = 0;
        let completed = 0;
        let overdue = 0;
        const weekMap = {};

        statsList.forEach((s) => {
          if (!s) return;
          totalTasks += s.totalTasks || 0;
          completed += s.completed || 0;
          overdue += s.overdue || 0;
          Object.keys(aggStatus).forEach((k) => {
            aggStatus[k] += s.byStatus?.[k] || 0;
          });
          (s.completedPerWeek || []).forEach(({ week, count }) => {
            weekMap[week] = (weekMap[week] || 0) + count;
          });
        });

        const weeks = Object.entries(weekMap).map(([week, count]) => ({ week, count }));

        const allDeadlines = taskLists
          .flat()
          .filter((t) => t.status !== 'Done' && t.dueDate)
          .sort((a, b) => new Date(a.dueDate) - new Date(b.dueDate))
          .slice(0, 5);

        setTotals({
          total: totalTasks,
          completed,
          inProgress: aggStatus['In Progress'],
          overdue,
        });
        setByStatus(aggStatus);
        setCompletedPerWeek(weeks);
        setDeadlines(allDeadlines);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load dashboard');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const donutData = useMemo(
    () => Object.entries(byStatus).map(([name, value]) => ({ name, value })),
    [byStatus]
  );

  if (loading) return <Spinner />;

  return (
    <div className="flex flex-col gap-6">
      {error && <div className="error-banner">{error}</div>}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard icon={ListChecks} label="Total Tasks" value={totals.total} color="text-white" />
        <StatCard icon={CheckCircle2} label="Completed" value={totals.completed} color="text-green-400" />
        <StatCard icon={Clock} label="In Progress" value={totals.inProgress} color="text-blue-400" />
        <StatCard icon={AlertTriangle} label="Overdue" value={totals.overdue} color="text-red-400" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <h3 className="text-[15px] font-semibold text-white mb-4">Tasks Overview</h3>
          {totals.total === 0 ? (
            <EmptyState title="No tasks yet" subtitle="Tasks you create across your boards will show up here." />
          ) : (
            <div className="flex items-center gap-6">
              <div className="w-40 h-40 relative flex-shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={donutData}
                      dataKey="value"
                      innerRadius={55}
                      outerRadius={78}
                      paddingAngle={2}
                      stroke="none"
                    >
                      {donutData.map((entry) => (
                        <Cell key={entry.name} fill={STATUS_COLORS[entry.name]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ background: '#0d1120', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold text-white">{totals.total}</span>
                  <span className="text-[11px] text-text-dim">Total</span>
                </div>
              </div>
              <div className="flex flex-col gap-2.5">
                {donutData.map((d) => (
                  <div key={d.name} className="flex items-center gap-2 text-[13px]">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: STATUS_COLORS[d.name] }} />
                    <span className="text-text-dim">{d.name}</span>
                    <span className="text-text font-medium ml-auto">
                      {d.value} ({totals.total ? Math.round((d.value / totals.total) * 100) : 0}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-[15px] font-semibold text-white mb-4">Tasks Completed</h3>
          {completedPerWeek.length === 0 ? (
            <EmptyState title="No completed tasks yet" subtitle="Your weekly completion trend will appear once tasks are marked Done." />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={completedPerWeek}>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold text-white">Upcoming Deadlines</h3>
            <Link to="/dashboard/tasks" className="text-[12.5px] text-accent-2 hover:underline">View all</Link>
          </div>
          {deadlines.length === 0 ? (
            <EmptyState title="Nothing due soon" subtitle="Tasks with upcoming due dates will show up here." />
          ) : (
            <div className="flex flex-col divide-y divide-border">
              {deadlines.map((t) => (
                <div key={t._id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div className="min-w-0">
                    <p className="text-[13.5px] text-text truncate">{t.title}</p>
                    <p className="text-[11.5px] text-text-faint">{t.boardName}</p>
                  </div>
                  <span className="text-[12px] text-text-dim flex-shrink-0 ml-3">{formatShortDate(t.dueDate)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h3 className="text-[15px] font-semibold text-white mb-4">Recent Activity</h3>
          <EmptyState
            icon={Activity}
            title="Activity feed coming soon"
            subtitle="This needs an activity-log endpoint that isn't part of the current backend yet, so nothing is shown here rather than made up."
          />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <div className="card p-5 flex items-center justify-between">
      <div>
        <p className="text-[12.5px] text-text-dim mb-1.5">{label}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
      </div>
      <span className="w-10 h-10 rounded-full bg-white/[0.04] flex items-center justify-center">
        <Icon size={18} className={color} />
      </span>
    </div>
  );
}
