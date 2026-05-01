import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Clock, AlertTriangle, Filter } from 'lucide-react';
import { taskAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { format, isPast } from 'date-fns';

const STATUS_OPTIONS = ['All', 'Todo', 'In Progress', 'Done'];

const StatusBadge = ({ status }) => {
  const map = { 'Todo': 'badge-todo', 'In Progress': 'badge-inprogress', 'Done': 'badge-done' };
  return <span className={map[status] || 'badge-todo'}>{status}</span>;
};

const PriorityBadge = ({ priority }) => {
  const map = { 'Low': 'badge-low', 'Medium': 'badge-medium', 'High': 'badge-high' };
  return <span className={map[priority] || 'badge-low'}>{priority}</span>;
};

export default function TasksPage() {
  const { isAdmin } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('All');

  useEffect(() => {
    setLoading(true);
    const params = statusFilter !== 'All' ? { status: statusFilter } : {};
    taskAPI.getAll(params)
      .then((r) => setTasks(r.data.tasks))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      const { data } = await taskAPI.update(taskId, { status: newStatus });
      setTasks(tasks.map((t) => (t._id === taskId ? data.task : t)));
    } catch { /* silent */ }
  };

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-semibold text-slate-100">
            {isAdmin ? 'All Tasks' : 'My Tasks'}
          </h1>
          <p className="text-slate-500 mt-1">{tasks.length} task{tasks.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2 text-slate-500">
          <Filter size={14} />
          <span className="text-sm">Filter</span>
        </div>
      </div>

      {/* Status filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {STATUS_OPTIONS.map((s) => (
          <button
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`text-sm px-3.5 py-1.5 rounded-xl transition-all font-medium ${
              statusFilter === s
                ? 'bg-brand-600/20 text-brand-400 border border-brand-500/30'
                : 'bg-slate-800/60 text-slate-500 hover:text-slate-300 border border-transparent'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tasks.length === 0 ? (
        <div className="card p-12 text-center">
          <CheckSquare size={40} className="mx-auto text-slate-700 mb-3" />
          <p className="text-slate-400 font-medium">No tasks found</p>
          <p className="text-slate-600 text-sm mt-1">
            {statusFilter !== 'All'
              ? `No tasks with status "${statusFilter}"`
              : isAdmin
                ? 'Create tasks from within a project.'
                : 'No tasks have been assigned to you yet.'}
          </p>
          {isAdmin && (
            <Link to="/projects" className="mt-4 inline-block text-brand-400 text-sm hover:text-brand-300">
              Go to Projects →
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {tasks.map((task) => {
            const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'Done';
            return (
              <div
                key={task._id}
                className={`card p-4 hover:border-slate-700/80 transition-colors ${
                  isOverdue ? 'border-red-500/20' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  {/* Status toggle */}
                  <button
                    onClick={() => handleStatusChange(task._id,
                      task.status === 'Todo' ? 'In Progress' :
                      task.status === 'In Progress' ? 'Done' : 'Todo'
                    )}
                    className={`w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all ${
                      task.status === 'Done'
                        ? 'bg-emerald-500 border-emerald-500'
                        : task.status === 'In Progress'
                          ? 'border-amber-500 bg-amber-500/20'
                          : 'border-slate-600 hover:border-slate-400'
                    }`}
                  >
                    {task.status === 'Done' && (
                      <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                        <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm font-medium ${task.status === 'Done' ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {task.title}
                      </span>
                      <PriorityBadge priority={task.priority} />
                    </div>
                    <div className="flex items-center gap-3 mt-1 flex-wrap">
                      {task.projectId && (
                        <Link
                          to={`/projects/${task.projectId._id}`}
                          className="text-xs text-brand-400 hover:text-brand-300"
                        >
                          {task.projectId.name}
                        </Link>
                      )}
                      {task.assignedTo && (
                        <span className="text-xs text-slate-500">→ {task.assignedTo.name}</span>
                      )}
                      {task.dueDate && (
                        <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
                          {isOverdue ? <AlertTriangle size={10} /> : <Clock size={10} />}
                          {format(new Date(task.dueDate), 'MMM d, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Status badge */}
                  <StatusBadge status={task.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
