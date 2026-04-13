import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  Users,
  Settings,
  CreditCard,
  Megaphone,
  BarChart3,
  ShoppingCart,
  Ticket,
  Coins,
} from "lucide-react";

interface AdminTabsProps {
  activeTab: string;
  onTabChange: (value: string) => void;
  children: React.ReactNode;
}

const AdminTabs = ({ activeTab, onTabChange, children }: AdminTabsProps) => {
  const tabs = [
    { value: "orders", label: "Orders", icon: ShoppingCart },
    { value: "packages", label: "Packages", icon: Package },
    { value: "coupons", label: "Coupons", icon: Ticket },
    { value: "credit-coupons", label: "Credits", icon: Coins },
    { value: "users", label: "Users", icon: Users },
    { value: "payments", label: "Payments", icon: CreditCard },
    { value: "announcements", label: "Banners", icon: Megaphone },
    { value: "analytics", label: "Analytics", icon: BarChart3 },
    { value: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
      <TabsList className="w-full flex flex-wrap justify-start gap-1 h-auto bg-card border border-border p-2 rounded-xl mb-6">
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            className="flex items-center gap-2 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <tab.icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
          </TabsTrigger>
        ))}
      </TabsList>
      {children}
    </Tabs>
  );
};

export default AdminTabs;
