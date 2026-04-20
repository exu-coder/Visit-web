import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { User, Package, Clock, CheckCircle, XCircle, LogOut, LogIn, Loader2, Coins, Ticket, History, ArrowDownCircle, ArrowUpCircle, Settings as SettingsIcon } from "lucide-react";
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

interface CreditTransaction {
  id: string;
  type: "coupon_redemption" | "order_payment" | "admin_adjustment" | "refund";
  amount: number;
  balance_after: number;
  description: string | null;
  created_at: string;
}

interface ProfileSectionProps {
  onAuthRequired?: () => void;
}

const ProfileSection = ({ onAuthRequired }: ProfileSectionProps) => {
  const { user, isLoading: authLoading, signOut } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [savedGuildUid, setSavedGuildUid] = useState<string>("");
  const [creditBalance, setCreditBalance] = useState(0);
  const [profileComplete, setProfileComplete] = useState(true);
  const [showHistory, setShowHistory] = useState(false);

  // Profile edit state
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [profileForm, setProfileForm] = useState({ telegram_username: "", whatsapp_number: "" });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Credit coupon redemption
  const [couponCode, setCouponCode] = useState("");
  const [isRedeeming, setIsRedeeming] = useState(false);

  const fetchData = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [ordersRes, profileRes, txRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, product_name, price, price_value, status, created_at, guild_uid")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("guild_uid, credit_balance, telegram_username, whatsapp_number")
          .eq("user_id", user.id)
          .maybeSingle(),
        supabase
          .from("credit_transactions")
          .select("id, type, amount, balance_after, description, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(50),
      ]);

      if (ordersRes.data) setOrders(ordersRes.data as Order[]);
      if (profileRes.data) {
        setSavedGuildUid(profileRes.data.guild_uid || "");
        setCreditBalance(profileRes.data.credit_balance || 0);
        const complete = !!(profileRes.data.telegram_username && profileRes.data.whatsapp_number);
        setProfileComplete(complete);
        setProfileForm({
          telegram_username: profileRes.data.telegram_username || "",
          whatsapp_number: profileRes.data.whatsapp_number || "",
        });
      }
      if (txRes.data) setTransactions(txRes.data as CreditTransaction[]);
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
      setTransactions([]);
      setSavedGuildUid("");
      setCreditBalance(0);
    }
  }, [user]);

  // Realtime: listen for order status changes
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel(`orders-user-${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const newOrder = payload.new as Order;
          const oldOrder = payload.old as Order;

          // Update local state
          setOrders((prev) => prev.map((o) => (o.id === newOrder.id ? { ...o, ...newOrder } : o)));

          // Toast on status change
          if (oldOrder.status !== newOrder.status) {
            const statusMessages: Record<Order["status"], { title: string; variant?: "default" | "destructive" }> = {
              approved: { title: "Order Approved!" },
              completed: { title: "Order Completed!" },
              rejected: { title: "Order Rejected", variant: "destructive" },
              pending: { title: "Order Pending" },
            };
            const msg = statusMessages[newOrder.status];
            toast({
              title: msg.title,
              description: `${newOrder.product_name} — status updated to ${newOrder.status}`,
              variant: msg.variant,
            });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, toast]);

  const logAttempt = async (code: string, success: boolean) => {
    if (!user) return;
    await supabase.from("coupon_redemption_attempts").insert({
      user_id: user.id,
      code_attempted: code,
      success,
    });
  };

  const redeemCoupon = async () => {
    if (!user || !couponCode.trim()) return;

    setIsRedeeming(true);
    const codeToTry = couponCode.toUpperCase().trim();

    try {
      // Rate limit check (server-side)
      const { data: rateLimit, error: rateLimitError } = await supabase
        .rpc("check_coupon_redemption_rate_limit", { _user_id: user.id });

      if (rateLimitError) {
        console.error("Rate limit check error:", rateLimitError);
      } else if (rateLimit && rateLimit.length > 0 && !rateLimit[0].allowed) {
        toast({
          title: "Slow down",
          description: rateLimit[0].reason || "Too many attempts. Try again later.",
          variant: "destructive",
        });
        return;
      }

      const { data: coupon, error: couponError } = await supabase
        .from("credit_coupons")
        .select("*")
        .eq("code", codeToTry)
        .eq("is_redeemed", false)
        .maybeSingle();

      if (couponError || !coupon) {
        await logAttempt(codeToTry, false);
        toast({ title: "Invalid Code", description: "This credit code is invalid or already used.", variant: "destructive" });
        return;
      }

      const { data: currentProfile, error: profileFetchError } = await supabase
        .from("profiles")
        .select("credit_balance")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileFetchError || !currentProfile) {
        await logAttempt(codeToTry, false);
        toast({ title: "Error", description: "Could not fetch your profile. Try again.", variant: "destructive" });
        return;
      }

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

      // Log transaction & successful attempt
      await Promise.all([
        supabase.from("credit_transactions").insert({
          user_id: user.id,
          type: "coupon_redemption",
          amount: coupon.credit_amount,
          balance_after: newBalance,
          description: `Redeemed coupon ${coupon.code}`,
          related_coupon_id: coupon.id,
        }),
        logAttempt(codeToTry, true),
      ]);

      setCreditBalance(newBalance);
      setCouponCode("");
      toast({
        title: "Credits Added!",
        description: `${coupon.credit_amount} credits have been added to your account.`,
      });
      fetchData();
    } catch (error) {
      console.error("Redeem error:", error);
      await logAttempt(codeToTry, false);
      toast({ title: "Error", description: "Failed to redeem coupon", variant: "destructive" });
    } finally {
      setIsRedeeming(false);
    }
  };

  const saveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          telegram_username: profileForm.telegram_username.trim(),
          whatsapp_number: profileForm.whatsapp_number.trim(),
        })
        .eq("user_id", user.id);
      if (error) throw error;
      toast({ title: "Profile Updated", description: "Your contact info has been saved." });
      setShowProfileEdit(false);
      fetchData();
    } catch (error) {
      toast({ title: "Error", description: "Failed to save profile", variant: "destructive" });
    } finally {
      setIsSavingProfile(false);
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

  const getTxLabel = (type: CreditTransaction["type"]) => {
    switch (type) {
      case "coupon_redemption": return "Coupon Redeemed";
      case "order_payment": return "Order Payment";
      case "admin_adjustment": return "Admin Adjustment";
      case "refund": return "Refund";
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
        {/* Profile completion prompt */}
        {!profileComplete && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="game-card p-4 border-warning/40 bg-warning/5">
            <div className="flex items-start gap-3">
              <SettingsIcon size={20} className="text-warning shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-sm text-warning">Complete your profile</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Add your Telegram username and WhatsApp number so we can deliver your orders faster.
                </p>
                <button
                  onClick={() => setShowProfileEdit(true)}
                  className="mt-3 px-3 py-1.5 rounded-lg bg-warning/20 text-warning hover:bg-warning/30 transition-colors text-xs font-medium"
                >
                  Complete Profile
                </button>
              </div>
            </div>
          </motion.div>
        )}

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
            <div className="flex flex-col gap-2">
              <button
                onClick={() => setShowProfileEdit(true)}
                className="p-2 rounded-lg bg-card border border-border hover:border-primary transition-colors"
                title="Edit profile"
              >
                <SettingsIcon size={18} />
              </button>
              <button onClick={handleSignOut} className="p-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Profile edit form */}
        {showProfileEdit && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="game-card p-6">
            <h4 className="font-orbitron font-bold mb-4">Edit Contact Info</h4>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-muted-foreground">Telegram Username</label>
                <Input
                  placeholder="@yourusername"
                  value={profileForm.telegram_username}
                  onChange={(e) => setProfileForm((p) => ({ ...p, telegram_username: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">WhatsApp Number</label>
                <Input
                  placeholder="+880XXXXXXXXXX"
                  value={profileForm.whatsapp_number}
                  onChange={(e) => setProfileForm((p) => ({ ...p, whatsapp_number: e.target.value }))}
                  className="mt-1"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  onClick={saveProfile}
                  disabled={isSavingProfile}
                  className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 text-sm font-medium"
                >
                  {isSavingProfile ? <Loader2 size={16} className="animate-spin mx-auto" /> : "Save"}
                </button>
                <button
                  onClick={() => setShowProfileEdit(false)}
                  className="px-4 py-2 rounded-lg bg-card border border-border hover:border-primary transition-colors text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}

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

          {/* Toggle transaction history */}
          <button
            onClick={() => setShowHistory((s) => !s)}
            className="mt-4 w-full flex items-center justify-center gap-2 py-2 rounded-lg bg-card border border-border hover:border-primary transition-colors text-sm"
          >
            <History size={16} />
            {showHistory ? "Hide" : "View"} Credit History
          </button>

          {showHistory && (
            <div className="mt-4 pt-4 border-t border-border space-y-2 max-h-80 overflow-y-auto">
              {transactions.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No transactions yet</p>
              ) : (
                transactions.map((tx) => {
                  const isPositive = tx.amount > 0;
                  return (
                    <div key={tx.id} className="flex items-start justify-between gap-2 p-3 rounded-lg bg-card/50 border border-border">
                      <div className="flex items-start gap-2 flex-1 min-w-0">
                        {isPositive ? (
                          <ArrowUpCircle size={18} className="text-success shrink-0 mt-0.5" />
                        ) : (
                          <ArrowDownCircle size={18} className="text-destructive shrink-0 mt-0.5" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium">{getTxLabel(tx.type)}</p>
                          {tx.description && (
                            <p className="text-xs text-muted-foreground truncate">{tx.description}</p>
                          )}
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(tx.created_at).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`font-orbitron font-bold ${isPositive ? "text-success" : "text-destructive"}`}>
                          {isPositive ? "+" : ""}{tx.amount}
                        </p>
                        <p className="text-[10px] text-muted-foreground">bal: {tx.balance_after}</p>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}
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
