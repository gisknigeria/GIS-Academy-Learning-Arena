import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleRoute } from "./components/RoleRoute";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { ArenaPage } from "./pages/ArenaPage";
import { AssessmentsPage } from "./pages/AssessmentsPage";
import { AssessmentBuilderPage } from "./pages/AssessmentBuilderPage";
import { AssessmentTakePage } from "./pages/AssessmentTakePage";
import { AssessmentResultPage } from "./pages/AssessmentResultPage";
import { AssessmentAttemptsPage } from "./pages/AssessmentAttemptsPage";
import { CertificatesPage } from "./pages/CertificatesPage";
import { ClassesPage } from "./pages/ClassesPage";
import { CoursesPage } from "./pages/CoursesPage";
import { CourseDetailPage } from "./pages/CourseDetailPage";
import { LessonPlayerPage } from "./pages/LessonPlayerPage";
import { CompetitionDetailPage } from "./pages/CompetitionDetailPage";
import { CompetitionChallengePage } from "./pages/CompetitionChallengePage";
import { DashboardPage } from "./pages/DashboardPage";
import { LearnPage } from "./pages/LearnPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ReportsPage } from "./pages/ReportsPage";
import { UsersPage } from "./pages/UsersPage";
import { ProfilePage } from "./pages/ProfilePage";
import { VerifyPage } from "./pages/VerifyPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      {/* Public routes — no login required */}
      <Route path="/verify" element={<VerifyPage />} />
      <Route path="/verify/:verificationId" element={<VerifyPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<DashboardLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route element={<RoleRoute page="courses" />}>
            <Route path="/courses" element={<CoursesPage />} />
            <Route path="/courses/:id" element={<CourseDetailPage />} />
            <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonPlayerPage />} />
          </Route>
          <Route element={<RoleRoute page="learn" />}>
            <Route path="/learn" element={<LearnPage />} />
          </Route>
          <Route element={<RoleRoute page="arena" />}>
            <Route path="/arena" element={<ArenaPage />} />
            <Route path="/arena/:id" element={<CompetitionDetailPage />} />
            <Route path="/arena/:id/challenge" element={<CompetitionChallengePage />} />
          </Route>
          <Route element={<RoleRoute page="classes" />}>
            <Route path="/classes" element={<ClassesPage />} />
          </Route>
          <Route element={<RoleRoute page="assessments" />}>
            <Route path="/assessments" element={<AssessmentsPage />} />
            <Route path="/assessments/:id/build" element={<AssessmentBuilderPage />} />
            <Route path="/assessments/:id/take" element={<AssessmentTakePage />} />
            <Route path="/assessments/:id/attempts" element={<AssessmentAttemptsPage />} />
            <Route path="/assessments/attempts/:attemptId" element={<AssessmentResultPage />} />
          </Route>
          <Route element={<RoleRoute page="certificates" />}>
            <Route path="/certificates" element={<CertificatesPage />} />
          </Route>
          <Route element={<RoleRoute page="reports" />}>
            <Route path="/reports" element={<ReportsPage />} />
          </Route>
          <Route element={<RoleRoute page="users" />}>
            <Route path="/users" element={<UsersPage />} />
          </Route>
          {/* Profile — available to every authenticated user */}
          <Route path="/profile" element={<ProfilePage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
