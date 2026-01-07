export type UserRole = 'admin' | 'doctor' | 'pharmacy' | 'lab' | 'frontdesk' | 'accounts'

export interface User {
  id: string
  email: string
  role: UserRole
  name: string
  is_online: boolean
  created_at: string
}

export interface Patient {
  id: string
  first_name: string
  last_name: string
  phone_number: string
  date_of_birth: string
  gender: 'male' | 'female'
  address?: string
  emergency_contact?: string
  blood_type?: string
  allergies?: string
  created_at: string
  updated_at: string
}

export interface PatientVisit {
  id: string
  patient_id: string
  weight?: number
  blood_pressure_systolic?: number
  blood_pressure_diastolic?: number
  temperature?: number
  pulse_rate?: number
  respiratory_rate?: number
  chief_complaint?: string
  visit_date: string
  created_by: string
  assigned_doctor_id?: string
  status: 'pending' | 'in_consultation' | 'lab_requested' | 'pharmacy_requested' | 'completed' | 'billing'
  current_location: 'frontdesk' | 'doctor' | 'lab' | 'pharmacy' | 'accounts'
  diagnosis?: string
  notes?: string
  created_at: string
  updated_at: string
}

export interface Prescription {
  id: string
  visit_id: string
  drug_id: string
  dosage: string
  frequency: string
  duration: string
  notes?: string
  created_at: string
}

export interface LabResult {
  id: string
  visit_id: string
  test_name: string
  test_result: string
  reference_range?: string
  notes?: string
  performed_by: string
  created_at: string
}

export interface Drug {
  id: string
  name: string
  generic_name?: string
  description?: string
  category?: string
  purchase_price: number
  sales_price: number
  stock_quantity: number
  reorder_level: number
  unit: string
  expiry_date?: string
  manufacturer?: string
  created_at: string
  updated_at: string
}

export interface Bill {
  id: string
  visit_id: string
  patient_id: string
  total_amount: number
  items: BillItem[]
  status: 'pending' | 'paid' | 'partial'
  amount_paid: number
  created_at: string
  paid_at?: string
}

export interface BillItem {
  id: string
  item_type: 'consultation' | 'lab_test' | 'drug'
  item_id: string
  name: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface Message {
  id: string
  from_user_id: string
  to_user_id?: string
  to_role?: UserRole
  visit_id: string
  subject: string
  body: string
  is_read: boolean
  created_at: string
}
