import { Home, Package, ShoppingBag, User, MessageCircle } from "lucide-react";
import { motion } from "framer-motion";

interface BottomNavProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const navItems = [
  { id: "home", label: "Home", icon: Home },
  { id: "packages", label: "Packages", icon: Package },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "profile", label: "Profile", icon: User },
  { id: "support", label: "Support", icon: MessageCircle },
];

const BottomNav = ({ activeTab, onTabChange }: BottomNavProps) => {
  return (
    <nav className="bottom-nav">
      <div className="flex justify-around items-center py-2 px-4 max-w-lg mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`nav-item ${isActive ? "active" : ""}`}
            >
              <motion.div
                whileTap={{ scale: 0.9 }}
                className="nav-icon"
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
              </motion.div>
              <span className="text-[10px] font-medium font-poppins">
                {item.label}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute -top-1 w-8 h-1 rounded-full bg-primary"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
