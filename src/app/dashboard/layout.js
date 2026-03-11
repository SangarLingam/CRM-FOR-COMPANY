import Sidebar from "@/components/Sidebar";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/lib/toast-context";

export default function DashboardLayout({ children }) {
  return (
    <AuthProvider>
      <ToastProvider>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 min-h-screen overflow-y-auto" style={{ marginLeft:"260px" }}>
            {children}
          </main>
        </div>
      </ToastProvider>
    </AuthProvider>
  );
}