
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  
  "public": {
          Tables: {
            "attachments": {
                  Row: {
                    "building_id": string,"content_type": string,"created_at": string,"file_name": string,"id": string,"item_id": string | null,"kind": Database["public"]['Enums']["attachment_kind"],"log_entry_id": string | null,"size_bytes": number | null,"storage_path": string,"uploaded_by": string | null,"work_id": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "building_id": string,"content_type"?: string,"created_at"?: string,"file_name": string,"id"?: string,"item_id"?: string | null,"kind"?: Database["public"]['Enums']["attachment_kind"],"log_entry_id"?: string | null,"size_bytes"?: number | null,"storage_path": string,"uploaded_by"?: string | null,"work_id"?: string | null
                  }
                  Update: {
                    "building_id"?: string,"content_type"?: string,"created_at"?: string,"file_name"?: string,"id"?: string,"item_id"?: string | null,"kind"?: Database["public"]['Enums']["attachment_kind"],"log_entry_id"?: string | null,"size_bytes"?: number | null,"storage_path"?: string,"uploaded_by"?: string | null,"work_id"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "attachments_building_id_fkey"
      columns: ["building_id"]
isOneToOne: false
      referencedRelation: "buildings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "attachments_item_id_building_id_fkey"
      columns: ["item_id","building_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id","building_id"]
    },{
      foreignKeyName: "attachments_log_entry_id_building_id_fkey"
      columns: ["log_entry_id","building_id"]
isOneToOne: false
      referencedRelation: "log_entries"
      referencedColumns: ["id","building_id"]
    },{
      foreignKeyName: "attachments_work_id_building_id_fkey"
      columns: ["work_id","building_id"]
isOneToOne: false
      referencedRelation: "work"
      referencedColumns: ["id","building_id"]
    }
                  ]
                },"building_members": {
                  Row: {
                    "building_id": string,"created_at": string,"role": Database["public"]['Enums']["member_role"],"user_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "building_id": string,"created_at"?: string,"role"?: Database["public"]['Enums']["member_role"],"user_id": string
                  }
                  Update: {
                    "building_id"?: string,"created_at"?: string,"role"?: Database["public"]['Enums']["member_role"],"user_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "building_members_building_id_fkey"
      columns: ["building_id"]
isOneToOne: false
      referencedRelation: "buildings"
      referencedColumns: ["id"]
    }
                  ]
                },"buildings": {
                  Row: {
                    "address_line1": string,"address_line2": string,"baths": number | null,"beds": number | null,"city": string,"country": string,"created_at": string,"created_by": string | null,"hemisphere": Database["public"]['Enums']["hemisphere"],"id": string,"name": string,"postal_code": string,"region": string,"sqft": number | null,"type": Database["public"]['Enums']["building_type"],"year_built": number | null
                  }
                  ComputedFields: never
                  Insert: {
                    "address_line1"?: string,"address_line2"?: string,"baths"?: number | null,"beds"?: number | null,"city"?: string,"country"?: string,"created_at"?: string,"created_by"?: string | null,"hemisphere"?: Database["public"]['Enums']["hemisphere"],"id"?: string,"name": string,"postal_code"?: string,"region"?: string,"sqft"?: number | null,"type": Database["public"]['Enums']["building_type"],"year_built"?: number | null
                  }
                  Update: {
                    "address_line1"?: string,"address_line2"?: string,"baths"?: number | null,"beds"?: number | null,"city"?: string,"country"?: string,"created_at"?: string,"created_by"?: string | null,"hemisphere"?: Database["public"]['Enums']["hemisphere"],"id"?: string,"name"?: string,"postal_code"?: string,"region"?: string,"sqft"?: number | null,"type"?: Database["public"]['Enums']["building_type"],"year_built"?: number | null
                  }
                  Relationships: [
                    
                  ]
                },"contacts": {
                  Row: {
                    "company": string,"created_at": string,"email": string,"id": string,"instagram": string,"name": string,"owner_id": string,"phone": string,"photo_path": string | null,"trade": string,"why_we_like_them": string
                  }
                  ComputedFields: never
                  Insert: {
                    "company"?: string,"created_at"?: string,"email"?: string,"id"?: string,"instagram"?: string,"name": string,"owner_id"?: string,"phone"?: string,"photo_path"?: string | null,"trade"?: string,"why_we_like_them"?: string
                  }
                  Update: {
                    "company"?: string,"created_at"?: string,"email"?: string,"id"?: string,"instagram"?: string,"name"?: string,"owner_id"?: string,"phone"?: string,"photo_path"?: string | null,"trade"?: string,"why_we_like_them"?: string
                  }
                  Relationships: [
                    
                  ]
                },"items": {
                  Row: {
                    "brand": string,"building_id": string,"created_at": string,"id": string,"installed_on": string | null,"model": string,"name": string,"notes": string,"space_id": string,"template_key": string | null
                  }
                  ComputedFields: never
                  Insert: {
                    "brand"?: string,"building_id": string,"created_at"?: string,"id"?: string,"installed_on"?: string | null,"model"?: string,"name": string,"notes"?: string,"space_id": string,"template_key"?: string | null
                  }
                  Update: {
                    "brand"?: string,"building_id"?: string,"created_at"?: string,"id"?: string,"installed_on"?: string | null,"model"?: string,"name"?: string,"notes"?: string,"space_id"?: string,"template_key"?: string | null
                  }
                  Relationships: [
                    {
      foreignKeyName: "items_building_id_fkey"
      columns: ["building_id"]
isOneToOne: false
      referencedRelation: "buildings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "items_space_id_building_id_fkey"
      columns: ["space_id","building_id"]
isOneToOne: false
      referencedRelation: "spaces"
      referencedColumns: ["id","building_id"]
    }
                  ]
                },"log_entries": {
                  Row: {
                    "building_id": string,"cost": number | null,"created_at": string,"done_on": string,"id": string,"item_id": string,"note": string,"schedule_id": string | null,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "building_id": string,"cost"?: number | null,"created_at"?: string,"done_on": string,"id"?: string,"item_id": string,"note"?: string,"schedule_id"?: string | null,"title": string
                  }
                  Update: {
                    "building_id"?: string,"cost"?: number | null,"created_at"?: string,"done_on"?: string,"id"?: string,"item_id"?: string,"note"?: string,"schedule_id"?: string | null,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "log_entries_building_id_fkey"
      columns: ["building_id"]
isOneToOne: false
      referencedRelation: "buildings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "log_entries_item_id_building_id_fkey"
      columns: ["item_id","building_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id","building_id"]
    },{
      foreignKeyName: "log_entries_schedule_id_building_id_fkey"
      columns: ["schedule_id","building_id"]
isOneToOne: false
      referencedRelation: "schedules"
      referencedColumns: ["id","building_id"]
    }
                  ]
                },"log_entry_contacts": {
                  Row: {
                    "contact_id": string,"log_entry_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "contact_id": string,"log_entry_id": string
                  }
                  Update: {
                    "contact_id"?: string,"log_entry_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "log_entry_contacts_contact_id_fkey"
      columns: ["contact_id"]
isOneToOne: false
      referencedRelation: "contacts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "log_entry_contacts_log_entry_id_fkey"
      columns: ["log_entry_id"]
isOneToOne: false
      referencedRelation: "log_entries"
      referencedColumns: ["id"]
    }
                  ]
                },"profiles": {
                  Row: {
                    "avatar_url": string | null,"created_at": string,"full_name": string | null,"id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "avatar_url"?: string | null,"created_at"?: string,"full_name"?: string | null,"id": string
                  }
                  Update: {
                    "avatar_url"?: string | null,"created_at"?: string,"full_name"?: string | null,"id"?: string
                  }
                  Relationships: [
                    
                  ]
                },"schedules": {
                  Row: {
                    "active": boolean,"building_id": string,"created_at": string,"id": string,"item_id": string,"last_done_on": string | null,"next_due_on": string,"repeat": NonNullable<Json>,"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "active"?: boolean,"building_id": string,"created_at"?: string,"id"?: string,"item_id": string,"last_done_on"?: string | null,"next_due_on": string,"repeat": NonNullable<Json>,"title": string
                  }
                  Update: {
                    "active"?: boolean,"building_id"?: string,"created_at"?: string,"id"?: string,"item_id"?: string,"last_done_on"?: string | null,"next_due_on"?: string,"repeat"?: NonNullable<Json>,"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "schedules_building_id_fkey"
      columns: ["building_id"]
isOneToOne: false
      referencedRelation: "buildings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "schedules_item_id_building_id_fkey"
      columns: ["item_id","building_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id","building_id"]
    }
                  ]
                },"spaces": {
                  Row: {
                    "building_id": string,"created_at": string,"id": string,"kind": Database["public"]['Enums']["room_kind"],"name": string,"sort_order": number
                  }
                  ComputedFields: never
                  Insert: {
                    "building_id": string,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["room_kind"],"name": string,"sort_order"?: number
                  }
                  Update: {
                    "building_id"?: string,"created_at"?: string,"id"?: string,"kind"?: Database["public"]['Enums']["room_kind"],"name"?: string,"sort_order"?: number
                  }
                  Relationships: [
                    {
      foreignKeyName: "spaces_building_id_fkey"
      columns: ["building_id"]
isOneToOne: false
      referencedRelation: "buildings"
      referencedColumns: ["id"]
    }
                  ]
                },"work": {
                  Row: {
                    "budget": number | null,"building_id": string,"cost": number | null,"created_at": string,"finished_on": string | null,"id": string,"item_id": string | null,"kind": Database["public"]['Enums']["work_kind"],"notes": string,"performed_by": Database["public"]['Enums']["performed_by"],"planned_on": string | null,"space_id": string | null,"started_on": string | null,"status": Database["public"]['Enums']["work_status"],"title": string
                  }
                  ComputedFields: never
                  Insert: {
                    "budget"?: number | null,"building_id": string,"cost"?: number | null,"created_at"?: string,"finished_on"?: string | null,"id"?: string,"item_id"?: string | null,"kind": Database["public"]['Enums']["work_kind"],"notes"?: string,"performed_by"?: Database["public"]['Enums']["performed_by"],"planned_on"?: string | null,"space_id"?: string | null,"started_on"?: string | null,"status": Database["public"]['Enums']["work_status"],"title": string
                  }
                  Update: {
                    "budget"?: number | null,"building_id"?: string,"cost"?: number | null,"created_at"?: string,"finished_on"?: string | null,"id"?: string,"item_id"?: string | null,"kind"?: Database["public"]['Enums']["work_kind"],"notes"?: string,"performed_by"?: Database["public"]['Enums']["performed_by"],"planned_on"?: string | null,"space_id"?: string | null,"started_on"?: string | null,"status"?: Database["public"]['Enums']["work_status"],"title"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "work_building_id_fkey"
      columns: ["building_id"]
isOneToOne: false
      referencedRelation: "buildings"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "work_item_id_building_id_fkey"
      columns: ["item_id","building_id"]
isOneToOne: false
      referencedRelation: "items"
      referencedColumns: ["id","building_id"]
    },{
      foreignKeyName: "work_space_id_building_id_fkey"
      columns: ["space_id","building_id"]
isOneToOne: false
      referencedRelation: "spaces"
      referencedColumns: ["id","building_id"]
    }
                  ]
                },"work_contacts": {
                  Row: {
                    "contact_id": string,"work_id": string
                  }
                  ComputedFields: never
                  Insert: {
                    "contact_id": string,"work_id": string
                  }
                  Update: {
                    "contact_id"?: string,"work_id"?: string
                  }
                  Relationships: [
                    {
      foreignKeyName: "work_contacts_contact_id_fkey"
      columns: ["contact_id"]
isOneToOne: false
      referencedRelation: "contacts"
      referencedColumns: ["id"]
    },{
      foreignKeyName: "work_contacts_work_id_fkey"
      columns: ["work_id"]
isOneToOne: false
      referencedRelation: "work"
      referencedColumns: ["id"]
    }
                  ]
                }
          }
          Views: {
            [_ in never]: never
          }
          Functions: {
            "add_items":
{ Args: { "items": Json,"schedules": Json }; Returns: undefined
                           },
"complete_schedules":
{ Args: { "completions": Json }; Returns: undefined
                           },
"create_building":
{ Args: { "building": Json,"items": Json,"schedules": Json,"spaces": Json }; Returns: undefined
                           },
"save_work":
{ Args: { "contact_ids": (string)[],"work": Json }; Returns: undefined
                           }
          }
          Enums: {
            "attachment_kind": "photo"|"receipt"|"manual"|"other","building_type": "house"|"apartment_condo"|"mobile_home"|"rental"|"gym"|"store_cafe"|"office"|"theater","hemisphere": "north"|"south","member_role": "owner"|"member","performed_by": "diy"|"hired","room_kind": "whole_building"|"bedroom"|"bathroom"|"kitchen"|"living"|"hallway"|"laundry"|"garage"|"garden"|"other","work_kind": "project"|"repair","work_status": "idea"|"planning"|"open"|"in_progress"|"done"|"fixed"
          }
          CompositeTypes: {
            [_ in never]: never
          }
        }
}

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>

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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaTableNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
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
    : never = never
> = PublicCompositeTypeNameOrOptions extends { schema: keyof DatabaseWithoutInternals }
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  "public": {
          Enums: {
            "attachment_kind": ["photo", "receipt", "manual", "other"],"building_type": ["house", "apartment_condo", "mobile_home", "rental", "gym", "store_cafe", "office", "theater"],"hemisphere": ["north", "south"],"member_role": ["owner", "member"],"performed_by": ["diy", "hired"],"room_kind": ["whole_building", "bedroom", "bathroom", "kitchen", "living", "hallway", "laundry", "garage", "garden", "other"],"work_kind": ["project", "repair"],"work_status": ["idea", "planning", "open", "in_progress", "done", "fixed"]
          }
        }
} as const
