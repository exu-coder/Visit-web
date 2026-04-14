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

const FreeVisitForm = ({ selectedRegion, onBack, onResult, onAuthRequired }: FreeVisitFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [uid, setUid] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user already used free trial
  const { data: trialUsed, isLoading: trialLoading } = useQuery({
    queryKey: ["free-trial", user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from("free_trial_uses")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      return !!data;
    },
    enabled: !!user,
  });

  const serverCode = selectedRegion === "India" ? "ind" : "bd";

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
        body: { server: serverCode, uid: uid.trim() },
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
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button onClick={onBack} className="p-2 rounded-lg bg-card border border-border hover:border-primary transition-colors">
          <ArrowLeft size={20} />
        </button>
        <div>
          <h2 className="font-orbitron font-bold text-xl">Free Visit Trial</h2>
          <p className="text-sm text-muted-foreground">One-time free visit service</p>
        </div>
      </div>

      {/* Trial Badge */}
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
        {/* Server Display */}
        <div className="game-card p-4">
          <div className="flex items-center gap-3">
            <Globe size={18} className="text-primary" />
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">Server</p>
              <p className="font-orbitron font-bold text-primary">{selectedRegion} ({serverCode.toUpperCase()})</p>
            </div>
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
            <><Loader2 size={20} className="animate-spin" /> Processing Visit...</>
          ) : (
            <><Eye size={20} /> Execute Free Visit</>
          )}
        </motion.button>
      </form>
    </motion.div>
  );
};

export default FreeVisitForm;