import DashboardPageLayout from "@/components/dashboard/layout";
import AdvisorDashboard from "@/components/advisor/advisor-dashboard";

export default function DashboardPage() {
  return (
    <DashboardPageLayout>
      <AdvisorDashboard />
    </DashboardPageLayout>
  );
}
