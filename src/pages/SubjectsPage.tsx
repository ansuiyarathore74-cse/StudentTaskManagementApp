import { useEffect, useState } from 'react';
import { supabase, type SubjectWithCourse, type Course } from '@/lib/supabase';
import { Card, Button, Badge } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LoadingState, EmptyState, ErrorBanner, SuccessBanner } from '@/components/Feedback';
import { Plus, Search, Pencil, Trash2, BookOpen, User } from 'lucide-react';

type FormState = {
  id?: string;
  subject_code: string;
  subject_name: string;
  course_id: string;
  semester: string;
  credits: string;
  faculty: string;
};

const emptyForm: FormState = {
  subject_code: '',
  subject_name: '',
  course_id: '',
  semester: '1',
  credits: '3',
  faculty: '',
};

export function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectWithCourse[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [courseFilter, setCourseFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchSubjects = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('subjects')
      .select('*, course:courses(id, course_code, course_name)')
      .order('subject_name');
    if (err) {
      setError(err.message);
    } else {
      setSubjects((data as SubjectWithCourse[]) ?? []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchSubjects();
    supabase.from('courses').select('*').order('course_name').then(({ data }) => {
      setCourses((data as Course[]) ?? []);
    });
  }, []);

  const filtered = subjects.filter((s) => {
    const q = search.toLowerCase();
    const matchesSearch =
      s.subject_name.toLowerCase().includes(q) ||
      s.subject_code.toLowerCase().includes(q) ||
      s.faculty.toLowerCase().includes(q);
    const matchesCourse = courseFilter === 'all' || s.course_id === courseFilter;
    return matchesSearch && matchesCourse;
  });

  const openAdd = () => {
    setForm({ ...emptyForm, course_id: courses[0]?.id ?? '' });
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (s: SubjectWithCourse) => {
    setForm({
      id: s.id,
      subject_code: s.subject_code,
      subject_name: s.subject_name,
      course_id: s.course_id,
      semester: String(s.semester),
      credits: String(s.credits),
      faculty: s.faculty,
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.subject_code.trim() || !form.subject_name.trim() || !form.course_id) {
      setFormError('Subject Code, Subject Name, and Course are required');
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload = {
      subject_code: form.subject_code.trim(),
      subject_name: form.subject_name.trim(),
      course_id: form.course_id,
      semester: parseInt(form.semester) || 1,
      credits: parseInt(form.credits) || 3,
      faculty: form.faculty.trim() || 'TBD',
    };

    if (form.id) {
      const { error: err } = await supabase.from('subjects').update(payload).eq('id', form.id);
      if (err) { setFormError(err.message); setSaving(false); return; }
      setSuccess('Subject updated successfully');
    } else {
      const { error: err } = await supabase.from('subjects').insert(payload);
      if (err) { setFormError(err.message); setSaving(false); return; }
      setSuccess('Subject added successfully');
    }
    setSaving(false);
    setShowForm(false);
    fetchSubjects();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error: err } = await supabase.from('subjects').delete().eq('id', deleteId);
    setDeleting(false);
    if (err) { setError(err.message); } else { setSuccess('Subject deleted successfully'); fetchSubjects(); }
    setDeleteId(null);
  };

  const selectedCourse = courses.find((c) => c.id === form.course_id);
  const maxSem = selectedCourse?.num_semesters ?? 12;

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      {success && <SuccessBanner message={success} onDismiss={() => setSuccess(null)} />}

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex flex-1 gap-2 max-w-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search subjects..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all whitespace-nowrap"
          >
            <option value="all">All Courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.course_code}</option>
            ))}
          </select>
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openAdd}>
          Add Subject
        </Button>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingState label="Loading subjects..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={BookOpen}
            title={search || courseFilter !== 'all' ? 'No matching subjects' : 'No subjects yet'}
            description={search || courseFilter !== 'all' ? 'Try a different search or filter.' : 'Add your first subject to get started.'}
            action={
              !search && courseFilter === 'all' && (
                <Button icon={<Plus className="w-4 h-4" />} onClick={openAdd}>Add Subject</Button>
              )
            }
          />
        ) : (
          <>
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Code</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Subject Name</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Course</th>
                    <th className="text-center text-xs font-semibold text-slate-500 uppercase px-4 py-3">Sem</th>
                    <th className="text-center text-xs font-semibold text-slate-500 uppercase px-4 py-3">Credits</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Faculty</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-4 py-3"><span className="text-sm font-mono text-slate-700">{s.subject_code}</span></td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{s.subject_name}</td>
                      <td className="px-4 py-3">{s.course ? <Badge variant="blue">{s.course.course_code}</Badge> : <span className="text-sm text-slate-400">—</span>}</td>
                      <td className="px-4 py-3 text-sm text-center text-slate-600">{s.semester}</td>
                      <td className="px-4 py-3 text-sm text-center"><Badge variant="amber">{s.credits}</Badge></td>
                      <td className="px-4 py-3 text-sm text-slate-600">{s.faculty}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(s)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(s.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Delete">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="md:hidden divide-y divide-slate-50">
              {filtered.map((s) => (
                <div key={s.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{s.subject_name}</p>
                      <p className="text-xs text-slate-400 font-mono">{s.subject_code}</p>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button onClick={() => openEdit(s)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(s.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {s.course && <Badge variant="blue">{s.course.course_code}</Badge>}
                    <Badge variant="amber">{s.credits} credits</Badge>
                    <span className="text-xs text-slate-400">Sem {s.semester}</span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1">
                    <User className="w-3 h-3" /> {s.faculty}
                  </p>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={form.id ? 'Edit Subject' : 'Add Subject'}>
        <form onSubmit={handleSave} className="space-y-4">
          {formError && <ErrorBanner message={formError} onDismiss={() => setFormError(null)} />}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject Code *</label>
              <input value={form.subject_code} onChange={(e) => setForm({ ...form, subject_code: e.target.value })} placeholder="CS101" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Credits</label>
              <input type="number" min="1" max="10" value={form.credits} onChange={(e) => setForm({ ...form, credits: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Subject Name *</label>
              <input value={form.subject_name} onChange={(e) => setForm({ ...form, subject_name: e.target.value })} placeholder="Database Management Systems" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Course *</label>
              <select value={form.course_id} onChange={(e) => setForm({ ...form, course_id: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                <option value="">Select course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.course_name} ({c.course_code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Semester</label>
              <select value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
                {Array.from({ length: maxSem }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={String(n)}>Semester {n}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Faculty</label>
              <input value={form.faculty} onChange={(e) => setForm({ ...form, faculty: e.target.value })} placeholder="Dr. Rajesh Kumar" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{form.id ? 'Save Changes' : 'Add Subject'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Subject"
        message="Are you sure you want to delete this subject? This will also remove related attendance and marks records. This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}
