import { AppSidebar } from "@/components/AppSidebar";
import { AppHeader } from "@/components/AppHeader";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <AppSidebar>
      <AppHeader />
      <div className="px-4 py-4">
        {children}
      </div>
    </AppSidebar>
  );
}
