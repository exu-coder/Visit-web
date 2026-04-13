import { motion } from "framer-motion";
import ProductCard from "./ProductCard";
import { usePackages } from "@/hooks/usePackages";
import type { Package } from "@/types/package";
import { Loader2 } from "lucide-react";

interface PackagesSectionProps {
  onSelectProduct: (pkg: Package, region: string) => void;
}

const PackagesSection = ({ onSelectProduct }: PackagesSectionProps) => {
  const { data: packages, isLoading, error } = usePackages();

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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
        {packages?.map((pkg, index) => (
          <ProductCard
            key={pkg.id}
            pkg={pkg}
            onSelect={() => onSelectProduct(pkg, "Bangladesh")}
            index={index}
          />
        ))}
      </div>

      {packages?.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No packages available at the moment.</p>
        </div>
      )}
    </section>
  );
};

export default PackagesSection;
