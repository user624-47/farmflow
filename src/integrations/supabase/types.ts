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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string
          icon: string | null
          id: string
          is_active: boolean | null
          rarity: string | null
          requirements: Json | null
          reward_coins: number | null
          reward_xp: number | null
          title: string
        }
        Insert: {
          category: string
          created_at?: string
          description: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          rarity?: string | null
          requirements?: Json | null
          reward_coins?: number | null
          reward_xp?: number | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          icon?: string | null
          id?: string
          is_active?: boolean | null
          rarity?: string | null
          requirements?: Json | null
          reward_coins?: number | null
          reward_xp?: number | null
          title?: string
        }
        Relationships: []
      }
      applications: {
        Row: {
          application_date: string
          application_method: string | null
          cost: number | null
          created_at: string
          crop_id: string | null
          farmer_id: string | null
          id: string
          next_application_date: string | null
          notes: string | null
          organization_id: string | null
          product_name: string
          product_type: string
          quantity: number
          target_pest_disease: string | null
          unit: string
          updated_at: string
          weather_conditions: string | null
        }
        Insert: {
          application_date: string
          application_method?: string | null
          cost?: number | null
          created_at?: string
          crop_id?: string | null
          farmer_id?: string | null
          id?: string
          next_application_date?: string | null
          notes?: string | null
          organization_id?: string | null
          product_name: string
          product_type: string
          quantity: number
          target_pest_disease?: string | null
          unit: string
          updated_at?: string
          weather_conditions?: string | null
        }
        Update: {
          application_date?: string
          application_method?: string | null
          cost?: number | null
          created_at?: string
          crop_id?: string | null
          farmer_id?: string | null
          id?: string
          next_application_date?: string | null
          notes?: string | null
          organization_id?: string | null
          product_name?: string
          product_type?: string
          quantity?: number
          target_pest_disease?: string | null
          unit?: string
          updated_at?: string
          weather_conditions?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_crop_id_fkey"
            columns: ["crop_id"]
            isOneToOne: false
            referencedRelation: "crops"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          amount: number
          bidder_id: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          amount: number
          bidder_id: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          amount?: number
          bidder_id?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          created_at: string
          id: string
          last_message_at: string | null
          participant_1_id: string
          participant_2_id: string
          product_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1_id: string
          participant_2_id: string
          product_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          last_message_at?: string | null
          participant_1_id?: string
          participant_2_id?: string
          product_id?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message_text: string
          message_type: string | null
          product_id: string | null
          receiver_id: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_text: string
          message_type?: string | null
          product_id?: string | null
          receiver_id: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message_text?: string
          message_type?: string | null
          product_id?: string | null
          receiver_id?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      crops: {
        Row: {
          actual_harvest_date: string | null
          created_at: string | null
          crop_name: string
          expected_harvest_date: string | null
          farm_area: number | null
          farmer_id: string | null
          id: string
          notes: string | null
          organization_id: string | null
          planting_date: string | null
          quantity_harvested: number | null
          quantity_planted: number | null
          season: string | null
          status: string | null
          unit: string | null
          updated_at: string | null
          variety: string | null
        }
        Insert: {
          actual_harvest_date?: string | null
          created_at?: string | null
          crop_name: string
          expected_harvest_date?: string | null
          farm_area?: number | null
          farmer_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          planting_date?: string | null
          quantity_harvested?: number | null
          quantity_planted?: number | null
          season?: string | null
          status?: string | null
          unit?: string | null
          updated_at?: string | null
          variety?: string | null
        }
        Update: {
          actual_harvest_date?: string | null
          created_at?: string | null
          crop_name?: string
          expected_harvest_date?: string | null
          farm_area?: number | null
          farmer_id?: string | null
          id?: string
          notes?: string | null
          organization_id?: string | null
          planting_date?: string | null
          quantity_harvested?: number | null
          quantity_planted?: number | null
          season?: string | null
          status?: string | null
          unit?: string | null
          updated_at?: string | null
          variety?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crops_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crops_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crops_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_rewards: {
        Row: {
          claimed_at: string
          day_number: number
          id: string
          reward_coins: number | null
          reward_xp: number | null
          streak_count: number | null
          user_id: string
        }
        Insert: {
          claimed_at?: string
          day_number: number
          id?: string
          reward_coins?: number | null
          reward_xp?: number | null
          streak_count?: number | null
          user_id: string
        }
        Update: {
          claimed_at?: string
          day_number?: number
          id?: string
          reward_coins?: number | null
          reward_xp?: number | null
          streak_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      extension_services: {
        Row: {
          audio_url: string | null
          category: string
          content: string | null
          created_at: string
          description: string
          id: string
          is_active: boolean | null
          language: string | null
          organization_id: string | null
          seasonal_relevance: string[] | null
          target_audience: string[] | null
          title: string
          updated_at: string
          video_url: string | null
          views_count: number | null
        }
        Insert: {
          audio_url?: string | null
          category: string
          content?: string | null
          created_at?: string
          description: string
          id?: string
          is_active?: boolean | null
          language?: string | null
          organization_id?: string | null
          seasonal_relevance?: string[] | null
          target_audience?: string[] | null
          title: string
          updated_at?: string
          video_url?: string | null
          views_count?: number | null
        }
        Update: {
          audio_url?: string | null
          category?: string
          content?: string | null
          created_at?: string
          description?: string
          id?: string
          is_active?: boolean | null
          language?: string | null
          organization_id?: string | null
          seasonal_relevance?: string[] | null
          target_audience?: string[] | null
          title?: string
          updated_at?: string
          video_url?: string | null
          views_count?: number | null
        }
        Relationships: []
      }
      farmers: {
        Row: {
          address: string | null
          created_at: string | null
          crops_grown: string[] | null
          date_of_birth: string | null
          email: string | null
          farm_location: string | null
          farm_size: number | null
          farmer_id: string
          first_name: string
          gender: string | null
          id: string
          id_number: string | null
          last_name: string
          lga: string | null
          livestock_owned: string[] | null
          organization_id: string | null
          phone: string | null
          state: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          crops_grown?: string[] | null
          date_of_birth?: string | null
          email?: string | null
          farm_location?: string | null
          farm_size?: number | null
          farmer_id: string
          first_name: string
          gender?: string | null
          id?: string
          id_number?: string | null
          last_name: string
          lga?: string | null
          livestock_owned?: string[] | null
          organization_id?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          crops_grown?: string[] | null
          date_of_birth?: string | null
          email?: string | null
          farm_location?: string | null
          farm_size?: number | null
          farmer_id?: string
          first_name?: string
          gender?: string | null
          id?: string
          id_number?: string | null
          last_name?: string
          lga?: string | null
          livestock_owned?: string[] | null
          organization_id?: string | null
          phone?: string | null
          state?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farmers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "farmers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_services: {
        Row: {
          amount: number | null
          application_date: string
          approval_date: string | null
          created_at: string
          disbursement_date: string | null
          duration_months: number | null
          farmer_id: string | null
          id: string
          interest_rate: number | null
          notes: string | null
          organization_id: string | null
          provider: string
          repayment_schedule: Json | null
          service_type: string
          status: string | null
          updated_at: string
        }
        Insert: {
          amount?: number | null
          application_date: string
          approval_date?: string | null
          created_at?: string
          disbursement_date?: string | null
          duration_months?: number | null
          farmer_id?: string | null
          id?: string
          interest_rate?: number | null
          notes?: string | null
          organization_id?: string | null
          provider: string
          repayment_schedule?: Json | null
          service_type: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number | null
          application_date?: string
          approval_date?: string | null
          created_at?: string
          disbursement_date?: string | null
          duration_months?: number | null
          farmer_id?: string | null
          id?: string
          interest_rate?: number | null
          notes?: string | null
          organization_id?: string | null
          provider?: string
          repayment_schedule?: Json | null
          service_type?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "financial_services_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
        ]
      }
      game_sessions: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          mini_game_id: string
          score: number | null
          time_taken: number | null
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          mini_game_id: string
          score?: number | null
          time_taken?: number | null
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          mini_game_id?: string
          score?: number | null
          time_taken?: number | null
          user_id?: string
        }
        Relationships: []
      }
      inputs: {
        Row: {
          cost_per_unit: number | null
          created_at: string | null
          date_supplied: string
          farmer_id: string | null
          id: string
          input_name: string
          input_type: string
          notes: string | null
          organization_id: string | null
          quantity: number
          season: string | null
          supplier: string | null
          total_cost: number | null
          unit: string
          updated_at: string | null
        }
        Insert: {
          cost_per_unit?: number | null
          created_at?: string | null
          date_supplied: string
          farmer_id?: string | null
          id?: string
          input_name: string
          input_type: string
          notes?: string | null
          organization_id?: string | null
          quantity: number
          season?: string | null
          supplier?: string | null
          total_cost?: number | null
          unit: string
          updated_at?: string | null
        }
        Update: {
          cost_per_unit?: number | null
          created_at?: string | null
          date_supplied?: string
          farmer_id?: string | null
          id?: string
          input_name?: string
          input_type?: string
          notes?: string | null
          organization_id?: string | null
          quantity?: number
          season?: string | null
          supplier?: string | null
          total_cost?: number | null
          unit?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inputs_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inputs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inputs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      livestock: {
        Row: {
          acquisition_cost: number | null
          acquisition_date: string | null
          age_months: number | null
          breed: string | null
          breeding_status: string | null
          created_at: string | null
          farmer_id: string | null
          health_status: string | null
          id: string
          livestock_type: string
          notes: string | null
          organization_id: string | null
          productivity_data: Json | null
          quantity: number
          updated_at: string | null
          vaccination_date: string | null
        }
        Insert: {
          acquisition_cost?: number | null
          acquisition_date?: string | null
          age_months?: number | null
          breed?: string | null
          breeding_status?: string | null
          created_at?: string | null
          farmer_id?: string | null
          health_status?: string | null
          id?: string
          livestock_type: string
          notes?: string | null
          organization_id?: string | null
          productivity_data?: Json | null
          quantity: number
          updated_at?: string | null
          vaccination_date?: string | null
        }
        Update: {
          acquisition_cost?: number | null
          acquisition_date?: string | null
          age_months?: number | null
          breed?: string | null
          breeding_status?: string | null
          created_at?: string | null
          farmer_id?: string | null
          health_status?: string | null
          id?: string
          livestock_type?: string
          notes?: string | null
          organization_id?: string | null
          productivity_data?: Json | null
          quantity?: number
          updated_at?: string | null
          vaccination_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "livestock_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "livestock_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "livestock_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      loans: {
        Row: {
          amount: number
          amount_repaid: number | null
          application_date: string
          approval_date: string | null
          created_at: string | null
          disbursement_date: string | null
          due_date: string | null
          duration_months: number | null
          farmer_id: string | null
          id: string
          interest_rate: number | null
          loan_type: string
          notes: string | null
          organization_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          amount_repaid?: number | null
          application_date: string
          approval_date?: string | null
          created_at?: string | null
          disbursement_date?: string | null
          due_date?: string | null
          duration_months?: number | null
          farmer_id?: string | null
          id?: string
          interest_rate?: number | null
          loan_type: string
          notes?: string | null
          organization_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          amount_repaid?: number | null
          application_date?: string
          approval_date?: string | null
          created_at?: string | null
          disbursement_date?: string | null
          due_date?: string | null
          duration_months?: number | null
          farmer_id?: string | null
          id?: string
          interest_rate?: number | null
          loan_type?: string
          notes?: string | null
          organization_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "loans_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "loans_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      market_prices: {
        Row: {
          commodity: string
          created_at: string
          id: string
          market_name: string
          price: number
          price_date: string
          price_trend: string | null
          seasonal_high: number | null
          seasonal_low: number | null
          state: string
          unit: string
          updated_at: string
        }
        Insert: {
          commodity: string
          created_at?: string
          id?: string
          market_name: string
          price: number
          price_date: string
          price_trend?: string | null
          seasonal_high?: number | null
          seasonal_low?: number | null
          state: string
          unit: string
          updated_at?: string
        }
        Update: {
          commodity?: string
          created_at?: string
          id?: string
          market_name?: string
          price?: number
          price_date?: string
          price_trend?: string | null
          seasonal_high?: number | null
          seasonal_low?: number | null
          state?: string
          unit?: string
          updated_at?: string
        }
        Relationships: []
      }
      mini_games: {
        Row: {
          created_at: string
          description: string
          difficulty: string | null
          game_type: string
          id: string
          is_active: boolean | null
          reward_coins: number | null
          reward_xp: number | null
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          difficulty?: string | null
          game_type: string
          id?: string
          is_active?: boolean | null
          reward_coins?: number | null
          reward_xp?: number | null
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          difficulty?: string | null
          game_type?: string
          id?: string
          is_active?: boolean | null
          reward_coins?: number | null
          reward_xp?: number | null
          title?: string
        }
        Relationships: []
      }
      nigerian_crop_varieties: {
        Row: {
          created_at: string
          crop_name: string
          disease_resistance: string[] | null
          drought_tolerance: string | null
          fertilizer_recommendation: Json | null
          id: string
          market_preference: string | null
          maturity_days: number | null
          planting_season: string[] | null
          recommended_regions: string[] | null
          seed_rate: number | null
          seed_rate_unit: string | null
          spacing: string | null
          updated_at: string
          variety_code: string | null
          variety_name: string
          yield_potential: number | null
        }
        Insert: {
          created_at?: string
          crop_name: string
          disease_resistance?: string[] | null
          drought_tolerance?: string | null
          fertilizer_recommendation?: Json | null
          id?: string
          market_preference?: string | null
          maturity_days?: number | null
          planting_season?: string[] | null
          recommended_regions?: string[] | null
          seed_rate?: number | null
          seed_rate_unit?: string | null
          spacing?: string | null
          updated_at?: string
          variety_code?: string | null
          variety_name: string
          yield_potential?: number | null
        }
        Update: {
          created_at?: string
          crop_name?: string
          disease_resistance?: string[] | null
          drought_tolerance?: string | null
          fertilizer_recommendation?: Json | null
          id?: string
          market_preference?: string | null
          maturity_days?: number | null
          planting_season?: string[] | null
          recommended_regions?: string[] | null
          seed_rate?: number | null
          seed_rate_unit?: string | null
          spacing?: string | null
          updated_at?: string
          variety_code?: string | null
          variety_name?: string
          yield_potential?: number | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          created_at: string
          id: string
          message: string
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_url?: string | null
          created_at?: string
          id?: string
          message: string
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_url?: string | null
          created_at?: string
          id?: string
          message?: string
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          address: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          phone: string | null
          subscription_end: string | null
          subscription_plan: string | null
          subscription_status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          phone?: string | null
          subscription_end?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          phone?: string | null
          subscription_end?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      processing_facilities: {
        Row: {
          capacity: number | null
          capacity_unit: string | null
          certifications: string[] | null
          commodities_processed: string[] | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string
          facility_type: string
          id: string
          is_active: boolean | null
          lga: string | null
          location: string
          minimum_quantity: number | null
          name: string
          operating_months: string[] | null
          pricing_structure: Json | null
          state: string
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          capacity_unit?: string | null
          certifications?: string[] | null
          commodities_processed?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          facility_type: string
          id?: string
          is_active?: boolean | null
          lga?: string | null
          location: string
          minimum_quantity?: number | null
          name: string
          operating_months?: string[] | null
          pricing_structure?: Json | null
          state: string
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          capacity_unit?: string | null
          certifications?: string[] | null
          commodities_processed?: string[] | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
          facility_type?: string
          id?: string
          is_active?: boolean | null
          lga?: string | null
          location?: string
          minimum_quantity?: number | null
          name?: string
          operating_months?: string[] | null
          pricing_structure?: Json | null
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          auction_end_date: string | null
          bid_count: number | null
          category: string
          condition: string | null
          created_at: string
          current_bid: number | null
          description: string | null
          id: string
          images: string[] | null
          is_student_item: boolean | null
          location: string | null
          min_bid: number | null
          price: number
          seller_id: string
          status: string | null
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          auction_end_date?: string | null
          bid_count?: number | null
          category: string
          condition?: string | null
          created_at?: string
          current_bid?: number | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_student_item?: boolean | null
          location?: string | null
          min_bid?: number | null
          price: number
          seller_id: string
          status?: string | null
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          auction_end_date?: string | null
          bid_count?: number | null
          category?: string
          condition?: string | null
          created_at?: string
          current_bid?: number | null
          description?: string | null
          id?: string
          images?: string[] | null
          is_student_item?: boolean | null
          location?: string | null
          min_bid?: number | null
          price?: number
          seller_id?: string
          status?: string | null
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          coins: number | null
          created_at: string
          display_name: string | null
          id: string
          level: number | null
          star_rating: number | null
          total_quests_completed: number | null
          updated_at: string
          user_id: string
          username: string | null
          xp: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          coins?: number | null
          created_at?: string
          display_name?: string | null
          id?: string
          level?: number | null
          star_rating?: number | null
          total_quests_completed?: number | null
          updated_at?: string
          user_id: string
          username?: string | null
          xp?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          coins?: number | null
          created_at?: string
          display_name?: string | null
          id?: string
          level?: number | null
          star_rating?: number | null
          total_quests_completed?: number | null
          updated_at?: string
          user_id?: string
          username?: string | null
          xp?: number | null
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          deploy_url: string | null
          description: string | null
          generated_code: string | null
          id: string
          prompt: string
          status: string | null
          template_category: string | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deploy_url?: string | null
          description?: string | null
          generated_code?: string | null
          id?: string
          prompt: string
          status?: string | null
          template_category?: string | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deploy_url?: string | null
          description?: string | null
          generated_code?: string | null
          id?: string
          prompt?: string
          status?: string | null
          template_category?: string | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quests: {
        Row: {
          created_at: string
          description: string
          difficulty: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_progress: number | null
          requirements: Json | null
          reward_coins: number | null
          reward_xp: number | null
          title: string
          type: string
        }
        Insert: {
          created_at?: string
          description: string
          difficulty?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_progress?: number | null
          requirements?: Json | null
          reward_coins?: number | null
          reward_xp?: number | null
          title: string
          type: string
        }
        Update: {
          created_at?: string
          description?: string
          difficulty?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_progress?: number | null
          requirements?: Json | null
          reward_coins?: number | null
          reward_xp?: number | null
          title?: string
          type?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number | null
          reviewee_id: string
          reviewer_id: string
          transaction_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          reviewee_id: string
          reviewer_id: string
          transaction_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number | null
          reviewee_id?: string
          reviewer_id?: string
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      sms_notifications: {
        Row: {
          created_at: string
          farmer_id: string | null
          id: string
          language: string | null
          message: string
          message_type: string
          organization_id: string | null
          phone_number: string
          sent_at: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          farmer_id?: string | null
          id?: string
          language?: string | null
          message: string
          message_type: string
          organization_id?: string | null
          phone_number: string
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          farmer_id?: string | null
          id?: string
          language?: string | null
          message?: string
          message_type?: string
          organization_id?: string | null
          phone_number?: string
          sent_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sms_notifications_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          buyer_confirmed: boolean | null
          buyer_id: string
          created_at: string
          escrow_release_date: string | null
          id: string
          payment_method: string | null
          product_id: string
          seller_confirmed: boolean | null
          seller_id: string
          status: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          buyer_confirmed?: boolean | null
          buyer_id: string
          created_at?: string
          escrow_release_date?: string | null
          id?: string
          payment_method?: string | null
          product_id: string
          seller_confirmed?: boolean | null
          seller_id: string
          status?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          buyer_confirmed?: boolean | null
          buyer_id?: string
          created_at?: string
          escrow_release_date?: string | null
          id?: string
          payment_method?: string | null
          product_id?: string
          seller_confirmed?: boolean | null
          seller_id?: string
          status?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_quests: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          id: string
          progress: number | null
          quest_id: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          progress?: number | null
          quest_id: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          id?: string
          progress?: number | null
          quest_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_quests_quest_id_fkey"
            columns: ["quest_id"]
            isOneToOne: false
            referencedRelation: "quests"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          organization_id: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          organization_id?: string | null
          role: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          organization_id?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organization_public_info"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      organization_public_info: {
        Row: {
          created_at: string | null
          id: string | null
          name: string | null
          subscription_plan: string | null
          subscription_status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string | null
          name?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      calculate_user_level: {
        Args: { user_xp: number }
        Returns: number
      }
      can_access_farmer_data: {
        Args: { farmer_uuid: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _organization_id: string
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      setup_organization_with_admin: {
        Args: { org_name: string }
        Returns: string
      }
    }
    Enums: {
      app_role: "admin" | "extension_officer" | "farmer"
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
      app_role: ["admin", "extension_officer", "farmer"],
    },
  },
} as const
