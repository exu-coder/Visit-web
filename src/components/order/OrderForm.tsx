import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Coins, Loader2, AlertTriangle, Eye, Globe, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import type { Package } from "@/types/package";
import { useQuery } from "@tanstack/react-query";

interface OrderFormProps {
  pkg: Package;
  selectedRegion: string;
  onBack: () => void;
  onSubmit: () => void;
  onAuthRequired: () => void;
}

const SERVERS = [
  { code: "bd", label: "Bangladesh", short: "BD", desc: "South Asia" },
  { code: "ind", label: "India", short: "IN", desc: "South Asia" },
];

const OrderForm = ({ pkg, selectedRegion, onBack, onSubmit, onAuthRequired }: OrderFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [server, setServer] = useState(selectedRegion === "India" ? "ind" : "bd");
  const [formData, setFormData] = useState({
    uid: "",
    guildUid: "",
    telegramUsername: "",
    whatsappNumber: "",
  });

  const { data: profile } = useQuery({
    queryKey: ["profile-credits", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("credit_balance, guild_uid, telegram_username, whatsapp_number")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  useEffect(() => {
    if (profile) {
      setFormData(prev => ({
        ...prev,
        guildUid: prev.guildUid || profile.guild_uid || "",
        telegramUsername: prev.telegramUsername || profile.telegram_username || "",
        whatsappNumber: prev.whatsappNumber || profile.whatsapp_number || "",
      }));
    }
  }, [profile]);

  const creditBalance = profile?.credit_balance ?? 0;
  const price = pkg.price;
  const hasEnoughCredits = creditBalance >= price;

  const isVisit = pkg.category === "visit";
  const isTcpGuild = pkg.category === "tcp" && pkg.sub_category === "guild";
  const isTcpFriend = pkg.category === "tcp" && pkg.sub_category === "friend";
  const isFreePackage = price === 0;

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const regionLabel = server === "ind" ? "India" : "Bangladesh";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) { onAuthRequired(); return; }
    if (isVisit && !formData.uid) {
      toast({ title: "Missing Information", description: "Please enter your UID", variant: "destructive" });
      return;
    }
    if (isTcpGuild && !formData.guildUid) {
      toast({ title: "Missing Information", description: "Please enter your Guild UID", variant: "destructive" });
      return;
    }
    if (isTcpFriend && !formData.uid) {
      toast({ title: "Missing Information", description: "Please enter your UID", variant: "destructive" });
      return;
    }
    if (!formData.telegramUsername || !formData.whatsappNumber) {
      toast({ title: "Missing Information", description: "Please fill in all required fields", variant: "destructive" });
      return;
    }

    if (!isFreePackage && !hasEnoughCredits) {
      toast({ title: "Insufficient Credits", description: `You need ${price} credits but only have ${creditBalance}.`, variant: "destructive" });
      return;
    }

    setIsSubmitting(true);

    try {
      const newBalance = creditBalance - price;
      if (!isFreePackage) {
        const { error: creditError } = await supabase
          .from("profiles")
          .update({ credit_balance: newBalance })
          .eq("user_id", user.id);
        if (creditError) throw new Error("Failed to deduct credits");
      }

      const guildUidValue = isTcpGuild ? formData.guildUid : (isVisit || isTcpFriend ? formData.uid : formData.guildUid);

      const { data: orderData, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          product_id: pkg.id,
          product_name: pkg.name,
          price: isFreePackage ? "FREE" : `${price} Credits`,
          price_value: price,
          trx_id: `CR-${Date.now()}`,
          guild_uid: guildUidValue,
          region: regionLabel,
          telegram_username: formData.telegramUsername,
          whatsapp_number: formData.whatsappNumber,
          payment_method: "credits",
          status: isFreePackage ? "approved" : "pending",
        })
        .select("id")
        .single();

      if (orderError) {
        if (!isFreePackage) {
          await supabase.from("profiles").update({ credit_balance: creditBalance }).eq("user_id", user.id);
        }
        throw new Error("Failed to create order");
      }

      // Log credit transaction
      if (!isFreePackage && orderData) {
        await supabase.from("credit_transactions").insert({
          user_id: user.id,
          type: "order_payment",
          amount: -price,
          balance_after: newBalance,
          description: `Payment for ${pkg.name}`,
          related_order_id: orderData.id,
        });
      }

      await supabase.from("profiles").update({
        guild_uid: formData.guildUid || formData.uid,
        telegram_username: formData.telegramUsername,
        whatsapp_number: formData.whatsappNumber,
      }).eq("user_id", user.id);

      toast({ title: isFreePackage ? "Order Auto-Approved!" : "Order Submitted!", description: isFreePackage ? "Your free order has been approved automatically." : `${price} credits deducted. Check your profile for updates.` });
      onSubmit();
    } catch (error) {
      console.error("Order submission error:", error);
      toast({ title: "Order Failed", description: error instanceof Error ? error.message : "Something went wrong", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = () => {
    if (isVisit) return `Visit`;
    if (isTcpGuild) return "TCP Guild";
    if (isTcpFriend) return "TCP Friend";
    return pkg.name;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="px-4 py-6 pb-28 max-w-lg mx-auto"
    >
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg bg-card border border-border hover:border-primary transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="font-orbitron font-bold text-xl">Complete Order</h2>
          <p className="text-sm text-muted-foreground">{pkg.name} — {getCategoryLabel()}</p>
        </div>
      </div>

      {!user && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="game-card p-4 mb-6 border-warning bg-warning/10">
          <p className="text-sm text-center">
            <span className="text-warning font-medium">Please sign in</span> to place your order
          </p>
          <button onClick={onAuthRequired} className="w-full mt-3 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors font-medium">
            Sign In / Create Account
          </button>
        </motion.div>
      )}

      <div className="game-card p-4 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="font-orbitron font-bold">{pkg.name}</h3>
            <p className="text-sm text-muted-foreground">{getCategoryLabel()}</p>
          </div>
          <div className="text-right">
            {isFreePackage ? (
              <div className="text-2xl font-orbitron font-black text-emerald-400">FREE</div>
            ) : (
              <>
                <div className="text-2xl font-orbitron font-black text-primary flex items-center gap-1">
                  <Coins size={22} />
                  {price}
                </div>
                <div className="text-xs text-muted-foreground">Credits</div>
              </>
            )}
          </div>
        </div>
      </div>

      {user && !isFreePackage && (
        <div className={`game-card p-4 mb-6 ${hasEnoughCredits ? 'border-success/30 bg-success/5' : 'border-destructive/30 bg-destructive/5'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins size={20} className={hasEnoughCredits ? "text-success" : "text-destructive"} />
              <span className="font-medium">Your Balance</span>
            </div>
            <span className={`font-orbitron font-bold text-lg ${hasEnoughCredits ? 'text-success' : 'text-destructive'}`}>
              {creditBalance} Credits
            </span>
          </div>
          {!hasEnoughCredits && (
            <div className="flex items-center gap-2 mt-3 text-sm text-destructive">
              <AlertTriangle size={16} />
              <span>You need {price - creditBalance} more credits. Redeem a credit coupon in your profile.</span>
            </div>
          )}
        </div>
      )}

      {isFreePackage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="game-card p-4 mb-6 border-emerald-500/25 bg-emerald-500/5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
              <Shield size={20} className="text-emerald-400" />
            </div>
            <div>
              <p className="font-bold text-sm text-emerald-400">AUTO-APPROVED</p>
              <p className="text-xs text-muted-foreground">Free packages are approved instantly</p>
            </div>
          </div>
        </motion.div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Server Selection */}
        <div>
          <Label className="font-poppins flex items-center gap-2 mb-2">
            <Globe size={14} /> Select Server *
          </Label>
          <div className="grid grid-cols-2 gap-2">
            {SERVERS.map((s) => (
              <button
                key={s.code}
                type="button"
                onClick={() => setServer(s.code)}
                className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl border transition-all ${
                  server === s.code
                    ? "bg-primary/10 border-primary/40 shadow-[0_0_12px_hsl(var(--primary)/0.15)]"
                    : "bg-card border-border hover:border-primary/30"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                  server === s.code ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {s.short}
                </div>
                <div className="text-left">
                  <p className={`text-sm font-semibold ${server === s.code ? "text-primary" : "text-foreground"}`}>{s.label}</p>
                  <p className="text-[10px] text-muted-foreground">{s.desc}</p>
                </div>
                {server === s.code && (
                  <motion.div
                    layoutId="order-server-check"
                    className="absolute right-3 w-2 h-2 rounded-full bg-primary"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {isVisit && (
            <div>
              <Label htmlFor="uid" className="font-poppins">Your UID *</Label>
              <Input id="uid" placeholder="Enter your UID" value={formData.uid} onChange={(e) => handleInputChange("uid", e.target.value)} className="mt-1 bg-card border-border focus:border-primary" />
            </div>
          )}

          {isTcpGuild && (
            <div>
              <Label htmlFor="guildUid" className="font-poppins">Guild UID *</Label>
              <Input id="guildUid" placeholder="Enter your Guild UID" value={formData.guildUid} onChange={(e) => handleInputChange("guildUid", e.target.value)} className="mt-1 bg-card border-border focus:border-primary" />
            </div>
          )}

          {isTcpFriend && (
            <div>
              <Label htmlFor="uid" className="font-poppins">Your UID *</Label>
              <Input id="uid" placeholder="Enter your UID" value={formData.uid} onChange={(e) => handleInputChange("uid", e.target.value)} className="mt-1 bg-card border-border focus:border-primary" />
            </div>
          )}

          <div>
            <Label htmlFor="telegram" className="font-poppins">Telegram Username *</Label>
            <Input id="telegram" placeholder="@yourusername" value={formData.telegramUsername} onChange={(e) => handleInputChange("telegramUsername", e.target.value)} className="mt-1 bg-card border-border focus:border-primary" />
          </div>
          <div>
            <Label htmlFor="whatsapp" className="font-poppins">WhatsApp Number *</Label>
            <Input id="whatsapp" placeholder="+880XXXXXXXXXX" value={formData.whatsappNumber} onChange={(e) => handleInputChange("whatsappNumber", e.target.value)} className="mt-1 bg-card border-border focus:border-primary" />
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={isSubmitting || (!isFreePackage && !hasEnoughCredits) || !user}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full neon-btn-solid rounded-xl py-4 text-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <><Loader2 size={20} className="animate-spin" /> Processing...</>
          ) : (
            <>{isFreePackage ? <Eye size={20} /> : <Coins size={20} />} {isFreePackage ? "Submit Free Order" : `Pay ${price} Credits & Submit`}</>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default OrderForm;
