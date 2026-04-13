import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Package,
  Loader2,
  GripVertical,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface PackageData {
  id: string;
  name: string;
  description: string | null;
  price: number;
  original_price: number | null;
  image_url: string | null;
  features: string[] | null;
  is_active: boolean;
  display_order: number;
  category: string;
  sub_category: string | null;
}

const PackagesManager = () => {
  const { toast } = useToast();
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<PackageData>>({});

  const fetchPackages = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("packages")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error) {
      console.error("Error fetching packages:", error);
      toast({
        title: "Error",
        description: "Failed to fetch packages",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleCreate = async () => {
    if (!formData.name || !formData.price) {
      toast({
        title: "Error",
        description: "Name and price are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("packages").insert({
        name: formData.name,
        description: formData.description || null,
        price: formData.price,
        original_price: formData.original_price || null,
        image_url: formData.image_url || null,
        features: formData.features || [],
        is_active: formData.is_active ?? true,
        display_order: packages.length,
        category: formData.category || "visit",
        sub_category: formData.category === "tcp" ? (formData.sub_category || "guild") : null,
      });

      if (error) throw error;

      toast({ title: "Success", description: "Package created successfully" });
      setIsCreating(false);
      setFormData({});
      fetchPackages();
    } catch (error) {
      console.error("Error creating package:", error);
      toast({
        title: "Error",
        description: "Failed to create package",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const { error } = await supabase
        .from("packages")
        .update({
          name: formData.name,
          description: formData.description,
          price: formData.price,
          original_price: formData.original_price,
          image_url: formData.image_url,
          features: formData.features,
          is_active: formData.is_active,
          category: formData.category || "visit",
          sub_category: formData.category === "tcp" ? (formData.sub_category || "guild") : null,
        })
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Success", description: "Package updated successfully" });
      setEditingId(null);
      setFormData({});
      fetchPackages();
    } catch (error) {
      console.error("Error updating package:", error);
      toast({
        title: "Error",
        description: "Failed to update package",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package?")) return;

    try {
      const { error } = await supabase.from("packages").delete().eq("id", id);

      if (error) throw error;

      toast({ title: "Success", description: "Package deleted successfully" });
      fetchPackages();
    } catch (error) {
      console.error("Error deleting package:", error);
      toast({
        title: "Error",
        description: "Failed to delete package",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("packages")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
      fetchPackages();
    } catch (error) {
      console.error("Error toggling package:", error);
    }
  };

  const startEdit = (pkg: PackageData) => {
    setEditingId(pkg.id);
    setFormData(pkg);
    setIsCreating(false);
  };

  const startCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({
      name: "",
      description: "",
      price: 0,
      original_price: null,
      image_url: "",
      features: [],
      is_active: true,
      category: "visit",
      sub_category: null,
    });
  };

  const handleFeaturesChange = (value: string) => {
    setFormData({
      ...formData,
      features: value.split("\n").filter((f) => f.trim()),
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
        <h2 className="text-xl font-orbitron font-bold">Manage Packages</h2>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          Add Package
        </button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="game-card p-6 space-y-4"
        >
          <h3 className="font-semibold">New Package</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Name *</Label>
              <Input
                value={formData.name || ""}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Package name"
              />
            </div>
            <div>
              <Label>Price (৳) *</Label>
              <Input
                type="number"
                value={formData.price || ""}
                onChange={(e) =>
                  setFormData({ ...formData, price: Number(e.target.value) })
                }
                placeholder="450"
              />
            </div>
            <div>
              <Label>Original Price (for discount display)</Label>
              <Input
                type="number"
                value={formData.original_price || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    original_price: e.target.value
                      ? Number(e.target.value)
                      : null,
                  })
                }
                placeholder="600"
              />
            </div>
            <div>
              <Label>Image URL</Label>
              <Input
                value={formData.image_url || ""}
                onChange={(e) =>
                  setFormData({ ...formData, image_url: e.target.value })
                }
                placeholder="https://..."
              />
            </div>
          </div>
          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description || ""}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Package description..."
              rows={2}
            />
          </div>
          <div>
            <Label>Features (one per line)</Label>
            <Textarea
              value={formData.features?.join("\n") || ""}
              onChange={(e) => handleFeaturesChange(e.target.value)}
              placeholder="Feature 1&#10;Feature 2&#10;Feature 3"
              rows={3}
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

      {/* Packages List */}
      {packages.length === 0 && !isCreating ? (
        <div className="game-card p-12 text-center">
          <Package size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No packages yet</p>
          <button
            onClick={startCreate}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            Create your first package
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {packages.map((pkg, index) => (
            <motion.div
              key={pkg.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`game-card p-4 ${!pkg.is_active ? "opacity-50" : ""}`}
            >
              {editingId === pkg.id ? (
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
                      <Label>Price (৳)</Label>
                      <Input
                        type="number"
                        value={formData.price || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            price: Number(e.target.value),
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Original Price</Label>
                      <Input
                        type="number"
                        value={formData.original_price || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            original_price: e.target.value
                              ? Number(e.target.value)
                              : null,
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label>Image URL</Label>
                      <Input
                        value={formData.image_url || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, image_url: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Description</Label>
                    <Textarea
                      value={formData.description || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      rows={2}
                    />
                  </div>
                  <div>
                    <Label>Features (one per line)</Label>
                    <Textarea
                      value={formData.features?.join("\n") || ""}
                      onChange={(e) => handleFeaturesChange(e.target.value)}
                      rows={3}
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
                      onClick={() => handleUpdate(pkg.id)}
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
                    <GripVertical
                      size={20}
                      className="text-muted-foreground cursor-grab"
                    />
                    {pkg.image_url && (
                      <img
                        src={pkg.image_url}
                        alt={pkg.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div>
                      <h3 className="font-semibold">{pkg.name}</h3>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-primary font-orbitron font-bold">
                          ৳{pkg.price}
                        </span>
                        {pkg.original_price && (
                          <span className="text-muted-foreground line-through">
                            ৳{pkg.original_price}
                          </span>
                        )}
                      </div>
                      {pkg.features && pkg.features.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {pkg.features.length} features
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={pkg.is_active}
                      onCheckedChange={(checked) =>
                        handleToggleActive(pkg.id, checked)
                      }
                    />
                    <button
                      onClick={() => startEdit(pkg)}
                      className="p-2 rounded-lg bg-card border border-border hover:border-primary transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(pkg.id)}
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

export default PackagesManager;
