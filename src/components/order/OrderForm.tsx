import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Coins, Loader2, AlertTriangle } from "lucide-react";
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

const OrderForm = ({ pkg, selectedRegion, onBack, onSubmit, onAuthRequired }: OrderFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
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

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const isFreePackage = price === 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) { onAuthRequired(); return; }
    // Validate based on category
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
      if (!isFreePackage) {
        const { error: creditError } = await supabase
          .from("profiles")
          .update({ credit_balance: creditBalance - price })
          .eq("user_id", user.id);
        if (creditError) throw new Error("Failed to deduct credits");
      }

      const guildUidValue = isTcpGuild ? formData.guildUid : (isVisit || isTcpFriend ? formData.uid : formData.guildUid);

      const { error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          product_id: pkg.id,
          product_name: pkg.name,
          price: isFreePackage ? "FREE" : `${price} Credits`,
          price_value: price,
          trx_id: `CR-${Date.now()}`,
          guild_uid: guildUidValue,
          region: selectedRegion,
          telegram_username: formData.telegramUsername,
          whatsapp_number: formData.whatsappNumber,
          payment_method: "credits",
          status: "pending",
        });

      if (orderError) {
        if (!isFreePackage) {
          await supabase.from("profiles").update({ credit_balance: creditBalance }).eq("user_id", user.id);
        }
        throw new Error("Failed to create order");
      }

      await supabase.from("profiles").update({
        guild_uid: formData.guildUid || formData.uid,
        telegram_username: formData.telegramUsername,
        whatsapp_number: formData.whatsappNumber,
      }).eq("user_id", user.id);

      toast({ title: "Order Submitted!", description: isFreePackage ? "Your free order has been placed." : `${price} credits deducted. Check your profile for updates.` });
      onSubmit();
    } catch (error) {
      console.error("Order submission error:", error);
      toast({ title: "Order Failed", description: error instanceof Error ? error.message : "Something went wrong", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryLabel = () => {
    if (isVisit) return `Visit • ${selectedRegion}`;
    if (isTcpGuild) return "TCP • Guild";
    if (isTcpFriend) return "TCP • Friend";
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
            <span className="text-warning font-medium">⚠️ Please sign in</span> to place your order
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
            <div className="text-2xl font-orbitron font-black text-primary flex items-center gap-1">
              <Coins size={22} />
              {price}
            </div>
            <div className="text-xs text-muted-foreground">Credits</div>
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

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-4">
          {/* Visit: UID field */}
          {isVisit && (
            <div>
              <Label htmlFor="uid" className="font-poppins">Your UID *</Label>
              <Input id="uid" placeholder="Enter your UID" value={formData.uid} onChange={(e) => handleInputChange("uid", e.target.value)} className="mt-1 bg-card border-border focus:border-primary" />
            </div>
          )}

          {/* TCP Guild: Guild UID field */}
          {isTcpGuild && (
            <div>
              <Label htmlFor="guildUid" className="font-poppins">Guild UID *</Label>
              <Input id="guildUid" placeholder="Enter your Guild UID" value={formData.guildUid} onChange={(e) => handleInputChange("guildUid", e.target.value)} className="mt-1 bg-card border-border focus:border-primary" />
            </div>
          )}

          {/* TCP Friend: UID field */}
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
