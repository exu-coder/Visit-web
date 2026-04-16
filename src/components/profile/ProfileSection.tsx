import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Package, Clock, CheckCircle, XCircle, LogOut, LogIn, Loader2, Coins, Ticket } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import AuthModal from "@/components/auth/AuthModal";
import { Input } from "@/components/ui/input";

interface Order {
  id: string;
  product_name: string;
  price: string;
  price_value: number;
  status: "pending" | "approved" | "completed" | "rejected";
  created_at: string;
  guild_uid: string;
}

interface ProfileSectionProps {
  onAuthRequired?: () => void;
}

const ProfileSection = ({ onAuthRequired }: ProfileSectionProps) => {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [savedGuildUid, setSavedGuildUid] = useState<string>("");
  const [creditBalance, setCreditBalance] = useState(0);
  
  // Credit coupon redemption
  const [couponCode, setCouponCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);

  const fetchData = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const [ordersRes, profileRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, product_name, price, price_value, status, created_at, guild_uid")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("guild_uid, credit_balance")
          .eq("user_id", user.id)
          .maybeSingle()
      ]);

      if (ordersRes.data) setOrders(ordersRes.data as Order[]);
      if (profileRes.data) {
        setSavedGuildUid(profileRes.data.guild_uid || "");
        setCreditBalance(profileRes.data.credit_balance || 0);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    } else {
      setOrders([]);
      setSavedGuildUid("");
      setCreditBalance(0);
    }
  }, [user]);

  const redeemCoupon = async () => {
    if (!user || !couponCode.trim()) return;
    
    setIsRedeeming(true);
    try {
      // Find the coupon
      const { data: coupon, error: couponError } = await supabase
        .from("credit_coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase().trim())
        .eq("is_redeemed", false)
        .maybeSingle();

      if (couponError || !coupon) {
        toast({ title: "Invalid Code", description: "This credit code is invalid or already used.", variant: "destructive" });
        return;
      }

      // Fetch current balance first to avoid stale state
      const { data: currentProfile, error: profileFetchError } = await supabase
        .from("profiles")
        .select("credit_balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileFetchError || !currentProfile) {
        toast({ title: "Error", description: "Could not fetch your profile. Try again.", variant: "destructive" });
        return;
      }

      // Redeem: mark coupon as used and add credits
      const { error: updateError } = await supabase
        .from("credit_coupons")
        .update({ is_redeemed: true, redeemed_by: user.id, redeemed_at: new Date().toISOString() })
        .eq("id", coupon.id);

      if (updateError) throw updateError;

      const newBalance = (currentProfile.credit_balance || 0) + coupon.credit_amount;
      const { error: balanceError } = await supabase
        .from("profiles")
        .update({ credit_balance: newBalance })
        .eq("user_id", user.id);

      if (balanceError) throw balanceError;

      setCreditBalance(newBalance);
      setCouponCode("");
      toast({
        title: "Credits Added!",
        description: `${coupon.credit_amount} credits have been added to your account.`,
      });
    } catch (error) {
      console.error("Redeem error:", error);
      toast({ title: "Error", description: "Failed to redeem coupon", variant: "destructive" });
    } finally {
      setIsRedeeming(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed Out", description: "You have been signed out successfully" });
  };

  const getStatusIcon = (status: Order["status"]) => {
    switch (status) {
      case "pending": return <Clock className="text-warning" size={18} />;
      case "approved": return <CheckCircle className="text-primary" size={18} />;
      case "completed": return <CheckCircle className="text-success" size={18} />;
      case "rejected": return <XCircle className="text-destructive" size={18} />;
    }
  };

  const getStatusText = (status: Order["status"]) => {
    switch (status) {
      case "pending": return "Pending Review";
      case "approved": return "Approved";
      case "completed": return "Completed";
      case "rejected": return "Rejected";
    }
  };

  if (authLoading) {
    return (
      <section className="px-4 py-8 pb-28 flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-primary" />
      </section>
    );
  }

  if (!user) {
    return (
      <section className="px-4 py-8 pb-28">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h2 className="section-title">MY PROFILE</h2>
        </motion.div>
        <div className="max-w-lg mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="game-card p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary/20 flex items-center justify-center glow-red-soft">
              <User size={40} className="text-primary" />
            </div>
            <h3 className="font-orbitron font-bold text-xl mb-2">Welcome, Gamer!</h3>
            <p className="text-muted-foreground mb-6">Sign in to track your orders and manage your credits</p>
            <button onClick={() => setShowAuthModal(true)} className="neon-btn-solid rounded-xl px-8 py-3 font-bold flex items-center justify-center gap-2 mx-auto">
              <LogIn size={20} /> Sign In / Sign Up
            </button>
          </motion.div>
        </div>
        <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
      </section>
    );
  }

  return (
    <section className="px-4 py-8 pb-28">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <h2 className="section-title">MY PROFILE</h2>
      </motion.div>

      <div className="max-w-lg mx-auto space-y-6">
        {/* User Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="game-card p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center glow-red-soft">
                <User size={32} className="text-primary" />
              </div>
              <div>
                <h3 className="font-orbitron font-bold text-lg">{user.email?.split("@")[0]}</h3>
                {savedGuildUid && (
                  <p className="text-sm text-muted-foreground">Guild UID: <span className="text-primary">{savedGuildUid}</span></p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{orders.length} order{orders.length !== 1 ? "s" : ""} placed</p>
              </div>
            </div>
            <button onClick={handleSignOut} className="p-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors">
              <LogOut size={20} />
            </button>
          </div>
        </motion.div>

        {/* Credit Balance */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="game-card p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Coins size={24} className="text-primary" />
              <h3 className="font-orbitron font-bold text-lg">Credit Balance</h3>
            </div>
            <span className="font-orbitron font-black text-2xl text-primary glow-text">{creditBalance}</span>
          </div>
          
          {/* Redeem Credit Coupon */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3 flex items-center gap-2">
              <Ticket size={16} className="text-primary" />
              Redeem Credit Coupon
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="Enter credit code"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                className="flex-1 uppercase bg-card border-border focus:border-primary"
              />
              <button
                onClick={redeemCoupon}
                disabled={isRedeeming || !couponCode.trim()}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {isRedeeming ? <Loader2 size={18} className="animate-spin" /> : "Redeem"}
              </button>
            </div>
          </div>
        </motion.div>

        {/* Orders List */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-orbitron font-bold text-lg flex items-center gap-2">
              <Package size={20} className="text-primary" />
              Order History
            </h3>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          ) : orders.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="game-card p-8 text-center">
              <Package size={48} className="mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No orders yet</p>
              <p className="text-sm text-muted-foreground mt-1">Your order history will appear here</p>
            </motion.div>
          ) : (
            <div className="space-y-3">
              {orders.map((order, index) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="game-card p-4"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-foreground">{order.product_name}</h4>
                      <p className="text-sm text-muted-foreground">{order.price}</p>
                      <p className="text-xs text-muted-foreground mt-1">{new Date(order.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(order.status)}
                      <span className="text-sm font-medium">{getStatusText(order.status)}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </section>
  );
};

export default ProfileSection;
