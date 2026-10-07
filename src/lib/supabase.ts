import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Task = {
  id: string;
  title: string;
  deadline: string | null;
  completed: boolean;
  priority: 'low' | 'medium' | 'high';
  created_at: string;
};

export type TaskPriority = 'low' | 'medium' | 'high';

export type Course = {
  id: string;
  course_code: string;
  course_name: string;
  department: string;
  duration: string;
  num_semesters: number;
  created_at: string;
};

export type Subject = {
  id: string;
  subject_code: string;
  subject_name: string;
  course_id: string;
  semester: number;
  credits: number;
  faculty: string;
  created_at: string;
};

export type Gender = 'male' | 'female' | 'other';

export type Student = {
  id: string;
  student_id: string;
  enrollment_number: string;
  name: string;
  email: string;
  phone: string | null;
  date_of_birth: string | null;
  gender: Gender | null;
  address: string | null;
  course_id: string | null;
  semester: number;
  section: string | null;
  photo_url: string | null;
  created_at: string;
};

export type AttendanceStatus = 'present' | 'absent' | 'late';

export type Attendance = {
  id: string;
  student_id: string;
  subject_id: string;
  date: string;
  status: AttendanceStatus;
  created_at: string;
};

export type Marks = {
  id: string;
  student_id: string;
  subject_id: string;
  internal_marks: number;
  assignment_marks: number;
  exam_marks: number;
  created_at: string;
};

export type AssignmentStatus = 'pending' | 'submitted' | 'graded';

export type Assignment = {
  id: string;
  student_id: string;
  subject_id: string;
  title: string;
  due_date: string | null;
  status: AssignmentStatus;
  marks: number | null;
  max_marks: number;
  created_at: string;
};

export type StudentWithCourse = Student & {
  course?: Pick<Course, 'id' | 'course_code' | 'course_name'> | null;
};

export type SubjectWithCourse = Subject & {
  course?: Pick<Course, 'id' | 'course_code' | 'course_name'> | null;
};
