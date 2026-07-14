import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Boxes, MoreVertical, Archive, Trash2, User, Users, Building2 } from 'lucide-react';
import { getWorkspaces, createWorkspace, archiveWorkspace, deleteWorkspace } from '../api/workspaces';
import { usePageHeader } from '../components/layout/AppLayout';
import { Spinner, EmptyState, Modal, RoleBadge } from '../components/common/Misc';
import { WORKSPACE_TYPES } from '../utils/constants';

const TYPE_ICON = { Personal: User, Team: Users, Organization: Building2 };

export default function WorkspacesPage() {
  usePageHeader('Workspaces', 'Personal, team, and organization workspaces you belong to.');
  const navigate = useNavigate();

  const [workspaces, setWorkspaces] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);

  const load = () => {
    setLoading(true);
    getWorkspaces()
      .then(setWorkspaces)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const filtered = workspaces.filter((w) => w.name.toLowerCase().includes(search.toLowerCase()));

  const handleArchive = async (id) => {
    if (!confirm('Archive this workspace? You can restore it later.')) return;
    try {
      await archiveWorkspace(id);
      setWorkspaces((list) => list.filter((w) => w._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Permanently delete this workspace? This cannot be undone.')) return;
    try {
      await deleteWorkspace(id);
      setWorkspaces((list) => list.filter((w) => w._id !== id));
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
            placeholder="Search workspaces…"
            className="input pl-9"
          />
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={16} /> Create Workspace
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading && <Spinner />}

      {!loading && filtered.length === 0 && (
        <EmptyState
          icon={Boxes}
          title="No workspaces yet"
          subtitle="Create a Personal, Team, or Organization workspace to start organizing teams and projects."
        />
      )}

      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.map((ws) => {
            const TypeIcon = TYPE_ICON[ws.type] || Boxes;
            return (
              <div key={ws._id} className="card p-5 flex flex-col gap-4 relative">
                <div className="flex items-start justify-between">
                  <span
                    className="w-10 h-10 rounded-[10px] flex items-center justify-center text-white"
                    style={{ background: ws.color || '#7c5cff' }}
                  >
                    <TypeIcon size={18} />
                  </span>
                  <div className="relative">
                    <button
                      onClick={() => setMenuOpenId(menuOpenId === ws._id ? null : ws._id)}
                      className="text-text-faint hover:text-text p-1"
                    >
                      <MoreVertical size={16} />
                    </button>
                    {menuOpenId === ws._id && (
                      <div className="absolute right-0 mt-1 w-44 bg-[#0d1120] border border-border-strong rounded-lg shadow-xl z-20 py-1.5">
                        {ws.myRole === 'Owner' && (
                          <>
                            <button
                              onClick={() => {
                                setMenuOpenId(null);
                                handleArchive(ws._id);
                              }}
                              className="w-full text-left px-3.5 py-2 text-[13px] text-text hover:bg-white/[0.05] flex items-center gap-2"
                            >
                              <Archive size={14} /> Archive
                            </button>
                            <button
                              onClick={() => {
                                setMenuOpenId(null);
                                handleDelete(ws._id);
                              }}
                              className="w-full text-left px-3.5 py-2 text-[13px] text-red-300 hover:bg-white/[0.05] flex items-center gap-2"
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button className="text-left" onClick={() => navigate(`/dashboard/workspaces/${ws._id}`)}>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-[15.5px] font-semibold text-white">{ws.name}</h3>
                    <span className="text-[10.5px] uppercase tracking-wide text-text-faint">{ws.type}</span>
                  </div>
                  <p className="text-[13px] text-text-dim line-clamp-2 min-h-[2.5em]">
                    {ws.description || 'No description yet.'}
                  </p>
                </button>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-[12.5px] text-text-dim">
                    {ws.teamCount ?? 0} Teams · {ws.members?.length ?? 0} Members
                  </span>
                  {ws.myRole && <RoleBadge role={ws.myRole} />}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateWorkspaceModal
          onClose={() => setShowCreate(false)}
          onCreated={(ws) => {
            setWorkspaces((list) => [{ ...ws, teamCount: 0, myRole: 'Owner' }, ...list]);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

function CreateWorkspaceModal({ onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Team');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Workspace name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const ws = await createWorkspace({ name, description, type });
      onCreated(ws);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Create Workspace" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-banner">{error}</div>}
        <div className="field">
          <label>Workspace Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Acme Inc." />
        </div>
        <div className="field">
          <label>Type</label>
          <div className="grid grid-cols-3 gap-2">
            {WORKSPACE_TYPES.map((t) => (
              <button
                type="button"
                key={t}
                onClick={() => setType(t)}
                className={`py-2.5 rounded-[10px] text-[12.5px] font-medium border ${
                  type === t ? 'border-accent-2 bg-accent/15 text-white' : 'border-border text-text-dim'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Description</label>
          <textarea
            className="input"
            rows={3}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What's this workspace for?"
          />
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Creating…' : 'Create Workspace'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
