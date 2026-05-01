import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckSquare, Clock, AlertTriangle, ListTodo, TrendingUp, ArrowRight } from 'lucide-react';
import { taskAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import { format, isPast } from 'date-fns';

const StatusBadge = ({ status }) => {
  const map = {
    'Todo': 'badge-todo',
    'In Progress': 'badge-inprogress',
    'Done': 'badge-done',
  };
  return <span className={map[status] || 'badge-todo'}>{status}</span>;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    taskAPI.getStats()
      .then((res) => {
        setStats(res.data.stats);
        setRecentTasks(res.data.recentTasks);
      })
      .finally(() => setLoading(false));
  }, []);

  const statCards = [
    {
      label: 'Total Tasks',
      value: stats?.total ?? 0,
      icon: ListTodo,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10 border-blue-500/20',
    },
    {
      label: 'Completed',
      value: stats?.completed ?? 0,
      icon: CheckSquare,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'In Progress',
      value: stats?.inProgress ?? 0,
      icon: TrendingUp,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Overdue',
      value: stats?.overdue ?? 0,
      icon: AlertTriangle,
      color: 'text-red-400',
      bg: 'bg-red-500/10 border-red-500/20',
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const completionRate = stats?.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  return (
    <div className="animate-slide-up">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-slate-100">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
          <span className="text-brand-400">{user?.name?.split(' ')[0]}</span> 👋
        </h1>
        <p className="text-slate-500 mt-1">Here's what's happening with your tasks today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`card p-5 border ${bg}`}>
            <div className="flex items-start justify-between mb-3">
              <Icon size={18} className={color} />
            </div>
            <p className="text-3xl font-semibold text-slate-100">{value}</p>
            <p className="text-slate-500 text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Completion progress */}
      <div className="card p-6 mb-8">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="font-medium text-slate-200">Overall Completion</h2>
            <p className="text-slate-500 text-sm mt-0.5">{stats?.completed} of {stats?.total} tasks done</p>
          </div>
          <span className="text-2xl font-semibold text-slate-100">{completionRate}%</span>
        </div>
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-brand-600 to-brand-400 rounded-full transition-all duration-700"
            style={{ width: `${completionRate}%` }}
          />
        </div>
      </div>

      {/* Recent tasks */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-medium text-slate-200">Recent Tasks</h2>
          <Link to="/tasks" className="text-brand-400 text-sm hover:text-brand-300 flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {recentTasks.length === 0 ? (
          <div className="text-center py-10">
            <ListTodo size={32} className="mx-auto text-slate-700 mb-3" />
            <p className="text-slate-500">No tasks yet. Create one to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {recentTasks.map((task) => {
              const isOverdue = task.dueDate && isPast(new Date(task.dueDate)) && task.status !== 'Done';
              return (
                <div
                  key={task._id}
                  className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/40 hover:bg-slate-800/70 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-200 truncate">{task.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">{task.projectId?.name}</span>
                      {task.dueDate && (
                        <>
                          <span className="text-slate-700">·</span>
                          <span className={`flex items-center gap-1 text-xs ${isOverdue ? 'text-red-400' : 'text-slate-500'}`}>
                            <Clock size={10} />
                            {format(new Date(task.dueDate), 'MMM d')}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <StatusBadge status={task.status} />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
