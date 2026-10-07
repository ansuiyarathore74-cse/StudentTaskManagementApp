export type Page = 'dashboard' | 'students' | 'student-profile' | 'courses' | 'subjects' | 'tasks';

export type RouteState = {
  page: Page;
  studentId?: string;
};

export function parseHash(): RouteState {
  const hash = window.location.hash.replace(/^#\/?/, '');
  const parts = hash.split('/').filter(Boolean);

  if (parts.length === 0) return { page: 'dashboard' };

  if (parts[0] === 'students' && parts[1] === 'profile' && parts[2]) {
    return { page: 'student-profile', studentId: parts[2] };
  }

  const validPages: Page[] = ['dashboard', 'students', 'courses', 'subjects', 'tasks'];
  if (validPages.includes(parts[0] as Page)) {
    return { page: parts[0] as Page };
  }

  return { page: 'dashboard' };
}

export function navigate(page: Page, studentId?: string) {
  if (page === 'student-profile' && studentId) {
    window.location.hash = `/students/profile/${studentId}`;
  } else {
    window.location.hash = `/${page}`;
  }
}
