import { supabase } from "../lib/supabase";

const userService = {
  // Récupérer le profil d'un utilisateur
  async getProfile(userId) {
    const { data, error } = await supabase
      .from("profiles")
      .select("*, pays:pays(name, code)")
      .eq("id", userId)
      .single();

    if (error) throw error;
    return data;
  },

  // Mettre à jour le profil
  async updateProfile(userId, updates) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Upload de photo CNI
  async uploadCNI(userId, file) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/${Date.now()}_cni.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("cni_documents")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    // Mettre à jour le profil avec le chemin
    const { data, error } = await supabase
      .from("profiles")
      .update({ photo_cni: fileName })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Upload d'avatar
  async uploadAvatar(userId, file) {
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}/avatar_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase.storage
      .from("avatars")
      .getPublicUrl(fileName);

    const { data, error } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl.publicUrl })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Récupérer tous les utilisateurs (admin)
  async getAllUsers(filters = {}) {
    let query = supabase.from("profiles").select("*, pays:pays(name)");

    if (filters.role) query = query.eq("role", filters.role);
    if (filters.isActive !== undefined)
      query = query.eq("is_active", filters.isActive);

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;
    return data;
  },

  // Changer le rôle d'un utilisateur (admin)
  async changeRole(userId, newRole) {
    const { data, error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

export default userService;
