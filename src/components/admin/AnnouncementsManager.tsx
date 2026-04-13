import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  Megaphone,
  Loader2,
  AlertCircle,
  Info,
  Gift,
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

interface Announcement {
  id: string;
  title: string;
  message: string;
  type: string;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
}

const AnnouncementsManager = () => {
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<Announcement>>({});

  const fetchAnnouncements = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("announcements")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (error) {
      console.error("Error fetching announcements:", error);
      toast({
        title: "Error",
        description: "Failed to fetch announcements",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const handleCreate = async () => {
    if (!formData.title || !formData.message) {
      toast({
        title: "Error",
        description: "Title and message are required",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("announcements").insert({
        title: formData.title,
        message: formData.message,
        type: formData.type || "info",
        is_active: formData.is_active ?? true,
        starts_at: formData.starts_at || null,
        ends_at: formData.ends_at || null,
      });

      if (error) throw error;

      toast({ title: "Success", description: "Announcement created" });
      setIsCreating(false);
      setFormData({});
      fetchAnnouncements();
    } catch (error) {
      console.error("Error creating announcement:", error);
      toast({
        title: "Error",
        description: "Failed to create announcement",
        variant: "destructive",
      });
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .update({
          title: formData.title,
          message: formData.message,
          type: formData.type,
          is_active: formData.is_active,
          starts_at: formData.starts_at,
          ends_at: formData.ends_at,
        })
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Success", description: "Announcement updated" });
      setEditingId(null);
      setFormData({});
      fetchAnnouncements();
    } catch (error) {
      console.error("Error updating announcement:", error);
      toast({
        title: "Error",
        description: "Failed to update announcement",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this announcement?")) return;

    try {
      const { error } = await supabase
        .from("announcements")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast({ title: "Success", description: "Announcement deleted" });
      fetchAnnouncements();
    } catch (error) {
      console.error("Error deleting announcement:", error);
      toast({
        title: "Error",
        description: "Failed to delete announcement",
        variant: "destructive",
      });
    }
  };

  const handleToggleActive = async (id: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from("announcements")
        .update({ is_active: isActive })
        .eq("id", id);

      if (error) throw error;
      fetchAnnouncements();
    } catch (error) {
      console.error("Error toggling announcement:", error);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "warning":
        return <AlertCircle size={20} className="text-warning" />;
      case "promo":
        return <Gift size={20} className="text-success" />;
      default:
        return <Info size={20} className="text-primary" />;
    }
  };

  const getTypeBadge = (type: string) => {
    const styles: Record<string, string> = {
      info: "bg-primary/20 text-primary border-primary/50",
      warning: "bg-warning/20 text-warning border-warning/50",
      promo: "bg-success/20 text-success border-success/50",
    };

    return (
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${styles[type] || styles.info}`}
      >
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const startEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData(announcement);
    setIsCreating(false);
  };

  const startCreate = () => {
    setIsCreating(true);
    setEditingId(null);
    setFormData({
      title: "",
      message: "",
      type: "info",
      is_active: true,
      starts_at: null,
      ends_at: null,
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
        <h2 className="text-xl font-orbitron font-bold">Announcements & Banners</h2>
        <button
          onClick={startCreate}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus size={18} />
          Add Banner
        </button>
      </div>

      {/* Create Form */}
      {isCreating && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="game-card p-6 space-y-4"
        >
          <h3 className="font-semibold">New Announcement</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Title *</Label>
              <Input
                value={formData.title || ""}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                placeholder="New Year Sale!"
              />
            </div>
            <div>
              <Label>Type</Label>
              <Select
                value={formData.type || "info"}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info (Blue)</SelectItem>
                  <SelectItem value="warning">Warning (Yellow)</SelectItem>
                  <SelectItem value="promo">Promo (Green)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Message *</Label>
            <Textarea
              value={formData.message || ""}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              placeholder="Get 20% off on all packages this weekend!"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Starts At (optional)</Label>
              <Input
                type="datetime-local"
                value={formData.starts_at?.slice(0, 16) || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    starts_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                  })
                }
              />
            </div>
            <div>
              <Label>Ends At (optional)</Label>
              <Input
                type="datetime-local"
                value={formData.ends_at?.slice(0, 16) || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    ends_at: e.target.value ? new Date(e.target.value).toISOString() : null,
                  })
                }
              />
            </div>
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

      {/* Announcements List */}
      {announcements.length === 0 && !isCreating ? (
        <div className="game-card p-12 text-center">
          <Megaphone size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No announcements yet</p>
          <button
            onClick={startCreate}
            className="mt-4 px-4 py-2 rounded-lg bg-primary text-primary-foreground"
          >
            Create your first announcement
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement, index) => (
            <motion.div
              key={announcement.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`game-card p-4 ${!announcement.is_active ? "opacity-50" : ""}`}
            >
              {editingId === announcement.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Title</Label>
                      <Input
                        value={formData.title || ""}
                        onChange={(e) =>
                          setFormData({ ...formData, title: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <Label>Type</Label>
                      <Select
                        value={formData.type || "info"}
                        onValueChange={(value) =>
                          setFormData({ ...formData, type: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="info">Info</SelectItem>
                          <SelectItem value="warning">Warning</SelectItem>
                          <SelectItem value="promo">Promo</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>Message</Label>
                    <Textarea
                      value={formData.message || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, message: e.target.value })
                      }
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
                      onClick={() => handleUpdate(announcement.id)}
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
                    {getTypeIcon(announcement.type)}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{announcement.title}</h3>
                        {getTypeBadge(announcement.type)}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {announcement.message}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Created: {new Date(announcement.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={announcement.is_active}
                      onCheckedChange={(checked) =>
                        handleToggleActive(announcement.id, checked)
                      }
                    />
                    <button
                      onClick={() => startEdit(announcement)}
                      className="p-2 rounded-lg bg-card border border-border hover:border-primary transition-colors"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      onClick={() => handleDelete(announcement.id)}
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

export default AnnouncementsManager;
