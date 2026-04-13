import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ProductCard from "./ProductCard";
import { usePackages } from "@/hooks/usePackages";
import type { Package } from "@/types/package";
import { Loader2, Eye, Wifi, Shield, Users, ChevronRight } from "lucide-react";

interface PackagesSectionProps {
  onSelectProduct: (pkg: Package, region: string) => void;
}

const PackagesSection = ({ onSelectProduct }: PackagesSectionProps) => {
  const { data: packages, isLoading, error } = usePackages();
  const [activeCategory, setActiveCategory] = useState<"visit" | "tcp">("visit");
  const [tcpSubTab, setTcpSubTab] = useState<"guild" | "friend">("guild");
  const [visitRegion, setVisitRegion] = useState<"Bangladesh" | "India">("Bangladesh");

  if (isLoading) {
    return (
      <section className="px-4 py-8 pb-28 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="animate-spin text-primary" size={40} />
      </section>
    );
  }

  if (error) {
    return (
      <section className="px-4 py-8 pb-28 text-center">
        <p className="text-destructive">Failed to load packages. Please try again.</p>
      </section>
    );
  }

  const visitPackages = packages?.filter(p => p.category === "visit") || [];
  const tcpGuildPackages = packages?.filter(p => p.category === "tcp" && p.sub_category === "guild") || [];
  const tcpFriendPackages = packages?.filter(p => p.category === "tcp" && p.sub_category === "friend") || [];

  const currentPackages = activeCategory === "visit"
    ? visitPackages
    : tcpSubTab === "guild"
      ? tcpGuildPackages
      : tcpFriendPackages;

  return (
    <section className="px-4 py-8 pb-28">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="section-title">SELECT SERVICE</h2>
        <p className="text-muted-foreground font-poppins text-sm">
          Choose your service type and server region
        </p>
      </motion.div>

      {/* Service Type Selector */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="max-w-md mx-auto mb-5"
      >
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-1">Service Type</p>
        <div className="relative flex rounded-xl bg-card border border-border p-1 gap-1">
          {/* Sliding indicator */}
          <motion.div
            className="absolute top-1 bottom-1 rounded-lg bg-primary/15 border border-primary/30"
            initial={false}
            animate={{
              left: activeCategory === "visit" ? "4px" : "50%",
              width: "calc(50% - 6px)",
            }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
          />
          <button
            onClick={() => setActiveCategory("visit")}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2.5 py-3 rounded-lg font-orbitron font-bold text-sm transition-colors ${
              activeCategory === "visit"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye size={16} />
            VISIT
          </button>
          <button
            onClick={() => setActiveCategory("tcp")}
            className={`relative z-10 flex-1 flex items-center justify-center gap-2.5 py-3 rounded-lg font-orbitron font-bold text-sm transition-colors ${
              activeCategory === "tcp"
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Wifi size={16} />
            TCP
          </button>
        </div>
      </motion.div>

      {/* Sub-selector: Region for Visit / Type for TCP */}
      <AnimatePresence mode="wait">
        {activeCategory === "visit" ? (
          <motion.div
            key="visit-region"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="max-w-sm mx-auto mb-8"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-1">Server Region</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setVisitRegion("Bangladesh")}
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  visitRegion === "Bangladesh"
                    ? "bg-primary/10 border-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
                    : "bg-card border-border hover:border-primary/30"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  visitRegion === "Bangladesh" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  BD
                </div>
                <div className="text-left">
                  <p className={`text-sm font-semibold ${visitRegion === "Bangladesh" ? "text-primary" : "text-foreground"}`}>Bangladesh</p>
                  <p className="text-[10px] text-muted-foreground">South Asia</p>
                </div>
                {visitRegion === "Bangladesh" && (
                  <motion.div
                    layoutId="region-check"
                    className="absolute right-3 w-2 h-2 rounded-full bg-primary"
                  />
                )}
              </button>
              <button
                onClick={() => setVisitRegion("India")}
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  visitRegion === "India"
                    ? "bg-primary/10 border-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
                    : "bg-card border-border hover:border-primary/30"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  visitRegion === "India" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  IN
                </div>
                <div className="text-left">
                  <p className={`text-sm font-semibold ${visitRegion === "India" ? "text-primary" : "text-foreground"}`}>India</p>
                  <p className="text-[10px] text-muted-foreground">South Asia</p>
                </div>
                {visitRegion === "India" && (
                  <motion.div
                    layoutId="region-check"
                    className="absolute right-3 w-2 h-2 rounded-full bg-primary"
                  />
                )}
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="tcp-type"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="max-w-sm mx-auto mb-8"
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2 px-1">Connection Type</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setTcpSubTab("guild")}
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  tcpSubTab === "guild"
                    ? "bg-primary/10 border-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
                    : "bg-card border-border hover:border-primary/30"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  tcpSubTab === "guild" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  <Shield size={16} />
                </div>
                <div className="text-left">
                  <p className={`text-sm font-semibold ${tcpSubTab === "guild" ? "text-primary" : "text-foreground"}`}>Guild</p>
                  <p className="text-[10px] text-muted-foreground">Guild UID</p>
                </div>
                {tcpSubTab === "guild" && (
                  <motion.div
                    layoutId="tcp-check"
                    className="absolute right-3 w-2 h-2 rounded-full bg-primary"
                  />
                )}
              </button>
              <button
                onClick={() => setTcpSubTab("friend")}
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  tcpSubTab === "friend"
                    ? "bg-primary/10 border-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
                    : "bg-card border-border hover:border-primary/30"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                  tcpSubTab === "friend" ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  <Users size={16} />
                </div>
                <div className="text-left">
                  <p className={`text-sm font-semibold ${tcpSubTab === "friend" ? "text-primary" : "text-foreground"}`}>Friend</p>
                  <p className="text-[10px] text-muted-foreground">Player UID</p>
                </div>
                {tcpSubTab === "friend" && (
                  <motion.div
                    layoutId="tcp-check"
                    className="absolute right-3 w-2 h-2 rounded-full bg-primary"
                  />
                )}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Active Selection Indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-5xl mx-auto mb-4"
      >
        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1">
          <span className="font-medium text-foreground">{activeCategory === "visit" ? "Visit" : "TCP"}</span>
          <ChevronRight size={12} />
          <span className="font-medium text-primary">
            {activeCategory === "visit"
              ? visitRegion
              : tcpSubTab === "guild" ? "Guild" : "Friend"
            }
          </span>
          <span className="ml-auto">{currentPackages.length} package{currentPackages.length !== 1 ? "s" : ""}</span>
        </div>
      </motion.div>

      {/* Packages Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeCategory}-${activeCategory === "visit" ? visitRegion : tcpSubTab}`}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.25 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto"
        >
          {currentPackages.map((pkg, index) => (
            <ProductCard
              key={pkg.id}
              pkg={pkg}
              onSelect={() => onSelectProduct(pkg, activeCategory === "visit" ? visitRegion : "Bangladesh")}
              index={index}
            />
          ))}
        </motion.div>
      </AnimatePresence>

      {currentPackages.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-muted/50 flex items-center justify-center">
            {activeCategory === "visit" ? <Eye size={28} className="text-muted-foreground" /> : <Wifi size={28} className="text-muted-foreground" />}
          </div>
          <p className="text-muted-foreground font-medium">No packages available</p>
          <p className="text-xs text-muted-foreground mt-1">Check back later for new offerings</p>
        </motion.div>
      )}
    </section>
  );
};

export default PackagesSection;
