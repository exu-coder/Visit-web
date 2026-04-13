import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Loader2, Coins, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface CreditCoupon {
  id: string;
  code: string;
  credit_amount: number;
  is_redeemed: boolean;
  redeemed_by: string | null;
  redeemed_at: string | null;
  created_at: string;
}

const generateCode = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "EXU-";
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

const CreditCouponsManager = () => {
  const { toast } = useToast();
  const [coupons, setCoupons] = useState<CreditCoupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [creditAmount, setCreditAmount] = useState(100);
  const [bulkCount, setBulkCount] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchCoupons = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("credit_coupons")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      toast({ title: "Error", description: "Failed to fetch credit coupons", variant: "destructive" });
    } else {
      setCoupons(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => { fetchCoupons(); }, []);

  const createCoupons = async () => {
    if (creditAmount <= 0 || bulkCount <= 0) return;
    setIsCreating(true);

    try {
      const newCoupons = Array.from({ length: bulkCount }, () => ({
        code: generateCode(),
        credit_amount: creditAmount,
      }));

      const { error } = await supabase.from("credit_coupons").insert(newCoupons);
      if (error) throw error;

      toast({ title: "Success", description: `${bulkCount} credit coupon(s) created` });
      fetchCoupons();
    } catch (error) {
      toast({ title: "Error", description: "Failed to create coupons", variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const deleteCoupon = async (id: string) => {
    const { error } = await supabase.from("credit_coupons").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: "Failed to delete coupon", variant: "destructive" });
    } else {
      setCoupons(prev => prev.filter(c => c.id !== id));
    }
  };

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-orbitron font-bold">Credit Coupons</h2>

      {/* Generate Form */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="game-card p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <Coins size={20} className="text-primary" />
          Generate Credit Coupons
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <Label>Credit Amount</Label>
            <Input
              type="number"
              min={1}
              value={creditAmount}
              onChange={(e) => setCreditAmount(parseInt(e.target.value) || 0)}
              className="mt-1"
            />
          </div>
          <div>
            <Label>Number of Coupons</Label>
            <Input
              type="number"
              min={1}
              max={50}
              value={bulkCount}
              onChange={(e) => setBulkCount(parseInt(e.target.value) || 1)}
              className="mt-1"
            />
          </div>
          <div className="flex items-end">
            <button
              onClick={createCoupons}
              disabled={isCreating}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isCreating ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
              Generate
            </button>
          </div>
        </div>
      </motion.div>

      {/* Coupons List */}
      <div className="space-y-3">
        {coupons.map((coupon) => (
          <motion.div
            key={coupon.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`game-card p-4 flex items-center justify-between ${coupon.is_redeemed ? 'opacity-60' : ''}`}
          >
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${coupon.is_redeemed ? 'bg-muted' : 'bg-primary/20'}`}>
                <Coins size={20} className={coupon.is_redeemed ? "text-muted-foreground" : "text-primary"} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <code className="font-mono font-bold text-foreground">{coupon.code}</code>
                  <button onClick={() => copyCode(coupon.code, coupon.id)} className="p-1 hover:bg-muted rounded">
                    {copiedId === coupon.id ? <Check size={14} className="text-success" /> : <Copy size={14} className="text-muted-foreground" />}
                  </button>
                </div>
                <p className="text-sm text-muted-foreground">
                  {coupon.credit_amount} Credits
                  {coupon.is_redeemed && " • Redeemed"}
                  {coupon.redeemed_at && ` on ${new Date(coupon.redeemed_at).toLocaleDateString()}`}
                </p>
              </div>
            </div>
            {!coupon.is_redeemed && (
              <button
                onClick={() => deleteCoupon(coupon.id)}
                className="p-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            )}
          </motion.div>
        ))}
        {coupons.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">No credit coupons generated yet</div>
        )}
      </div>
    </div>
  );
};

export default CreditCouponsManager;
