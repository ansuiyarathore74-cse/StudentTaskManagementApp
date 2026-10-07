import { useEffect, useState } from 'react';
import {
  supabase,
  type StudentWithCourse,
  type Subject,
  type Attendance,
  type Marks,
  type Assignment,
  type Gender,
} from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { Card, Button, Badge } from '@/components/Button';
import { Modal } from '@/components/Modal';
import { LoadingState, EmptyState, ErrorBanner, SuccessBanner } from '@/components/Feedback';
import { formatDate, getInitials, getGrade, getGradeColor, getAttendanceColor } from '@/lib/utils';
import {
  ArrowLeft,
  Pencil,
  Mail,
  Phone,
  Calendar,
  MapPin,
  User,
  GraduationCap,
  Hash,
  BookOpen,
  CheckCircle2,
  Clock,
  AlertCircle,
} from 'lucide-react';

type Tab = 'overview' | 'attendance' | 'marks' | 'subjects' | 'assignments';

type StudentData = {
  student: StudentWithCourse | null;
  subjects: Subject[];
  attendance: (Attendance & { subject?: Subject })[];
  marks: (Marks & { subject?: Subject })[];
  assignments: (Assignment & { subject?: Subject })[];
};

export function StudentProfilePage({ studentId }: { studentId: string }) {
  const [data, setData] = useState<StudentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('overview');
  const [showEdit, setShowEdit] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    const [studentRes, subjectsRes, attendanceRes, marksRes, assignmentsRes] = await Promise.all([
      supabase
        .from('students')
        .select('*, course:courses(id, course_code, course_name)')
        .eq('id', studentId)
        .maybeSingle(),
      supabase.from('subjects').select('*').order('subject_name'),
      supabase
        .from('attendance')
        .select('*, subject:subjects(*)')
        .eq('student_id', studentId)
        .order('date', { ascending: false }),
      supabase
        .from('marks')
        .select('*, subject:subjects(*)')
        .eq('student_id', studentId)
        .order('created_at', { ascending: false }),
      supabase
        .from('assignments')
        .select('*, subject:subjects(*)')
        .eq('student_id', studentId)
        .order('due_date', { ascending: true }),
    ]);

    if (studentRes.error) {
      setError(studentRes.error.message);
      setLoading(false);
      return;
    }

    setData({
      student: studentRes.data as StudentWithCourse,
      subjects: (subjectsRes.data as Subject[]) ?? [],
      attendance: (attendanceRes.data as (Attendance & { subject?: Subject })[]) ?? [],
      marks: (marksRes.data as (Marks & { subject?: Subject })[]) ?? [],
      assignments: (assignmentsRes.data as (Assignment & { subject?: Subject })[]) ?? [],
    });
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, [studentId]);

  if (loading) return <LoadingState label="Loading student profile..." />;

  if (error) return <ErrorBanner message={error} />;

  const student = data?.student;
  if (!student) return <EmptyState title="Student not found" description="This student may have been deleted." />;

  const courseSubjects = data!.subjects.filter(
    (s) => s.course_id === student.course_id && s.semester === student.semester
  );

  // Attendance stats
  const totalAttendance = data!.attendance.length;
  const presentCount = data!.attendance.filter((a) => a.status === 'present').length;
  const attendanceRate = totalAttendance > 0 ? Math.round((presentCount / totalAttendance) * 100) : 0;

  // Marks stats
  const totalMarks = data!.marks.reduce(
    (sum, m) => sum + m.internal_marks + m.assignment_marks + m.exam_marks,
    0
  );
  const maxTotal = data!.marks.reduce((sum) => sum + 100, 0);
  const overallPct = maxTotal > 0 ? Math.round((totalMarks / maxTotal) * 100) : 0;
  const grade = getGrade(overallPct);

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'overview', label: 'Overview', icon: User },
    { id: 'attendance', label: 'Attendance', icon: Calendar },
    { id: 'marks', label: 'Marks', icon: GraduationCap },
    { id: 'subjects', label: 'Subjects', icon: BookOpen },
    { id: 'assignments', label: 'Assignments', icon: CheckCircle2 },
  ];

  const infoItems = [
    { icon: Hash, label: 'Student ID', value: student.student_id },
    { icon: Hash, label: 'Enrollment No.', value: student.enrollment_number },
    { icon: Mail, label: 'Email', value: student.email },
    { icon: Phone, label: 'Phone', value: student.phone ?? '—' },
    { icon: Calendar, label: 'Date of Birth', value: formatDate(student.date_of_birth) },
    { icon: User, label: 'Gender', value: student.gender ? student.gender.charAt(0).toUpperCase() + student.gender.slice(1) : '—' },
    { icon: MapPin, label: 'Address', value: student.address ?? '—' },
    { icon: GraduationCap, label: 'Course', value: student.course?.course_name ?? '—' },
    { icon: BookOpen, label: 'Semester', value: String(student.semester) },
    { icon: BookOpen, label: 'Section', value: student.section ?? '—' },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {success && <SuccessBanner message={success} onDismiss={() => setSuccess(null)} />}

      {/* Back Button */}
      <button
        onClick={() => navigate('students')}
        className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-700 transition-all"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Students
      </button>

      {/* Profile Header */}
      <Card className="overflow-hidden">
        <div className="h-24 bg-gradient-to-r from-blue-600 to-blue-800" />
        <div className="px-5 sm:px-6 pb-5">
          <div className="flex items-end justify-between flex-wrap gap-4 -mt-12">
            <div className="flex items-end gap-4">
              <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-md flex items-center justify-center overflow-hidden flex-shrink-0">
                {student.photo_url ? (
                  <img src={student.photo_url} alt={student.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-slate-100 flex items-center justify-center text-2xl font-bold text-slate-400">
                    {getInitials(student.name)}
                  </div>
                )}
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-bold text-slate-900">{student.name}</h2>
                <p className="text-sm text-slate-500">
                  {student.course?.course_name ?? 'No course'} · Semester {student.semester} · Section {student.section}
                </p>
              </div>
            </div>
            <Button variant="secondary" icon={<Pencil className="w-4 h-4" />} onClick={() => setShowEdit(true)}>
              Edit Profile
            </Button>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-px">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                active
                  ? 'text-blue-700 border-blue-600 bg-white'
                  : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-100/50'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <Card className="p-5 sm:p-6">
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* Academic Summary */}
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Academic Summary</h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <SummaryStat label="Attendance" value={`${attendanceRate}%`} className={getAttendanceColor(attendanceRate)} />
                <SummaryStat label="Overall %" value={`${overallPct}%`} className={getGradeColor(overallPct).split(' ')[0]} />
                <SummaryStat label="Grade" value={grade} className={getGradeColor(overallPct).split(' ')[0]} />
                <SummaryStat label="Subjects" value={String(courseSubjects.length)} className="text-blue-600" />
              </div>
            </div>

            {/* Student Information */}
            <div>
              <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-3">Student Information</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
                {infoItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="flex items-start gap-3 py-1">
                      <Icon className="w-4 h-4 text-slate-400 mt-0.5 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-slate-400">{item.label}</p>
                        <p className="text-sm font-medium text-slate-700 truncate">{item.value}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {tab === 'attendance' && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-900">{attendanceRate}%</span>
                <span className="text-sm text-slate-400">Overall</span>
              </div>
              <div className="flex gap-3 text-sm">
                <span className="text-emerald-600">{presentCount} present</span>
                <span className="text-red-600">{data!.attendance.filter((a) => a.status === 'absent').length} absent</span>
                <span className="text-amber-600">{data!.attendance.filter((a) => a.status === 'late').length} late</span>
              </div>
            </div>

            {data!.attendance.length === 0 ? (
              <EmptyState icon={Calendar} title="No attendance records" description="Attendance has not been recorded for this student yet." />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-100">
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2">Date</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2">Subject</th>
                      <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {data!.attendance.map((a) => (
                      <tr key={a.id} className="hover:bg-slate-50/50">
                        <td className="px-3 py-2.5 text-sm text-slate-700">{formatDate(a.date)}</td>
                        <td className="px-3 py-2.5 text-sm text-slate-700">{a.subject?.subject_name ?? '—'}</td>
                        <td className="px-3 py-2.5">
                          <Badge
                            variant={a.status === 'present' ? 'green' : a.status === 'absent' ? 'red' : 'amber'}
                          >
                            {a.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'marks' && (
          <div className="space-y-4">
            {data!.marks.length === 0 ? (
              <EmptyState icon={GraduationCap} title="No marks recorded" description="Marks have not been entered for this student yet." />
            ) : (
              <>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-2">
                  <SummaryStat label="Internal" value={`${data!.marks.reduce((s, m) => s + m.internal_marks, 0)}/${data!.marks.length * 40}`} className="text-blue-600" />
                  <SummaryStat label="Assignment" value={`${data!.marks.reduce((s, m) => s + m.assignment_marks, 0)}/${data!.marks.length * 20}`} className="text-amber-600" />
                  <SummaryStat label="Exam" value={`${data!.marks.reduce((s, m) => s + m.exam_marks, 0)}/${data!.marks.length * 40}`} className="text-emerald-600" />
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-slate-100">
                        <th className="text-left text-xs font-semibold text-slate-500 uppercase px-3 py-2">Subject</th>
                        <th className="text-center text-xs font-semibold text-slate-500 uppercase px-3 py-2">Internal /40</th>
                        <th className="text-center text-xs font-semibold text-slate-500 uppercase px-3 py-2">Assignment /20</th>
                        <th className="text-center text-xs font-semibold text-slate-500 uppercase px-3 py-2">Exam /40</th>
                        <th className="text-center text-xs font-semibold text-slate-500 uppercase px-3 py-2">Total /100</th>
                        <th className="text-center text-xs font-semibold text-slate-500 uppercase px-3 py-2">%</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {data!.marks.map((m) => {
                        const total = m.internal_marks + m.assignment_marks + m.exam_marks;
                        const pct = Math.round(total);
                        return (
                          <tr key={m.id} className="hover:bg-slate-50/50">
                            <td className="px-3 py-2.5 text-sm font-medium text-slate-700">{m.subject?.subject_name ?? '—'}</td>
                            <td className="px-3 py-2.5 text-sm text-center text-slate-600">{m.internal_marks}</td>
                            <td className="px-3 py-2.5 text-sm text-center text-slate-600">{m.assignment_marks}</td>
                            <td className="px-3 py-2.5 text-sm text-center text-slate-600">{m.exam_marks}</td>
                            <td className="px-3 py-2.5 text-sm text-center font-semibold text-slate-900">{total}</td>
                            <td className="px-3 py-2.5 text-center">
                              <span className={`text-sm font-semibold ${getGradeColor(pct).split(' ')[0]}`}>{pct}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                  <span className="text-sm font-semibold text-slate-700">Overall Percentage & Grade</span>
                  <div className="flex items-center gap-3">
                    <span className={`text-lg font-bold ${getGradeColor(overallPct).split(' ')[0]}`}>{overallPct}%</span>
                    <span className={`px-3 py-1 rounded-lg text-sm font-bold border ${getGradeColor(overallPct)}`}>{grade}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {tab === 'subjects' && (
          <div className="space-y-4">
            {courseSubjects.length === 0 ? (
              <EmptyState icon={BookOpen} title="No subjects" description="No subjects found for this student's course and semester." />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {courseSubjects.map((s) => (
                  <div key={s.id} className="p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{s.subject_name}</p>
                        <p className="text-xs text-slate-400 font-mono">{s.subject_code}</p>
                      </div>
                      <Badge variant="blue">{s.credits} credits</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Faculty: {s.faculty}</p>
                    <p className="text-xs text-slate-400">Semester {s.semester}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'assignments' && (
          <div className="space-y-3">
            {data!.assignments.length === 0 ? (
              <EmptyState icon={CheckCircle2} title="No assignments" description="No assignments have been assigned to this student yet." />
            ) : (
              data!.assignments.map((a) => {
                const statusConfig = {
                  pending: { variant: 'amber' as const, icon: Clock, label: 'Pending' },
                  submitted: { variant: 'blue' as const, icon: CheckCircle2, label: 'Submitted' },
                  graded: { variant: 'green' as const, icon: CheckCircle2, label: 'Graded' },
                };
                const cfg = statusConfig[a.status];
                const StatusIcon = cfg.icon;
                return (
                  <div key={a.id} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 hover:border-slate-300 transition-all">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{a.title}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {a.subject?.subject_name ?? '—'} · Due {formatDate(a.due_date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 ml-3">
                      {a.marks !== null && a.status === 'graded' && (
                        <span className="text-sm font-semibold text-slate-700">
                          {a.marks}/{a.max_marks}
                        </span>
                      )}
                      <Badge variant={cfg.variant}>
                        <StatusIcon className="w-3 h-3" />
                        {cfg.label}
                      </Badge>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}
      </Card>

      {/* Edit Profile Modal - Inline Edit */}
      {showEdit && (
        <EditProfileModal
          student={student}
          onClose={() => setShowEdit(false)}
          onSaved={() => {
            setShowEdit(false);
            setSuccess('Profile updated successfully');
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function SummaryStat({ label, value, className }: { label: string; value: string; className?: string }) {
  return (
    <div className="p-3 rounded-xl bg-slate-50 border border-slate-100">
      <p className="text-xs text-slate-400">{label}</p>
      <p className={`text-xl font-bold mt-0.5 ${className ?? 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

function EditProfileModal({
  student,
  onClose,
  onSaved,
}: {
  student: StudentWithCourse;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState({
    name: student.name,
    email: student.email,
    phone: student.phone ?? '',
    date_of_birth: student.date_of_birth ?? '',
    gender: student.gender ?? 'other',
    address: student.address ?? '',
    semester: String(student.semester),
    section: student.section ?? 'A',
  });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErr(null);
    const { error: updateErr } = await supabase
      .from('students')
      .update({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        date_of_birth: form.date_of_birth || null,
        gender: form.gender as Gender,
        address: form.address.trim() || null,
        semester: parseInt(form.semester) || 1,
        section: form.section.trim() || 'A',
      })
      .eq('id', student.id);

    setSaving(false);
    if (updateErr) {
      setErr(updateErr.message);
    } else {
      onSaved();
    }
  };

  return (
    <Modal open={true} onClose={onClose} title="Edit Profile" size="lg">
      <form onSubmit={handleSave} className="space-y-4">
        {err && <ErrorBanner message={err} onDismiss={() => setErr(null)} />}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Full Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Date of Birth</label>
            <input type="date" value={form.date_of_birth} onChange={(e) => setForm({ ...form, date_of_birth: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Gender</label>
            <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as Gender })} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all">
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Semester</label>
            <input type="number" min="1" max="12" value={form.semester} onChange={(e) => setForm({ ...form, semester: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Section</label>
            <input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1.5">Address</label>
          <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="w-full px-4 py-2.5 rounded-xl border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all" />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={saving}>Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
}
