import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  TrendingUp,
  Package,
  Users,
  DollarSign,
  ShoppingCart,
  Loader2,
  BarChart3,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Analytics {
  totalOrders: number;
  completedOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalUsers: number;
  topPackages: { name: string; count: number; revenue: number }[];
  recentActivity: { date: string; orders: number; revenue: number }[];
}

const AnalyticsDashboard = () => {
  const { toast } = useToast();
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    try {
      // Fetch orders
      const { data: orders, error: ordersError } = await supabase
        .from("orders")
        .select("*");

      if (ordersError) throw ordersError;

      // Fetch users
      const { data: users, error: usersError } = await supabase
        .from("profiles")
        .select("id");

      if (usersError) throw usersError;

      // Calculate analytics
      const totalOrders = orders?.length || 0;
      const completedOrders = orders?.filter((o) => o.status === "completed").length || 0;
      const pendingOrders = orders?.filter((o) => o.status === "pending").length || 0;
      const totalRevenue = orders
        ?.filter((o) => o.status === "completed")
        .reduce((sum, o) => sum + (o.price_value || 0), 0) || 0;

      // Top packages
      const packageCounts: Record<string, { count: number; revenue: number }> = {};
      orders?.forEach((order) => {
        if (!packageCounts[order.product_name]) {
          packageCounts[order.product_name] = { count: 0, revenue: 0 };
        }
        packageCounts[order.product_name].count++;
        if (order.status === "completed") {
          packageCounts[order.product_name].revenue += order.price_value || 0;
        }
      });

      const topPackages = Object.entries(packageCounts)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Recent activity (last 7 days)
      const today = new Date();
      const recentActivity: { date: string; orders: number; revenue: number }[] = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];
        const dayOrders = orders?.filter(
          (o) => o.created_at.split("T")[0] === dateStr
        ) || [];
        recentActivity.push({
          date: date.toLocaleDateString("en-US", { weekday: "short" }),
          orders: dayOrders.length,
          revenue: dayOrders
            .filter((o) => o.status === "completed")
            .reduce((sum, o) => sum + (o.price_value || 0), 0),
        });
      }

      setAnalytics({
        totalOrders,
        completedOrders,
        pendingOrders,
        totalRevenue,
        totalUsers: users?.length || 0,
        topPackages,
        recentActivity,
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
  }, []);

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

  const maxDailyOrders = Math.max(...analytics.recentActivity.map((d) => d.orders), 1);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-orbitron font-bold">Analytics Dashboard</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="game-card p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-primary/20">
              <DollarSign size={20} className="text-primary" />
            </div>
            <span className="text-sm text-muted-foreground">Total Revenue</span>
          </div>
          <p className="text-2xl font-orbitron font-bold">
            ৳{analytics.totalRevenue.toLocaleString()}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="game-card p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-success/20">
              <ShoppingCart size={20} className="text-success" />
            </div>
            <span className="text-sm text-muted-foreground">Total Orders</span>
          </div>
          <p className="text-2xl font-orbitron font-bold">{analytics.totalOrders}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="game-card p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-warning/20">
              <TrendingUp size={20} className="text-warning" />
            </div>
            <span className="text-sm text-muted-foreground">Completed</span>
          </div>
          <p className="text-2xl font-orbitron font-bold">{analytics.completedOrders}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="game-card p-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 rounded-lg bg-secondary/50">
              <Users size={20} className="text-secondary-foreground" />
            </div>
            <span className="text-sm text-muted-foreground">Total Users</span>
          </div>
          <p className="text-2xl font-orbitron font-bold">{analytics.totalUsers}</p>
        </motion.div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="game-card p-6"
        >
          <h3 className="font-semibold mb-4">Weekly Activity</h3>
          <div className="flex items-end justify-between gap-2 h-40">
            {analytics.recentActivity.map((day, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-primary/80 rounded-t transition-all duration-500"
                  style={{
                    height: `${(day.orders / maxDailyOrders) * 100}%`,
                    minHeight: day.orders > 0 ? "8px" : "2px",
                  }}
                />
                <span className="text-xs text-muted-foreground">{day.date}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded bg-primary" />
              <span className="text-muted-foreground">Orders</span>
            </div>
          </div>
        </motion.div>

        {/* Top Packages */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="game-card p-6"
        >
          <h3 className="font-semibold mb-4">Top Packages</h3>
          {analytics.topPackages.length === 0 ? (
            <div className="flex items-center justify-center h-40 text-muted-foreground">
              <Package size={32} className="mr-2" />
              No orders yet
            </div>
          ) : (
            <div className="space-y-3">
              {analytics.topPackages.map((pkg, index) => (
                <div
                  key={pkg.name}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-primary/20 text-primary flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </span>
                    <span className="font-medium truncate max-w-32">{pkg.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-orbitron font-bold text-primary">
                      {pkg.count} orders
                    </p>
                    <p className="text-xs text-muted-foreground">
                      ৳{pkg.revenue.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Conversion Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="game-card p-6"
      >
        <h3 className="font-semibold mb-4">Order Status Breakdown</h3>
        <div className="flex items-center gap-4">
          <div className="flex-1 bg-muted rounded-full h-4 overflow-hidden">
            <div className="h-full flex">
              <div
                className="bg-success transition-all"
                style={{
                  width: `${analytics.totalOrders > 0 ? (analytics.completedOrders / analytics.totalOrders) * 100 : 0}%`,
                }}
              />
              <div
                className="bg-warning transition-all"
                style={{
                  width: `${analytics.totalOrders > 0 ? (analytics.pendingOrders / analytics.totalOrders) * 100 : 0}%`,
                }}
              />
              <div
                className="bg-primary transition-all"
                style={{
                  width: `${analytics.totalOrders > 0 ? ((analytics.totalOrders - analytics.completedOrders - analytics.pendingOrders) / analytics.totalOrders) * 100 : 0}%`,
                }}
              />
            </div>
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-success" />
            <span className="text-muted-foreground">
              Completed ({analytics.completedOrders})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-warning" />
            <span className="text-muted-foreground">
              Pending ({analytics.pendingOrders})
            </span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-primary" />
            <span className="text-muted-foreground">
              Other ({analytics.totalOrders - analytics.completedOrders - analytics.pendingOrders})
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default AnalyticsDashboard;
