'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { LogOut, Search, Plus, UserPlus, Send, User as UserIcon, Activity } from 'lucide-react'
import { searchPatients, getPatientById, createPatient, createPatientVisit, getOnlineDoctors, updateVisit, getPatientVisits } from '@/lib/database'
import { signOut } from '@/lib/auth'
import type { Patient, User } from '@/types'
import { format } from 'date-fns'

export default function FrontDeskDashboard() {
  const { appUser } = useAuth()
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Patient[]>([])
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null)
  const [patientHistory, setPatientHistory] = useState<any[]>([])
  const [onlineDoctors, setOnlineDoctors] = useState<User[]>([])
  const [showNewPatientForm, setShowNewPatientForm] = useState(false)
  const [showVisitForm, setShowVisitForm] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const [newPatient, setNewPatient] = useState({
    first_name: '',
    last_name: '',
    phone_number: '',
    date_of_birth: '',
    gender: 'male' as 'male' | 'female',
    address: '',
    emergency_contact: '',
    blood_type: '',
    allergies: ''
  })

  const [newVisit, setNewVisit] = useState({
    weight: '',
    blood_pressure_systolic: '',
    blood_pressure_diastolic: '',
    temperature: '',
    pulse_rate: '',
    respiratory_rate: '',
    chief_complaint: '',
    assigned_doctor_id: ''
  })

  useEffect(() => {
    if (appUser && appUser.role !== 'frontdesk') {
      router.push('/')
      return
    }

    if (appUser) {
      loadOnlineDoctors()
      setLoading(false)
    }
  }, [appUser, router])

  useEffect(() => {
    if (searchQuery.length >= 2) {
      handleSearchPatients()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const handleSearchPatients = async () => {
    try {
      const results = await searchPatients(searchQuery)
      setSearchResults(results)
    } catch (error) {
      console.error('Error searching patients:', error)
    }
  }

  const loadOnlineDoctors = async () => {
    try {
      const doctors = await getOnlineDoctors()
      setOnlineDoctors(doctors)
    } catch (error) {
      console.error('Error loading doctors:', error)
    }
  }

  const selectPatient = async (patient: Patient) => {
    setSelectedPatient(patient)
    setSearchResults([])
    setSearchQuery('')
    setShowNewPatientForm(false)

    try {
      const history = await getPatientVisits(patient.id)
      setPatientHistory(history)
    } catch (error) {
      console.error('Error loading patient history:', error)
    }
  }

  const handleCreatePatient = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const patient = await createPatient(newPatient)
      selectPatient(patient)
      setNewPatient({
        first_name: '',
        last_name: '',
        phone_number: '',
        date_of_birth: '',
        gender: 'male',
        address: '',
        emergency_contact: '',
        blood_type: '',
        allergies: ''
      })
      setShowNewPatientForm(false)
    } catch (error) {
      console.error('Error creating patient:', error)
      alert('Failed to create patient')
    }
  }

  const handleCreateVisit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedPatient || !newVisit.assigned_doctor_id) {
      alert('Please select a patient and a doctor')
      return
    }

    setSending(true)
    try {
      await createPatientVisit({
        patient_id: selectedPatient.id,
        weight: newVisit.weight ? parseFloat(newVisit.weight) : undefined,
        blood_pressure_systolic: newVisit.blood_pressure_systolic ? parseInt(newVisit.blood_pressure_systolic) : undefined,
        blood_pressure_diastolic: newVisit.blood_pressure_diastolic ? parseInt(newVisit.blood_pressure_diastolic) : undefined,
        temperature: newVisit.temperature ? parseFloat(newVisit.temperature) : undefined,
        pulse_rate: newVisit.pulse_rate ? parseInt(newVisit.pulse_rate) : undefined,
        respiratory_rate: newVisit.respiratory_rate ? parseInt(newVisit.respiratory_rate) : undefined,
        chief_complaint: newVisit.chief_complaint || undefined,
        created_by: appUser!.id,
        assigned_doctor_id: newVisit.assigned_doctor_id,
        status: 'in_consultation',
        current_location: 'doctor'
      })

      setNewVisit({
        weight: '',
        blood_pressure_systolic: '',
        blood_pressure_diastolic: '',
        temperature: '',
        pulse_rate: '',
        respiratory_rate: '',
        chief_complaint: '',
        assigned_doctor_id: ''
      })

      setShowVisitForm(false)

      const history = await getPatientVisits(selectedPatient.id)
      setPatientHistory(history)
    } catch (error) {
      console.error('Error creating visit:', error)
      alert('Failed to create visit')
    } finally {
      setSending(false)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-gray-600 dark:text-gray-400">Loading dashboard...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Front Desk Dashboard</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Patient Registration & Triage</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{appUser?.name}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Front Desk</p>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!showNewPatientForm && !showVisitForm ? (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                    <Search className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                    Search Patient
                  </h2>
                  <div className="relative mb-4">
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search by name or phone number..."
                      className="w-full px-4 py-3 pl-12 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                    />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>

                  {searchResults.length > 0 && (
                    <div className="space-y-2 max-h-96 overflow-y-auto">
                      {searchResults.map(patient => (
                        <button
                          key={patient.id}
                          onClick={() => selectPatient(patient)}
                          className="w-full text-left p-4 bg-gray-50 dark:bg-gray-700/50 hover:bg-cyan-50 dark:hover:bg-cyan-900/20 rounded-lg border border-gray-200 dark:border-gray-600 transition-colors"
                        >
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {patient.first_name} {patient.last_name}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-400">{patient.phone_number}</p>
                            </div>
                            <span className="text-xs text-gray-500 dark:text-gray-500">
                              {new Date(patient.date_of_birth).toLocaleDateString()}
                            </span>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  <div className="mt-4 flex gap-3">
                    <button
                      onClick={() => setShowNewPatientForm(true)}
                      className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                    >
                      <UserPlus className="w-4 h-4" />
                      New Patient
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-600 dark:text-green-400" />
                  Online Doctors
                </h2>
                <div className="space-y-2">
                  {onlineDoctors.length === 0 ? (
                    <p className="text-gray-600 dark:text-gray-400 text-center py-4">No doctors online</p>
                  ) : (
                    onlineDoctors.map(doctor => (
                      <div key={doctor.id} className="flex items-center gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{doctor.name}</p>
                          <p className="text-xs text-gray-600 dark:text-gray-400">Available</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {selectedPatient && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <UserIcon className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                    Patient Details
                  </h2>
                  <button
                    onClick={() => setShowVisitForm(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    New Visit
                  </button>
                </div>

                <div className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Name</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {selectedPatient.first_name} {selectedPatient.last_name}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Phone</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{selectedPatient.phone_number}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Age</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {Math.floor((new Date().getTime() - new Date(selectedPatient.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365))} years
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Gender</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{selectedPatient.gender}</p>
                    </div>
                  </div>

                  {selectedPatient.blood_type && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Blood Type: {selectedPatient.blood_type}</p>
                    </div>
                  )}

                  {selectedPatient.allergies && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-red-600 dark:text-red-400">Allergies: {selectedPatient.allergies}</p>
                    </div>
                  )}

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Visit History</h3>
                    {patientHistory.length === 0 ? (
                      <p className="text-gray-600 dark:text-gray-400">No visit history</p>
                    ) : (
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {patientHistory.map(visit => (
                          <div key={visit.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                            <div className="flex justify-between items-start mb-2">
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {format(new Date(visit.visit_date), 'PPp')}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">Doctor: {visit.doctor || 'Not assigned'}</p>
                              </div>
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                visit.status === 'completed' ? 'bg-green-100 text-green-700' :
                                visit.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                'bg-blue-100 text-blue-700'
                              }`}>
                                {visit.status}
                              </span>
                            </div>
                            {visit.chief_complaint && (
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                                <span className="font-medium">Complaint:</span> {visit.chief_complaint}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        ) : showNewPatientForm ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <UserPlus className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                Register New Patient
              </h2>
            </div>
            <form onSubmit={handleCreatePatient} className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">First Name *</label>
                  <input
                    type="text"
                    value={newPatient.first_name}
                    onChange={(e) => setNewPatient({ ...newPatient, first_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Last Name *</label>
                  <input
                    type="text"
                    value={newPatient.last_name}
                    onChange={(e) => setNewPatient({ ...newPatient, last_name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={newPatient.phone_number}
                    onChange={(e) => setNewPatient({ ...newPatient, phone_number: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date of Birth *</label>
                  <input
                    type="date"
                    value={newPatient.date_of_birth}
                    onChange={(e) => setNewPatient({ ...newPatient, date_of_birth: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Gender *</label>
                  <select
                    value={newPatient.gender}
                    onChange={(e) => setNewPatient({ ...newPatient, gender: e.target.value as 'male' | 'female' })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Blood Type</label>
                  <select
                    value={newPatient.blood_type}
                    onChange={(e) => setNewPatient({ ...newPatient, blood_type: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="">Select</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Address</label>
                  <input
                    type="text"
                    value={newPatient.address}
                    onChange={(e) => setNewPatient({ ...newPatient, address: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Emergency Contact</label>
                  <input
                    type="tel"
                    value={newPatient.emergency_contact}
                    onChange={(e) => setNewPatient({ ...newPatient, emergency_contact: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Allergies</label>
                  <input
                    type="text"
                    value={newPatient.allergies}
                    onChange={(e) => setNewPatient({ ...newPatient, allergies: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    placeholder="Separate with commas"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewPatientForm(false)
                    setNewPatient({
                      first_name: '',
                      last_name: '',
                      phone_number: '',
                      date_of_birth: '',
                      gender: 'male',
                      address: '',
                      emergency_contact: '',
                      blood_type: '',
                      allergies: ''
                    })
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 transition-colors"
                >
                  Register Patient
                </button>
              </div>
            </form>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Plus className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                New Patient Visit
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Patient: {selectedPatient?.first_name} {selectedPatient?.last_name}
              </p>
            </div>
            <form onSubmit={handleCreateVisit} className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newVisit.weight}
                    onChange={(e) => setNewVisit({ ...newVisit, weight: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">BP Systolic</label>
                  <input
                    type="number"
                    value={newVisit.blood_pressure_systolic}
                    onChange={(e) => setNewVisit({ ...newVisit, blood_pressure_systolic: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">BP Diastolic</label>
                  <input
                    type="number"
                    value={newVisit.blood_pressure_diastolic}
                    onChange={(e) => setNewVisit({ ...newVisit, blood_pressure_diastolic: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Temperature (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newVisit.temperature}
                    onChange={(e) => setNewVisit({ ...newVisit, temperature: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Pulse Rate (bpm)</label>
                  <input
                    type="number"
                    value={newVisit.pulse_rate}
                    onChange={(e) => setNewVisit({ ...newVisit, pulse_rate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Respiratory Rate</label>
                  <input
                    type="number"
                    value={newVisit.respiratory_rate}
                    onChange={(e) => setNewVisit({ ...newVisit, respiratory_rate: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Chief Complaint</label>
                  <textarea
                    value={newVisit.chief_complaint}
                    onChange={(e) => setNewVisit({ ...newVisit, chief_complaint: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    rows={3}
                  />
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Assign to Doctor *</label>
                <select
                  value={newVisit.assigned_doctor_id}
                  onChange={(e) => setNewVisit({ ...newVisit, assigned_doctor_id: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  required
                >
                  <option value="">Select a doctor...</option>
                  {onlineDoctors.map(doctor => (
                    <option key={doctor.id} value={doctor.id}>{doctor.name}</option>
                  ))}
                </select>
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowVisitForm(false)
                    setNewVisit({
                      weight: '',
                      blood_pressure_systolic: '',
                      blood_pressure_diastolic: '',
                      temperature: '',
                      pulse_rate: '',
                      respiratory_rate: '',
                      chief_complaint: '',
                      assigned_doctor_id: ''
                    })
                  }}
                  className="px-6 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sending}
                  className="px-6 py-2 bg-cyan-600 text-white rounded-lg hover:bg-cyan-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {sending ? 'Sending...' : 'Send to Doctor'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  )
}
