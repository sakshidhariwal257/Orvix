import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, ChevronLeft, ChevronRight, ListChecks } from 'lucide-react';
import { getTeams } from '../api/teams';
import { getBoards } from '../api/boards';
import { getTasks, createTask } from '../api/tasks';
import { usePageHeader } from '../components/layout/AppLayout';
import { Spinner, EmptyState, Modal, StatusBadge, PriorityBadge } from '../components/common/Misc';
import Avatar from '../components/common/Avatar';
import { TASK_STATUSES, TASK_PRIORITIES } from '../utils/constants';
import { formatShortDate } from '../utils/date';

const PAGE_SIZE = 10;

export default function TasksPage() {
  usePageHeader('Tasks', 'All tasks across your boards.');
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [boards, setBoards] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const teamList = await getTeams();
      setTeams(teamList);

      const teamById = Object.fromEntries(teamList.map((t) => [t._id, t]));
      const allBoards = (
        await Promise.all(teamList.map((t) => getBoards(t._id).catch(() => [])))
      ).flat();
      setBoards(allBoards);

      const allTasks = (
        await Promise.all(
          allBoards.map((b) =>
            getTasks(b._id)
              .then((list) =>
                list.map((t) => ({
                  ...t,
                  boardName: b.name,
                  teamName: teamById[b.team]?.name || '',
                }))
              )
              .catch(() => [])
          )
        )
      ).flat();

      setTasks(allTasks);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (search && !t.title.toLowerCase().includes(search.toLowerCase())) return false;
      if (statusFilter && t.status !== statusFilter) return false;
      if (priorityFilter && t.priority !== priorityFilter) return false;
      return true;
    });
  }, [tasks, search, statusFilter, priorityFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const pageItems = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => setPage(1), [search, statusFilter, priorityFilter]);

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-wrap flex-1">
          <div className="relative w-full max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks…"
              className="input pl-9"
            />
          </div>
          <select className="input max-w-[150px]" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">All Status</option>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select className="input max-w-[150px]" value={priorityFilter} onChange={(e) => setPriorityFilter(e.target.value)}>
            <option value="">All Priority</option>
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary" disabled={boards.length === 0}>
          <Plus size={16} /> New Task
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading && <Spinner />}

      {!loading && filtered.length === 0 && (
        <EmptyState icon={ListChecks} title="No tasks found" subtitle="Try adjusting your filters, or create a new task." />
      )}

      {!loading && filtered.length > 0 && (
        <div className="card overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="border-b border-border text-[11.5px] uppercase tracking-wider text-text-faint">
                <th className="px-5 py-3 font-medium">Task</th>
                <th className="px-5 py-3 font-medium">Board</th>
                <th className="px-5 py-3 font-medium">Assignee</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Priority</th>
                <th className="px-5 py-3 font-medium">Due Date</th>
              </tr>
            </thead>
            <tbody>
              {pageItems.map((t) => (
                <tr
                  key={t._id}
                  onClick={() => navigate(`/dashboard/boards/${t.board}`)}
                  className="border-b border-border/60 last:border-0 hover:bg-white/[0.02] cursor-pointer"
                >
                  <td className="px-5 py-3 text-[13px] text-text">{t.title}</td>
                  <td className="px-5 py-3 text-[13px] text-text-dim">{t.boardName}</td>
                  <td className="px-5 py-3">
                    {t.assignee ? (
                      <div className="flex items-center gap-2">
                        <Avatar name={t.assignee.name} size="xs" />
                        <span className="text-[12.5px] text-text-dim">{t.assignee.name}</span>
                      </div>
                    ) : (
                      <span className="text-[12px] text-text-faint">Unassigned</span>
                    )}
                  </td>
                  <td className="px-5 py-3"><StatusBadge status={t.status} /></td>
                  <td className="px-5 py-3"><PriorityBadge priority={t.priority} /></td>
                  <td className="px-5 py-3 text-[12.5px] text-text-dim">{formatShortDate(t.dueDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="flex items-center justify-between px-5 py-3.5 text-[12px] text-text-faint">
            <span>
              Showing {(page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} tasks
            </span>
            <div className="flex items-center gap-1">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="p-1.5 rounded-md hover:bg-white/[0.05] disabled:opacity-40"
              >
                <ChevronLeft size={15} />
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .slice(0, 5)
                .map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`w-7 h-7 rounded-md text-[12px] ${
                      p === page ? 'bg-accent text-white' : 'hover:bg-white/[0.05]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="p-1.5 rounded-md hover:bg-white/[0.05] disabled:opacity-40"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>
        </div>
      )}

      {showCreate && (
        <NewTaskModal
          teams={teams}
          boards={boards}
          onClose={() => setShowCreate(false)}
          onCreated={(task, boardName, teamName) => {
            setTasks((list) => [{ ...task, boardName, teamName }, ...list]);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

function NewTaskModal({ teams, boards, onClose, onCreated }) {
  const [teamId, setTeamId] = useState(teams[0]?._id || '');
  const [boardId, setBoardId] = useState('');
  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const teamBoards = boards.filter((b) => b.team === teamId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !boardId) {
      setError('Title and board are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const task = await createTask({ title: title.trim(), priority, dueDate: dueDate || null, boardId });
      const board = boards.find((b) => b._id === boardId);
      const team = teams.find((t) => t._id === teamId);
      onCreated(task, board?.name, team?.name);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="New Task" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-banner">{error}</div>}
        <div className="field">
          <label>Team</label>
          <select
            className="input"
            value={teamId}
            onChange={(e) => {
              setTeamId(e.target.value);
              setBoardId('');
            }}
          >
            {teams.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Board</label>
          <select className="input" value={boardId} onChange={(e) => setBoardId(e.target.value)}>
            <option value="">Select a board</option>
            {teamBoards.map((b) => (
              <option key={b._id} value={b._id}>{b.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Title</label>
          <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="field">
            <label>Priority</label>
            <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
              {TASK_PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Due Date</label>
            <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating…' : 'Create Task'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
