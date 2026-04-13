import { motion } from "framer-motion";
import { Check, Sparkles, Coins } from "lucide-react";
import type { Package } from "@/types/package";

interface ProductCardProps {
  pkg: Package;
  onSelect: () => void;
  index: number;
}

const ProductCard = ({ pkg, onSelect, index }: ProductCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.1 }}
      className="game-card p-5 cursor-pointer group overflow-hidden"
      onClick={onSelect}
    >
      {/* Package Image */}
      {pkg.image_url && (
        <div className="w-full h-40 -mx-5 -mt-5 mb-4 overflow-hidden">
          <img
            src={pkg.image_url}
            alt={pkg.name}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      {/* Badge */}
      <div className="absolute top-3 right-3">
        <span className="badge-glow flex items-center gap-1">
          <Sparkles size={10} />
          {pkg.features?.[0] || "Package"}
        </span>
      </div>

      {/* Product Name */}
      <h3 className="font-orbitron font-bold text-lg text-foreground mb-2 pr-20 group-hover:text-primary transition-colors">
        {pkg.name}
      </h3>

      {/* Price in Credits */}
      <div className="flex items-center gap-2 mb-4">
        <Coins size={20} className="text-primary" />
        <span className="font-orbitron text-2xl font-black text-primary glow-text">
          {pkg.price}
        </span>
        <span className="text-sm text-muted-foreground">Credits</span>
      </div>

      {/* Features */}
      <ul className="space-y-2 mb-4">
        {pkg.features?.map((feature, idx) => (
          <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
            <Check size={14} className="text-primary flex-shrink-0" />
            <span>{feature}</span>
          </li>
        ))}
      </ul>

      {/* Description */}
      {pkg.description && (
        <p className="text-xs text-muted-foreground mb-4 line-clamp-2">
          {pkg.description}
        </p>
      )}

      {/* Order Button */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full neon-btn-solid rounded-lg py-3 text-sm font-semibold"
      >
        Order Now
      </motion.button>

      {/* Hover glow effect */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none glow-red-border" />
    </motion.div>
  );
};

export default ProductCard;
