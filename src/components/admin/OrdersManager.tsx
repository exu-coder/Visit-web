import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Clock, CheckCircle, XCircle, Loader2, Check, X, RefreshCw, Trash2, Search, Filter,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface Order {
  id: string;
  user_id: string;
  product_id: string;
  product_name: string;
  price: string;
  price_value: number;
  trx_id: string;
  guild_uid: string;
  region: string;
  telegram_username: string;
  whatsapp_number: string;
  payment_method: string;
  payment_proof_url: string | null;
  status: "pending" | "approved" | "rejected" | "completed";
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const DATE_RANGES = [
  { key: "all", label: "All time" },
  { key: "today", label: "Today" },
  { key: "7d", label: "Last 7 days" },
  { key: "30d", label: "Last 30 days" },
] as const;

const OrdersManager = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [dateRange, setDateRange] = useState<typeof DATE_RANGES[number]["key"]>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setOrders((data as Order[]) || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({ title: "Error", description: "Failed to fetch orders", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  const updateOrderStatus = async (orderId: string, newStatus: "approved" | "rejected" | "completed") => {
    try {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
      if (error) throw error;
      setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
      toast({ title: "Order Updated", description: `Order marked as ${newStatus}` });
    } catch (error) {
      toast({ title: "Error", description: "Failed to update order", variant: "destructive" });
    }
  };

  const clearAllOrders = async () => {
    setIsClearing(true);
    try {
      const { error } = await supabase.from("orders").delete().neq("id", "00000000-0000-0000-0000-000000000000");
      if (error) throw error;
      setOrders([]);
      toast({ title: "Orders Cleared", description: "All orders have been deleted" });
      setShowClearConfirm(false);
    } catch (error) {
      console.error("Error clearing orders:", error);
      toast({ title: "Error", description: "Failed to clear orders", variant: "destructive" });
    } finally {
      setIsClearing(false);
    }
  };

  const getStatusBadge = (status: Order["status"]) => {
    const styles = {
      pending: "bg-warning/20 text-warning border-warning/50",
      approved: "bg-primary/20 text-primary border-primary/50",
      completed: "bg-success/20 text-success border-success/50",
      rejected: "bg-destructive/20 text-destructive border-destructive/50",
    };
    const icons = {
      pending: <Clock size={14} />, approved: <CheckCircle size={14} />,
      completed: <CheckCircle size={14} />, rejected: <XCircle size={14} />,
    };
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium border ${styles[status]}`}>
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const paymentMethods = useMemo(() => {
    const set = new Set(orders.map((o) => o.payment_method).filter(Boolean));
    return Array.from(set);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let list = orders;

    // Status
    if (filterStatus !== "all") list = list.filter((o) => o.status === filterStatus);

    // Payment method
    if (paymentFilter !== "all") list = list.filter((o) => o.payment_method === paymentFilter);

    // Date range
    if (dateRange !== "all") {
      const now = new Date();
      const cutoff = new Date(now);
      if (dateRange === "today") cutoff.setHours(0, 0, 0, 0);
      else if (dateRange === "7d") cutoff.setDate(now.getDate() - 7);
      else if (dateRange === "30d") cutoff.setDate(now.getDate() - 30);
      list = list.filter((o) => new Date(o.created_at) >= cutoff);
    }

    // Search
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((o) =>
        o.product_name.toLowerCase().includes(q) ||
        o.trx_id.toLowerCase().includes(q) ||
        o.guild_uid.toLowerCase().includes(q) ||
        o.telegram_username.toLowerCase().includes(q) ||
        o.whatsapp_number.toLowerCase().includes(q) ||
        o.region.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    }

    return list;
  }, [orders, filterStatus, paymentFilter, dateRange, search]);

  const orderCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    approved: orders.filter(o => o.status === "approved").length,
    completed: orders.filter(o => o.status === "completed").length,
    rejected: orders.filter(o => o.status === "rejected").length,
  };

  const clearFilters = () => {
    setFilterStatus("all");
    setSearch("");
    setDateRange("all");
    setPaymentFilter("all");
  };
  const hasActiveFilters = filterStatus !== "all" || search || dateRange !== "all" || paymentFilter !== "all";

  if (isLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 size={32} className="animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl font-orbitron font-bold">Manage Orders</h2>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowClearConfirm(true)} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors text-sm">
            <Trash2 size={16} /> Clear All
          </button>
          <button onClick={fetchOrders} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-card border border-border hover:border-primary transition-colors">
            <RefreshCw size={16} /> Refresh
          </button>
        </div>
      </div>

      {/* Clear Confirm Dialog */}
      <AnimatePresence>
        {showClearConfirm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="game-card p-4 border-destructive/50 bg-destructive/5">
            <p className="text-sm font-medium mb-3">Are you sure you want to delete ALL orders? This cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={clearAllOrders} disabled={isClearing} className="flex items-center gap-1 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground hover:bg-destructive/90 transition-colors text-sm disabled:opacity-50">
                {isClearing ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                {isClearing ? "Deleting..." : "Yes, Delete All"}
              </button>
              <button onClick={() => setShowClearConfirm(false)} className="px-4 py-2 rounded-lg bg-card border border-border hover:border-primary transition-colors text-sm">
                Cancel
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats / status filter */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(["all", "pending", "approved", "completed", "rejected"] as const).map(status => (
          <button key={status} onClick={() => setFilterStatus(status)} className={`game-card p-4 text-center transition-all ${filterStatus === status ? "border-primary glow-red-border" : ""}`}>
            <p className="text-2xl font-orbitron font-bold">{orderCounts[status]}</p>
            <p className="text-xs text-muted-foreground capitalize">{status}</p>
          </button>
        ))}
      </div>

      {/* Search & advanced filters */}
      <div className="game-card p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product, TRX ID, UID, telegram, whatsapp..."
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter size={14} /> Filters:
          </div>

          {/* Date range chips */}
          <div className="flex flex-wrap gap-1">
            {DATE_RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setDateRange(r.key)}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors border ${
                  dateRange === r.key
                    ? "bg-primary/20 text-primary border-primary/50"
                    : "bg-card text-muted-foreground border-border hover:border-primary/30"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>

          {/* Payment method filter */}
          {paymentMethods.length > 1 && (
            <div className="flex flex-wrap gap-1">
              <button
                onClick={() => setPaymentFilter("all")}
                className={`px-2.5 py-1 rounded-md text-xs transition-colors border ${
                  paymentFilter === "all"
                    ? "bg-primary/20 text-primary border-primary/50"
                    : "bg-card text-muted-foreground border-border hover:border-primary/30"
                }`}
              >
                All payments
              </button>
              {paymentMethods.map((pm) => (
                <button
                  key={pm}
                  onClick={() => setPaymentFilter(pm)}
                  className={`px-2.5 py-1 rounded-md text-xs uppercase transition-colors border ${
                    paymentFilter === pm
                      ? "bg-primary/20 text-primary border-primary/50"
                      : "bg-card text-muted-foreground border-border hover:border-primary/30"
                  }`}
                >
                  {pm}
                </button>
              ))}
            </div>
          )}

          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="ml-auto text-xs text-destructive hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Showing <span className="text-foreground font-medium">{filteredOrders.length}</span> of {orders.length} orders
        </p>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="game-card p-12 text-center">
          <Package size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No orders match your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order, index) => (
            <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: Math.min(index * 0.03, 0.3) }} className="game-card p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <h3 className="font-semibold">{order.product_name}</h3>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <p><span className="text-foreground/70">TRX:</span> {order.trx_id}</p>
                    <p><span className="text-foreground/70">Guild:</span> {order.guild_uid}</p>
                    <p><span className="text-foreground/70">Telegram:</span> {order.telegram_username}</p>
                    <p><span className="text-foreground/70">WhatsApp:</span> {order.whatsapp_number}</p>
                    <p><span className="text-foreground/70">Payment:</span> {order.payment_method.toUpperCase()}</p>
                    <p><span className="text-foreground/70">Region:</span> {order.region}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{new Date(order.created_at).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-orbitron font-bold text-primary text-lg">{order.price}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
                {order.status === "pending" && (
                  <>
                    <button onClick={() => updateOrderStatus(order.id, "approved")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-success/20 text-success hover:bg-success/30 transition-colors text-sm">
                      <Check size={14} /> Approve
                    </button>
                    <button onClick={() => updateOrderStatus(order.id, "rejected")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors text-sm">
                      <X size={14} /> Reject
                    </button>
                  </>
                )}
                {order.status === "approved" && (
                  <button onClick={() => updateOrderStatus(order.id, "completed")} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/20 text-primary hover:bg-primary/30 transition-colors text-sm">
                    <CheckCircle size={14} /> Mark Complete
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersManager;
