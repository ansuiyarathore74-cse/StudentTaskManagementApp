import { useEffect, useState } from 'react';
import { supabase, type Course } from '@/lib/supabase';
import { Card, Button, Badge } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LoadingState, EmptyState, ErrorBanner, SuccessBanner } from '@/components/Feedback';
import { Plus, Search, Pencil, Trash2, GraduationCap, BookOpen } from 'lucide-react';

type FormState = {
  id?: string;
  course_code: string;
  course_name: string;
  department: string;
  duration: string;
  num_semesters: string;
};

const emptyForm: FormState = {
  course_code: '',
  course_name: '',
  department: '',
  duration: '3 Years',
  num_semesters: '6',
};

export function CoursesPage() {
  const [courses, setCourses] = useState<(Course & { subject_count?: number })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchCourses = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('courses')
      .select('*, subjects(count)')
      .order('course_name');
    if (err) {
      setError(err.message);
    } else {
      setCourses(
        (data ?? []).map((c) => ({
          ...c,
          subject_count: (c.subjects as { count: number }[] | null)?.[0]?.count ?? 0,
        })) as (Course & { subject_count?: number })[]
      );
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const filtered = courses.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.course_name.toLowerCase().includes(q) ||
      c.course_code.toLowerCase().includes(q) ||
      c.department.toLowerCase().includes(q)
    );
  });

  const openAdd = () => {
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (c: Course) => {
    setForm({
      id: c.id,
      course_code: c.course_code,
      course_name: c.course_name,
      department: c.department,
      duration: c.duration,
      num_semesters: String(c.num_semesters),
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.course_code.trim() || !form.course_name.trim() || !form.department.trim()) {
      setFormError('Course Code, Course Name, and Department are required');
      return;
    }
    setSaving(true);
    setFormError(null);
    const payload = {
      course_code: form.course_code.trim(),
      course_name: form.course_name.trim(),
      department: form.department.trim(),
      duration: form.duration.trim(),
      num_semesters: parseInt(form.num_semesters) || 6,
    };

    if (form.id) {
      const { error: err } = await supabase.from('courses').update(payload).eq('id', form.id);
      if (err) {
        setFormError(err.message);
        setSaving(false);
        return;
      }
      setSuccess('Course updated successfully');
    } else {
      const { error: err } = await supabase.from('courses').insert(payload);
      if (err) {
        setFormError(err.message);
        setSaving(false);
        return;
      }
      setSuccess('Course added successfully');
    }
    setSaving(false);
    setShowForm(false);
    fetchCourses();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error: err } = await supabase.from('courses').delete().eq('id', deleteId);
    setDeleting(false);
    if (err) {
      setError(err.message);
    } else {
      setSuccess('Course deleted successfully');
      fetchCourses();
    }
    setDeleteId(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      {success && <SuccessBanner message={success} onDismiss={() => setSuccess(null)} />}

      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search courses..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openAdd}>
          Add Course
        </Button>
      </div>

      <Card className="overflow-hidden">
        {loading ? (
          <LoadingState label="Loading courses..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={GraduationCap}
            title={search ? 'No matching courses' : 'No courses yet'}
            description={search ? 'Try a different search.' : 'Add your first course to get started.'}
            action={
              !search && (
                <Button icon={<Plus className="w-4 h-4" />} onClick={openAdd}>Add Course</Button>
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
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Course Name</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Department</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase px-4 py-3">Duration</th>
                    <th className="text-center text-xs font-semibold text-slate-500 uppercase px-4 py-3">Sems</th>
                    <th className="text-center text-xs font-semibold text-slate-500 uppercase px-4 py-3">Subjects</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-4 py-3"><Badge variant="blue">{c.course_code}</Badge></td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">{c.course_name}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{c.department}</td>
                      <td className="px-4 py-3 text-sm text-slate-600">{c.duration}</td>
                      <td className="px-4 py-3 text-sm text-center text-slate-600">{c.num_semesters}</td>
                      <td className="px-4 py-3 text-sm text-center">
                        <span className="inline-flex items-center gap-1 text-slate-500">
                          <BookOpen className="w-3.5 h-3.5" />
                          {c.subject_count ?? 0}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(c)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all" title="Edit">
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button onClick={() => setDeleteId(c.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" title="Delete">
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
              {filtered.map((c) => (
                <div key={c.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <Badge variant="blue">{c.course_code}</Badge>
                      <p className="text-sm font-medium text-slate-900 mt-1.5">{c.course_name}</p>
                      <p className="text-xs text-slate-400">{c.department}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => openEdit(c)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteId(c.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">{c.duration} · {c.num_semesters} semesters · {c.subject_count ?? 0} subjects</p>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={form.id ? 'Edit Course' : 'Add Course'}>
        <form onSubmit={handleSave} className="space-y-4">
          {formError && <ErrorBanner message={formError} onDismiss={() => setFormError(null)} />}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Course Code *</label>
              <input value={form.course_code} onChange={(e) => setForm({ ...form, course_code: e.target.value })} placeholder="BCA" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Duration</label>
              <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="3 Years" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
            </div>
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Course Name *</label>
              <input value={form.course_name} onChange={(e) => setForm({ ...form, course_name: e.target.value })} placeholder="Bachelor of Computer Applications" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Department *</label>
              <input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} placeholder="Computer Science" className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Number of Semesters</label>
              <input type="number" min="1" max="12" value={form.num_semesters} onChange={(e) => setForm({ ...form, num_semesters: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{form.id ? 'Save Changes' : 'Add Course'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Course"
        message="Deleting this course will also delete all subjects assigned to it. Students enrolled in this course will be unenrolled. This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}
