import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { Card } from '@/components/Button';
import { LoadingState, EmptyState } from '@/components/Feedback';
import { Users, GraduationCap, BookOpen, CheckSquare, ArrowRight, TrendingUp } from 'lucide-react';

type Stats = {
  studentCount: number;
  courseCount: number;
  subjectCount: number;
  pendingTasks: number;
};

export function DashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentStudents, setRecentStudents] = useState<
    { id: string; name: string; student_id: string; course_name?: string }[]
  >([]);

  useEffect(() => {
    (async () => {
      const [students, courses, subjects, tasks, recent] = await Promise.all([
        supabase.from('students').select('id', { count: 'exact', head: true }),
        supabase.from('courses').select('id', { count: 'exact', head: true }),
        supabase.from('subjects').select('id', { count: 'exact', head: true }),
        supabase.from('tasks').select('id', { count: 'exact', head: true }).eq('completed', false),
        supabase
          .from('students')
          .select('id, name, student_id, course:courses(course_name)')
          .order('created_at', { ascending: false })
          .limit(5),
      ]);

      setStats({
        studentCount: students.count ?? 0,
        courseCount: courses.count ?? 0,
        subjectCount: subjects.count ?? 0,
        pendingTasks: tasks.count ?? 0,
      });
      setRecentStudents(
        (recent.data ?? []).map((s) => ({
          id: s.id,
          name: s.name,
          student_id: s.student_id,
          course_name: (s.course as { course_name?: string })?.course_name,
        }))
      );
      setLoading(false);
    })();
  }, []);

  if (loading) return <LoadingState label="Loading dashboard..." />;

  const cards = [
    {
      label: 'Students',
      value: stats?.studentCount ?? 0,
      icon: Users,
      color: 'from-blue-500 to-blue-700',
      page: 'students' as const,
    },
    {
      label: 'Courses',
      value: stats?.courseCount ?? 0,
      icon: GraduationCap,
      color: 'from-emerald-500 to-emerald-700',
      page: 'courses' as const,
    },
    {
      label: 'Subjects',
      value: stats?.subjectCount ?? 0,
      icon: BookOpen,
      color: 'from-amber-500 to-amber-700',
      page: 'subjects' as const,
    },
    {
      label: 'Pending Tasks',
      value: stats?.pendingTasks ?? 0,
      icon: CheckSquare,
      color: 'from-slate-600 to-slate-800',
      page: 'tasks' as const,
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg">
        <h2 className="text-2xl font-bold mb-1">Welcome back, Administrator</h2>
        <p className="text-blue-100 text-sm">
          Here's an overview of your college. Manage students, courses, and subjects all in one place.
        </p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <button
              key={card.label}
              onClick={() => navigate(card.page)}
              className="text-left group"
            >
              <Card className="p-5 group-hover:shadow-md transition-all">
                <div className="flex items-center justify-between mb-3">
                  <div
                    className={`w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shadow-sm`}
                  >
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-slate-500 group-hover:translate-x-0.5 transition-all" />
                </div>
                <p className="text-2xl font-bold text-slate-900">{card.value}</p>
                <p className="text-sm text-slate-500 mt-0.5">{card.label}</p>
              </Card>
            </button>
          );
        })}
      </div>

      {/* Recent Students */}
      <Card className="p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-slate-400" />
            Recent Students
          </h3>
          <button
            onClick={() => navigate('students')}
            className="text-sm font-medium text-blue-600 hover:text-blue-500 flex items-center gap-1"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentStudents.length === 0 ? (
          <EmptyState title="No students yet" description="Add students to see them here." />
        ) : (
          <div className="space-y-2">
            {recentStudents.map((student) => (
              <button
                key={student.id}
                onClick={() => navigate('student-profile', student.id)}
                className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-200 flex items-center justify-center text-sm font-semibold text-slate-600">
                    {student.name
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-900">{student.name}</p>
                    <p className="text-xs text-slate-400">{student.student_id}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {student.course_name && (
                    <span className="hidden sm:inline text-xs text-slate-400">
                      {student.course_name}
                    </span>
                  )}
                  <ArrowRight className="w-4 h-4 text-slate-300" />
                </div>
              </button>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
