import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, Search, ChevronDown, LayoutGrid, MoreVertical, Trash2 } from 'lucide-react';
import { getTeams } from '../api/teams';
import { getBoards, createBoard, deleteBoard } from '../api/boards';
import { getTasks } from '../api/tasks';
import { usePageHeader } from '../components/layout/AppLayout';
import { Spinner, EmptyState, Modal } from '../components/common/Misc';

export default function BoardsPage() {
  usePageHeader('Boards', 'All boards from your teams.');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const teamIdFilter = searchParams.get('teamId') || '';

  const [teams, setTeams] = useState([]);
  const [boardsByTeam, setBoardsByTeam] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [teamFilter, setTeamFilter] = useState(teamIdFilter);
  const [collapsed, setCollapsed] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const teamList = await getTeams();
      setTeams(teamList);

      const perTeam = await Promise.all(
        teamList.map(async (team) => {
          const boards = await getBoards(team._id);
          const withCounts = await Promise.all(
            boards.map(async (board) => {
              const tasks = await getTasks(board._id).catch(() => []);
              const total = tasks.length;
              const done = tasks.filter((t) => t.status === 'Done').length;
              const percent = total ? Math.round((done / total) * 100) : 0;
              return { ...board, taskCount: total, percent };
            })
          );
          return [team._id, withCounts];
        })
      );

      setBoardsByTeam(Object.fromEntries(perTeam));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleTeams = useMemo(
    () => teams.filter((t) => !teamFilter || t._id === teamFilter),
    [teams, teamFilter]
  );

  const matchesSearch = (name) => name.toLowerCase().includes(search.toLowerCase());

  const totalBoardsShown = visibleTeams.reduce(
    (sum, t) => sum + (boardsByTeam[t._id] || []).filter((b) => matchesSearch(b.name)).length,
    0
  );

  const handleDeleteBoard = async (id, teamId) => {
    if (!confirm('Delete this board and all its tasks? This cannot be undone.')) return;
    try {
      await deleteBoard(id);
      setBoardsByTeam((prev) => ({
        ...prev,
        [teamId]: prev[teamId].filter((b) => b._id !== id),
      }));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3 flex-1 min-w-[240px]">
          <div className="relative w-full max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search boards…"
              className="input pl-9"
            />
          </div>
          <select
            value={teamFilter}
            onChange={(e) => setTeamFilter(e.target.value)}
            className="input max-w-[180px]"
          >
            <option value="">All Teams</option>
            {teams.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={16} /> Create Board
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading && <Spinner />}

      {!loading && teams.length === 0 && (
        <EmptyState
          icon={LayoutGrid}
          title="No teams yet"
          subtitle="Create a team first, then add boards to it."
        />
      )}

      {!loading && teams.length > 0 && totalBoardsShown === 0 && (
        <EmptyState icon={LayoutGrid} title="No boards found" subtitle="Try a different search or create a new board." />
      )}

      {!loading &&
        visibleTeams.map((team) => {
          const boards = (boardsByTeam[team._id] || []).filter((b) => matchesSearch(b.name));
          if (boards.length === 0) return null;
          const isCollapsed = collapsed[team._id];

          return (
            <div key={team._id} className="flex flex-col gap-3">
              <button
                onClick={() => setCollapsed((c) => ({ ...c, [team._id]: !c[team._id] }))}
                className="flex items-center gap-2 text-[14px] font-semibold text-white"
              >
                <ChevronDown size={16} className={`transition-transform ${isCollapsed ? '-rotate-90' : ''}`} />
                {team.name}
              </button>

              {!isCollapsed && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {boards.map((board) => (
                    <div key={board._id} className="card p-5 flex flex-col gap-4 relative">
                      <div className="flex items-start justify-between">
                        <button className="text-left flex-1" onClick={() => navigate(`/dashboard/boards/${board._id}`)}>
                          <h3 className="text-[15px] font-semibold text-white mb-1">{board.name}</h3>
                          <p className="text-[12.5px] text-text-dim line-clamp-1">
                            {board.description || 'No description'}
                          </p>
                        </button>
                        <div className="relative">
                          <button
                            onClick={() => setMenuOpenId(menuOpenId === board._id ? null : board._id)}
                            className="text-text-faint hover:text-text p-1"
                          >
                            <MoreVertical size={15} />
                          </button>
                          {menuOpenId === board._id && (
                            <div className="absolute right-0 mt-1 w-40 bg-[#0d1120] border border-border-strong rounded-lg shadow-xl z-20 py-1.5">
                              <button
                                onClick={() => {
                                  setMenuOpenId(null);
                                  handleDeleteBoard(board._id, team._id);
                                }}
                                className="w-full text-left px-3.5 py-2 text-[13px] text-red-300 hover:bg-white/[0.05] flex items-center gap-2"
                              >
                                <Trash2 size={14} /> Delete Board
                              </button>
                            </div>
                          )}
                        </div>
                      </div>

                      <button className="text-left" onClick={() => navigate(`/dashboard/boards/${board._id}`)}>
                        <p className="text-[12px] text-text-dim mb-2">{board.taskCount} Tasks</p>
                        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                          <div
                            className="h-full bg-accent-gradient rounded-full"
                            style={{ width: `${board.percent}%` }}
                          />
                        </div>
                        <p className="text-[11.5px] text-text-faint mt-1.5">{board.percent}% complete</p>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}

      {showCreate && (
        <CreateBoardModal
          teams={teams}
          defaultTeamId={teamFilter}
          onClose={() => setShowCreate(false)}
          onCreated={(board, teamId) => {
            setBoardsByTeam((prev) => ({
              ...prev,
              [teamId]: [{ ...board, taskCount: 0, percent: 0 }, ...(prev[teamId] || [])],
            }));
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

function CreateBoardModal({ teams, defaultTeamId, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [teamId, setTeamId] = useState(defaultTeamId || teams[0]?._id || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !teamId) {
      setError('Board name and team are required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const board = await createBoard({ name, description, teamId });
      onCreated(board, teamId);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Create Board" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-banner">{error}</div>}
        <div className="field">
          <label>Team</label>
          <select className="input" value={teamId} onChange={(e) => setTeamId(e.target.value)}>
            {teams.map((t) => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Board Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sprint 12" />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea
            className="input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this board for?"
          />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating…' : 'Create Board'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
