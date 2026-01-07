import { Sidebar } from '@/components/dashboard/Sidebar';
import { TopBar } from '@/components/dashboard/TopBar';

// Force dynamic rendering for all dashboard pages (they use Clerk auth)
export const dynamic = 'force-dynamic';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div>
      <Sidebar />
      <main className="main-content">
        <TopBar />
        <div className="page-container">
          {children}
        </div>
      </main>
    </div>
  );
}
