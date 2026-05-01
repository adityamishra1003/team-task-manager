import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, FolderKanban, Users, Trash2, ArrowRight, X } from 'lucide-react';
import { projectAPI, authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

export default function ProjectsPage() {
  const { isAdmin } = useAuth();
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ name: '', description: '', members: [] });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProjects();
    if (isAdmin) authAPI.getAllUsers().then((r) => setUsers(r.data.users));
  }, [isAdmin]);

  const fetchProjects = () => {
    setLoading(true);
    projectAPI.getAll()
      .then((r) => setProjects(r.data.projects))
      .finally(() => setLoading(false));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const { data } = await projectAPI.create(form);
      setProjects([data.project, ...projects]);
      setShowModal(false);
      setForm({ name: '', description: '', members: [] });
      toast.success('Project created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create project');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Delete "${name}" and all its tasks? This cannot be undone.`)) return;
    try {
      await projectAPI.delete(id);
      setProjects(projects.filter((p) => p._id !== id));
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const toggleMember = (userId) => {
    setForm((f) => ({
      ...f,
      members: f.members.includes(userId)
        ? f.members.filter((id) => id !== userId)
        : [...f.members, userId],
    }));
  };

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">Projects</h1>
          <p className="text-slate-500 mt-1">{projects.length} project{projects.length !== 1 ? 's' : ''} total</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus size={16} />
            New Project
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : projects.length === 0 ? (
        <div className="card p-12 text-center">
          <FolderKanban size={40} className="mx-auto text-slate-700 mb-3" />
          <p className="text-slate-400 font-medium">No projects yet</p>
          <p className="text-slate-600 text-sm mt-1">
            {isAdmin ? 'Create your first project to get started.' : 'You haven\'t been added to any projects.'}
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {projects.map((project) => (
            <div key={project._id} className="card p-5 group hover:border-slate-700/80 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 bg-brand-600/20 rounded-xl flex items-center justify-center">
                  <FolderKanban size={18} className="text-brand-400" />
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDelete(project._id, project.name)}
                    className="opacity-0 group-hover:opacity-100 p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>

              <h3 className="font-semibold text-slate-100 mb-1">{project.name}</h3>
              {project.description && (
                <p className="text-slate-500 text-sm mb-3 line-clamp-2">{project.description}</p>
              )}

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800/60">
                <div className="flex items-center gap-1.5 text-slate-500 text-xs">
                  <Users size={12} />
                  <span>{project.members?.length || 0} member{project.members?.length !== 1 ? 's' : ''}</span>
                </div>
                <Link
                  to={`/projects/${project._id}`}
                  className="flex items-center gap-1 text-brand-400 text-xs hover:text-brand-300 font-medium"
                >
                  View tasks <ArrowRight size={12} />
                </Link>
              </div>

              {/* Member avatars */}
              {project.members?.length > 0 && (
                <div className="flex -space-x-1.5 mt-3">
                  {project.members.slice(0, 5).map((m) => (
                    <div
                      key={m._id}
                      title={m.name}
                      className="w-6 h-6 rounded-full bg-brand-600/30 border border-slate-900 flex items-center justify-center text-[10px] font-medium text-brand-300"
                    >
                      {m.name?.[0]?.toUpperCase()}
                    </div>
                  ))}
                  {project.members.length > 5 && (
                    <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-900 flex items-center justify-center text-[9px] text-slate-400">
                      +{project.members.length - 5}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Project Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card p-6 w-full max-w-md animate-slide-up border-slate-700">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-100">Create Project</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="label">Project Name *</label>
                <input
                  className="input"
                  placeholder="e.g. Website Redesign"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="label">Description</label>
                <textarea
                  className="input resize-none h-20"
                  placeholder="Brief description..."
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <div>
                <label className="label">Add Members</label>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {users.map((u) => (
                    <label
                      key={u._id}
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-800/50 cursor-pointer hover:bg-slate-800"
                    >
                      <input
                        type="checkbox"
                        checked={form.members.includes(u._id)}
                        onChange={() => toggleMember(u._id)}
                        className="accent-brand-500"
                      />
                      <div className="w-6 h-6 rounded-full bg-brand-600/30 flex items-center justify-center text-[10px] font-medium text-brand-300">
                        {u.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm text-slate-200">{u.name}</p>
                        <p className="text-xs text-slate-500 capitalize">{u.role}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                  {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
