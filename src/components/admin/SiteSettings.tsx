import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Save, Settings, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SiteSetting {
  id: string;
  setting_key: string;
  setting_value: string | null;
}

const SiteSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("site_settings")
        .select("*");

      if (error) throw error;

      const settingsMap: Record<string, string> = {};
      (data || []).forEach((setting: SiteSetting) => {
        settingsMap[setting.setting_key] = setting.setting_value || "";
      });
      setSettings(settingsMap);
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error",
        description: "Failed to fetch settings",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Upsert each setting
      for (const [key, value] of Object.entries(settings)) {
        const { error } = await supabase
          .from("site_settings")
          .upsert(
            { setting_key: key, setting_value: value },
            { onConflict: "setting_key" }
          );

        if (error) throw error;
      }

      toast({ title: "Success", description: "Settings saved successfully" });
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error",
        description: "Failed to save settings",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const updateSetting = (key: string, value: string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-orbitron font-bold">Site Settings</h2>
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          {isSaving ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <Save size={18} />
          )}
          Save Changes
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="game-card p-6 space-y-6"
      >
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Settings size={24} className="text-primary" />
          <div>
            <h3 className="font-semibold">Branding</h3>
            <p className="text-sm text-muted-foreground">
              Customize your shop's branding
            </p>
          </div>
        </div>

        <div className="grid gap-6">
          <div>
            <Label>Site Name</Label>
            <Input
              value={settings.site_name || ""}
              onChange={(e) => updateSetting("site_name", e.target.value)}
              placeholder="My Glory Shop"
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1">
              This name will appear in the header and browser tab
            </p>
          </div>

          <div>
            <Label>Tagline (optional)</Label>
            <Input
              value={settings.tagline || ""}
              onChange={(e) => updateSetting("tagline", e.target.value)}
              placeholder="Best Glory Service Provider"
              className="mt-2"
            />
          </div>

          <div>
            <Label>Support Telegram</Label>
            <Input
              value={settings.support_telegram || ""}
              onChange={(e) => updateSetting("support_telegram", e.target.value)}
              placeholder="@yourtegramhandle"
              className="mt-2"
            />
          </div>

          <div>
            <Label>Support WhatsApp</Label>
            <Input
              value={settings.support_whatsapp || ""}
              onChange={(e) => updateSetting("support_whatsapp", e.target.value)}
              placeholder="+8801234567890"
              className="mt-2"
            />
          </div>

          <div>
            <Label>YouTube Channel URL</Label>
            <Input
              value={settings.youtube_url || ""}
              onChange={(e) => updateSetting("youtube_url", e.target.value)}
              placeholder="https://youtube.com/@yourchannel"
              className="mt-2"
            />
          </div>

          <div>
            <Label>Telegram Channel URL</Label>
            <Input
              value={settings.telegram_channel || ""}
              onChange={(e) => updateSetting("telegram_channel", e.target.value)}
              placeholder="https://t.me/yourchannel"
              className="mt-2"
            />
          </div>
        </div>
      </motion.div>

      {/* Preview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="game-card p-6"
      >
        <h3 className="font-semibold mb-4">Preview</h3>
        <div className="p-4 rounded-lg bg-background border border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-orbitron font-bold text-lg">
                {(settings.site_name || "RG")[0]}
              </span>
            </div>
            <div>
              <h4 className="font-orbitron font-bold">
                {settings.site_name || "Roshan Glory Shop"}
              </h4>
              {settings.tagline && (
                <p className="text-xs text-muted-foreground">{settings.tagline}</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default SiteSettings;
