// =========================================================================
// WISDOM WEB APPLICATION - CORE TYPESCRIPT MODEL DEFINITIONS
// =========================================================================

/**
 * Supported field types for our custom Form Builder (matching Google Forms capabilities)
 */
export type FormFieldType = 'text' | 'textarea' | 'select' | 'radio' | 'checkbox';

/**
 * Structure of a single question created in the Admin Dynamic Form Builder
 */
export interface FormField {
  id: string;          // Unique identifier for the question (e.g. "q1", "name")
  label: string;       // The actual question text (e.g. "Full Name", "Gender")
  type: FormFieldType; // Form field type
  required: boolean;   // Whether user must answer this question
  options?: string[];  // Choices list (only used for 'select', 'radio', and 'checkbox')
}

/**
 * Core event model representing a class, course, lecture, or youth event
 */
export interface WisdomEvent {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: string;       // e.g. "Class", "Youth Event", "Community Lecture"
  image_url?: string;     // Flyer image path in Supabase Storage
  start_date: string;     // ISO timestamp
  end_date?: string;      // ISO timestamp (optional)
  location: string;       // Online, Wisdom Center, etc.
  status: 'draft' | 'published' | 'archived';
  form_config: FormField[]; // Dynamic fields to render for registration
  created_at: string;     // ISO timestamp
  created_by?: string;    // UUID referencing profiles/auth.users
}

/**
 * Registration structure representing a participant's submission
 */
export interface Registration {
  id: string;
  event_id: string;
  form_responses: Record<string, string | string[]>; // Answer mapped to FormField.id
  created_at: string;
}

/**
 * Admin profile model
 */
export interface AdminProfile {
  id: string;
  email: string;
  role: 'admin' | 'superadmin';
  created_at: string;
}
