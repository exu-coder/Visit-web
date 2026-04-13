import { useState } from "react";
import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import { usePackages } from "@/hooks/usePackages";
import type { Package } from "@/types/package";
import { Loader2, Eye, Wifi } from "lucide-react";

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
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h2 className="section-title">PACKAGES</h2>
        <p className="text-muted-foreground font-poppins text-sm">
          Select your package and dominate the arena
        </p>
      </motion.div>

      {/* Category Tabs: Visit / TCP */}
      <div className="flex gap-2 justify-center mb-4 max-w-md mx-auto">
        <button
          onClick={() => setActiveCategory("visit")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-orbitron font-bold text-sm transition-all ${
            activeCategory === "visit"
              ? "bg-primary text-primary-foreground shadow-lg"
              : "bg-card border border-border text-muted-foreground hover:border-primary"
          }`}
        >
          <Eye size={18} />
          Visit
        </button>
        <button
          onClick={() => setActiveCategory("tcp")}
          className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-orbitron font-bold text-sm transition-all ${
            activeCategory === "tcp"
              ? "bg-primary text-primary-foreground shadow-lg"
              : "bg-card border border-border text-muted-foreground hover:border-primary"
          }`}
        >
          <Wifi size={18} />
          TCP
        </button>
      </div>

      {/* Visit Region Tabs */}
      {activeCategory === "visit" && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 justify-center mb-6 max-w-sm mx-auto"
        >
          <button
            onClick={() => setVisitRegion("Bangladesh")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              visitRegion === "Bangladesh"
                ? "bg-primary/20 text-primary border border-primary/40"
                : "bg-card border border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            🇧🇩 Bangladesh
          </button>
          <button
            onClick={() => setVisitRegion("India")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              visitRegion === "India"
                ? "bg-primary/20 text-primary border border-primary/40"
                : "bg-card border border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            🇮🇳 India
          </button>
        </motion.div>
      )}

      {/* TCP Sub-tabs: Guild / Friend */}
      {activeCategory === "tcp" && (
        <motion.div
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex gap-2 justify-center mb-6 max-w-sm mx-auto"
        >
          <button
            onClick={() => setTcpSubTab("guild")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tcpSubTab === "guild"
                ? "bg-primary/20 text-primary border border-primary/40"
                : "bg-card border border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            🏰 Guild
          </button>
          <button
            onClick={() => setTcpSubTab("friend")}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
              tcpSubTab === "friend"
                ? "bg-primary/20 text-primary border border-primary/40"
                : "bg-card border border-border text-muted-foreground hover:border-primary/50"
            }`}
          >
            👤 Friend
          </button>
        </motion.div>
      )}

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {currentPackages.map((pkg, index) => (
          <ProductCard
            key={pkg.id}
            pkg={pkg}
            onSelect={() => onSelectProduct(pkg, activeCategory === "visit" ? visitRegion : "Bangladesh")}
            index={index}
          />
        ))}
      </div>

      {currentPackages.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No packages available in this category.</p>
        </div>
      )}
    </section>
  );
};

export default PackagesSection;
