import { Navigate, Route, Routes } from "react-router-dom";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { ArenaPage } from "./pages/ArenaPage";
import { AssessmentsPage } from "./pages/AssessmentsPage";
import { CertificatesPage } from "./pages/CertificatesPage";
import { ClassesPage } from "./pages/ClassesPage";
import { DashboardPage } from "./pages/DashboardPage";
import { LearnPage } from "./pages/LearnPage";
import { ReportsPage } from "./pages/ReportsPage";

function App() {
  return (
    <Routes>
      <Route element={<DashboardLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/learn" element={<LearnPage />} />
        <Route path="/arena" element={<ArenaPage />} />
        <Route path="/classes" element={<ClassesPage />} />
        <Route path="/assessments" element={<AssessmentsPage />} />
        <Route path="/certificates" element={<CertificatesPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default App;
