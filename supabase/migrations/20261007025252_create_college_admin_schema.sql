/*
# College Administration Schema

Creates the full database structure for a college administration app:
courses, subjects, students, attendance, marks, and assignments.

## 1. New Tables

### courses
- `id` (uuid, PK)
- `course_code` (text, unique) — short code like "BCA"
- `course_name` (text) — full name
- `department` (text) — e.g. "Computer Science"
- `duration` (text) — e.g. "3 Years"
- `num_semesters` (int) — total number of semesters
- `created_at` (timestamptz)

### subjects
- `id` (uuid, PK)
- `subject_code` (text, unique) — e.g. "CS101"
- `subject_name` (text)
- `course_id` (uuid, FK → courses.id ON DELETE CASCADE)
- `semester` (int) — which semester (1–8)
- `credits` (int) — credit hours
- `faculty` (text) — faculty member name
- `created_at` (timestamptz)

### students
- `id` (uuid, PK)
- `student_id` (text, unique) — e.g. "STU001"
- `enrollment_number` (text, unique)
- `name` (text)
- `email` (text)
- `phone` (text)
- `date_of_birth` (date)
- `gender` (text) — 'male', 'female', 'other'
- `address` (text)
- `course_id` (uuid, FK → courses.id ON DELETE SET NULL)
- `semester` (int) — current semester
- `section` (text) — e.g. "A"
- `photo_url` (text, nullable)
- `created_at` (timestamptz)

### attendance
- `id` (uuid, PK)
- `student_id` (uuid, FK → students.id ON DELETE CASCADE)
- `subject_id` (uuid, FK → subjects.id ON DELETE CASCADE)
- `date` (date)
- `status` (text) — 'present', 'absent', 'late'
- `created_at` (timestamptz)

### marks
- `id` (uuid, PK)
- `student_id` (uuid, FK → students.id ON DELETE CASCADE)
- `subject_id` (uuid, FK → subjects.id ON DELETE CASCADE)
- `internal_marks` (int, default 0) — out of 40
- `assignment_marks` (int, default 0) — out of 20
- `exam_marks` (int, default 0) — out of 40
- `created_at` (timestamptz)

### assignments
- `id` (uuid, PK)
- `student_id` (uuid, FK → students.id ON DELETE CASCADE)
- `subject_id` (uuid, FK → subjects.id ON DELETE CASCADE)
- `title` (text)
- `due_date` (date, nullable)
- `status` (text) — 'pending', 'submitted', 'graded'
- `marks` (int, nullable) — grade received
- `max_marks` (int, default 100)
- `created_at` (timestamptz)

## 2. Security
All tables have RLS enabled with anon + authenticated full CRUD (single-tenant, no auth).

## 3. Indexes
- subjects.course_id for filtering by course
- students.course_id for filtering by course
- attendance.student_id and attendance.subject_id
- marks.student_id and marks.subject_id
- assignments.student_id

## 4. Seed Data
Includes 3 courses, 8 subjects, 4 sample students, attendance, marks, and assignments.
*/

-- COURSES
CREATE TABLE IF NOT EXISTS courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_code text UNIQUE NOT NULL,
  course_name text NOT NULL,
  department text NOT NULL,
  duration text NOT NULL,
  num_semesters int NOT NULL DEFAULT 8,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_courses_sel" ON courses;
CREATE POLICY "anon_crud_courses_sel" ON courses FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_courses_ins" ON courses;
CREATE POLICY "anon_crud_courses_ins" ON courses FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_courses_upd" ON courses;
CREATE POLICY "anon_crud_courses_upd" ON courses FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_courses_del" ON courses;
CREATE POLICY "anon_crud_courses_del" ON courses FOR DELETE TO anon, authenticated USING (true);

-- SUBJECTS
CREATE TABLE IF NOT EXISTS subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_code text UNIQUE NOT NULL,
  subject_name text NOT NULL,
  course_id uuid REFERENCES courses(id) ON DELETE CASCADE,
  semester int NOT NULL,
  credits int NOT NULL DEFAULT 3,
  faculty text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_subjects_sel" ON subjects;
CREATE POLICY "anon_crud_subjects_sel" ON subjects FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_subjects_ins" ON subjects;
CREATE POLICY "anon_crud_subjects_ins" ON subjects FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_subjects_upd" ON subjects;
CREATE POLICY "anon_crud_subjects_upd" ON subjects FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_subjects_del" ON subjects;
CREATE POLICY "anon_crud_subjects_del" ON subjects FOR DELETE TO anon, authenticated USING (true);

-- STUDENTS
CREATE TABLE IF NOT EXISTS students (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text UNIQUE NOT NULL,
  enrollment_number text UNIQUE NOT NULL,
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  date_of_birth date,
  gender text DEFAULT 'other',
  address text,
  course_id uuid REFERENCES courses(id) ON DELETE SET NULL,
  semester int DEFAULT 1,
  section text DEFAULT 'A',
  photo_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_students_sel" ON students;
CREATE POLICY "anon_crud_students_sel" ON students FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_students_ins" ON students;
CREATE POLICY "anon_crud_students_ins" ON students FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_students_upd" ON students;
CREATE POLICY "anon_crud_students_upd" ON students FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_students_del" ON students;
CREATE POLICY "anon_crud_students_del" ON students FOR DELETE TO anon, authenticated USING (true);

-- ATTENDANCE
CREATE TABLE IF NOT EXISTS attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  status text NOT NULL DEFAULT 'present' CHECK (status IN ('present', 'absent', 'late')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_attendance_sel" ON attendance;
CREATE POLICY "anon_crud_attendance_sel" ON attendance FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_attendance_ins" ON attendance;
CREATE POLICY "anon_crud_attendance_ins" ON attendance FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_attendance_upd" ON attendance;
CREATE POLICY "anon_crud_attendance_upd" ON attendance FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_attendance_del" ON attendance;
CREATE POLICY "anon_crud_attendance_del" ON attendance FOR DELETE TO anon, authenticated USING (true);

-- MARKS
CREATE TABLE IF NOT EXISTS marks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  internal_marks int NOT NULL DEFAULT 0,
  assignment_marks int NOT NULL DEFAULT 0,
  exam_marks int NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, subject_id)
);
ALTER TABLE marks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_marks_sel" ON marks;
CREATE POLICY "anon_crud_marks_sel" ON marks FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_marks_ins" ON marks;
CREATE POLICY "anon_crud_marks_ins" ON marks FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_marks_upd" ON marks;
CREATE POLICY "anon_crud_marks_upd" ON marks FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_marks_del" ON marks;
CREATE POLICY "anon_crud_marks_del" ON marks FOR DELETE TO anon, authenticated USING (true);

-- ASSIGNMENTS
CREATE TABLE IF NOT EXISTS assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES subjects(id) ON DELETE CASCADE,
  title text NOT NULL,
  due_date date,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'submitted', 'graded')),
  marks int,
  max_marks int NOT NULL DEFAULT 100,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_crud_assignments_sel" ON assignments;
CREATE POLICY "anon_crud_assignments_sel" ON assignments FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "anon_crud_assignments_ins" ON assignments;
CREATE POLICY "anon_crud_assignments_ins" ON assignments FOR INSERT TO anon, authenticated WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_assignments_upd" ON assignments;
CREATE POLICY "anon_crud_assignments_upd" ON assignments FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "anon_crud_assignments_del" ON assignments;
CREATE POLICY "anon_crud_assignments_del" ON assignments FOR DELETE TO anon, authenticated USING (true);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_subjects_course_id ON subjects(course_id);
CREATE INDEX IF NOT EXISTS idx_students_course_id ON students(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_attendance_subject_id ON attendance(subject_id);
CREATE INDEX IF NOT EXISTS idx_marks_student_id ON marks(student_id);
CREATE INDEX IF NOT EXISTS idx_marks_subject_id ON marks(subject_id);
CREATE INDEX IF NOT EXISTS idx_assignments_student_id ON assignments(student_id);

-- SEED: Courses
INSERT INTO courses (course_code, course_name, department, duration, num_semesters) VALUES
  ('BCA', 'Bachelor of Computer Applications', 'Computer Science', '3 Years', 6),
  ('BBA', 'Bachelor of Business Administration', 'Business Management', '3 Years', 6),
  ('MCA', 'Master of Computer Applications', 'Computer Science', '2 Years', 4)
ON CONFLICT (course_code) DO NOTHING;

-- SEED: Subjects (using subqueries to get course IDs)
INSERT INTO subjects (subject_code, subject_name, course_id, semester, credits, faculty)
SELECT 'CS101', 'Programming Fundamentals', c.id, 1, 4, 'Dr. Rajesh Kumar' FROM courses c WHERE c.course_code = 'BCA'
ON CONFLICT (subject_code) DO NOTHING;

INSERT INTO subjects (subject_code, subject_name, course_id, semester, credits, faculty)
SELECT 'CS102', 'Database Management Systems', c.id, 2, 4, 'Prof. Anita Sharma' FROM courses c WHERE c.course_code = 'BCA'
ON CONFLICT (subject_code) DO NOTHING;

INSERT INTO subjects (subject_code, subject_name, course_id, semester, credits, faculty)
SELECT 'CS103', 'Web Technologies', c.id, 3, 3, 'Dr. Vikram Singh' FROM courses c WHERE c.course_code = 'BCA'
ON CONFLICT (subject_code) DO NOTHING;

INSERT INTO subjects (subject_code, subject_name, course_id, semester, credits, faculty)
SELECT 'CS104', 'Data Structures & Algorithms', c.id, 3, 4, 'Dr. Rajesh Kumar' FROM courses c WHERE c.course_code = 'BCA'
ON CONFLICT (subject_code) DO NOTHING;

INSERT INTO subjects (subject_code, subject_name, course_id, semester, credits, faculty)
SELECT 'MG101', 'Principles of Management', c.id, 1, 3, 'Prof. Meena Iyer' FROM courses c WHERE c.course_code = 'BBA'
ON CONFLICT (subject_code) DO NOTHING;

INSERT INTO subjects (subject_code, subject_name, course_id, semester, credits, faculty)
SELECT 'MG102', 'Financial Accounting', c.id, 2, 4, 'Dr. Suresh Nair' FROM courses c WHERE c.course_code = 'BBA'
ON CONFLICT (subject_code) DO NOTHING;

INSERT INTO subjects (subject_code, subject_name, course_id, semester, credits, faculty)
SELECT 'MC101', 'Advanced Algorithms', c.id, 1, 4, 'Dr. Rajesh Kumar' FROM courses c WHERE c.course_code = 'MCA'
ON CONFLICT (subject_code) DO NOTHING;

INSERT INTO subjects (subject_code, subject_name, course_id, semester, credits, faculty)
SELECT 'MC102', 'Software Engineering', c.id, 1, 3, 'Prof. Anita Sharma' FROM courses c WHERE c.course_code = 'MCA'
ON CONFLICT (subject_code) DO NOTHING;

-- SEED: Students
INSERT INTO students (student_id, enrollment_number, name, email, phone, date_of_birth, gender, address, course_id, semester, section, photo_url)
SELECT 'STU001', 'BCA2023001', 'Aarav Patel', 'aarav.patel@college.edu', '+91 98765 43210', '2004-05-15', 'male', '12 MG Road, Bangalore, KA', c.id, 3, 'A', 'https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=200'
FROM courses c WHERE c.course_code = 'BCA'
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO students (student_id, enrollment_number, name, email, phone, date_of_birth, gender, address, course_id, semester, section, photo_url)
SELECT 'STU002', 'BBA2023007', 'Priya Reddy', 'priya.reddy@college.edu', '+91 98123 45678', '2004-08-22', 'female', '45 Park Street, Kolkata, WB', c.id, 2, 'B', 'https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=200'
FROM courses c WHERE c.course_code = 'BBA'
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO students (student_id, enrollment_number, name, email, phone, date_of_birth, gender, address, course_id, semester, section, photo_url)
SELECT 'STU003', 'MCA2023015', 'Arjun Nair', 'arjun.nair@college.edu', '+91 99887 76655', '2002-03-10', 'male', '78 Civil Lines, Delhi, DL', c.id, 1, 'A', 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=200'
FROM courses c WHERE c.course_code = 'MCA'
ON CONFLICT (student_id) DO NOTHING;

INSERT INTO students (student_id, enrollment_number, name, email, phone, date_of_birth, gender, address, course_id, semester, section)
SELECT 'STU004', 'BCA2023019', 'Sneha Gupta', 'sneha.gupta@college.edu', '+91 90011 22334', '2004-11-30', 'female', '23 Marine Drive, Mumbai, MH', c.id, 3, 'A'
FROM courses c WHERE c.course_code = 'BCA'
ON CONFLICT (student_id) DO NOTHING;

-- SEED: Attendance for STU001 (BCA sem 3 - subjects CS103, CS104)
INSERT INTO attendance (student_id, subject_id, date, status)
SELECT s.id, sub.id, '2026-09-01', 'present' FROM students s, subjects sub WHERE s.student_id = 'STU001' AND sub.subject_code = 'CS103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status)
SELECT s.id, sub.id, '2026-09-02', 'present' FROM students s, subjects sub WHERE s.student_id = 'STU001' AND sub.subject_code = 'CS103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status)
SELECT s.id, sub.id, '2026-09-03', 'absent' FROM students s, subjects sub WHERE s.student_id = 'STU001' AND sub.subject_code = 'CS103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status)
SELECT s.id, sub.id, '2026-09-04', 'present' FROM students s, subjects sub WHERE s.student_id = 'STU001' AND sub.subject_code = 'CS103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status)
SELECT s.id, sub.id, '2026-09-05', 'late' FROM students s, subjects sub WHERE s.student_id = 'STU001' AND sub.subject_code = 'CS103'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status)
SELECT s.id, sub.id, '2026-09-01', 'present' FROM students s, subjects sub WHERE s.student_id = 'STU001' AND sub.subject_code = 'CS104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status)
SELECT s.id, sub.id, '2026-09-02', 'present' FROM students s, subjects sub WHERE s.student_id = 'STU001' AND sub.subject_code = 'CS104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status)
SELECT s.id, sub.id, '2026-09-03', 'present' FROM students s, subjects sub WHERE s.student_id = 'STU001' AND sub.subject_code = 'CS104'
ON CONFLICT DO NOTHING;
INSERT INTO attendance (student_id, subject_id, date, status)
SELECT s.id, sub.id, '2026-09-04', 'present' FROM students s, subjects sub WHERE s.student_id = 'STU001' AND sub.subject_code = 'CS104'
ON CONFLICT DO NOTHING;

-- SEED: Marks for STU001
INSERT INTO marks (student_id, subject_id, internal_marks, assignment_marks, exam_marks)
SELECT s.id, sub.id, 32, 18, 36 FROM students s, subjects sub WHERE s.student_id = 'STU001' AND sub.subject_code = 'CS103'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO marks (student_id, subject_id, internal_marks, assignment_marks, exam_marks)
SELECT s.id, sub.id, 35, 19, 38 FROM students s, subjects sub WHERE s.student_id = 'STU001' AND sub.subject_code = 'CS104'
ON CONFLICT (student_id, subject_id) DO NOTHING;

-- SEED: Marks for STU004
INSERT INTO marks (student_id, subject_id, internal_marks, assignment_marks, exam_marks)
SELECT s.id, sub.id, 28, 15, 30 FROM students s, subjects sub WHERE s.student_id = 'STU004' AND sub.subject_code = 'CS103'
ON CONFLICT (student_id, subject_id) DO NOTHING;
INSERT INTO marks (student_id, subject_id, internal_marks, assignment_marks, exam_marks)
SELECT s.id, sub.id, 30, 17, 33 FROM students s, subjects sub WHERE s.student_id = 'STU004' AND sub.subject_code = 'CS104'
ON CONFLICT (student_id, subject_id) DO NOTHING;

-- SEED: Assignments for STU001
INSERT INTO assignments (student_id, subject_id, title, due_date, status, marks, max_marks)
SELECT s.id, sub.id, 'HTML/CSS Portfolio Project', '2026-09-20', 'submitted', NULL, 100 FROM students s, subjects sub WHERE s.student_id = 'STU001' AND sub.subject_code = 'CS103'
ON CONFLICT DO NOTHING;
INSERT INTO assignments (student_id, subject_id, title, due_date, status, marks, max_marks)
SELECT s.id, sub.id, 'Binary Tree Implementation', '2026-09-25', 'graded', 92, 100 FROM students s, subjects sub WHERE s.student_id = 'STU001' AND sub.subject_code = 'CS104'
ON CONFLICT DO NOTHING;
INSERT INTO assignments (student_id, subject_id, title, due_date, status, marks, max_marks)
SELECT s.id, sub.id, 'JavaScript DOM Manipulation', '2026-10-10', 'pending', NULL, 50 FROM students s, subjects sub WHERE s.student_id = 'STU001' AND sub.subject_code = 'CS103'
ON CONFLICT DO NOTHING;

-- SEED: Assignments for STU004
INSERT INTO assignments (student_id, subject_id, title, due_date, status, marks, max_marks)
SELECT s.id, sub.id, 'Responsive Layout Exercise', '2026-09-20', 'graded', 88, 100 FROM students s, subjects sub WHERE s.student_id = 'STU004' AND sub.subject_code = 'CS103'
ON CONFLICT DO NOTHING;
