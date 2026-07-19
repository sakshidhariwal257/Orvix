import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { getTeams } from '../api/teams';
import { getTeamTasks } from '../api/tasks';
import { usePageHeader } from '../components/layout/AppLayout';
import { Spinner, EmptyState } from '../components/common/Misc';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const STATUS_DOT = {
  Todo: 'bg-slate-400',
  'In Progress': 'bg-blue-400',
  Review: 'bg-amber-400',
  Done: 'bg-green-400',
};

export default function CalendarPage() {
  usePageHeader('Calendar', 'Every task with a due date, across your teams.');
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [teamId, setTeamId] = useState('');
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cursor, setCursor] = useState(new Date());

  useEffect(() => {
    getTeams()
      .then(setTeams)
      .catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError('');
      try {
        if (teamId) {
          const list = await getTeamTasks(teamId);
          if (!cancelled) setTasks(list);
        } else {
          const all = (
            await Promise.all(teams.map((t) => getTeamTasks(t._id).catch(() => [])))
          ).flat();
          if (!cancelled) setTasks(all);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (teams.length > 0 || teamId) load();
    else setLoading(false);
    return () => {
      cancelled = true;
    };
  }, [teamId, teams]);

  const tasksByDay = useMemo(() => {
    const map = {};
    tasks.forEach((t) => {
      const d = new Date(t.dueDate);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [tasks]);

  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const cells = [];
  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    cells.push({ day: daysInPrevMonth - i, current: false });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ day: d, current: true });
  }
  while (cells.length % 7 !== 0) {
    cells.push({ day: cells.length - (firstDayOfMonth + daysInMonth) + 1, current: false });
  }

  const monthLabel = cursor.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const today = new Date();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <select className="input max-w-[200px]" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
          <option value="">All Teams</option>
          {teams.map((t) => (
            <option key={t._id} value={t._id}>{t.name}</option>
          ))}
        </select>

        <div className="flex items-center gap-3">
          <button onClick={() => setCursor(new Date())} className="btn !py-1.5 !px-3 text-[12.5px]">Today</button>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCursor(new Date(year, month - 1, 1))}
              className="p-1.5 rounded-md hover:bg-white/[0.05]"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="text-[13.5px] font-medium text-white w-32 text-center">{monthLabel}</span>
            <button
              onClick={() => setCursor(new Date(year, month + 1, 1))}
              className="p-1.5 rounded-md hover:bg-white/[0.05]"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading && <Spinner />}

      {!loading && (
        <div className="card overflow-hidden">
          <div className="grid grid-cols-7 border-b border-border">
            {WEEKDAYS.map((d) => (
              <div key={d} className="px-3 py-2.5 text-[11.5px] uppercase tracking-wider text-text-faint text-center">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((cell, i) => {
              const isToday =
                cell.current &&
                cell.day === today.getDate() &&
                month === today.getMonth() &&
                year === today.getFullYear();
              const key = `${year}-${month}-${cell.day}`;
              const dayTasks = cell.current ? tasksByDay[key] || [] : [];

              return (
                <div
                  key={i}
                  className={`min-h-[92px] border-b border-r border-border/60 p-2 ${
                    cell.current ? '' : 'opacity-30'
                  }`}
                >
                  <span
                    className={`text-[12px] inline-flex items-center justify-center w-6 h-6 rounded-full ${
                      isToday ? 'bg-accent text-white font-semibold' : 'text-text-dim'
                    }`}
                  >
                    {cell.day}
                  </span>
                  <div className="flex flex-col gap-1 mt-1.5">
                    {dayTasks.slice(0, 3).map((t) => (
                      <button
                        key={t._id}
                        onClick={() => navigate(`/dashboard/boards/${t.board}`)}
                        className="text-left text-[10.5px] px-1.5 py-1 rounded-md bg-white/[0.05] hover:bg-white/[0.09] flex items-center gap-1.5 truncate"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${STATUS_DOT[t.status]}`} />
                        <span className="truncate text-text-dim">{t.title}</span>
                      </button>
                    ))}
                    {dayTasks.length > 3 && (
                      <span className="text-[10px] text-text-faint px-1.5">+{dayTasks.length - 3} more</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!loading && tasks.length === 0 && (
        <EmptyState title="Nothing scheduled" subtitle="Tasks with a due date will appear on the calendar." />
      )}
    </div>
  );
}
