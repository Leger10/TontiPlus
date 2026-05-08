export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      adhesions: {
        Row: {
          adresse: string | null
          cnib: string | null
          created_at: string | null
          date_signature: string | null
          date_validation: string | null
          email: string | null
          engagement_pdf_url: string | null
          has_taken_gain: boolean | null
          id: string
          identite_document_url: string | null
          motif_rejet: string | null
          nom_complet: string
          nombre_mains: number | null
          numero_telephone: string
          operateur_id: number | null
          photo_cni_url: string | null
          position_tour: number | null
          signature_acceptee: boolean | null
          statut: string | null
          tontine_id: string | null
          updated_at: string | null
          user_id: string | null
          valide_par: string | null
        }
        Insert: {
          adresse?: string | null
          cnib?: string | null
          created_at?: string | null
          date_signature?: string | null
          date_validation?: string | null
          email?: string | null
          engagement_pdf_url?: string | null
          has_taken_gain?: boolean | null
          id?: string
          identite_document_url?: string | null
          motif_rejet?: string | null
          nom_complet: string
          nombre_mains?: number | null
          numero_telephone: string
          operateur_id?: number | null
          photo_cni_url?: string | null
          position_tour?: number | null
          signature_acceptee?: boolean | null
          statut?: string | null
          tontine_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          valide_par?: string | null
        }
        Update: {
          adresse?: string | null
          cnib?: string | null
          created_at?: string | null
          date_signature?: string | null
          date_validation?: string | null
          email?: string | null
          engagement_pdf_url?: string | null
          has_taken_gain?: boolean | null
          id?: string
          identite_document_url?: string | null
          motif_rejet?: string | null
          nom_complet?: string
          nombre_mains?: number | null
          numero_telephone?: string
          operateur_id?: number | null
          photo_cni_url?: string | null
          position_tour?: number | null
          signature_acceptee?: boolean | null
          statut?: string | null
          tontine_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          valide_par?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "adhesions_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "operateurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adhesions_tontine_id_fkey"
            columns: ["tontine_id"]
            isOneToOne: false
            referencedRelation: "tontines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adhesions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "adhesions_valide_par_fkey"
            columns: ["valide_par"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          statut: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          statut?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          statut?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_type: string | null
          adhesion_id: string | null
          created_at: string | null
          date_action: string | null
          email_sent: boolean | null
          email_sent_at: string | null
          error_message: string | null
          id: string
          internal_sent: boolean | null
          internal_sent_at: string | null
          is_read: boolean | null
          lien_action: string | null
          message: string
          priority: string | null
          push_sent: boolean | null
          push_sent_at: string | null
          recipient_email: string | null
          recipient_phone: string | null
          send_email: boolean | null
          send_internal: boolean | null
          send_push: boolean | null
          send_sms: boolean | null
          sent_at: string | null
          sms_sent: boolean | null
          sms_sent_at: string | null
          title: string
          tontine_id: string | null
          type: string | null
          user_id: string | null
        }
        Insert: {
          action_type?: string | null
          adhesion_id?: string | null
          created_at?: string | null
          date_action?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          error_message?: string | null
          id?: string
          internal_sent?: boolean | null
          internal_sent_at?: string | null
          is_read?: boolean | null
          lien_action?: string | null
          message: string
          priority?: string | null
          push_sent?: boolean | null
          push_sent_at?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          send_email?: boolean | null
          send_internal?: boolean | null
          send_push?: boolean | null
          send_sms?: boolean | null
          sent_at?: string | null
          sms_sent?: boolean | null
          sms_sent_at?: string | null
          title: string
          tontine_id?: string | null
          type?: string | null
          user_id?: string | null
        }
        Update: {
          action_type?: string | null
          adhesion_id?: string | null
          created_at?: string | null
          date_action?: string | null
          email_sent?: boolean | null
          email_sent_at?: string | null
          error_message?: string | null
          id?: string
          internal_sent?: boolean | null
          internal_sent_at?: string | null
          is_read?: boolean | null
          lien_action?: string | null
          message?: string
          priority?: string | null
          push_sent?: boolean | null
          push_sent_at?: string | null
          recipient_email?: string | null
          recipient_phone?: string | null
          send_email?: boolean | null
          send_internal?: boolean | null
          send_push?: boolean | null
          send_sms?: boolean | null
          sent_at?: string | null
          sms_sent?: boolean | null
          sms_sent_at?: string | null
          title?: string
          tontine_id?: string | null
          type?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_adhesion_id_fkey"
            columns: ["adhesion_id"]
            isOneToOne: false
            referencedRelation: "adhesions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_tontine_id_fkey"
            columns: ["tontine_id"]
            isOneToOne: false
            referencedRelation: "tontines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      operateurs: {
        Row: {
          code: string
          created_at: string | null
          id: number
          is_active: boolean | null
          logo_url: string | null
          nom: string
          pays_id: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          logo_url?: string | null
          nom: string
          pays_id?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          logo_url?: string | null
          nom?: string
          pays_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "operateurs_pays_id_fkey"
            columns: ["pays_id"]
            isOneToOne: false
            referencedRelation: "pays"
            referencedColumns: ["id"]
          },
        ]
      }
      otp_codes: {
        Row: {
          attempts: number | null
          code: string
          created_at: string | null
          expires_at: string
          id: string
          is_used: boolean | null
          phone: string
          type: string | null
        }
        Insert: {
          attempts?: number | null
          code: string
          created_at?: string | null
          expires_at: string
          id?: string
          is_used?: boolean | null
          phone: string
          type?: string | null
        }
        Update: {
          attempts?: number | null
          code?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          is_used?: boolean | null
          phone?: string
          type?: string | null
        }
        Relationships: []
      }
      paiements: {
        Row: {
          adhesion_id: string | null
          capture_ecran_url: string | null
          created_at: string | null
          cycle_end: string | null
          cycle_number: number
          cycle_start: string | null
          date_limite: string | null
          date_paiement: string | null
          date_rappel: string | null
          date_validation_tontinier: string | null
          id: string
          is_offline: boolean | null
          main_number: number | null
          montant: number
          numero_emetteur: string | null
          operateur_id: number | null
          operateur_nom: string | null
          operateur_numero: string | null
          statut: string | null
          tontine_id: string | null
          transaction_id: string | null
          updated_at: string | null
          user_id: string | null
          valide_par_tontinier: boolean | null
        }
        Insert: {
          adhesion_id?: string | null
          capture_ecran_url?: string | null
          created_at?: string | null
          cycle_end?: string | null
          cycle_number: number
          cycle_start?: string | null
          date_limite?: string | null
          date_paiement?: string | null
          date_rappel?: string | null
          date_validation_tontinier?: string | null
          id?: string
          is_offline?: boolean | null
          main_number?: number | null
          montant: number
          numero_emetteur?: string | null
          operateur_id?: number | null
          operateur_nom?: string | null
          operateur_numero?: string | null
          statut?: string | null
          tontine_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          valide_par_tontinier?: boolean | null
        }
        Update: {
          adhesion_id?: string | null
          capture_ecran_url?: string | null
          created_at?: string | null
          cycle_end?: string | null
          cycle_number?: number
          cycle_start?: string | null
          date_limite?: string | null
          date_paiement?: string | null
          date_rappel?: string | null
          date_validation_tontinier?: string | null
          id?: string
          is_offline?: boolean | null
          main_number?: number | null
          montant?: number
          numero_emetteur?: string | null
          operateur_id?: number | null
          operateur_nom?: string | null
          operateur_numero?: string | null
          statut?: string | null
          tontine_id?: string | null
          transaction_id?: string | null
          updated_at?: string | null
          user_id?: string | null
          valide_par_tontinier?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "paiements_adhesion_id_fkey"
            columns: ["adhesion_id"]
            isOneToOne: false
            referencedRelation: "adhesions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "operateurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_tontine_id_fkey"
            columns: ["tontine_id"]
            isOneToOne: false
            referencedRelation: "tontines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "paiements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      parrainages: {
        Row: {
          commission: number | null
          created_at: string | null
          date_paiement: string | null
          filleul_id: string | null
          id: string
          parrain_id: string | null
          statut: string | null
        }
        Insert: {
          commission?: number | null
          created_at?: string | null
          date_paiement?: string | null
          filleul_id?: string | null
          id?: string
          parrain_id?: string | null
          statut?: string | null
        }
        Update: {
          commission?: number | null
          created_at?: string | null
          date_paiement?: string | null
          filleul_id?: string | null
          id?: string
          parrain_id?: string | null
          statut?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "parrainages_filleul_id_fkey"
            columns: ["filleul_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "parrainages_parrain_id_fkey"
            columns: ["parrain_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pays: {
        Row: {
          code: string | null
          created_at: string | null
          devise: string | null
          id: number
          indicatif_telephone: string | null
          name: string
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          devise?: string | null
          id?: number
          indicatif_telephone?: string | null
          name: string
        }
        Update: {
          code?: string | null
          created_at?: string | null
          devise?: string | null
          id?: number
          indicatif_telephone?: string | null
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          abonnement_expire_at: string | null
          abonnement_started_at: string | null
          abonnement_type: string | null
          avatar_url: string | null
          created_at: string | null
          date_naissance: string | null
          email: string | null
          full_name: string | null
          genre: string | null
          id: string
          is_active: boolean | null
          is_pro: boolean | null
          last_login: string | null
          parrain_id: string | null
          pays_id: number | null
          phone: string | null
          photo_cni: string | null
          profession: string | null
          role: string | null
          total_commissions: number | null
          updated_at: string | null
        }
        Insert: {
          abonnement_expire_at?: string | null
          abonnement_started_at?: string | null
          abonnement_type?: string | null
          avatar_url?: string | null
          created_at?: string | null
          date_naissance?: string | null
          email?: string | null
          full_name?: string | null
          genre?: string | null
          id: string
          is_active?: boolean | null
          is_pro?: boolean | null
          last_login?: string | null
          parrain_id?: string | null
          pays_id?: number | null
          phone?: string | null
          photo_cni?: string | null
          profession?: string | null
          role?: string | null
          total_commissions?: number | null
          updated_at?: string | null
        }
        Update: {
          abonnement_expire_at?: string | null
          abonnement_started_at?: string | null
          abonnement_type?: string | null
          avatar_url?: string | null
          created_at?: string | null
          date_naissance?: string | null
          email?: string | null
          full_name?: string | null
          genre?: string | null
          id?: string
          is_active?: boolean | null
          is_pro?: boolean | null
          last_login?: string | null
          parrain_id?: string | null
          pays_id?: number | null
          phone?: string | null
          photo_cni?: string | null
          profession?: string | null
          role?: string | null
          total_commissions?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_parrain_id_fkey"
            columns: ["parrain_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_pays_id_fkey"
            columns: ["pays_id"]
            isOneToOne: false
            referencedRelation: "pays"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          updated_at: string | null
          value: Json | null
        }
        Insert: {
          key: string
          updated_at?: string | null
          value?: Json | null
        }
        Update: {
          key?: string
          updated_at?: string | null
          value?: Json | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string | null
          date_debut: string
          date_fin: string
          desactivation_raison: string | null
          id: string
          last_admin_action_by: string | null
          last_admin_action_date: string | null
          notes_admin: string | null
          prix: number
          reference_paiement: string | null
          statut: string | null
          type_pack: string
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          date_debut: string
          date_fin: string
          desactivation_raison?: string | null
          id?: string
          last_admin_action_by?: string | null
          last_admin_action_date?: string | null
          notes_admin?: string | null
          prix: number
          reference_paiement?: string | null
          statut?: string | null
          type_pack: string
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          date_debut?: string
          date_fin?: string
          desactivation_raison?: string | null
          id?: string
          last_admin_action_by?: string | null
          last_admin_action_date?: string | null
          notes_admin?: string | null
          prix?: number
          reference_paiement?: string | null
          statut?: string | null
          type_pack?: string
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_last_admin_action_by_fkey"
            columns: ["last_admin_action_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tontines: {
        Row: {
          contact_organisateur: string | null
          created_at: string | null
          cycle_actuel: number | null
          cycle_total: number | null
          date_debut: string | null
          date_fin: string | null
          delai_rigueur: number | null
          description: string | null
          frequence: string | null
          id: string
          image_url: string | null
          localisation: string | null
          montant_cotisation: number
          montant_maximum: number | null
          montant_minimum: number | null
          montant_total_collecte: number | null
          name: string
          nombre_mains_max: number | null
          nombre_membres: number | null
          organisateur_id: string | null
          organisateur_numero: string | null
          organisateur_operateur_id: number | null
          paiement_anticipe: boolean | null
          paliers: Json | null
          pays_id: number | null
          possibilites_speciales: string | null
          quartier: string | null
          statut: string | null
          type_tontine: string | null
          updated_at: string | null
          ville: string | null
          whatsapp: string | null
        }
        Insert: {
          contact_organisateur?: string | null
          created_at?: string | null
          cycle_actuel?: number | null
          cycle_total?: number | null
          date_debut?: string | null
          date_fin?: string | null
          delai_rigueur?: number | null
          description?: string | null
          frequence?: string | null
          id?: string
          image_url?: string | null
          localisation?: string | null
          montant_cotisation: number
          montant_maximum?: number | null
          montant_minimum?: number | null
          montant_total_collecte?: number | null
          name: string
          nombre_mains_max?: number | null
          nombre_membres?: number | null
          organisateur_id?: string | null
          organisateur_numero?: string | null
          organisateur_operateur_id?: number | null
          paiement_anticipe?: boolean | null
          paliers?: Json | null
          pays_id?: number | null
          possibilites_speciales?: string | null
          quartier?: string | null
          statut?: string | null
          type_tontine?: string | null
          updated_at?: string | null
          ville?: string | null
          whatsapp?: string | null
        }
        Update: {
          contact_organisateur?: string | null
          created_at?: string | null
          cycle_actuel?: number | null
          cycle_total?: number | null
          date_debut?: string | null
          date_fin?: string | null
          delai_rigueur?: number | null
          description?: string | null
          frequence?: string | null
          id?: string
          image_url?: string | null
          localisation?: string | null
          montant_cotisation?: number
          montant_maximum?: number | null
          montant_minimum?: number | null
          montant_total_collecte?: number | null
          name?: string
          nombre_mains_max?: number | null
          nombre_membres?: number | null
          organisateur_id?: string | null
          organisateur_numero?: string | null
          organisateur_operateur_id?: number | null
          paiement_anticipe?: boolean | null
          paliers?: Json | null
          pays_id?: number | null
          possibilites_speciales?: string | null
          quartier?: string | null
          statut?: string | null
          type_tontine?: string | null
          updated_at?: string | null
          ville?: string | null
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tontines_organisateur_id_fkey"
            columns: ["organisateur_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontines_organisateur_operateur_id_fkey"
            columns: ["organisateur_operateur_id"]
            isOneToOne: false
            referencedRelation: "operateurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontines_pays_id_fkey"
            columns: ["pays_id"]
            isOneToOne: false
            referencedRelation: "pays"
            referencedColumns: ["id"]
          },
        ]
      }
      tours: {
        Row: {
          adhesion_id: string | null
          created_at: string | null
          cycle_number: number
          date_notification: string | null
          date_notification_rappel: string | null
          date_reception: string | null
          id: string
          montant_recu: number | null
          nombre_mains: number | null
          position: number
          statut: string | null
          tontine_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          adhesion_id?: string | null
          created_at?: string | null
          cycle_number: number
          date_notification?: string | null
          date_notification_rappel?: string | null
          date_reception?: string | null
          id?: string
          montant_recu?: number | null
          nombre_mains?: number | null
          position: number
          statut?: string | null
          tontine_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          adhesion_id?: string | null
          created_at?: string | null
          cycle_number?: number
          date_notification?: string | null
          date_notification_rappel?: string | null
          date_reception?: string | null
          id?: string
          montant_recu?: number | null
          nombre_mains?: number | null
          position?: number
          statut?: string | null
          tontine_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tours_adhesion_id_fkey"
            columns: ["adhesion_id"]
            isOneToOne: false
            referencedRelation: "adhesions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tours_tontine_id_fkey"
            columns: ["tontine_id"]
            isOneToOne: false
            referencedRelation: "tontines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tours_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions_wallet: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          methode: string | null
          montant: number
          reference: string | null
          statut: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          methode?: string | null
          montant: number
          reference?: string | null
          statut?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          methode?: string | null
          montant?: number
          reference?: string | null
          statut?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_wallet_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      wallets: {
        Row: {
          balance: number | null
          commissions_total: number | null
          created_at: string | null
          id: string
          pending_withdrawal: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          balance?: number | null
          commissions_total?: number | null
          created_at?: string | null
          id?: string
          pending_withdrawal?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          balance?: number | null
          commissions_total?: number | null
          created_at?: string | null
          id?: string
          pending_withdrawal?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "wallets_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      withdrawals: {
        Row: {
          amount: number
          amount_net: number
          created_at: string | null
          date_completion: string | null
          date_validation: string | null
          frais: number | null
          id: string
          motif_rejet: string | null
          operateur_id: number | null
          operateur_nom: string | null
          phone_number: string
          statut: string | null
          transaction_id: string | null
          user_id: string | null
          valide_par: string | null
        }
        Insert: {
          amount: number
          amount_net: number
          created_at?: string | null
          date_completion?: string | null
          date_validation?: string | null
          frais?: number | null
          id?: string
          motif_rejet?: string | null
          operateur_id?: number | null
          operateur_nom?: string | null
          phone_number: string
          statut?: string | null
          transaction_id?: string | null
          user_id?: string | null
          valide_par?: string | null
        }
        Update: {
          amount?: number
          amount_net?: number
          created_at?: string | null
          date_completion?: string | null
          date_validation?: string | null
          frais?: number | null
          id?: string
          motif_rejet?: string | null
          operateur_id?: number | null
          operateur_nom?: string | null
          phone_number?: string
          statut?: string | null
          transaction_id?: string | null
          user_id?: string | null
          valide_par?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_operateur_id_fkey"
            columns: ["operateur_id"]
            isOneToOne: false
            referencedRelation: "operateurs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdrawals_valide_par_fkey"
            columns: ["valide_par"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      activate_subscription: {
        Args: { p_duration_months: number; p_type: string; p_user_id: string }
        Returns: Json
      }
      increment_wallet: {
        Args: { amount: number; uid: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
