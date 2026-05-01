import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Plus, X, Trash2, Pencil } from 'lucide-react';
import { projectAPI, taskAPI, authAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import { format, isPast } from 'date-fns';

const STATUS_OPTIONS = ['Todo', 'In Progress', 'Done'];
const PRIORITY_OPTIONS = ['Low', 'Medium', 'High'];

const StatusBadge = ({ status }) => {
  const map = { 'Todo': 'badge-todo', 'In Progress': 'badge-inprogress', 'Done': 'badge-done' };
  return <span className={map[status] || 'badge-todo'}>{status}</span>;
};

const PriorityBadge = ({ priority }) => {
  const map = { 'Low': 'badge-low', 'Medium': 'badge-medium', 'High': 'badge-high' };
  return <span className={map[priority] || 'badge-low'}>{priority}</span>;
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const { isAdmin, user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [form, setForm] = useState({ title: '', description: '', status: 'Todo', priority: 'Medium', dueDate: '', assignedTo: '' });
  const [submitting, setSubmitting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    Promise.all([
      projectAPI.getById(id),
      taskAPI.getAll({ projectId: id }),
      authAPI.getAllUsers(),
    ]).then(([p, t, u]) => {
      setProject(p.data.project);
      setTasks(t.data.tasks);
      setUsers(u.data.users);
    }).finally(() => setLoading(false));
  }, [id]);

  const openCreate = () => {
    setEditTask(null);
    setForm({ title: '', description: '', status: 'Todo', priority: 'Medium', dueDate: '', assignedTo: '' });
    setShowModal(true);
  };

  const openEdit = (task) => {
    setEditTask(task);
    setForm({
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate ? format(new Date(task.dueDate), 'yyyy-MM-dd') : '',
      assignedTo: task.assignedTo?._id || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { ...form, projectId: id, assignedTo: form.assignedTo || null, dueDate: form.dueDate || null };
      if (editTask) {
        const { data } = await taskAPI.update(editTask._id, payload);
        setTasks(tasks.map((t) => (t._id === editTask._id ? data.task : t)));
        toast.success('Task updated!');
      } else {
        const { data } = await taskAPI.create(payload);
        setTasks([data.task, ...tasks]);
        toast.success('Task created!');
      }
      setShowModal(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (taskId) => {
    if (!confirm('Delete this task?')) return;
    try {
      await taskAPI.delete(taskId);
      setTasks(tasks.filter((t) => t._id !== taskId));
      toast.success('Task deleted');
    } catch { toast.error('Failed to delete task'); }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const { data } = await taskAPI.update(taskId, { status: newStatus });
      setTasks(tasks.map((t) => (t._id === taskId ? data.task : t)));
    } catch { toast.error('Failed to update status'); }
  };

  const filteredTasks = statusFilter === 'All' ? tasks : tasks.filter((t) => t.status === statusFilter);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="mb-6">
        <Link to="/projects" className="inline-flex items-center gap-1.5 text-slate-500 hover:text-slate-300 text-sm mb-4">
          <ArrowLeft size={14} /> Projects
        </Link>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold text-slate-100">{project?.name}</h1>
            {project?.description && <p className="text-slate-500 mt-1">{project.description}</p>}
          </div>
          {isAdmin && (
            <button onClick={openCreate} className="btn-primary shrink-0">
              <Plus size={16} /> Add Task
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {['All', ...STATUS_OPTIONS].map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-sm px-3.5 py-1.5 rounded-xl transition-all duration-200 font-medium ${
              statusFilter === s
                ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                : 'bg-slate-800/60 text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
          >
            {s}
            <span className="ml-1.5 text-xs opacity-60">
              {s === 'All' ? tasks.length : tasks.filter((t) => t.status === s).length}
            </span>
          </button>
        ))}
      </div>

      {/* Task list */}
      {filteredTasks.length === 0 ? (
        <div className="card p-12 text-center">
          <p className="text-slate-500">No tasks {statusFilter !== 'All' ? `with status "${statusFilter}"` : 'yet'}.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTasks.map((task) => {
            const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'Done';
            const canEdit = isAdmin || task.assignedTo?._id === user?._id;
            return (
              <div key={task._id} className="card p-4 hover:border-slate-700/80 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-medium text-slate-100">{task.title}</h3>
                      <PriorityBadge priority={task.priority} />
                    </div>
                    {task.description && (
                      <p className="text-slate-500 text-sm mb-2">{task.description}</p>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                      {task.assignedTo && (
                        <span className="text-xs text-slate-500">
                          → {task.assignedTo.name}
                        </span>
                      )}
                      {task.dueDate && (
                        <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
                          {isOverdue ? '⚠ ' : ''}Due {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {/* Status dropdown */}
                    {canEdit && (
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task._id, e.target.value)}
                        className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2 py-1.5 text-slate-300 focus:outline-none focus:border-brand-500"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    )}
                    {!canEdit && <StatusBadge status={task.status} />}

                    {isAdmin && (
                      <>
                        <button onClick={() => openEdit(task)} className="p-1.5 text-slate-600 hover:text-brand-400 hover:bg-brand-500/10 rounded-lg transition-all">
                          <Pencil size={13} />
                        </button>
                        <button onClick={() => handleDelete(task._id)} className="p-1.5 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all">
                          <Trash2 size={13} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="card p-6 w-full max-w-lg animate-slide-up border-slate-700 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-semibold text-slate-100">{editTask ? 'Edit Task' : 'Create Task'}</h2>
              <button onClick={() => setShowModal(false)} className="text-slate-500 hover:text-slate-300">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Title *</label>
                <input className="input" placeholder="Task title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <label className="label">Description</label>
                <textarea className="input resize-none h-20" placeholder="Details..." value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Status</label>
                  <select className="input" value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                    {STATUS_OPTIONS.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Priority</label>
                  <select className="input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                    {PRIORITY_OPTIONS.map((p) => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="label">Due Date</label>
                <input type="date" className="input" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} />
              </div>
              <div>
                <label className="label">Assign To</label>
                <select className="input" value={form.assignedTo} onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}>
                  <option value="">Unassigned</option>
                  {users.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1 justify-center">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 justify-center">
                  {submitting ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : editTask ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
