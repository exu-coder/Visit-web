import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Ban,
  CheckCircle,
  Shield,
  ShieldOff,
  Loader2,
  Search,
  Mail,
  Phone,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Input } from "@/components/ui/input";

interface UserProfile {
  id: string;
  user_id: string;
  email: string | null;
  telegram_username: string | null;
  whatsapp_number: string | null;
  guild_uid: string | null;
  is_banned: boolean;
  created_at: string;
  role?: string;
}

const UsersManager = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      if (rolesError) throw rolesError;

      // Merge data
      const usersWithRoles = (profiles || []).map((profile) => ({
        ...profile,
        role: roles?.find((r) => r.user_id === profile.user_id)?.role || "user",
      }));

      setUsers(usersWithRoles);
    } catch (error) {
      console.error("Error fetching users:", error);
      toast({
        title: "Error",
        description: "Failed to fetch users",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleBanUser = async (userId: string, isBanned: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_banned: isBanned })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User ${isBanned ? "banned" : "unbanned"} successfully`,
      });
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      toast({
        title: "Error",
        description: "Failed to update user",
        variant: "destructive",
      });
    }
  };

  const handleToggleAdmin = async (userId: string, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";

    try {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: newRole })
        .eq("user_id", userId);

      if (error) throw error;

      toast({
        title: "Success",
        description: `User role changed to ${newRole}`,
      });
      fetchUsers();
    } catch (error) {
      console.error("Error updating role:", error);
      toast({
        title: "Error",
        description: "Failed to update user role",
        variant: "destructive",
      });
    }
  };

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.telegram_username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.whatsapp_number?.includes(searchQuery)
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 size={32} className="animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h2 className="text-xl font-orbitron font-bold">Manage Users</h2>
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users..."
            className="pl-10 w-64"
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="game-card p-4 text-center">
          <p className="text-2xl font-orbitron font-bold">{users.length}</p>
          <p className="text-xs text-muted-foreground">Total Users</p>
        </div>
        <div className="game-card p-4 text-center">
          <p className="text-2xl font-orbitron font-bold text-primary">
            {users.filter((u) => u.role === "admin").length}
          </p>
          <p className="text-xs text-muted-foreground">Admins</p>
        </div>
        <div className="game-card p-4 text-center">
          <p className="text-2xl font-orbitron font-bold text-success">
            {users.filter((u) => !u.is_banned).length}
          </p>
          <p className="text-xs text-muted-foreground">Active</p>
        </div>
        <div className="game-card p-4 text-center">
          <p className="text-2xl font-orbitron font-bold text-destructive">
            {users.filter((u) => u.is_banned).length}
          </p>
          <p className="text-xs text-muted-foreground">Banned</p>
        </div>
      </div>

      {/* Users List */}
      {filteredUsers.length === 0 ? (
        <div className="game-card p-12 text-center">
          <Users size={48} className="mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">No users found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredUsers.map((user, index) => (
            <motion.div
              key={user.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className={`game-card p-4 ${user.is_banned ? "opacity-60" : ""}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">{user.email || "No email"}</h3>
                    {user.role === "admin" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/50">
                        <Shield size={12} />
                        Admin
                      </span>
                    )}
                    {user.is_banned && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-destructive/20 text-destructive border border-destructive/50">
                        <Ban size={12} />
                        Banned
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {user.telegram_username && (
                      <p className="flex items-center gap-1">
                        <Mail size={12} />
                        {user.telegram_username}
                      </p>
                    )}
                    {user.whatsapp_number && (
                      <p className="flex items-center gap-1">
                        <Phone size={12} />
                        {user.whatsapp_number}
                      </p>
                    )}
                    {user.guild_uid && (
                      <p>
                        <span className="text-foreground/70">Guild:</span>{" "}
                        {user.guild_uid}
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Joined: {new Date(user.created_at).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleAdmin(user.user_id, user.role || "user")}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      user.role === "admin"
                        ? "bg-warning/20 text-warning hover:bg-warning/30"
                        : "bg-primary/20 text-primary hover:bg-primary/30"
                    }`}
                  >
                    {user.role === "admin" ? (
                      <>
                        <ShieldOff size={14} />
                        Remove Admin
                      </>
                    ) : (
                      <>
                        <Shield size={14} />
                        Make Admin
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleBanUser(user.user_id, !user.is_banned)}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                      user.is_banned
                        ? "bg-success/20 text-success hover:bg-success/30"
                        : "bg-destructive/20 text-destructive hover:bg-destructive/30"
                    }`}
                  >
                    {user.is_banned ? (
                      <>
                        <CheckCircle size={14} />
                        Unban
                      </>
                    ) : (
                      <>
                        <Ban size={14} />
                        Ban
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UsersManager;
