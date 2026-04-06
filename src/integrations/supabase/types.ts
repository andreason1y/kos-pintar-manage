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
      admins: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      broadcasts: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          message: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          message: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          message?: string
        }
        Relationships: []
      }
      deposits: {
        Row: {
          catatan_potongan: string | null
          created_at: string
          id: string
          jumlah: number
          jumlah_dikembalikan: number
          property_id: string
          status: string
          tanggal_kembali: string | null
          tenant_id: string
        }
        Insert: {
          catatan_potongan?: string | null
          created_at?: string
          id?: string
          jumlah?: number
          jumlah_dikembalikan?: number
          property_id: string
          status?: string
          tanggal_kembali?: string | null
          tenant_id: string
        }
        Update: {
          catatan_potongan?: string | null
          created_at?: string
          id?: string
          jumlah?: number
          jumlah_dikembalikan?: number
          property_id?: string
          status?: string
          tanggal_kembali?: string | null
          tenant_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposits_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposits_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      expenses: {
        Row: {
          created_at: string
          id: string
          is_recurring: boolean
          judul: string
          jumlah: number
          kategori: string
          property_id: string
          tanggal: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_recurring?: boolean
          judul: string
          jumlah?: number
          kategori?: string
          property_id: string
          tanggal?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_recurring?: boolean
          judul?: string
          jumlah?: number
          kategori?: string
          property_id?: string
          tanggal?: string
        }
        Relationships: [
          {
            foreignKeyName: "expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          nama: string | null
          no_hp: string | null
        }
        Insert: {
          created_at?: string
          id: string
          nama?: string | null
          no_hp?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          nama?: string | null
          no_hp?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          alamat: string | null
          created_at: string
          id: string
          nama_kos: string
          user_id: string
        }
        Insert: {
          alamat?: string | null
          created_at?: string
          id?: string
          nama_kos: string
          user_id: string
        }
        Update: {
          alamat?: string | null
          created_at?: string
          id?: string
          nama_kos?: string
          user_id?: string
        }
        Relationships: []
      }
      reminders: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          periode_bulan: number
          periode_tahun: number
          property_id: string
          tenant_id: string
          type: string
          wa_link: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          periode_bulan: number
          periode_tahun: number
          property_id: string
          tenant_id: string
          type: string
          wa_link?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          periode_bulan?: number
          periode_tahun?: number
          property_id?: string
          tenant_id?: string
          type?: string
          wa_link?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reminders_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reminders_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      room_types: {
        Row: {
          created_at: string
          fasilitas: string[] | null
          harga_per_bulan: number
          id: string
          nama: string
          property_id: string
        }
        Insert: {
          created_at?: string
          fasilitas?: string[] | null
          harga_per_bulan?: number
          id?: string
          nama: string
          property_id: string
        }
        Update: {
          created_at?: string
          fasilitas?: string[] | null
          harga_per_bulan?: number
          id?: string
          nama?: string
          property_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_types_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          id: string
          lantai: number
          nomor: string
          room_type_id: string
          status: Database["public"]["Enums"]["room_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          lantai?: number
          nomor: string
          room_type_id: string
          status?: Database["public"]["Enums"]["room_status"]
        }
        Update: {
          created_at?: string
          id?: string
          lantai?: number
          nomor?: string
          room_type_id?: string
          status?: Database["public"]["Enums"]["room_status"]
        }
        Relationships: [
          {
            foreignKeyName: "rooms_room_type_id_fkey"
            columns: ["room_type_id"]
            isOneToOne: false
            referencedRelation: "room_types"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          created_at: string
          id: string
          key: string
          value: number
        }
        Insert: {
          created_at?: string
          id?: string
          key: string
          value?: number
        }
        Update: {
          created_at?: string
          id?: string
          key?: string
          value?: number
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          created_at: string
          expires_at: string
          id: string
          started_at: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          id?: string
          started_at?: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          id?: string
          started_at?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      tenants: {
        Row: {
          created_at: string
          gender: Database["public"]["Enums"]["gender_type"]
          id: string
          nama: string
          no_hp: string | null
          property_id: string
          room_id: string | null
          status: Database["public"]["Enums"]["tenant_status"]
          tanggal_keluar: string | null
          tanggal_masuk: string
        }
        Insert: {
          created_at?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          id?: string
          nama: string
          no_hp?: string | null
          property_id: string
          room_id?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          tanggal_keluar?: string | null
          tanggal_masuk?: string
        }
        Update: {
          created_at?: string
          gender?: Database["public"]["Enums"]["gender_type"]
          id?: string
          nama?: string
          no_hp?: string | null
          property_id?: string
          room_id?: string | null
          status?: Database["public"]["Enums"]["tenant_status"]
          tanggal_keluar?: string | null
          tanggal_masuk?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          catatan: string | null
          created_at: string
          id: string
          jumlah_dibayar: number
          metode_bayar: Database["public"]["Enums"]["payment_method"] | null
          nota_number: string | null
          periode_bulan: number
          periode_tahun: number
          property_id: string
          status: Database["public"]["Enums"]["payment_status"]
          tanggal_bayar: string | null
          tenant_id: string
          total_tagihan: number
        }
        Insert: {
          catatan?: string | null
          created_at?: string
          id?: string
          jumlah_dibayar?: number
          metode_bayar?: Database["public"]["Enums"]["payment_method"] | null
          nota_number?: string | null
          periode_bulan: number
          periode_tahun: number
          property_id: string
          status?: Database["public"]["Enums"]["payment_status"]
          tanggal_bayar?: string | null
          tenant_id: string
          total_tagihan?: number
        }
        Update: {
          catatan?: string | null
          created_at?: string
          id?: string
          jumlah_dibayar?: number
          metode_bayar?: Database["public"]["Enums"]["payment_method"] | null
          nota_number?: string | null
          periode_bulan?: number
          periode_tahun?: number
          property_id?: string
          status?: Database["public"]["Enums"]["payment_status"]
          tanggal_bayar?: string | null
          tenant_id?: string
          total_tagihan?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_get_user_stats: {
        Args: never
        Returns: {
          property_count: number
          room_count: number
          user_id: string
        }[]
      }
      admin_get_users: {
        Args: never
        Returns: {
          created_at: string
          email: string
          id: string
          nama: string
          no_hp: string
        }[]
      }
      get_active_outlets: {
        Args: never
        Returns: {
          id: string
          nama_outlet: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      verify_cashier_pin: {
        Args: { p_outlet_id: string; p_pin: string }
        Returns: Json
      }
    }
    Enums: {
      gender_type: "L" | "P"
      payment_method: "tunai" | "transfer" | "qris"
      payment_status: "belum_bayar" | "belum_lunas" | "lunas"
      room_status: "kosong" | "terisi"
      tenant_status: "aktif" | "keluar"
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
    Enums: {
      gender_type: ["L", "P"],
      payment_method: ["tunai", "transfer", "qris"],
      payment_status: ["belum_bayar", "belum_lunas", "lunas"],
      room_status: ["kosong", "terisi"],
      tenant_status: ["aktif", "keluar"],
    },
  },
} as const
