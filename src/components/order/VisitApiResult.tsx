import { motion } from "framer-motion";
import { CheckCircle, User, Eye, Star, Clock, Globe, Hash, ArrowLeft } from "lucide-react";

interface VisitApiData {
  fail: number;
  level: number;
  likes: number;
  nickname: string;
  region: string;
  success: number;
  time_seconds: number;
  uid: number;
}

interface VisitApiResultProps {
  data: VisitApiData;
  onDone: () => void;
}

const VisitApiResult = ({ data, onDone }: VisitApiResultProps) => {
  const successRate = data.success + data.fail > 0
    ? ((data.success / (data.success + data.fail)) * 100).toFixed(1)
    : "100";

  const stats = [
    { label: "Visits Sent", value: data.success.toLocaleString(), icon: Eye, color: "text-emerald-400" },
    { label: "Failed", value: data.fail.toLocaleString(), icon: Star, color: "text-red-400" },
    { label: "Success Rate", value: `${successRate}%`, icon: CheckCircle, color: "text-cyan-400" },
    { label: "Time Taken", value: `${data.time_seconds}s`, icon: Clock, color: "text-amber-400" },
    { label: "Level", value: data.level.toString(), icon: Hash, color: "text-violet-400" },
    { label: "Likes", value: data.likes.toLocaleString(), icon: Star, color: "text-pink-400" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="px-4 py-6 pb-28 max-w-lg mx-auto"
    >
      {/* Success Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-center mb-6"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-500/20 flex items-center justify-center border border-emerald-500/30">
          <CheckCircle size={32} className="text-emerald-400" />
        </div>
        <h2 className="font-orbitron font-bold text-xl text-foreground">Visit Complete</h2>
        <p className="text-sm text-muted-foreground mt-1">Free trial executed successfully</p>
      </motion.div>

      {/* Player Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="game-card p-5 mb-4"
      >
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-xl bg-primary/15 border border-primary/25 flex items-center justify-center">
            <User size={28} className="text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-orbitron font-bold text-lg truncate text-foreground">{data.nickname}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Globe size={12} />
                {data.region}
              </span>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Hash size={12} />
                {data.uid}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.05 }}
            className="game-card p-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <stat.icon size={14} className={stat.color} />
              <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">{stat.label}</span>
            </div>
            <p className={`font-orbitron font-bold text-xl ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Trial Notice */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="game-card p-4 mb-6 border-amber-500/20 bg-amber-500/5"
      >
        <p className="text-xs text-amber-400/80 text-center font-medium">
          This was your one-time free trial. Purchase a visit package for unlimited access.
        </p>
      </motion.div>

      {/* Back Button */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
        onClick={onDone}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-card border border-border hover:border-primary/40 transition-colors font-medium"
      >
        <ArrowLeft size={18} />
        Back to Packages
      </motion.button>
    </motion.div>
  );
};

export default VisitApiResult;