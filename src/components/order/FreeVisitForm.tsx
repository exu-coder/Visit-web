import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Eye, Loader2, Globe, Hash, Zap } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

interface FreeVisitFormProps {
  selectedRegion: string;
  onBack: () => void;
  onResult: (data: any) => void;
  onAuthRequired: () => void;
}

const SERVERS = [
  { code: "bd", label: "Bangladesh", short: "BD", desc: "South Asia" },
  { code: "ind", label: "India", short: "IN", desc: "South Asia" },
];

const FreeVisitForm = ({ selectedRegion, onBack, onResult, onAuthRequired }: FreeVisitFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [uid, setUid] = useState("");
  const [server, setServer] = useState(selectedRegion === "India" ? "ind" : "bd");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: trialInfo, isLoading: trialLoading } = useQuery({
    queryKey: ["free-trial", user?.id],
    queryFn: async () => {
      if (!user) return { used: 0, limit: 3 };
      
      // Get daily limit setting
      const { data: limitSetting } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", "free_trial_user_daily_limit")
        .maybeSingle();
      
      const dailyLimit = parseInt(limitSetting?.setting_value || "3") || 0;
      
      // Count today's usage
      const todayStart = new Date();
      todayStart.setUTCHours(0, 0, 0, 0);
      
      const { count } = await supabase
        .from("free_trial_uses")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("used_at", todayStart.toISOString());
      
      return { used: count || 0, limit: dailyLimit };
    },
    enabled: !!user,
  });

  const trialUsed = trialInfo ? (trialInfo.limit > 0 && trialInfo.used >= trialInfo.limit) : false;
  const remainingUses = trialInfo ? (trialInfo.limit > 0 ? trialInfo.limit - trialInfo.used : Infinity) : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) { onAuthRequired(); return; }

    if (!uid.trim()) {
      toast({ title: "Missing UID", description: "Please enter your game UID", variant: "destructive" });
      return;
    }

    if (trialUsed) {
      toast({ title: "Trial Used", description: "You have already used your free trial.", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("visit-api", {
        body: { server, uid: uid.trim() },
      });

      if (error) throw new Error(error.message || "API call failed");
      if (data?.error) throw new Error(data.error);

      onResult(data.data);
    } catch (error) {
      console.error("Visit API error:", error);
      toast({
        title: "Request Failed",
        description: error instanceof Error ? error.message : "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
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
          <h2 className="font-orbitron font-bold text-xl">Free Visit Trial</h2>
          <p className="text-sm text-muted-foreground">One-time free visit service</p>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="game-card p-4 mb-6 border-emerald-500/25 bg-emerald-500/5"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center">
            <Zap size={20} className="text-emerald-400" />
          </div>
          <div>
            <p className="font-bold text-sm text-emerald-400">FREE TRIAL</p>
            <p className="text-xs text-muted-foreground">One visit per account - No credits required</p>
          </div>
        </div>
      </motion.div>

      {!user && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="game-card p-4 mb-6 border-amber-500/30 bg-amber-500/10">
          <p className="text-sm text-center text-amber-400 font-medium">Sign in to use your free trial</p>
          <button onClick={onAuthRequired} className="w-full mt-3 py-2 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors font-medium">
            Sign In / Create Account
          </button>
        </motion.div>
      )}

      {user && trialUsed && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="game-card p-4 mb-6 border-destructive/30 bg-destructive/5">
          <p className="text-sm text-center text-destructive font-medium">
            You have already used your free trial. Purchase a visit package for continued access.
          </p>
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
                    layoutId="free-server-check"
                    className="absolute right-3 w-2 h-2 rounded-full bg-primary"
                  />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* UID Input */}
        <div>
          <Label htmlFor="free-uid" className="font-poppins flex items-center gap-2">
            <Hash size={14} /> Your Game UID
          </Label>
          <Input
            id="free-uid"
            placeholder="Enter your game UID"
            value={uid}
            onChange={(e) => setUid(e.target.value)}
            className="mt-2 bg-card border-border focus:border-primary"
          />
        </div>

        {/* Submit */}
        <motion.button
          type="submit"
          disabled={isSubmitting || !user || trialUsed || trialLoading}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="w-full rounded-xl py-4 text-lg font-bold flex items-center justify-center gap-2 disabled:opacity-50 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.2)]"
        >
          {isSubmitting ? (
            <>
              <Loader2 size={20} className="animate-spin" />
              <span className="animate-pulse">Executing Visit...</span>
            </>
          ) : (
            <><Eye size={20} /> Execute Free Visit</>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default FreeVisitForm;