import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, MoreVertical, Layers, UserPlus, Trash2, X } from 'lucide-react';
import { getTeams, createTeam, deleteTeam, addMember, removeMember } from '../api/teams';
import { usePageHeader } from '../components/layout/AppLayout';
import { Spinner, EmptyState, Modal } from '../components/common/Misc';
import Avatar from '../components/common/Avatar';
import { useAuth } from '../context/AuthContext';

const COLOR_OPTIONS = ['#2563eb', '#7c5cff', '#ec4899', '#f59e0b', '#22c55e', '#06b6d4'];

export default function TeamsPage() {
  usePageHeader('Teams', 'Manage your teams and collaborate with your members.');
  const { user } = useAuth();
  const navigate = useNavigate();

  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [manageTeam, setManageTeam] = useState(null);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const load = () => {
    setLoading(true);
    getTeams()
      .then(setTeams)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = teams.filter((t) => t.name.toLowerCase().includes(search.toLowerCase()));

  const handleDelete = async (id) => {
    if (!confirm('Delete this team? This cannot be undone.')) return;
    try {
      await deleteTeam(id);
      setTeams((list) => list.filter((t) => t._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-xs">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search teams…"
            className="input pl-9"
          />
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={16} /> Create Team
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading && <Spinner />}

      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={Layers}
          title="No teams yet"
          subtitle="Create a team to start organizing boards and inviting members."
        />
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((team) => {
            const isOwner = team.owner?._id === user?._id;
            return (
              <div key={team._id} className="card p-5 flex flex-col gap-4 relative">
                <div className="flex items-start justify-between">
                  <span
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white font-semibold"
                    style={{ background: team.color || '#2563eb' }}
                  >
                    <Layers size={18} />
                  </span>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === team._id ? null : team._id)}
                      className="text-text-faint hover:text-text p-1"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {menuOpenId === team._id && (
                      <div className="absolute right-0 mt-1 w-44 bg-[#0d1120] border border-border-strong rounded-lg shadow-xl z-20 py-1.5">
                        <button
                          onClick={() => {
                            setManageTeam(team);
                            setMenuOpenId(null);
                          }}
                          className="w-full text-left px-3.5 py-2 text-[13px] text-text hover:bg-white/[0.05] flex items-center gap-2"
                        >
                          <UserPlus size={14} /> Manage Members
                        </button>
                        {isOwner && (
                          <button
                            onClick={() => {
                              setMenuOpenId(null);
                              handleDelete(team._id);
                            }}
                            className="w-full text-left px-3.5 py-2 text-[13px] text-red-300 hover:bg-white/[0.05] flex items-center gap-2"
                          >
                            <Trash2 size={14} /> Delete Team
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button className="text-left" onClick={() => navigate(`/dashboard/boards?teamId=${team._id}`)}>
                  <h3 className="text-[15.5px] font-semibold text-white mb-1">{team.name}</h3>
                  <p className="text-[13px] text-text-dim line-clamp-2 min-h-[2.5em]">
                    {team.description || 'No description yet.'}
                  </p>
                </button>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-[12.5px] text-text-dim">{team.boardCount ?? 0} Boards</span>
                  <div className="flex -space-x-2">
                    {(team.members || []).slice(0, 4).map((m) => (
                      <Avatar key={m._id} name={m.name} size="xs" className="ring-2 ring-[#12162a]" />
                    ))}
                    {(team.members?.length || 0) > 4 && (
                      <span className="w-6 h-6 rounded-full bg-white/10 text-[10px] flex items-center justify-center ring-2 ring-[#12162a] text-text-dim">
                        +{team.members.length - 4}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateTeamModal
          onClose={() => setShowCreate(false)}
          onCreated={(team) => {
            setTeams((list) => [team, ...list]);
            setShowCreate(false);
          }}
        />
      )}

      {manageTeam && (
        <ManageMembersModal
          team={manageTeam}
          currentUserId={user?._id}
          onClose={() => setManageTeam(null)}
          onUpdated={(updated) => {
            setTeams((list) => list.map((t) => (t._id === updated._id ? { ...t, ...updated } : t)));
            setManageTeam(updated);
          }}
        />
      )}
    </div>
  );
}

function CreateTeamModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState(COLOR_OPTIONS[1]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Team name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const team = await createTeam({ name, description, color });
      onCreated({ ...team, boardCount: 0 });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Create Team" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-banner">{error}</div>}
        <div className="field">
          <label>Team Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Design Squad" />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea
            className="input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What does this team work on?"
          />
        </div>
        <div className="field">
          <label>Color</label>
          <div className="flex gap-2">
            {COLOR_OPTIONS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => setColor(c)}
                className="w-7 h-7 rounded-full flex-shrink-0"
                style={{ background: c, outline: color === c ? '2px solid white' : 'none', outlineOffset: 2 }}
              />
            ))}
          </div>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating…' : 'Create Team'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function ManageMembersModal({ team, currentUserId, onClose, onUpdated }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const isOwner = team.owner?._id === currentUserId;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const updated = await addMember(team._id, email.trim());
      onUpdated(updated);
      setEmail('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (userId) => {
    try {
      const updated = await removeMember(team._id, userId);
      onUpdated(updated);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Modal title={`Members · ${team.name}`} onClose={onClose}>
      {error && <div className="error-banner">{error}</div>}

      {isOwner && (
        <form onSubmit={handleAdd} className="flex gap-2 mb-4">
          <input
            className="input"
            type="email"
            placeholder="Invite by email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <button className="btn-primary flex-shrink-0" disabled={loading}>
            <UserPlus size={15} />
          </button>
        </form>
      )}

      <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
        {(team.members || []).map((m) => (
          <div key={m._id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/[0.03]">
            <Avatar name={m.name} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="text-[13px] text-text truncate">{m.name}</p>
              <p className="text-[11.5px] text-text-faint truncate">{m.email}</p>
            </div>
            {m._id === team.owner?._id && (
              <span className="text-[10.5px] uppercase text-accent-2 font-semibold">Owner</span>
            )}
            {isOwner && m._id !== team.owner?._id && (
              <button onClick={() => handleRemove(m._id)} className="text-text-faint hover:text-red-300">
                <X size={15} />
              </button>
            )}
          </div>
        ))}
      </div>
    </Modal>
  );
}
