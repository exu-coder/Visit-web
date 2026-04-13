import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav from "@/components/layout/BottomNav";
import HeroSection from "@/components/home/HeroSection";
import PackagesSection from "@/components/packages/PackagesSection";
import OrderForm from "@/components/order/OrderForm";
import SupportSection from "@/components/support/SupportSection";
import ProfileSection from "@/components/profile/ProfileSection";
import AuthModal from "@/components/auth/AuthModal";
import type { Package } from "@/types/package";

const Index = () => {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedPackage, setSelectedPackage] = useState<Package | null>(null);
  const selectedRegion = "Bangladesh";
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    setSelectedPackage(null);
  };

  const handleSelectProduct = (pkg: Package) => {
    setSelectedPackage(pkg);
    setActiveTab("order");
  };

  const handleOrderSubmit = () => {
    setSelectedPackage(null);
    setActiveTab("profile");
  };

  const renderContent = () => {
    // Order form view
    if (selectedPackage) {
      return (
        <OrderForm
          pkg={selectedPackage}
          selectedRegion={selectedRegion}
          onBack={() => {
            setSelectedPackage(null);
            setActiveTab("packages");
          }}
          onSubmit={handleOrderSubmit}
          onAuthRequired={() => setShowAuthModal(true)}
        />
      );
    }

    switch (activeTab) {
      case "home":
        return (
          <HeroSection
            onStartTopUp={() => setActiveTab("packages")}
            onViewPackages={() => setActiveTab("packages")}
            onSupport={() => setActiveTab("support")}
          />
        );
      case "packages":
        return <PackagesSection onSelectProduct={handleSelectProduct} />;
      case "orders":
      case "profile":
        return <ProfileSection />;
      case "support":
        return <SupportSection />;
      default:
        return <HeroSection 
          onStartTopUp={() => setActiveTab("packages")}
          onViewPackages={() => setActiveTab("packages")}
          onSupport={() => setActiveTab("support")}
        />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AnimatePresence mode="wait">
        <motion.main
          key={activeTab + (selectedPackage?.id || "")}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {renderContent()}
        </motion.main>
      </AnimatePresence>

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
      
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};

export default Index;
