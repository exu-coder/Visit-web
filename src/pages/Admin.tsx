import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Shield, LogOut, ArrowLeft, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import AdminLogin from "@/components/admin/AdminLogin";
import AdminTabs from "@/components/admin/AdminTabs";
import OrdersManager from "@/components/admin/OrdersManager";
import PackagesManager from "@/components/admin/PackagesManager";
import CouponsManager from "@/components/admin/CouponsManager";
import CreditCouponsManager from "@/components/admin/CreditCouponsManager";
import UsersManager from "@/components/admin/UsersManager";
import PaymentsManager from "@/components/admin/PaymentsManager";
import AnnouncementsManager from "@/components/admin/AnnouncementsManager";
import AnalyticsDashboard from "@/components/admin/AnalyticsDashboard";
import SiteSettings from "@/components/admin/SiteSettings";
import { TabsContent } from "@/components/ui/tabs";

const Admin = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading, signOut } = useAuth();
  const [activeTab, setActiveTab] = useState("orders");

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 size={48} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !isAdmin) {
    return <AdminLogin />;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/")}
              className="p-2 rounded-lg bg-card border border-border hover:border-primary transition-colors"
            >
              <ArrowLeft size={20} />
            </button>
            <div className="flex items-center gap-2">
              <Shield className="text-primary" size={24} />
              <h1 className="font-orbitron font-bold text-xl">Admin Panel</h1>
            </div>
          </div>
          <button
            onClick={signOut}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        <AdminTabs activeTab={activeTab} onTabChange={setActiveTab}>
          <TabsContent value="orders"><OrdersManager /></TabsContent>
          <TabsContent value="packages"><PackagesManager /></TabsContent>
          <TabsContent value="coupons"><CouponsManager /></TabsContent>
          <TabsContent value="credit-coupons"><CreditCouponsManager /></TabsContent>
          <TabsContent value="users"><UsersManager /></TabsContent>
          <TabsContent value="payments"><PaymentsManager /></TabsContent>
          <TabsContent value="announcements"><AnnouncementsManager /></TabsContent>
          <TabsContent value="analytics"><AnalyticsDashboard /></TabsContent>
          <TabsContent value="settings"><SiteSettings /></TabsContent>
        </AdminTabs>
      </main>
    </div>
  );
};

export default Admin;
