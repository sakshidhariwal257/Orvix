import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Plus, MoreVertical, Copy, Archive, Trash2, FolderKanban } from 'lucide-react';
import { getTeamById } from '../api/teams';
import {
  getProjectsByTeam,
  createProject,
  archiveProject,
  deleteProject,
  duplicateProject,
} from '../api/projects';
import { usePageHeader } from '../components/layout/AppLayout';
import { Spinner, EmptyState, Modal, ProjectStatusBadge, PriorityBadge } from '../components/common/Misc';
import { PROJECT_STATUSES, TASK_PRIORITIES, PROJECT_VISIBILITY } from '../utils/constants';
import { formatDate } from '../utils/date';

export default function ProjectsPage() {
  const [searchParams] = useSearchParams();
  const teamId = searchParams.get('teamId');
  const navigate = useNavigate();

  const [team, setTeam] = useState(null);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [menuOpenId, setMenuOpenId] = useState(null);

  usePageHeader(team ? `${team.name} Projects` : 'Projects', 'Every project this team is running.');

  const load = async () => {
    if (!teamId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError('');
    try {
      const [t, projectList] = await Promise.all([getTeamById(teamId), getProjectsByTeam(teamId)]);
      setTeam(t);
      setProjects(projectList);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  if (!teamId) {
    return (
      <EmptyState
        icon={FolderKanban}
        title="Pick a team to see its projects"
        subtitle="Open a team from Workspaces or Teams, then choose Projects from there."
      />
    );
  }

  const handleArchive = async (id) => {
    try {
      await archiveProject(id);
      setProjects((list) => list.filter((p) => p._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this project? Boards under it are not deleted.')) return;
    try {
      await deleteProject(id);
      setProjects((list) => list.filter((p) => p._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDuplicate = async (id) => {
    try {
      const copy = await duplicateProject(id);
      setProjects((list) => [copy, ...list]);
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <Plus size={16} /> Create Project
        </button>
      </div>

      {error && <div className="error-banner">{error}</div>}
      {loading && <Spinner />}

      {!loading && projects.length === 0 && (
        <EmptyState icon={FolderKanban} title="No projects yet" subtitle="Create a project to start organizing boards under it." />
      )}

      {!loading && projects.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((p) => (
            <div key={p._id} className="card p-5 flex flex-col gap-3 relative">
              <div className="flex items-start justify-between">
                <ProjectStatusBadge status={p.status} />
                <div className="relative">
                  <button
                    onClick={() => setMenuOpenId(menuOpenId === p._id ? null : p._id)}
                    className="text-text-faint hover:text-text p-1"
                  >
                    <MoreVertical size={15} />
                  </button>
                  {menuOpenId === p._id && (
                    <div className="absolute right-0 mt-1 w-40 bg-[#0d1120] border border-border-strong rounded-lg shadow-xl z-20 py-1.5">
                      <button
                        onClick={() => { setMenuOpenId(null); handleDuplicate(p._id); }}
                        className="w-full text-left px-3.5 py-2 text-[13px] text-text hover:bg-white/[0.05] flex items-center gap-2"
                      >
                        <Copy size={14} /> Duplicate
                      </button>
                      <button
                        onClick={() => { setMenuOpenId(null); handleArchive(p._id); }}
                        className="w-full text-left px-3.5 py-2 text-[13px] text-text hover:bg-white/[0.05] flex items-center gap-2"
                      >
                        <Archive size={14} /> Archive
                      </button>
                      <button
                        onClick={() => { setMenuOpenId(null); handleDelete(p._id); }}
                        className="w-full text-left px-3.5 py-2 text-[13px] text-red-300 hover:bg-white/[0.05] flex items-center gap-2"
                      >
                        <Trash2 size={14} /> Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <button className="text-left" onClick={() => navigate(`/dashboard/boards?teamId=${teamId}&projectId=${p._id}`)}>
                <h3 className="text-[15px] font-semibold text-white mb-1">{p.name}</h3>
                <p className="text-[12.5px] text-text-dim line-clamp-2 min-h-[2.5em]">{p.description || 'No description'}</p>
              </button>

              <div className="flex items-center justify-between pt-2 border-t border-border">
                <PriorityBadge priority={p.priority} />
                <span className="text-[11.5px] text-text-faint">{p.dueDate ? formatDate(p.dueDate) : 'No due date'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <CreateProjectModal
          teamId={teamId}
          onClose={() => setShowCreate(false)}
          onCreated={(p) => {
            setProjects((list) => [p, ...list]);
            setShowCreate(false);
          }}
        />
      )}
    </div>
  );
}

function CreateProjectModal({ teamId, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('Planning');
  const [priority, setPriority] = useState('Medium');
  const [visibility, setVisibility] = useState('Team');
  const [dueDate, setDueDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Project name is required');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const project = await createProject({
        name,
        description,
        status,
        priority,
        visibility,
        dueDate: dueDate || null,
        teamId,
      });
      onCreated(project);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal title="Create Project" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        {error && <div className="error-banner">{error}</div>}
        <div className="field">
          <label>Project Name</label>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Website Redesign" />
        </div>
        <div className="field">
          <label>Description</label>
          <textarea className="input" rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="field">
            <label>Status</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              {PROJECT_STATUSES.map((s) => (
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
            <label>Visibility</label>
            <select className="input" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
              {PROJECT_VISIBILITY.map((v) => (
                <option key={v} value={v}>{v}</option>
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
            {loading ? 'Creating…' : 'Create Project'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
