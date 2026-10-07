import { useEffect, useState } from 'react';
import { supabase, type StudentWithCourse } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { Card, Button, Badge } from '@/components/Button';
import { Input } from '@/components/Form';
import { Modal } from '@/components/Modal';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { LoadingState, EmptyState, ErrorBanner, SuccessBanner } from '@/components/Feedback';
import { getInitials } from '@/lib/utils';
import { Plus, Search, Eye, Pencil, Trash2, Users, X } from 'lucide-react';

type FormState = {
  id?: string;
  student_id: string;
  enrollment_number: string;
  name: string;
  email: string;
  phone: string;
  date_of_birth: string;
  gender: string;
  address: string;
  course_id: string;
  semester: string;
  section: string;
};

const emptyForm: FormState = {
  student_id: '',
  enrollment_number: '',
  name: '',
  email: '',
  phone: '',
  date_of_birth: '',
  gender: 'other',
  address: '',
  course_id: '',
  semester: '1',
  section: 'A',
};

export function StudentsPage() {
  const [students, setStudents] = useState<StudentWithCourse[]>([]);
  const [courses, setCourses] = useState<{ id: string; course_name: string; course_code: string }[]>([]);
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

  const fetchStudents = async () => {
    setLoading(true);
    setError(null);
    const { data, error: err } = await supabase
      .from('students')
      .select('*, course:courses(id, course_code, course_name)')
      .order('created_at', { ascending: false });
    if (err) setError(err.message);
    else setStudents((data as StudentWithCourse[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    fetchStudents();
    supabase.from('courses').select('id, course_name, course_code').then(({ data }) => {
      setCourses((data as { id: string; course_name: string; course_code: string }[]) ?? []);
    });
  }, []);

  const filtered = students.filter((s) => {
    const q = search.toLowerCase();
    return (
      s.name.toLowerCase().includes(q) ||
      s.student_id.toLowerCase().includes(q) ||
      s.enrollment_number.toLowerCase().includes(q) ||
      (s.email ?? '').toLowerCase().includes(q)
    );
  });

  const openAdd = () => {
    setForm(emptyForm);
    setFormError(null);
    setShowForm(true);
  };

  const openEdit = (s: StudentWithCourse) => {
    setForm({
      id: s.id,
      student_id: s.student_id,
      enrollment_number: s.enrollment_number,
      name: s.name,
      email: s.email,
      phone: s.phone ?? '',
      date_of_birth: s.date_of_birth ?? '',
      gender: s.gender ?? 'other',
      address: s.address ?? '',
      course_id: s.course_id ?? '',
      semester: String(s.semester),
      section: s.section ?? 'A',
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.student_id.trim() || !form.enrollment_number.trim()) {
      setFormError('Name, Student ID, and Enrollment Number are required');
      return;
    }

    setSaving(true);
    setFormError(null);
    const payload = {
      student_id: form.student_id.trim(),
      enrollment_number: form.enrollment_number.trim(),
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim() || null,
      date_of_birth: form.date_of_birth || null,
      gender: form.gender,
      address: form.address.trim() || null,
      course_id: form.course_id || null,
      semester: parseInt(form.semester) || 1,
      section: form.section.trim() || 'A',
    };

    if (form.id) {
      const { error: err } = await supabase.from('students').update(payload).eq('id', form.id);
      if (err) {
        setFormError(err.message);
        setSaving(false);
        return;
      }
      setSuccess('Student updated successfully');
    } else {
      const { error: err } = await supabase.from('students').insert(payload);
      if (err) {
        setFormError(err.message);
        setSaving(false);
        return;
      }
      setSuccess('Student added successfully');
    }

    setSaving(false);
    setShowForm(false);
    fetchStudents();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    const { error: err } = await supabase.from('students').delete().eq('id', deleteId);
    setDeleting(false);
    if (err) {
      setError(err.message);
    } else {
      setSuccess('Student deleted successfully');
      fetchStudents();
    }
    setDeleteId(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {error && <ErrorBanner message={error} onDismiss={() => setError(null)} />}
      {success && <SuccessBanner message={success} onDismiss={() => setSuccess(null)} />}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, ID, or enrollment..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-900 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
        </div>
        <Button icon={<Plus className="w-4 h-4" />} onClick={openAdd}>
          Add Student
        </Button>
      </div>

      {/* Table / List */}
      <Card className="overflow-hidden">
        {loading ? (
          <LoadingState label="Loading students..." />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={Users}
            title={search ? 'No matching students' : 'No students yet'}
            description={search ? 'Try a different search.' : 'Add your first student to get started.'}
            action={
              !search && (
                <Button icon={<Plus className="w-4 h-4" />} onClick={openAdd}>
                  Add Student
                </Button>
              )
            }
          />
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Student</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">ID</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Course</th>
                    <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Sem</th>
                    <th className="text-right text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filtered.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/50 transition-all">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 overflow-hidden">
                            {s.photo_url ? (
                              <img src={s.photo_url} alt={s.name} className="w-full h-full object-cover" />
                            ) : (
                              getInitials(s.name)
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-slate-900">{s.name}</p>
                            <p className="text-xs text-slate-400">{s.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-slate-700 font-mono">{s.student_id}</p>
                        <p className="text-xs text-slate-400 font-mono">{s.enrollment_number}</p>
                      </td>
                      <td className="px-4 py-3">
                        {s.course ? (
                          <Badge variant="blue">{s.course.course_code}</Badge>
                        ) : (
                          <span className="text-sm text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-slate-700">{s.semester}</span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate('student-profile', s.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-all"
                            title="View"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(s)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-all"
                            title="Edit"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteId(s.id)}
                            className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-slate-50">
              {filtered.map((s) => (
                <div key={s.id} className="p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-xs font-semibold text-slate-600 overflow-hidden flex-shrink-0">
                    {s.photo_url ? (
                      <img src={s.photo_url} alt={s.name} className="w-full h-full object-cover" />
                    ) : (
                      getInitials(s.name)
                    )}
                  </div>
                  <div className="flex-1 min-w-0" onClick={() => navigate('student-profile', s.id)}>
                    <p className="text-sm font-medium text-slate-900 truncate">{s.name}</p>
                    <p className="text-xs text-slate-400">{s.student_id} · {s.course?.course_code ?? 'No course'}</p>
                  </div>
                  <button
                    onClick={() => openEdit(s)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteId(s.id)}
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-600 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      {/* Add/Edit Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={form.id ? 'Edit Student' : 'Add Student'}
        size="lg"
      >
        <form onSubmit={handleSave} className="space-y-4">
          {formError && <ErrorBanner message={formError} onDismiss={() => setFormError(null)} />}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Student ID *" value={form.student_id} onChange={(e) => setForm({ ...form, student_id: e.target.value })} placeholder="STU001" />
            <Input label="Enrollment Number *" value={form.enrollment_number} onChange={(e) => setForm({ ...form, enrollment_number: e.target.value })} placeholder="BCA2023001" />
            <Input label="Full Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="John Doe" />
            <Input label="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="john@college.edu" />
            <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+91 98765 43210" />
            <Input label="Date of Birth" type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} />
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender</label>
              <select
                value={form.gender}
                onChange={(e) => setForm({ ...form, gender: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">Course</label>
              <select
                value={form.course_id}
                onChange={(e) => setForm({ ...form, course_id: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              >
                <option value="">Select course</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>{c.course_name} ({c.course_code})</option>
                ))}
              </select>
            </div>
            <Input label="Semester" type="number" min="1" max="12" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} />
            <Input label="Section" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} placeholder="A" />
          </div>
          <Input label="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} placeholder="123 Main Street, City" />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="ghost" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" loading={saving}>{form.id ? 'Save Changes' : 'Add Student'}</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!deleteId}
        title="Delete Student"
        message="Are you sure you want to delete this student? This will also remove all their attendance, marks, and assignment records. This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setDeleteId(null)}
        loading={deleting}
      />
    </div>
  );
}
