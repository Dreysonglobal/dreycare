import { supabase } from './supabase'
import type { Patient, PatientVisit, Drug, Prescription, LabResult, User } from '@/types'

export async function searchPatients(query: string) {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .or(`first_name.ilike.%${query}%,last_name.ilike.%${query}%,phone_number.ilike.%${query}%`)
    .limit(20)

  if (error) throw error
  return data as Patient[]
}

export async function getPatientById(id: string) {
  const { data, error } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Patient
}

export async function createPatient(patient: Partial<Patient>) {
  const { data, error } = await supabase
    .from('patients')
    .insert([patient])
    .select()
    .single()

  if (error) throw error
  return data as Patient
}

export async function updatePatient(id: string, patient: Partial<Patient>) {
  const { data, error } = await supabase
    .from('patients')
    .update(patient)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Patient
}

export async function createPatientVisit(visit: Partial<PatientVisit>) {
  const { data, error } = await supabase
    .from('patient_visits')
    .insert([visit])
    .select()
    .single()

  if (error) throw error
  return data as PatientVisit
}

export async function getPatientVisits(patientId: string) {
  const { data, error } = await supabase
    .from('patient_visits')
    .select(`
      *,
      doctor:users!patient_visits_assigned_doctor_id_fkey(name),
      creator:users!patient_visits_created_by_fkey(name)
    `)
    .eq('patient_id', patientId)
    .order('visit_date', { ascending: false })

  if (error) throw error
  return data
}

export async function getVisitById(id: string) {
  const { data, error } = await supabase
    .from('patient_visits')
    .select(`
      *,
      patient:patients(*),
      doctor:users!patient_visits_assigned_doctor_id_fkey(name),
      creator:users!patient_visits_created_by_fkey(name),
      prescriptions:prescriptions(*, drug:drugs(*)),
      lab_results:lab_results(*)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data
}

export async function updateVisit(id: string, updates: Partial<PatientVisit>) {
  const { data, error } = await supabase
    .from('patient_visits')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as PatientVisit
}

export async function getOnlineDoctors() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'doctor')
    .eq('is_online', true)

  if (error) throw error
  return data as User[]
}

export async function getAllDoctors() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', 'doctor')
    .order('name')

  if (error) throw error
  return data as User[]
}

export async function getDrugs() {
  const { data, error } = await supabase
    .from('drugs')
    .select('*')
    .order('name')

  if (error) throw error
  return data as Drug[]
}

export async function getDrugById(id: string) {
  const { data, error } = await supabase
    .from('drugs')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return data as Drug
}

export async function createDrug(drug: Partial<Drug>) {
  const { data, error } = await supabase
    .from('drugs')
    .insert([drug])
    .select()
    .single()

  if (error) throw error
  return data as Drug
}

export async function updateDrug(id: string, drug: Partial<Drug>) {
  const { data, error } = await supabase
    .from('drugs')
    .update(drug)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Drug
}

export async function deleteDrug(id: string) {
  const { error } = await supabase
    .from('drugs')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function reduceDrugStock(drugId: string, quantity: number = 1) {
  const { data, error } = await supabase.rpc('reduce_stock', {
    drug_id: drugId,
    quantity: quantity
  })

  if (error) throw error
  return data
}

export async function createPrescription(prescription: Partial<Prescription>) {
  const { data, error } = await supabase
    .from('prescriptions')
    .insert([prescription])
    .select(`
      *,
      drug:drugs(*)
    `)
    .single()

  if (error) throw error
  return data
}

export async function createLabResult(result: Partial<LabResult>) {
  const { data, error } = await supabase
    .from('lab_results')
    .insert([result])
    .select()
    .single()

  if (error) throw error
  return data as LabResult
}

export async function getLabResults(visitId: string) {
  const { data, error } = await supabase
    .from('lab_results')
    .select('*')
    .eq('visit_id', visitId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data as LabResult[]
}

export async function getVisitByLocation(role: string) {
  const locationMap: Record<string, string> = {
    'doctor': 'doctor',
    'lab': 'lab',
    'pharmacy': 'pharmacy',
    'frontdesk': 'frontdesk',
    'accounts': 'accounts'
  }

  const location = locationMap[role]
  if (!location) return []

  const { data, error } = await supabase
    .from('patient_visits')
    .select(`
      *,
      patient:patients(*),
      doctor:users!patient_visits_assigned_doctor_id_fkey(name)
    `)
    .eq('current_location', location)
    .neq('status', 'completed')
    .order('visit_date', { ascending: true })

  if (error) throw error
  return data
}

export async function sendMessage(fromUserId: string, toUserId: string | null, toRole: string | null, visitId: string, subject: string, body: string) {
  const { data, error } = await supabase
    .from('messages')
    .insert([{
      from_user_id: fromUserId,
      to_user_id: toUserId,
      to_role: toRole,
      visit_id: visitId,
      subject,
      body
    }])
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getMessages(userId?: string, role?: string) {
  let query = supabase
    .from('messages')
    .select(`
      *,
      from_user:users!messages_from_user_id_fkey(name, role),
      to_user:users!messages_to_user_id_fkey(name, role)
    `)
    .order('created_at', { ascending: false })

  if (userId) {
    query = query.or(`to_user_id.eq.${userId},from_user_id.eq.${userId}`)
  } else if (role) {
    query = query.eq('to_role', role)
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

export async function markMessageAsRead(messageId: string) {
  const { data, error } = await supabase
    .from('messages')
    .update({ is_read: true })
    .eq('id', messageId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getDrugInventory() {
  const { data, error } = await supabase
    .from('drugs')
    .select('*')
    .order('stock_quantity', { ascending: true })

  if (error) throw error
  return data as Drug[]
}

export async function getAllVisits() {
  const { data, error } = await supabase
    .from('patient_visits')
    .select(`
      *,
      patient:patients(*),
      doctor:users!patient_visits_assigned_doctor_id_fkey(name),
      creator:users!patient_visits_created_by_fkey(name)
    `)
    .order('visit_date', { ascending: false })
    .limit(100)

  if (error) throw error
  return data
}

export async function getAllStaff() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('name')

  if (error) throw error
  return data as User[]
}

export async function getStatistics() {
  const [patients, visits, drugs, staff] = await Promise.all([
    supabase.from('patients').select('*', { count: 'exact', head: true }),
    supabase.from('patient_visits').select('*', { count: 'exact', head: true }),
    supabase.from('drugs').select('*', { count: 'exact', head: true }),
    supabase.from('users').select('*', { count: 'exact', head: true })
  ])

  return {
    totalPatients: patients.count || 0,
    totalVisits: visits.count || 0,
    totalDrugs: drugs.count || 0,
    totalStaff: staff.count || 0
  }
}
