import { useEffect, useState } from 'react';
import { type Page, parseHash, navigate } from '@/lib/router';
import { Layout } from '@/components/Layout';
import { DashboardPage } from '@/pages/DashboardPage';
import { StudentsPage } from '@/pages/StudentsPage';
import { StudentProfilePage } from '@/pages/StudentProfilePage';
import { CoursesPage } from '@/pages/CoursesPage';
import { SubjectsPage } from '@/pages/SubjectsPage';
import { TasksPage } from '@/pages/TasksPage';

function App() {
  const [route, setRoute] = useState(parseHash());

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const renderPage = () => {
    if (route.page === 'student-profile' && route.studentId) {
      return <StudentProfilePage studentId={route.studentId} />;
    }
    switch (route.page) {
      case 'dashboard': return <DashboardPage />;
      case 'students': return <StudentsPage />;
      case 'courses': return <CoursesPage />;
      case 'subjects': return <SubjectsPage />;
      case 'tasks': return <TasksPage />;
      default: return <DashboardPage />;
    }
  };

  const currentPage: Page = route.page === 'student-profile' ? 'students' : route.page;

  return (
    <Layout currentPage={currentPage}>
      {renderPage()}
    </Layout>
  );
}

export default App;
