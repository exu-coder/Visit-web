import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  CreditCard,
  Loader2,
  Wallet,
  Building2,
  Smartphone,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PaymentMethod {
  id: string;
  name: string;
  type: string;
  details: string;
  qr_code_url: string | null;
  is_active: boolean;
  display_order: number;
}

const PaymentsManager = () => {
  const { toast } = useToast();
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<PaymentMethod>>({});

  const fetchMethods = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setMethods(data || []);
    } catch (error) {
      console.error("Error fetching payment methods:", error);
      toast({
        title: "Error",
        description: "Failed to fetch payment methods",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMethods();
  }, []);

  const handleCreate = async () => {
    if (!formData.name || !formData.type || !formData.details) {
      toast({
        title: "Error",
        description: "Name, type, and details are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("payment_methods").insert({
        name: formData.name,
        type: formData.type,
        details: formData.details,
        qr_code_url: formData.qr_code_url || null,
        is_active: formData.is_active ?? true,
        display_order: methods.length,
      });

      if (error) throw error;

      toast({ title: "Success", description: "Payment method added" });
      setIsCreating(false);
      setFormData({});
      fetchMethods();
    } catch (error) {
      console.error("Error creating payment method:", error);
      toast({
        title: "Error",
        description: "Failed to add payment method",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const { error } = await supabase
        .from("payment_methods")
        .update({
          name: formData.name,
          type: formData.type,
          details: formData.details,
          qr_code_url: formData.qr_code_url,
          is_active: formData.is_active,
        })
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Success", description: "Payment method updated" });
      setEditingId(null);
      setFormData({});
      fetchMethods();
    } catch (error) {
      console.error("Error updating payment method:", error);
      toast({
        title: "Error",
        description: "Failed to update payment method",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment method?")) return;

    try {
      const { error } = await supabase
        .from("payment_methods")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Success", description: "Payment method deleted" });
      fetchMethods();
    } catch (error) {
      console.error("Error deleting payment method:", error);
      toast({
        title: "Error",
        description: "Failed to delete payment method",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("payment_methods")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
      fetchMethods();
    } catch (error) {
      console.error("Error toggling payment method:", error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "wallet":
        return <Wallet size={20} className="text-primary" />;
      case "bank":
        return <Building2 size={20} className="text-primary" />;
      case "upi":
        return <Smartphone size={20} className="text-primary" />;
      default:
        return <CreditCard size={20} className="text-primary" />;
    }
  };

  const startEdit = (method: PaymentMethod) => {
    setEditingId(method.id);
    setFormData(method);
    setIsCreating(false);
  };

  const startCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({
      name: "",
      type: "wallet",
      details: "",
      qr_code_url: "",
      is_active: true,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-orbitron font-bold">Payment Methods</h2>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          Add Method
        </button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="game-card p-6 space-y-4"
        >
          <h3 className="font-semibold">New Payment Method</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="bKash Personal"
              />
            </div>
            <div>
              <Label>Type *</Label>
              <Select
                value={formData.type || "wallet"}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wallet">Wallet (bKash, Nagad)</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Details * (Phone number, UPI ID, or Bank details)</Label>
            <Textarea
              value={formData.details || ""}
              onChange={(e) =>
                setFormData({ ...formData, details: e.target.value })
              }
              placeholder="01346498005 (Personal - Send Money)"
              rows={2}
            />
          </div>
          <div>
            <Label>QR Code URL (optional)</Label>
            <Input
              value={formData.qr_code_url || ""}
              onChange={(e) =>
                setFormData({ ...formData, qr_code_url: e.target.value })
              }
              placeholder="https://..."
            />
          </div>
          <div className="flex items-center gap-2">
            <Switch
              checked={formData.is_active ?? true}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_active: checked })
              }
            />
            <Label>Active</Label>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success text-success-foreground hover:bg-success/90 transition-colors"
            >
              <Save size={16} />
              Create
            </button>
            <button
              onClick={() => {
                setIsCreating(false);
                setFormData({});
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              <X size={16} />
              Cancel
            </button>
          </div>
        </motion.div>
      )}

      {/* Methods List */}
      {methods.length === 0 && !isCreating ? (
        <div className="game-card p-12 text-center">
          <CreditCard size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No payment methods yet</p>
          <button
            onClick={startCreate}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            Add your first payment method
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {methods.map((method, index) => (
            <motion.div
              key={method.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`game-card p-4 ${!method.is_active ? "opacity-50" : ""}`}
            >
              {editingId === method.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Name</Label>
                      <Input
                        value={formData.name || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select
                        value={formData.type || "wallet"}
                        onValueChange={(value) =>
                          setFormData({ ...formData, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="wallet">Wallet</SelectItem>
                          <SelectItem value="upi">UPI</SelectItem>
                          <SelectItem value="bank">Bank Transfer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Details</Label>
                    <Textarea
                      value={formData.details || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, details: e.target.value })
                      }
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>QR Code URL</Label>
                    <Input
                      value={formData.qr_code_url || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, qr_code_url: e.target.value })
                      }
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={formData.is_active ?? true}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, is_active: checked })
                      }
                    />
                    <Label>Active</Label>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(method.id)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-success text-success-foreground hover:bg-success/90 transition-colors"
                    >
                      <Save size={16} />
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setEditingId(null);
                        setFormData({});
                      }}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-muted-foreground hover:bg-muted/80 transition-colors"
                    >
                      <X size={16} />
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    {getTypeIcon(method.type)}
                    <div>
                      <h3 className="font-semibold">{method.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {method.details}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        {method.type}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={method.is_active}
                      onCheckedChange={(checked) =>
                        handleToggleActive(method.id, checked)
                      }
                    />
                    <button
                      onClick={() => startEdit(method)}
                      className="p-2 rounded-lg bg-card border border-border hover:border-primary transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(method.id)}
                      className="p-2 rounded-lg bg-destructive/20 text-destructive hover:bg-destructive/30 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PaymentsManager;
