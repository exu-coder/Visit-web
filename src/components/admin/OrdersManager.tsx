import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Package, Clock, CheckCircle, XCircle, Loader2, Check, X, RefreshCw, Trash2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

const OrdersManager = () => {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");
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

  const filteredOrders = filterStatus === "all" ? orders : orders.filter(o => o.status === filterStatus);
  const orderCounts = {
    all: orders.length,
    pending: orders.filter(o => o.status === "pending").length,
    approved: orders.filter(o => o.status === "approved").length,
    completed: orders.filter(o => o.status === "completed").length,
    rejected: orders.filter(o => o.status === "rejected").length,
  };

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
            <p className="text-sm font-medium mb-3">⚠️ Are you sure you want to delete ALL orders? This cannot be undone.</p>
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

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {(["all", "pending", "approved", "completed", "rejected"] as const).map(status => (
          <button key={status} onClick={() => setFilterStatus(status)} className={`game-card p-4 text-center transition-all ${filterStatus === status ? "border-primary glow-red-border" : ""}`}>
            <p className="text-2xl font-orbitron font-bold">{orderCounts[status]}</p>
            <p className="text-xs text-muted-foreground capitalize">{status}</p>
          </button>
        ))}
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="game-card p-12 text-center">
          <Package size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No orders found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order, index) => (
            <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.05 }} className="game-card p-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{order.product_name}</h3>
                    {getStatusBadge(order.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    <p><span className="text-foreground/70">TRX:</span> {order.trx_id}</p>
                    <p><span className="text-foreground/70">Guild:</span> {order.guild_uid}</p>
                    <p><span className="text-foreground/70">Telegram:</span> {order.telegram_username}</p>
                    <p><span className="text-foreground/70">WhatsApp:</span> {order.whatsapp_number}</p>
                    <p><span className="text-foreground/70">Payment:</span> {order.payment_method.toUpperCase()}</p>
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
