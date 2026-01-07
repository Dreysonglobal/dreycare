'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { LogOut, FileText, Stethoscope, Activity, LogOut as SignOut, Send } from 'lucide-react'
import { getVisitByLocation, getVisitById, updateVisit, getLabResults, createPrescription, getDrugs } from '@/lib/database'
import { signOut } from '@/lib/auth'
import type { Drug } from '@/types'
import { format } from 'date-fns'

export default function DoctorDashboard() {
  const { appUser } = useAuth()
  const router = useRouter()
  const [visits, setVisits] = useState<any[]>([])
  const [selectedVisit, setSelectedVisit] = useState<any>(null)
  const [labResults, setLabResults] = useState<any[]>([])
  const [drugs, setDrugs] = useState<Drug[]>([])
  const [diagnosis, setDiagnosis] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [selectedDrugs, setSelectedDrugs] = useState<Map<string, any>>(new Map())

  useEffect(() => {
    if (!appUser || appUser.role !== 'doctor') {
      router.push('/')
      return
    }

    loadVisits()
    loadDrugs()
  }, [appUser, router])

  const loadVisits = async () => {
    try {
      const data = await getVisitByLocation('doctor')
      setVisits(data)
      setLoading(false)
    } catch (error) {
      console.error('Error loading visits:', error)
      setLoading(false)
    }
  }

  const loadDrugs = async () => {
    try {
      const data = await getDrugs()
      setDrugs(data)
    } catch (error) {
      console.error('Error loading drugs:', error)
    }
  }

  const selectVisit = async (visitId: string) => {
    try {
      const visit = await getVisitById(visitId)
      setSelectedVisit(visit)
      if (visit) {
        setDiagnosis(visit.diagnosis || '')
        setNotes(visit.notes || '')
        const results = await getLabResults(visitId)
        setLabResults(results)
      }
    } catch (error) {
      console.error('Error loading visit:', error)
    }
  }

  const addDrugToPrescription = (drug: Drug) => {
    setSelectedDrugs(prev => new Map(prev).set(drug.id, {
      ...drug,
      dosage: '',
      frequency: '',
      duration: ''
    }))
  }

  const updateDrugPrescription = (drugId: string, field: string, value: string) => {
    setSelectedDrugs(prev => {
      const newMap = new Map(prev)
      const drug = newMap.get(drugId)
      if (drug) {
        newMap.set(drugId, { ...drug, [field]: value })
      }
      return newMap
    })
  }

  const removeDrugFromPrescription = (drugId: string) => {
    setSelectedDrugs(prev => {
      const newMap = new Map(prev)
      newMap.delete(drugId)
      return newMap
    })
  }

  const sendToLocation = async (location: 'frontdesk' | 'lab' | 'pharmacy' | 'accounts') => {
    if (!selectedVisit) return

    setSending(true)
    try {
      await updateVisit(selectedVisit.id, {
        status: location === 'accounts' ? 'billing' : `${location}_requested`,
        current_location: location,
        diagnosis,
        notes
      })

      for (const [drugId, prescription] of selectedDrugs) {
        if (prescription.dosage && prescription.frequency && prescription.duration) {
          await createPrescription({
            visit_id: selectedVisit.id,
            drug_id: drugId,
            dosage: prescription.dosage,
            frequency: prescription.frequency,
            duration: prescription.duration
          })
        }
      }

      setSelectedVisit(null)
      setDiagnosis('')
      setNotes('')
      setSelectedDrugs(new Map())
      await loadVisits()
    } catch (error) {
      console.error('Error sending visit:', error)
      alert('Failed to send visit. Please try again.')
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Doctor Dashboard</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Patient Consultation</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{appUser?.name}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Doctor</p>
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                Pending Patients
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{visits.length} patients waiting</p>
            </div>
            <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
              {visits.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">No pending patients</p>
              ) : (
                visits.map(visit => (
                  <button
                    key={visit.id}
                    onClick={() => selectVisit(visit.id)}
                    className={`w-full text-left p-4 rounded-lg transition-colors ${
                      selectedVisit?.id === visit.id
                        ? 'bg-cyan-50 dark:bg-cyan-900/20 border-2 border-cyan-500'
                        : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {visit.patient?.first_name} {visit.patient?.last_name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{visit.patient?.phone_number}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {format(new Date(visit.visit_date), 'PPp')}
                        </p>
                      </div>
                      <div className="w-2 h-2 bg-cyan-500 rounded-full"></div>
                    </div>
                    {visit.chief_complaint && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                        <span className="font-medium">Complaint:</span> {visit.chief_complaint}
                      </p>
                    )}
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2">
            {selectedVisit ? (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Stethoscope className="w-6 h-6 text-cyan-600 dark:text-cyan-400" />
                    Patient Consultation
                  </h2>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Weight</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedVisit.weight || 'N/A'} kg</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Blood Pressure</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedVisit.blood_pressure_systolic || 'N/A'}/{selectedVisit.blood_pressure_diastolic || 'N/A'}
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Temperature</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedVisit.temperature || 'N/A'}°C</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Pulse Rate</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedVisit.pulse_rate || 'N/A'} bpm</p>
                    </div>
                  </div>

                  {selectedVisit.chief_complaint && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Chief Complaint</label>
                      <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
                        <p className="text-gray-900 dark:text-white">{selectedVisit.chief_complaint}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Diagnosis</label>
                    <textarea
                      value={diagnosis}
                      onChange={(e) => setDiagnosis(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                      rows={4}
                      placeholder="Enter your diagnosis..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Additional Notes</label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                      rows={3}
                      placeholder="Enter any additional notes..."
                    />
                  </div>

                  {labResults.length > 0 && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Lab Results</label>
                      <div className="space-y-2">
                        {labResults.map(result => (
                          <div key={result.id} className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <p className="font-medium text-gray-900 dark:text-white">{result.test_name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{result.test_result}</p>
                            {result.reference_range && (
                              <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Reference: {result.reference_range}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Prescribe Medications</label>
                    <div className="space-y-3">
                      <select
                        onChange={(e) => {
                          const drug = drugs.find(d => d.id === e.target.value)
                          if (drug) addDrugToPrescription(drug)
                        }}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                      >
                        <option value="">Select a drug to add...</option>
                        {drugs.filter(d => d.stock_quantity > 0).map(drug => (
                          <option key={drug.id} value={drug.id}>{drug.name} - ${drug.sales_price} (Stock: {drug.stock_quantity})</option>
                        ))}
                      </select>

                      {Array.from(selectedDrugs).map(([drugId, prescription]) => (
                        <div key={drugId} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="flex justify-between items-start mb-3">
                            <h4 className="font-medium text-gray-900 dark:text-white">{prescription.name}</h4>
                            <button
                              onClick={() => removeDrugFromPrescription(drugId)}
                              className="text-red-600 hover:text-red-700 text-sm"
                            >
                              Remove
                            </button>
                          </div>
                          <div className="grid grid-cols-3 gap-3">
                            <input
                              type="text"
                              placeholder="Dosage"
                              value={prescription.dosage}
                              onChange={(e) => updateDrugPrescription(drugId, 'dosage', e.target.value)}
                              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Frequency"
                              value={prescription.frequency}
                              onChange={(e) => updateDrugPrescription(drugId, 'frequency', e.target.value)}
                              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                            />
                            <input
                              type="text"
                              placeholder="Duration"
                              value={prescription.duration}
                              onChange={(e) => updateDrugPrescription(drugId, 'duration', e.target.value)}
                              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-sm"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => sendToLocation('frontdesk')}
                      disabled={sending}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      Send to Front Desk
                    </button>
                    <button
                      onClick={() => sendToLocation('lab')}
                      disabled={sending}
                      className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      Send to Laboratory
                    </button>
                    <button
                      onClick={() => sendToLocation('pharmacy')}
                      disabled={sending}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      Send to Pharmacy
                    </button>
                    <button
                      onClick={() => sendToLocation('accounts')}
                      disabled={sending}
                      className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      Send to Accounts
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                <Stethoscope className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Select a Patient</h3>
                <p className="text-gray-600 dark:text-gray-400">Choose a patient from the list to begin consultation</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
