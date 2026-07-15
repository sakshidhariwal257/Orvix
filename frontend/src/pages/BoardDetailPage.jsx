import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Plus, Search, Send } from 'lucide-react';
import { getBoardById } from '../api/boards';
import { getTeamById } from '../api/teams';
import {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  addComment,
  reorderTasks,
} from '../api/tasks';
import { usePageHeader } from '../components/layout/AppLayout';
import { Spinner, EmptyState, Modal, PriorityBadge } from '../components/common/Misc';
import Avatar from '../components/common/Avatar';
import { TASK_STATUSES, TASK_PRIORITIES, TASK_LABELS } from '../utils/constants';
import { formatShortDate, isOverdue, timeAgo } from '../utils/date';

export default function BoardDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [board, setBoard] = useState(null);
  const [team, setTeam] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [addingToColumn, setAddingToColumn] = useState(null);
  const [dragTaskId, setDragTaskId] = useState(null);

  usePageHeader(board?.name || 'Board', team ? `${team.name}` : undefined);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const b = await getBoardById(id);
      setBoard(b);
      const [t, taskList] = await Promise.all([getTeamById(b.team), getTasks(id)]);
      setTeam(t);
      setTasks(taskList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const columns = useMemo(() => {
    const grouped = {};
    TASK_STATUSES.forEach((s) => (grouped[s] = []));
    tasks
      .filter((t) => t.title.toLowerCase().includes(search.toLowerCase()))
      .forEach((t) => grouped[t.status]?.push(t));
    Object.values(grouped).forEach((list) => list.sort((a, b) => a.order - b.order));
    return grouped;
  }, [tasks, search]);

  const persistOrder = async (updatedTasks) => {
    const updates = updatedTasks.map((t) => ({ id: t._id, status: t.status, order: t.order }));
    try {
      await reorderTasks(updates);
    } catch (err) {
      setError(err.message);
      load();
    }
  };

  const handleDrop = (targetStatus) => {
    if (!dragTaskId) return;
    const task = tasks.find((t) => t._id === dragTaskId);
    if (!task || task.status === targetStatus) {
      setDragTaskId(null);
      return;
    }

    const remaining = tasks.filter((t) => t._id !== dragTaskId);
    const destColumnTasks = remaining
      .filter((t) => t.status === targetStatus)
      .sort((a, b) => a.order - b.order);
    const sourceColumnTasks = remaining
      .filter((t) => t.status === task.status)
      .sort((a, b) => a.order - b.order);

    const movedTask = { ...task, status: targetStatus, order: destColumnTasks.length };
    const reindexedDest = [...destColumnTasks, movedTask].map((t, i) => ({ ...t, order: i }));
    const reindexedSource = sourceColumnTasks.map((t, i) => ({ ...t, order: i }));

    const untouched = remaining.filter(
      (t) => t.status !== targetStatus && t.status !== task.status
    );

    const nextTasks = [...untouched, ...reindexedSource, ...reindexedDest];
    setTasks(nextTasks);
    setDragTaskId(null);
    persistOrder([...reindexedSource, ...reindexedDest]);
  };

  const handleQuickAdd = async (status, title) => {
    if (!title.trim()) return;
    try {
      const task = await createTask({ title: title.trim(), status, boardId: id });
      setTasks((list) => [...list, task]);
      setAddingToColumn(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleTaskUpdated = (updated) => {
    setTasks((list) => list.map((t) => (t._id === updated._id ? updated : t)));
    setSelectedTask(updated);
  };

  const handleTaskDeleted = (taskId) => {
    setTasks((list) => list.filter((t) => t._id !== taskId));
    setSelectedTask(null);
  };

  if (loading) return <Spinner />;
  if (error && !board) return <div className="error-banner">{error}</div>;

  return (
    <div className="flex flex-col gap-5 h-full">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-2 text-[13px] text-text-dim">
          <button onClick={() => navigate('/dashboard/boards')} className="flex items-center gap-1 hover:text-text">
            <ChevronLeft size={15} /> Boards
          </button>
          {team && <span>/ {team.name}</span>}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {(team?.members || []).slice(0, 5).map((m) => (
              <Avatar key={m._id} name={m.name} size="xs" className="ring-2 ring-bg" />
            ))}
          </div>
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search tasks…"
              className="input pl-8 !py-2 w-48"
            />
          </div>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <div className="flex gap-4 overflow-x-auto pb-4 flex-1">
        {TASK_STATUSES.map((status) => (
          <div
            key={status}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => handleDrop(status)}
            className="flex flex-col w-72 flex-shrink-0 bg-white/[0.02] border border-border rounded-lg p-3"
          >
            <div className="flex items-center justify-between px-1 mb-3">
              <span className="text-[13px] font-semibold text-white">{status}</span>
              <span className="text-[11.5px] text-text-faint">{columns[status].length}</span>
            </div>

            <div className="flex flex-col gap-2.5 min-h-[40px]">
              {columns[status].map((task) => (
                <div
                  key={task._id}
                  draggable
                  onDragStart={() => setDragTaskId(task._id)}
                  onClick={() => setSelectedTask(task)}
                  className="card p-3.5 cursor-pointer hover:border-border-strong transition-colors"
                >
                  <p className="text-[13px] text-text font-medium mb-2.5 leading-snug">{task.title}</p>
                  <div className="flex items-center justify-between">
                    <PriorityBadge priority={task.priority} />
                    {task.assignee ? (
                      <Avatar name={task.assignee.name} size="xs" />
                    ) : (
                      <span className="text-[10.5px] text-text-faint">Unassigned</span>
                    )}
                  </div>
                  {task.dueDate && (
                    <p
                      className={`text-[11px] mt-2 ${
                        isOverdue(task.dueDate, task.status) ? 'text-red-400' : 'text-text-faint'
                      }`}
                    >
                      Due {formatShortDate(task.dueDate)}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {addingToColumn === status ? (
              <QuickAddForm
                onCancel={() => setAddingToColumn(null)}
                onSubmit={(title) => handleQuickAdd(status, title)}
              />
            ) : (
              <button
                onClick={() => setAddingToColumn(status)}
                className="mt-2.5 flex items-center gap-1.5 text-[12.5px] text-text-dim hover:text-text px-1 py-1.5"
              >
                <Plus size={14} /> Add task
              </button>
            )}
          </div>
        ))}
      </div>

      {tasks.length === 0 && !loading && (
        <EmptyState title="No tasks on this board yet" subtitle="Add your first task to a column above." />
      )}

      {selectedTask && (
        <TaskDetailModal
          task={selectedTask}
          members={team?.members || []}
          onClose={() => setSelectedTask(null)}
          onUpdated={handleTaskUpdated}
          onDeleted={handleTaskDeleted}
        />
      )}
    </div>
  );
}

function QuickAddForm({ onSubmit, onCancel }) {
  const [title, setTitle] = useState('');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(title);
      }}
      className="mt-2.5"
    >
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => !title.trim() && onCancel()}
        placeholder="Task title…"
        className="input !py-2 text-[13px]"
      />
    </form>
  );
}

function TaskDetailModal({ task, members, onClose, onUpdated, onDeleted }) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [status, setStatus] = useState(task.status);
  const [priority, setPriority] = useState(task.priority);
  const [assignee, setAssignee] = useState(task.assignee?._id || '');
  const [dueDate, setDueDate] = useState(task.dueDate ? task.dueDate.slice(0, 10) : '');
  const [labels, setLabels] = useState(task.labels || []);
  const [comment, setComment] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const toggleLabel = (label) => {
    setLabels((list) => (list.includes(label) ? list.filter((l) => l !== label) : [...list, label]));
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const updated = await updateTask(task._id, {
        title,
        description,
        status,
        priority,
        assignee: assignee || null,
        dueDate: dueDate || null,
        labels,
      });
      onUpdated(updated);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Delete this task?')) return;
    try {
      await deleteTask(task._id);
      onDeleted(task._id);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!comment.trim()) return;
    try {
      const updated = await addComment(task._id, comment.trim());
      onUpdated(updated);
      setComment('');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal title="Task Details" onClose={onClose} maxWidth={560}>
      {error && <div className="error-banner">{error}</div>}

      <div className="field">
        <label>Title</label>
        <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>

      <div className="field">
        <label>Description</label>
        <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="field">
          <label>Status</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            {TASK_STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Priority</label>
          <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
            {TASK_PRIORITIES.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Assignee</label>
          <select className="input" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m._id} value={m._id}>{m.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Due Date</label>
          <input type="date" className="input" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label>Labels</label>
        <div className="flex flex-wrap gap-2">
          {TASK_LABELS.map((l) => (
            <button
              type="button"
              key={l}
              onClick={() => toggleLabel(l)}
              className={`badge border ${
                labels.includes(l) ? 'border-accent-2 bg-accent/15 text-white' : 'border-border text-text-dim'
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      <div className="modal-actions">
        <button type="button" className="btn-danger" onClick={handleDelete}>Delete</button>
        <button type="button" className="btn" onClick={onClose}>Cancel</button>
        <button type="button" className="btn-primary" onClick={handleSave} disabled={saving}>
          {saving ? 'Saving…' : 'Save Changes'}
        </button>
      </div>

      <div className="mt-6 pt-5 border-t border-border">
        <h3 className="text-[13.5px] font-semibold text-white mb-3">Comments</h3>
        <div className="flex flex-col gap-3 max-h-56 overflow-y-auto mb-3">
          {(task.comments || []).length === 0 && (
            <p className="text-[12.5px] text-text-faint">No comments yet.</p>
          )}
          {(task.comments || []).map((c) => (
            <div key={c._id} className="flex gap-2.5">
              <Avatar name={c.user?.name} size="xs" />
              <div>
                <p className="text-[12.5px] text-text">
                  <span className="font-medium">{c.user?.name}</span>{' '}
                  <span className="text-text-faint">{timeAgo(c.createdAt)}</span>
                </p>
                <p className="text-[12.5px] text-text-dim">{c.text}</p>
              </div>
            </div>
          ))}
        </div>
        <form onSubmit={handleAddComment} className="flex gap-2">
          <input
            className="input"
            placeholder="Write a comment… (@name to mention)"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
          />
          <button className="btn flex-shrink-0" type="submit">
            <Send size={15} />
          </button>
        </form>
      </div>
    </Modal>
  );
}
