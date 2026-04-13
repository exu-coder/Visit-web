import { motion } from "framer-motion";
import { Send, Shield, MessageCircle, Headphones, ExternalLink } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const SupportSection = () => {
  const { data: settings } = useQuery({
    queryKey: ["site-settings-support"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("setting_key, setting_value");
      if (error) throw error;
      const map: Record<string, string> = {};
      data?.forEach((s) => { map[s.setting_key] = s.setting_value || ""; });
      return map;
    },
  });

  const telegramUsername = settings?.support_telegram || "@EXU_Support";
  const telegramChannel = settings?.telegram_channel || "";
  const whatsappNumber = settings?.support_whatsapp || "";

  const telegramLink = telegramUsername.startsWith("@")
    ? `https://t.me/${telegramUsername.slice(1)}`
    : `https://t.me/${telegramUsername}`;

  return (
    <section className="px-4 py-8 pb-28">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-primary/20 flex items-center justify-center glow-red-soft">
          <Headphones size={40} className="text-primary" />
        </div>
        <h2 className="section-title">SUPPORT CENTER</h2>
        <p className="text-muted-foreground font-poppins text-sm">
          Need help? Contact our admin directly
        </p>
      </motion.div>

      {/* Main Support Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="game-card p-6 max-w-md mx-auto mb-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 rounded-full bg-[hsl(200,100%,40%)]/20 flex items-center justify-center">
            <Send size={24} className="text-[hsl(200,100%,50%)]" />
          </div>
          <div>
            <h3 className="font-orbitron font-bold text-lg">Live Admin Support</h3>
            <p className="text-sm text-muted-foreground">Chat directly on Telegram</p>
          </div>
        </div>
        <motion.a
          href={telegramLink}
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-[hsl(200,100%,40%)] text-white font-bold text-sm hover:bg-[hsl(200,100%,35%)] transition-colors"
        >
          <Send size={18} />
          Message Admin on Telegram
          <ExternalLink size={14} />
        </motion.a>
        <p className="text-xs text-center text-muted-foreground mt-3">
          Telegram: <span className="text-foreground font-medium">{telegramUsername}</span>
        </p>
      </motion.div>

      {/* Other contacts */}
      <div className="grid grid-cols-1 gap-3 max-w-md mx-auto mb-8">
        {telegramChannel && (
          <motion.a
            href={telegramChannel}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.02 }}
            className="game-card p-4 flex items-center gap-3 hover:border-primary transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-[hsl(200,100%,40%)]/20 flex items-center justify-center">
              <Shield size={20} className="text-[hsl(200,100%,50%)]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">Telegram Channel</p>
              <p className="text-xs text-muted-foreground">Updates & Announcements</p>
            </div>
            <ExternalLink size={16} className="text-muted-foreground" />
          </motion.a>
        )}

        {whatsappNumber && (
          <motion.a
            href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            whileHover={{ scale: 1.02 }}
            className="game-card p-4 flex items-center gap-3 hover:border-primary transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-[hsl(142,70%,45%)]/20 flex items-center justify-center">
              <MessageCircle size={20} className="text-[hsl(142,70%,45%)]" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-sm">WhatsApp</p>
              <p className="text-xs text-muted-foreground">{whatsappNumber}</p>
            </div>
            <ExternalLink size={16} className="text-muted-foreground" />
          </motion.a>
        )}
      </div>

      {/* FAQ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="max-w-md mx-auto"
      >
        <h3 className="font-orbitron font-bold text-lg text-center mb-4">FAQ</h3>
        <div className="space-y-3">
          {[
            { q: "How do I buy credits?", a: "Contact admin on Telegram to purchase credit coupons. Redeem them in your profile." },
            { q: "How long does delivery take?", a: "Most orders are completed within 2-8 hours depending on the package." },
            { q: "Is it safe?", a: "Yes! We use anti-ban protection and secure methods for all services." },
            { q: "What if my order fails?", a: "Credits will be refunded to your account. Contact admin for help." },
          ].map((faq, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="game-card p-4"
            >
              <h4 className="font-semibold text-sm text-foreground mb-1">{faq.q}</h4>
              <p className="text-xs text-muted-foreground">{faq.a}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
};

export default SupportSection;
