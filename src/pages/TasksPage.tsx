import { useEffect, useState, useCallback } from 'react';
import { supabase, type Task, type TaskPriority } from '@/lib/supabase';
import { Card, Button, Badge } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { LoadingState, EmptyState, ErrorBanner, SuccessBanner } from '@/components/Feedback';
import {
  Plus,
  Check,
  Trash2,
  Calendar,
  Flag,
  Circle,
  Clock,
  AlertCircle,
  Search,
  X,
  CheckSquare,
} from 'lucide-react';

type SortMode = 'deadline' | 'priority' | 'created';
type StatusFilter = 'all' | 'pending' | 'completed';
type PriorityFilter = 'all' | TaskPriority;

const priorityConfig: Record<
  TaskPriority,
  { label: string; badge: 'red' | 'amber' | 'sky'; accent: string; dot: string; weight: number; activeFilter: string }
> = {
  high: { label: 'High', badge: 'red', accent: 'border-l-red-500', dot: 'bg-red-500', weight: 0, activeFilter: 'bg-red-600 text-white border-red-600' },
  medium: { label: 'Medium', badge: 'amber', accent: 'border-l-amber-500', dot: 'bg-amber-500', weight: 1, activeFilter: 'bg-amber-500 text-white border-amber-500' },
  low: { label: 'Low', badge: 'sky', accent: 'border-l-sky-500', dot: 'bg-sky-500', weight: 2, activeFilter: 'bg-sky-500 text-white border-sky-500' },
};

function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'No deadline';
  const date = new Date(dateStr + 'T00:00:00');
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDeadlineStatus(dateStr: string | null): { label: string; className: string; icon: typeof Clock } {
  if (!dateStr) return { label: '', className: '', icon: Clock };
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(dateStr + 'T00:00:00');
  const days = Math.round((deadline.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (days < 0) return { label: `${Math.abs(days)}d overdue`, className: 'text-red-600', icon: AlertCircle };
  if (days === 0) return { label: 'Due today', className: 'text-red-600', icon: Clock };
  if (days === 1) return { label: 'Due tomorrow', className: 'text-amber-600', icon: Clock };
  if (days <= 3) return { label: `${days}d left`, className: 'text-amber-600', icon: Clock };
  return { label: `${days}d left`, className: 'text-slate-500', icon: Calendar };
}

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('deadline');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [priorityFilter, setPriorityFilter] = useState<PriorityFilter>('all');

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase.from('tasks').select('*').order('created_at', { ascending: false });
    if (err) setError(err.message);
    else setTasks((data as Task[]) ?? []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('tasks').insert({ title: title.trim(), deadline: deadline || null, priority })
      .select().single();
    if (err) { setError(err.message); } else if (data) {
      setTasks((prev) => [data as Task, ...prev]);
      setTitle(''); setDeadline(''); setPriority('medium'); setShowForm(false);
      setSuccess('Task added successfully');
    }
    setSubmitting(false);
  };

  const handleToggle = async (task: Task) => {
    const { error: err } = await supabase.from('tasks').update({ completed: !task.completed }).eq('id', task.id);
    if (err) { setError(err.message); } else { setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, completed: !t.completed } : t))); }
  };

  const handleDelete = async (id: string) => {
    const { error: err } = await supabase.from('tasks').delete().eq('id', id);
    if (err) { setError(err.message); } else { setTasks((prev) => prev.filter((t) => t.id !== id)); setSuccess('Task deleted'); }
  };

  const applyFilters = (list: Task[]): Task[] => {
    let r = list;
    if (searchQuery.trim()) r = r.filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
    if (priorityFilter !== 'all') r = r.filter((t) => t.priority === priorityFilter);
    return r;
  };

  const sortTasks = (list: Task[]): Task[] => [...list].sort((a, b) => {
    if (sortMode === 'deadline') {
      if (!a.deadline && !b.deadline) return 0;
      if (!a.deadline) return 1; if (!b.deadline) return -1;
      return a.deadline.localeCompare(b.deadline);
    }
    if (sortMode === 'priority') return priorityConfig[a.priority].weight - priorityConfig[b.priority].weight;
    return b.created_at.localeCompare(a.created_at);
  });

  const pendingRaw = tasks.filter((t) => !t.completed);
  const completedRaw = tasks.filter((t) => t.completed);
  const pendingTasks = statusFilter === 'completed' ? [] : sortTasks(applyFilters(pendingRaw));
  const completedTasks = statusFilter === 'pending' ? [] : sortTasks(applyFilters(completedRaw));
  const totalFiltered = pendingTasks.length + completedTasks.length;
  const hasActiveFilters = searchQuery.trim() !== '' || priorityFilter !== 'all' || statusFilter !== 'all';
  const clearFilters = () => { setSearchQuery(''); setPriorityFilter('all'); setStatusFilter('all'); };

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      {success && <SuccessBanner message={success} onDismiss={() => setSuccess(null)} />}

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <span className="font-semibold text-slate-700">{tasks.length}</span> tasks total
          <span className="text-slate-300">·</span>
          <span className="font-semibold text-emerald-600">{completedRaw.length}</span> completed
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>New Task</Button>
      </div>

      {/* Add Task Modal */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add a new task" size="md">
        <form onSubmit={handleAddTask} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Task name</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Finish calculus homework" autoFocus className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Deadline</label>
              <input type="date" value={deadline} onChange={(e) => setDeadline(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Priority</label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => (
                  <button key={p} type="button" onClick={() => setPriority(p)} className={`flex-1 px-3 py-2.5 rounded-xl text-sm font-medium border transition-all ${priority === p ? priorityConfig[p].activeFilter : 'border-slate-200 text-slate-500 hover:border-slate-300 bg-white'}`}>
                    {priorityConfig[p].label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-1">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" disabled={!title.trim()} loading={submitting}>Add Task</Button>
          </div>
        </form>
      </Modal>

      {/* Filter Bar */}
      {tasks.length > 0 && (
        <Card className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search tasks by name..." className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition-all" />
            {searchQuery && <button onClick={() => setSearchQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"><X className="w-4 h-4" /></button>}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide mr-1">Status</span>
            {([['all', 'All', tasks.length], ['pending', 'Pending', pendingRaw.length], ['completed', 'Completed', completedRaw.length]] as [StatusFilter, string, number][]).map(([mode, label, count]) => (
              <button key={mode} onClick={() => setStatusFilter(mode)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${statusFilter === mode ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                {label}<span className={`text-xs ${statusFilter === mode ? 'text-slate-300' : 'text-slate-400'}`}>{count}</span>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide mr-1">Priority</span>
            <button onClick={() => setPriorityFilter('all')} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${priorityFilter === 'all' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>All</button>
            {(['high', 'medium', 'low'] as TaskPriority[]).map((p) => (
              <button key={p} onClick={() => setPriorityFilter(p)} className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${priorityFilter === p ? priorityConfig[p].activeFilter : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'}`}>
                <span className={`w-2 h-2 rounded-full ${priorityFilter === p ? 'bg-white' : priorityConfig[p].dot}`} />{priorityConfig[p].label}
              </button>
            ))}
          </div>
          <div className="flex items-center justify-between gap-3 flex-wrap pt-1 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Sort</span>
              {([['deadline', 'Deadline'], ['priority', 'Priority'], ['created', 'Newest']] as [SortMode, string][]).map(([mode, label]) => (
                <button key={mode} onClick={() => setSortMode(mode)} className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${sortMode === mode ? 'bg-slate-700 text-white border-slate-700' : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'}`}>{label}</button>
              ))}
            </div>
            {hasActiveFilters && <button onClick={clearFilters} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"><X className="w-3.5 h-3.5" />Clear filters</button>}
          </div>
        </Card>
      )}

      {loading && <LoadingState label="Loading tasks..." />}

      {!loading && tasks.length === 0 && (
        <EmptyState icon={CheckSquare} title="No tasks yet" description="Stay on top of your work. Add your first task to get started." action={<Button icon={<Plus className="w-4 h-4" />} onClick={() => setShowForm(true)}>Add your first task</Button>} />
      )}

      {!loading && tasks.length > 0 && totalFiltered === 0 && (
        <EmptyState icon={Search} title="No matching tasks" description={searchQuery ? `No tasks match "${searchQuery}"` : 'No tasks match the selected filters.'} action={<button onClick={clearFilters} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium transition-all"><X className="w-4 h-4" />Clear filters</button>} />
      )}

      {!loading && pendingTasks.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-amber-400" />Pending<span className="text-slate-400 normal-case font-normal">({pendingTasks.length})</span>
          </h2>
          <div className="space-y-2.5">
            {pendingTasks.map((task) => <TaskCard key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />)}
          </div>
        </section>
      )}

      {!loading && completedTasks.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-slate-500 uppercase tracking-wide flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />Completed<span className="text-slate-400 normal-case font-normal">({completedTasks.length})</span>
          </h2>
          <div className="space-y-2.5">
            {completedTasks.map((task) => <TaskCard key={task.id} task={task} onToggle={handleToggle} onDelete={handleDelete} />)}
          </div>
        </section>
      )}
    </div>
  );
}

function TaskCard({ task, onToggle, onDelete }: { task: Task; onToggle: (t: Task) => void; onDelete: (id: string) => void }) {
  const prio = priorityConfig[task.priority];
  const ds = getDeadlineStatus(task.deadline);
  const DIcon = ds.icon;
  return (
    <div className={`group flex items-center gap-3 sm:gap-4 p-4 rounded-xl border bg-white border-l-4 transition-all hover:shadow-md ${task.completed ? `border-slate-100 ${prio.accent} bg-slate-50/50` : `border-slate-200 ${prio.accent} hover:border-slate-300`}`}>
      <button onClick={() => onToggle(task)} className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all active:scale-90 ${task.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300 hover:border-emerald-400 hover:bg-emerald-50'}`} aria-label={task.completed ? 'Mark as pending' : 'Mark as completed'}>
        {task.completed && <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />}
      </button>
      <div className="flex-1 min-w-0">
        <p className={`text-sm sm:text-base font-medium truncate ${task.completed ? 'text-slate-400 line-through' : 'text-slate-900'}`}>{task.title}</p>
        <div className="flex items-center gap-2 sm:gap-3 mt-1 flex-wrap">
          <Badge variant={prio.badge}><Flag className="w-3 h-3" />{prio.label}</Badge>
          {task.deadline ? (
            <span className={`inline-flex items-center gap-1 text-xs font-medium ${task.completed ? 'text-slate-400' : ds.className}`}>
              <DIcon className="w-3.5 h-3.5" />{formatDate(task.deadline)}
              {!task.completed && ds.label && <span className="hidden sm:inline">· {ds.label}</span>}
            </span>
          ) : !task.completed ? (
            <span className="inline-flex items-center gap-1 text-xs text-slate-400"><Calendar className="w-3.5 h-3.5" />No deadline</span>
          ) : null}
        </div>
      </div>
      <button onClick={() => onDelete(task.id)} className="flex-shrink-0 w-9 h-9 rounded-lg flex items-center justify-center text-slate-300 hover:text-red-600 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 sm:opacity-0" aria-label="Delete task">
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
