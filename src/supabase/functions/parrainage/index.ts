// supabase/functions/parrainage-commission/index.ts
import { createClient } from 
// @ts-ignore - Deno types are available at runtime
Deno.serve(async (req: Request) => {
  try {
    const supabase = createClient(
      // @ts-ignore
      Deno.env.get("SUPABASE_URL")!,
      // @ts-ignore
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { user_id } = await req.json();

    if (!user_id) {
      return new Response(
        JSON.stringify({ error: "user_id required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 1. Récupérer le parrain
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("parrain_id")
      .eq("id", user_id)
      .single();

    if (profileError || !profile?.parrain_id) {
      return new Response(
        JSON.stringify({ message: "No sponsor found" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    const commission = 10;

    // 2. Créer la fonction increment_wallet si elle n'existe pas
    // Exécutez ce SQL dans l'éditeur Supabase :
    /*
    CREATE OR REPLACE FUNCTION increment_wallet(uid UUID, amount DECIMAL)
    RETURNS void AS $$
    BEGIN
      UPDATE wallets 
      SET balance = balance + amount,
          commissions_total = commissions_total + amount
      WHERE user_id = uid;
    END;
    $$ LANGUAGE plpgsql;
    */

    // 3. Créditer le wallet du parrain
    await supabase.rpc("increment_wallet", {
      uid: profile.parrain_id,
      amount: commission
    });

    // 4. Enregistrer le parrainage
    await supabase.from("parrainages").insert({
      parrain_id: profile.parrain_id,
      filleul_id: user_id,
      commission: commission,
      statut: "active"
    });

    // 5. Créer une notification
    await supabase.from("notifications").insert({
      user_id: profile.parrain_id,
      title: "Commission reçue",
      message: `Vous avez gagné ${commission} FCFA pour votre filleul !`,
      type: "commission_earned",
      send_internal: true
    });

    return new Response(
      JSON.stringify({ success: true, message: "Commission credited" }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});