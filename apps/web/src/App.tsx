import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RoleRoute } from "./components/RoleRoute";
import { DashboardLayout } from "./layouts/DashboardLayout";

const ArenaPage = lazy(() => import("./pages/ArenaPage").then((module) => ({ default: module.ArenaPage })));
const AssessmentsPage = lazy(() => import("./pages/AssessmentsPage").then((module) => ({ default: module.AssessmentsPage })));
const AssessmentBuilderPage = lazy(() => import("./pages/AssessmentBuilderPage").then((module) => ({ default: module.AssessmentBuilderPage })));
const AssessmentTakePage = lazy(() => import("./pages/AssessmentTakePage").then((module) => ({ default: module.AssessmentTakePage })));
const AssessmentResultPage = lazy(() => import("./pages/AssessmentResultPage").then((module) => ({ default: module.AssessmentResultPage })));
const AssessmentAttemptsPage = lazy(() => import("./pages/AssessmentAttemptsPage").then((module) => ({ default: module.AssessmentAttemptsPage })));
const CertificatesPage = lazy(() => import("./pages/CertificatesPage").then((module) => ({ default: module.CertificatesPage })));
const ClassesPage = lazy(() => import("./pages/ClassesPage").then((module) => ({ default: module.ClassesPage })));
const ClassPage = lazy(() => import("./pages/ClassPage"));
const QuestionBankPage = lazy(() => import("./pages/QuestionBankPage"));
const GradingPage = lazy(() => import("./pages/GradingPage"));
const CoursesPage = lazy(() => import("./pages/CoursesPage").then((module) => ({ default: module.CoursesPage })));
const CourseDetailPage = lazy(() => import("./pages/CourseDetailPage").then((module) => ({ default: module.CourseDetailPage })));
const CourseLandingPage = lazy(() => import("./pages/CourseLandingPage").then((module) => ({ default: module.CourseLandingPage })));
const ProgrammeLandingPage = lazy(() => import("./pages/ProgrammeLandingPage").then((module) => ({ default: module.ProgrammeLandingPage })));
const LessonPlayerPage = lazy(() => import("./pages/LessonPlayerPage").then((module) => ({ default: module.LessonPlayerPage })));
const LiveSessionPage = lazy(() => import("./pages/LiveSessionPage").then((module) => ({ default: module.LiveSessionPage })));
const CompetitionDetailPage = lazy(() => import("./pages/CompetitionDetailPage").then((module) => ({ default: module.CompetitionDetailPage })));
const CompetitionChallengePage = lazy(() => import("./pages/CompetitionChallengePage").then((module) => ({ default: module.CompetitionChallengePage })));
const DashboardPage = lazy(() => import("./pages/DashboardPage").then((module) => ({ default: module.DashboardPage })));
const KnowledgeHubPage = lazy(() => import("./pages/KnowledgeHubPage").then((module) => ({ default: module.KnowledgeHubPage })));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage").then((module) => ({ default: module.OnboardingPage })));
const LearnPage = lazy(() => import("./pages/LearnPage").then((module) => ({ default: module.LearnPage })));
const LoginPage = lazy(() => import("./pages/LoginPage").then((module) => ({ default: module.LoginPage })));
const NotFoundPage = lazy(() => import("./pages/NotFoundPage").then((module) => ({ default: module.NotFoundPage })));
const RegisterPage = lazy(() => import("./pages/RegisterPage").then((module) => ({ default: module.RegisterPage })));
const ReportsPage = lazy(() => import("./pages/ReportsPage").then((module) => ({ default: module.ReportsPage })));
const UsersPage = lazy(() => import("./pages/UsersPage").then((module) => ({ default: module.UsersPage })));
const TeachSpacePage = lazy(() => import("./pages/TeachSpacePage").then((module) => ({ default: module.TeachSpacePage })));
const ProfilePage = lazy(() => import("./pages/ProfilePage").then((module) => ({ default: module.ProfilePage })));
const VerifyPage = lazy(() => import("./pages/VerifyPage").then((module) => ({ default: module.VerifyPage })));

function App() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<div className="route-loading" role="status">Loading page...</div>}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        {/* Public routes — no login required */}
        <Route path="/verify" element={<VerifyPage />} />
        <Route path="/verify/:verificationId" element={<VerifyPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route element={<DashboardLayout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/personalize" element={<KnowledgeHubPage />} />
            <Route path="/knowledge-hub" element={<Navigate to="/personalize" replace />} />
            <Route element={<RoleRoute page="courses" />}>
              <Route path="/courses" element={<CoursesPage />} />
              <Route path="/courses/:id" element={<CourseLandingPage />} />
              <Route path="/courses/:id/workspace" element={<CourseDetailPage />} />
              <Route path="/courses/:courseId/lessons/:lessonId" element={<LessonPlayerPage />} />
            </Route>
            <Route path="/programmes/:id" element={<ProgrammeLandingPage />} />
            <Route path="/teachspace" element={<TeachSpacePage />} />
            <Route element={<RoleRoute page="learn" />}>
              <Route path="/learn" element={<LearnPage />} />
            </Route>
            {/* Live session workspace — accessible to all authenticated users (trainers + learners) */}
            <Route path="/live-sessions/:sessionId" element={<LiveSessionPage />} />
            <Route element={<RoleRoute page="arena" />}>
              <Route path="/competitions" element={<ArenaPage />} />
              <Route path="/competitions/:id" element={<CompetitionDetailPage />} />
              <Route path="/competitions/:id/challenge" element={<CompetitionChallengePage />} />
              <Route path="/arena" element={<Navigate to="/competitions" replace />} />
              <Route path="/arena/:id" element={<CompetitionDetailPage />} />
              <Route path="/arena/:id/challenge" element={<CompetitionChallengePage />} />
            </Route>
            <Route element={<RoleRoute page="classes" />}>
              <Route path="/classes" element={<ClassesPage />} />
              <Route path="/classes/:id" element={<ClassPage />} />
            </Route>
            <Route element={<RoleRoute page="assessments" />}>
              <Route path="/assessments" element={<AssessmentsPage />} />
              <Route path="/assessments/:id/build" element={<AssessmentBuilderPage />} />
              <Route path="/assessments/:id/take" element={<AssessmentTakePage />} />
              <Route path="/assessments/:id/attempts" element={<AssessmentAttemptsPage />} />
              <Route path="/assessments/attempts/:attemptId" element={<AssessmentResultPage />} />
              <Route path="/assessments/banks" element={<QuestionBankPage />} />
              <Route path="/assessments/banks/manage" element={<QuestionBankPage />} />
              <Route path="/assessments/:id/grade" element={<GradingPage />} />
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
            {/* 404 within the authenticated shell */}
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Route>
        {/* Public 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
      </Suspense>
    </ErrorBoundary>
  );
}

export default App;
