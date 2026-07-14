import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ChevronLeft, Plus, UserPlus, X, LogOut, Settings2 } from 'lucide-react';
import {
  getWorkspaceById,
  getWorkspaceTeams,
  createTeamInWorkspace,
  inviteWorkspaceMember,
  updateMemberRole,
  removeWorkspaceMember,
  leaveWorkspace,
  updateWorkspace,
} from '../api/workspaces';
import { usePageHeader } from '../components/layout/AppLayout';
import { Spinner, EmptyState, Modal, RoleBadge } from '../components/common/Misc';
import Avatar from '../components/common/Avatar';
import { useAuth } from '../context/AuthContext';
import { WORKSPACE_ROLES } from '../utils/constants';

const TABS = ['Teams', 'Members', 'Settings'];

export default function WorkspaceDetailPage() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [workspace, setWorkspace] = useState(null);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('Teams');
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  usePageHeader(workspace?.name || 'Workspace', workspace?.type);

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const [ws, teamList] = await Promise.all([getWorkspaceById(id), getWorkspaceTeams(id)]);
      setWorkspace(ws);
      setTeams(teamList);
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

  const canManage = workspace?.myRole === 'Owner' || workspace?.myRole === 'Admin';

  const handleRoleChange = async (userId, role) => {
    try {
      const updated = await updateMemberRole(id, userId, role);
      setWorkspace(updated);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleRemoveMember = async (userId) => {
    if (!confirm('Remove this member from the workspace?')) return;
    try {
      const updated = await removeWorkspaceMember(id, userId);
      setWorkspace(updated);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleLeave = async () => {
    if (!confirm('Leave this workspace?')) return;
    try {
      await leaveWorkspace(id);
      navigate('/dashboard/workspaces');
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) return <Spinner />;
  if (error && !workspace) return <div className="error-banner">{error}</div>;

  return (
    <div className="flex flex-col gap-6">
      <button
        onClick={() => navigate('/dashboard/workspaces')}
        className="flex items-center gap-1 text-[13px] text-text-dim hover:text-text w-fit"
      >
        <ChevronLeft size={15} /> Workspaces
      </button>

      {error && <div className="error-banner">{error}</div>}

      <div className="flex items-center gap-3">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-[10px] text-[13.5px] font-medium ${
              tab === t ? 'bg-accent/15 text-white' : 'text-text-dim hover:bg-white/[0.04]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Teams' && (
        <div className="flex flex-col gap-5">
          <div className="flex justify-end">
            <button onClick={() => setShowCreateTeam(true)} className="btn-primary">
              <Plus size={16} /> Create Team
            </button>
          </div>

          {teams.length === 0 ? (
            <EmptyState title="No teams in this workspace yet" subtitle="Create a team to start adding projects and boards." />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {teams.map((team) => (
                <button
                  key={team._id}
                  onClick={() => navigate(`/dashboard/projects?teamId=${team._id}`)}
                  className="card p-5 text-left flex flex-col gap-3"
                >
                  <span
                    className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white text-sm font-semibold"
                    style={{ background: team.color || '#2563eb' }}
                  >
                    {team.name[0]}
                  </span>
                  <div>
                    <h3 className="text-[14.5px] font-semibold text-white mb-1">{team.name}</h3>
                    <p className="text-[12.5px] text-text-dim line-clamp-2">{team.description || 'No description'}</p>
                  </div>
                  <span className="text-[11.5px] text-text-faint">{team.members?.length ?? 0} members</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'Members' && (
        <div className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold text-white">Members</h3>
            <div className="flex items-center gap-2">
              {workspace.myRole !== 'Owner' && (
                <button onClick={handleLeave} className="btn !text-red-300">
                  <LogOut size={14} /> Leave
                </button>
              )}
              {canManage && (
                <button onClick={() => setShowInvite(true)} className="btn-primary">
                  <UserPlus size={15} /> Invite
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2">
            {(workspace.members || []).map((m) => (
              <div key={m.user._id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-white/[0.03]">
                <Avatar name={m.user.name} avatarUrl={m.user._id === user?._id ? user.avatar : undefined} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-text truncate">{m.user.name}</p>
                  <p className="text-[11.5px] text-text-faint truncate">{m.user.email}</p>
                </div>
                {canManage && m.role !== 'Owner' ? (
                  <select
                    value={m.role}
                    onChange={(e) => handleRoleChange(m.user._id, e.target.value)}
                    className="input !py-1.5 !w-auto text-[12px]"
                  >
                    {WORKSPACE_ROLES.filter((r) => r !== 'Owner').map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                ) : (
                  <RoleBadge role={m.role} />
                )}
                {canManage && m.role !== 'Owner' && (
                  <button onClick={() => handleRemoveMember(m.user._id)} className="text-text-faint hover:text-red-300">
                    <X size={15} />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'Settings' && (
        <WorkspaceSettingsTab workspace={workspace} canManage={canManage} onUpdated={setWorkspace} />
      )}

      {showCreateTeam && (
        <CreateTeamModal
          workspaceId={id}
          onClose={() => setShowCreateTeam(false)}
          onCreated={(team) => {
            setTeams((list) => [team, ...list]);
            setShowCreateTeam(false);
          }}
        />
      )}

      {showInvite && (
        <InviteMemberModal
          workspaceId={id}
          onClose={() => setShowInvite(false)}
          onInvited={(ws) => {
            setWorkspace(ws);
            setShowInvite(false);
          }}
        />
      )}
    </div>
  );
}

function CreateTeamModal({ workspaceId, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
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
      const team = await createTeamInWorkspace(workspaceId, { name, description });
      onCreated(team);
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
          <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
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

function InviteMemberModal({ workspaceId, onClose, onInvited }) {
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('Member');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    try {
      const ws = await inviteWorkspaceMember(workspaceId, email.trim(), role);
      onInvited(ws);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Invite Member" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-banner">{error}</div>}
        <div className="field">
          <label>Email</label>
          <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="teammate@company.com" />
        </div>
        <div className="field">
          <label>Role</label>
          <select className="input" value={role} onChange={(e) => setRole(e.target.value)}>
            {WORKSPACE_ROLES.filter((r) => r !== 'Owner').map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        <div className="modal-actions">
          <button type="button" className="btn" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Inviting…' : 'Send Invite'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function WorkspaceSettingsTab({ workspace, canManage, onUpdated }) {
  const [name, setName] = useState(workspace.name);
  const [description, setDescription] = useState(workspace.description || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const updated = await updateWorkspace(workspace._id, { name, description });
      onUpdated({ ...workspace, ...updated });
      setSuccess('Workspace updated');
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card p-6 max-w-xl">
      <h3 className="text-[15px] font-semibold text-white mb-4 flex items-center gap-2">
        <Settings2 size={16} /> Workspace Settings
      </h3>
      {error && <div className="error-banner">{error}</div>}
      {success && (
        <div className="px-3.5 py-2.5 rounded-[10px] bg-green-500/10 border border-green-500/30 text-green-300 text-[13.5px] mb-4">
          {success}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label>Name</label>
          <input className="input" value={name} disabled={!canManage} onChange={(e) => setName(e.target.value)} />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea className="input" rows={3} value={description} disabled={!canManage} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {canManage && (
          <button type="submit" className="btn-primary" disabled={saving}>
            {saving ? 'Saving…' : 'Save Changes'}
          </button>
        )}
        {!canManage && <p className="text-[12.5px] text-text-faint">Only an Admin or Owner can edit workspace settings.</p>}
      </form>

      <div className="mt-6 pt-5 border-t border-border">
        <p className="text-[12px] text-text-faint">
          Billing is on the <span className="text-text-dim">{workspace.billing?.plan || 'Free'}</span> plan. Real payment
          processing isn't wired up yet — that would need a provider like Stripe plus API keys, which is out of scope here.
        </p>
      </div>
    </div>
  );
}
