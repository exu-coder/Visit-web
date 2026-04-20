import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Package,
  Users,
  Coins,
  ShoppingCart,
  Loader2,
  BarChart3,
  Activity,
  Target,
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface DailyPoint {
  date: string;
  fullDate: string;
  orders: number;
  revenue: number;
  newUsers: number;
}

interface PackageStat {
  name: string;
  count: number;
  revenue: number;
}

interface Analytics {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  rejectedOrders: number;
  approvedOrders: number;
  totalRevenue: number;
  totalUsers: number;
  newUsers30d: number;
  conversionRate: number;
  averageOrderValue: number;
  daily: DailyPoint[];
  topPackages: PackageStat[];
  statusBreakdown: { name: string; value: number; color: string }[];
}

const RANGES = [
  { key: "7d", label: "7 days", days: 7 },
  { key: "30d", label: "30 days", days: 30 },
  { key: "90d", label: "90 days", days: 90 },
] as const;

const AnalyticsDashboard = () => {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState<typeof RANGES[number]["key"]>("30d");

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      const days = RANGES.find((r) => r.key === range)!.days;
      const since = new Date();
      since.setDate(since.getDate() - days);
      since.setHours(0, 0, 0, 0);

      const [ordersRes, usersRes] = await Promise.all([
        supabase.from("orders").select("*"),
        supabase.from("profiles").select("id, created_at"),
      ]);

      if (ordersRes.error) throw ordersRes.error;
      if (usersRes.error) throw usersRes.error;

      const orders = ordersRes.data || [];
      const users = usersRes.data || [];

      const totalOrders = orders.length;
      const completedOrders = orders.filter((o) => o.status === "completed").length;
      const approvedOrders = orders.filter((o) => o.status === "approved").length;
      const pendingOrders = orders.filter((o) => o.status === "pending").length;
      const rejectedOrders = orders.filter((o) => o.status === "rejected").length;

      const totalRevenue = orders
        .filter((o) => o.status === "completed" || o.status === "approved")
        .reduce((sum, o) => sum + (o.price_value || 0), 0);

      const conversionRate =
        totalOrders > 0 ? ((completedOrders + approvedOrders) / totalOrders) * 100 : 0;

      const paidOrders = orders.filter(
        (o) => (o.status === "completed" || o.status === "approved") && o.price_value > 0
      );
      const averageOrderValue =
        paidOrders.length > 0
          ? paidOrders.reduce((s, o) => s + o.price_value, 0) / paidOrders.length
          : 0;

      const newUsers30d = users.filter((u) => new Date(u.created_at) >= since).length;

      // Top packages (in selected range)
      const packageCounts: Record<string, { count: number; revenue: number }> = {};
      orders
        .filter((o) => new Date(o.created_at) >= since)
        .forEach((order) => {
          if (!packageCounts[order.product_name]) {
            packageCounts[order.product_name] = { count: 0, revenue: 0 };
          }
          packageCounts[order.product_name].count++;
          if (order.status === "completed" || order.status === "approved") {
            packageCounts[order.product_name].revenue += order.price_value || 0;
          }
        });

      const topPackages = Object.entries(packageCounts)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 6);

      // Daily series
      const daily: DailyPoint[] = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const dateStr = d.toISOString().split("T")[0];
        const dayOrders = orders.filter((o) => o.created_at.split("T")[0] === dateStr);
        const dayUsers = users.filter((u) => u.created_at.split("T")[0] === dateStr);
        daily.push({
          date:
            days <= 7
              ? d.toLocaleDateString("en-US", { weekday: "short" })
              : d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
          fullDate: dateStr,
          orders: dayOrders.length,
          revenue: dayOrders
            .filter((o) => o.status === "completed" || o.status === "approved")
            .reduce((s, o) => s + (o.price_value || 0), 0),
          newUsers: dayUsers.length,
        });
      }

      const statusBreakdown = [
        { name: "Completed", value: completedOrders, color: "hsl(var(--success))" },
        { name: "Approved", value: approvedOrders, color: "hsl(var(--primary))" },
        { name: "Pending", value: pendingOrders, color: "hsl(var(--warning))" },
        { name: "Rejected", value: rejectedOrders, color: "hsl(var(--destructive))" },
      ].filter((s) => s.value > 0);

      setAnalytics({
        totalOrders,
        completedOrders,
        approvedOrders,
        pendingOrders,
        rejectedOrders,
        totalRevenue,
        totalUsers: users.length,
        newUsers30d,
        conversionRate,
        averageOrderValue,
        daily,
        topPackages,
        statusBreakdown,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="game-card p-12 text-center">
        <BarChart3 size={48} className="mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  const tooltipStyle = {
    backgroundColor: "hsl(var(--card))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "8px",
    fontSize: "12px",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="text-xl font-orbitron font-bold">Analytics Dashboard</h2>
        <div className="flex gap-1 p-1 rounded-lg bg-card border border-border">
          {RANGES.map((r) => (
            <button
              key={r.key}
              onClick={() => setRange(r.key)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                range === r.key
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          {
            icon: Coins,
            label: "Revenue (Credits)",
            value: analytics.totalRevenue.toLocaleString(),
            color: "primary",
          },
          {
            icon: ShoppingCart,
            label: "Total Orders",
            value: analytics.totalOrders.toString(),
            color: "success",
          },
          {
            icon: TrendingUp,
            label: "Completed",
            value: analytics.completedOrders.toString(),
            color: "success",
          },
          {
            icon: Target,
            label: "Conversion",
            value: `${analytics.conversionRate.toFixed(1)}%`,
            color: "warning",
          },
          {
            icon: Activity,
            label: "Avg Order",
            value: analytics.averageOrderValue.toFixed(0),
            color: "primary",
          },
          {
            icon: Users,
            label: `New Users (${range})`,
            value: analytics.newUsers30d.toString(),
            color: "secondary",
          },
        ].map((metric, i) => (
          <motion.div
            key={metric.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="game-card p-4"
          >
            <div className={`p-2 rounded-lg bg-${metric.color}/20 inline-flex mb-2`}>
              <metric.icon size={18} className={`text-${metric.color}`} />
            </div>
            <p className="text-xs text-muted-foreground">{metric.label}</p>
            <p className="text-xl font-orbitron font-bold mt-1">{metric.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Revenue Trend */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="game-card p-6"
      >
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <TrendingUp size={18} className="text-primary" /> Revenue Trend
        </h3>
        <ResponsiveContainer width="100%" height={250}>
          <AreaChart data={analytics.daily}>
            <defs>
              <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.5} />
                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              fill="url(#revGrad)"
              name="Revenue"
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Orders + Users daily */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="game-card p-6"
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <ShoppingCart size={18} className="text-primary" /> Orders Per Day
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={analytics.daily}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="game-card p-6"
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Users size={18} className="text-primary" /> New Users Per Day
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={analytics.daily}>
              <defs>
                <linearGradient id="usrGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--success))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--success))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={11} />
              <Tooltip contentStyle={tooltipStyle} />
              <Area
                type="monotone"
                dataKey="newUsers"
                stroke="hsl(var(--success))"
                strokeWidth={2}
                fill="url(#usrGrad)"
                name="New Users"
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Top packages + Status pie */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="game-card p-6"
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Package size={18} className="text-primary" /> Top Packages
          </h3>
          {analytics.topPackages.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <Package size={32} className="mr-2" />
              No orders in this period
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={analytics.topPackages} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={11} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={10}
                  width={100}
                />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="count" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Orders" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="game-card p-6"
        >
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 size={18} className="text-primary" /> Order Status
          </h3>
          {analytics.statusBreakdown.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              No orders yet
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={analytics.statusBreakdown}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={50}
                  outerRadius={90}
                  paddingAngle={2}
                >
                  {analytics.statusBreakdown.map((entry, idx) => (
                    <Cell key={idx} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
