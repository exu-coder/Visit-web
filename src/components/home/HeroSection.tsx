import { motion } from "framer-motion";
import { Zap, Package, Phone } from "lucide-react";

interface HeroSectionProps {
  onStartTopUp: () => void;
  onViewPackages: () => void;
  onSupport: () => void;
}

const HeroSection = ({ onStartTopUp, onViewPackages, onSupport }: HeroSectionProps) => {
  return (
    <section className="relative min-h-[85vh] flex flex-col items-center justify-center px-4 overflow-hidden">
      <div className="absolute inset-0 grid-bg animate-grid opacity-50" />
      <div className="absolute inset-0 bg-hero-glow" />

      <div className="relative z-10 text-center max-w-lg mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-4"
        >
          <h1 className="text-3xl md:text-5xl font-orbitron font-black tracking-wider">
            <span className="text-foreground">EXU GUILD</span>
            <br />
            <span className="text-primary glow-text">TCP BOT</span>
            <motion.span
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="inline-block ml-2"
            >
              ⚡
            </motion.span>
          </h1>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl font-poppins text-muted-foreground mb-8 tracking-wide"
        >
          <span className="text-primary font-semibold">Fast</span> •{" "}
          <span className="text-secondary-foreground font-semibold">Secure</span> •{" "}
          <span className="text-primary font-semibold">Credit-Powered</span> Services
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col gap-4"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onStartTopUp}
            className="neon-btn-solid rounded-xl py-4 text-lg flex items-center justify-center gap-3 animate-pulse-glow"
          >
            <Zap size={22} className="animate-pulse" />
            Browse Packages
          </motion.button>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onViewPackages}
              className="neon-btn rounded-xl flex-1 flex items-center justify-center gap-2"
            >
              <Package size={18} />
              View Packages
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onSupport}
              className="neon-btn rounded-xl flex-1 flex items-center justify-center gap-2"
            >
              <Phone size={18} />
              Support
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 flex justify-center gap-8"
        >
          {[
            { value: "500+", label: "Orders" },
            { value: "24/7", label: "Support" },
            { value: "100%", label: "Secure" },
          ].map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-2xl font-orbitron font-bold text-primary">
                {stat.value}
              </div>
              <div className="text-xs font-poppins text-muted-foreground">
                {stat.label}
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
    </section>
  );
};

export default HeroSection;
