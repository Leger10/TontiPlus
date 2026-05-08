import { supabase } from "../lib/supabase";

const tontineService = {
  // Créer une tontine
  async createTontine(data) {
    const { data: tontine, error } = await supabase
      .from("tontines")
      .insert([
        {
          ...data,
          organisateur_id: (await supabase.auth.getUser()).data.user?.id,
        },
      ])
      .select()
      .single();

    if (error) throw error;
    return tontine;
  },

  // Récupérer toutes les tontines
  async getAllTontines(filters = {}) {
    let query = supabase
      .from("tontines")
      .select(
        "*, organisateur:organisateur_id(full_name, email), pays:pays(name)",
      );

    if (filters.status) query = query.eq("statut", filters.status);
    if (filters.pays_id) query = query.eq("pays_id", filters.pays_id);
    if (filters.organisateur_id)
      query = query.eq("organisateur_id", filters.organisateur_id);

    const { data, error } = await query.order("created_at", {
      ascending: false,
    });

    if (error) throw error;
    return data;
  },

  // Récupérer une tontine par ID
  async getTontineById(id) {
    const { data, error } = await supabase
      .from("tontines")
      .select("*, organisateur:organisateur_id(*), pays:pays(*)")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // Mettre à jour une tontine
  async updateTontine(id, updates) {
    const { data, error } = await supabase
      .from("tontines")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Upload image de tontine
  async uploadTontineImage(tontineId, file) {
    const fileExt = file.name.split(".").pop();
    const fileName = `tontines/${tontineId}/cover_${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("tontines_images")
      .upload(fileName, file);

    if (uploadError) throw uploadError;

    const { data: publicUrl } = supabase.storage
      .from("tontines_images")
      .getPublicUrl(fileName);

    const { data, error } = await supabase
      .from("tontines")
      .update({ image_url: publicUrl.publicUrl })
      .eq("id", tontineId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Supprimer une tontine
  async deleteTontine(id) {
    const { error } = await supabase.from("tontines").delete().eq("id", id);

    if (error) throw error;
    return true;
  },
};

export default tontineService;
