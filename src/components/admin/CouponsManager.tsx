import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Ticket, Plus, Trash2, Edit2, Copy, Check, X, Loader2, Users, Calendar, Percent, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface Coupon {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  min_order_value: number | null;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
}

const CouponsManager = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    code: "",
    discount_type: "percentage",
    discount_value: 10,
    max_uses: "",
    min_order_value: "",
    is_active: true,
    expires_at: "",
  });

  const { data: coupons, isLoading } = useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Coupon[];
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("coupons")
        .insert({
          code: data.code.toUpperCase(),
          discount_type: data.discount_type,
          discount_value: data.discount_value,
          max_uses: data.max_uses ? parseInt(data.max_uses) : null,
          min_order_value: data.min_order_value ? parseInt(data.min_order_value) : null,
          is_active: data.is_active,
          expires_at: data.expires_at || null,
        });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast({ title: "Coupon created successfully!" });
      resetForm();
      setIsDialogOpen(false);
    },
    onError: (error) => {
      toast({ 
        title: "Failed to create coupon", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Coupon> }) => {
      const { error } = await supabase
        .from("coupons")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast({ title: "Coupon updated successfully!" });
      resetForm();
      setIsDialogOpen(false);
      setEditingCoupon(null);
    },
    onError: (error) => {
      toast({ 
        title: "Failed to update coupon", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("coupons")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast({ title: "Coupon deleted successfully!" });
    },
    onError: (error) => {
      toast({ 
        title: "Failed to delete coupon", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const resetForm = () => {
    setFormData({
      code: "",
      discount_type: "percentage",
      discount_value: 10,
      max_uses: "",
      min_order_value: "",
      is_active: true,
      expires_at: "",
    });
    setEditingCoupon(null);
  };

  const openEditDialog = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      max_uses: coupon.max_uses?.toString() || "",
      min_order_value: coupon.min_order_value?.toString() || "",
      is_active: coupon.is_active,
      expires_at: coupon.expires_at ? coupon.expires_at.split("T")[0] : "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.code) {
      toast({ title: "Coupon code is required", variant: "destructive" });
      return;
    }

    if (editingCoupon) {
      updateMutation.mutate({
        id: editingCoupon.id,
        data: {
          code: formData.code.toUpperCase(),
          discount_type: formData.discount_type,
          discount_value: formData.discount_value,
          max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
          min_order_value: formData.min_order_value ? parseInt(formData.min_order_value) : null,
          is_active: formData.is_active,
          expires_at: formData.expires_at || null,
        },
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleActive = (coupon: Coupon) => {
    updateMutation.mutate({
      id: coupon.id,
      data: { is_active: !coupon.is_active },
    });
  };

  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  const isMaxedOut = (coupon: Coupon) => {
    if (!coupon.max_uses) return false;
    return coupon.used_count >= coupon.max_uses;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-primary" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Ticket className="text-primary" size={24} />
          <h2 className="font-orbitron font-bold text-xl">Discount Coupons</h2>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <Plus size={18} />
              <span>Create Coupon</span>
            </button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="font-orbitron">
                {editingCoupon ? "Edit Coupon" : "Create New Coupon"}
              </DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="code">Coupon Code *</Label>
                <Input
                  id="code"
                  placeholder="e.g., SAVE20"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  className="mt-1 uppercase"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="discount_type">Discount Type</Label>
                  <select
                    id="discount_type"
                    value={formData.discount_type}
                    onChange={(e) => setFormData({ ...formData, discount_type: e.target.value })}
                    className="mt-1 w-full px-3 py-2 rounded-lg bg-background border border-border focus:border-primary focus:outline-none"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                </div>
                
                <div>
                  <Label htmlFor="discount_value">
                    Discount Value {formData.discount_type === "percentage" ? "(%)" : "(₹)"}
                  </Label>
                  <Input
                    id="discount_value"
                    type="number"
                    min="1"
                    max={formData.discount_type === "percentage" ? 100 : undefined}
                    value={formData.discount_value}
                    onChange={(e) => setFormData({ ...formData, discount_value: parseInt(e.target.value) || 0 })}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="max_uses">Max Uses (leave empty for unlimited)</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    min="1"
                    placeholder="Unlimited"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label htmlFor="min_order_value">Min Order Value (₹)</Label>
                  <Input
                    id="min_order_value"
                    type="number"
                    min="0"
                    placeholder="No minimum"
                    value={formData.min_order_value}
                    onChange={(e) => setFormData({ ...formData, min_order_value: e.target.value })}
                    className="mt-1"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="expires_at">Expiry Date (optional)</Label>
                <Input
                  id="expires_at"
                  type="date"
                  value={formData.expires_at}
                  onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  className="mt-1"
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="is_active">Active</Label>
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
                />
              </div>
              
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setIsDialogOpen(false);
                    resetForm();
                  }}
                  className="flex-1 py-2 rounded-lg border border-border hover:bg-card transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {createMutation.isPending || updateMutation.isPending ? (
                    <Loader2 className="animate-spin mx-auto" size={20} />
                  ) : editingCoupon ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Coupons List */}
      {coupons?.length === 0 ? (
        <div className="game-card p-8 text-center">
          <Ticket className="mx-auto text-muted-foreground mb-4" size={48} />
          <p className="text-muted-foreground">No coupons created yet</p>
          <p className="text-sm text-muted-foreground mt-1">Create your first discount coupon to attract customers!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {coupons?.map((coupon) => {
            const expired = isExpired(coupon.expires_at);
            const maxedOut = isMaxedOut(coupon);
            const inactive = !coupon.is_active || expired || maxedOut;
            
            return (
              <div
                key={coupon.id}
                className={`game-card p-4 ${inactive ? "opacity-60" : ""}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-2">
                        <code className="font-orbitron font-bold text-lg text-primary bg-primary/10 px-3 py-1 rounded">
                          {coupon.code}
                        </code>
                        <button
                          onClick={() => copyCode(coupon.code)}
                          className="p-1.5 rounded hover:bg-card transition-colors"
                          title="Copy code"
                        >
                          {copiedCode === coupon.code ? (
                            <Check size={16} className="text-success" />
                          ) : (
                            <Copy size={16} className="text-muted-foreground" />
                          )}
                        </button>
                      </div>
                      
                      {/* Status badges */}
                      <div className="flex gap-2">
                        {!coupon.is_active && (
                          <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground">
                            Disabled
                          </span>
                        )}
                        {expired && (
                          <span className="px-2 py-0.5 rounded text-xs bg-destructive/20 text-destructive">
                            Expired
                          </span>
                        )}
                        {maxedOut && (
                          <span className="px-2 py-0.5 rounded text-xs bg-warning/20 text-warning">
                            Max Uses Reached
                          </span>
                        )}
                        {coupon.is_active && !expired && !maxedOut && (
                          <span className="px-2 py-0.5 rounded text-xs bg-success/20 text-success">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <div className="flex items-center gap-2">
                        {coupon.discount_type === "percentage" ? (
                          <Percent size={14} className="text-muted-foreground" />
                        ) : (
                          <DollarSign size={14} className="text-muted-foreground" />
                        )}
                        <span>
                          {coupon.discount_type === "percentage" 
                            ? `${coupon.discount_value}% off`
                            : `₹${coupon.discount_value} off`
                          }
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Users size={14} className="text-muted-foreground" />
                        <span>
                          {coupon.used_count}/{coupon.max_uses || "∞"} used
                        </span>
                      </div>
                      
                      {coupon.min_order_value && (
                        <div className="flex items-center gap-2">
                          <DollarSign size={14} className="text-muted-foreground" />
                          <span>Min ₹{coupon.min_order_value}</span>
                        </div>
                      )}
                      
                      {coupon.expires_at && (
                        <div className="flex items-center gap-2">
                          <Calendar size={14} className="text-muted-foreground" />
                          <span>
                            Expires {new Date(coupon.expires_at).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={coupon.is_active}
                      onCheckedChange={() => toggleActive(coupon)}
                      disabled={updateMutation.isPending}
                    />
                    <button
                      onClick={() => openEditDialog(coupon)}
                      className="p-2 rounded-lg hover:bg-card transition-colors"
                      title="Edit coupon"
                    >
                      <Edit2 size={18} className="text-muted-foreground" />
                    </button>
                    <button
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this coupon?")) {
                          deleteMutation.mutate(coupon.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="p-2 rounded-lg hover:bg-destructive/20 transition-colors"
                      title="Delete coupon"
                    >
                      <Trash2 size={18} className="text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CouponsManager;
