// Type definitions for Supabase Database
// This is a manually created type definition file

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

/**
 * Main database types for the application
 */
export interface Database {
  public: {
    Tables: {
      livestock: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          organization_id: string
          status?: string
          breed?: string
          location?: string
          // Add other fields from your livestock table as needed
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string
          organization_id?: string
          status?: string
          breed?: string
          location?: string
          // Add other fields from your livestock table as needed
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          organization_id?: string
          status?: string
          breed?: string
          location?: string
          // Add other fields from your livestock table as needed
        }
      }
      ai_insights: {
        Row: {
          id: string
          organization_id: string
          farm_id?: string
          insight_type: string
          title: string
          description: string
          severity: 'low' | 'medium' | 'high'
          recommended_actions: Json
          confidence: number
          metadata?: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          farm_id?: string
          insight_type: string
          title: string
          description: string
          severity: 'low' | 'medium' | 'high'
          recommended_actions?: Json
          confidence?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          farm_id?: string | null
          insight_type?: string
          title?: string
          description?: string
          severity?: 'low' | 'medium' | 'high'
          recommended_actions?: Json
          confidence?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      livestock_health_records: {
        Row: {
          id: string
          livestock_id: string
          date: string
          diagnosis: string
          treatment: string
          vet_notes?: string
          medication?: string
          next_checkup_date?: string
          created_at: string
          updated_at: string
        }
        // Add Insert and Update types if needed
      }
      // Add other tables as needed
    }
  }
}
