'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { LogOut, FlaskConical, Activity, Check, FileText, Send } from 'lucide-react'
import { getVisitByLocation, getVisitById, updateVisit, createLabResult, getLabResults } from '@/lib/database'
import { signOut } from '@/lib/auth'
import { format } from 'date-fns'

export default function LabDashboard() {
  const { appUser } = useAuth()
  const router = useRouter()
  const [visits, setVisits] = useState<any[]>([])
  const [selectedVisit, setSelectedVisit] = useState<any>(null)
  const [labResults, setLabResults] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const [newResult, setNewResult] = useState({
    test_name: '',
    test_result: '',
    reference_range: '',
    notes: ''
  })

  useEffect(() => {
    if (!appUser || appUser.role !== 'lab') {
      router.push('/')
      return
    }

    loadVisits()
  }, [appUser, router])

  const loadVisits = async () => {
    try {
      const data = await getVisitByLocation('lab')
      setVisits(data)
      setLoading(false)
    } catch (error) {
      console.error('Error loading visits:', error)
      setLoading(false)
    }
  }

  const selectVisit = async (visitId: string) => {
    try {
      const visit = await getVisitById(visitId)
      setSelectedVisit(visit)
      const results = await getLabResults(visitId)
      setLabResults(results)
    } catch (error) {
      console.error('Error loading visit:', error)
    }
  }

  const addLabResult = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVisit) return

    try {
      await createLabResult({
        visit_id: selectedVisit.id,
        test_name: newResult.test_name,
        test_result: newResult.test_result,
        reference_range: newResult.reference_range,
        notes: newResult.notes,
        performed_by: appUser!.id
      })

      setNewResult({
        test_name: '',
        test_result: '',
        reference_range: '',
        notes: ''
      })

      const results = await getLabResults(selectedVisit.id)
      setLabResults(results)
    } catch (error) {
      console.error('Error adding lab result:', error)
      alert('Failed to add lab result')
    }
  }

  const sendToLocation = async (location: 'doctor' | 'frontdesk') => {
    if (!selectedVisit) return

    setSending(true)
    try {
      await updateVisit(selectedVisit.id, {
        current_location: location,
        status: location === 'frontdesk' ? 'pending' : 'in_consultation'
      })
      setSelectedVisit(null)
      setLabResults([])
      await loadVisits()
    } catch (error) {
      console.error('Error sending visit:', error)
      alert('Failed to send visit')
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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Lab Dashboard</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Laboratory Tests & Results</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{appUser?.name}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Lab Technician</p>
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
                <FlaskConical className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                Lab Requests
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{visits.length} tests requested</p>
            </div>
            <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
              {visits.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">No pending lab requests</p>
              ) : (
                visits.map(visit => (
                  <button
                    key={visit.id}
                    onClick={() => selectVisit(visit.id)}
                    className={`w-full text-left p-4 rounded-lg transition-colors ${
                      selectedVisit?.id === visit.id
                        ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-500'
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
                      <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    </div>
                    {visit.diagnosis && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 line-clamp-2">
                        <span className="font-medium">Diagnosis:</span> {visit.diagnosis}
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
                    <Activity className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                    Lab Test Processing
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Patient: {selectedVisit.patient?.first_name} {selectedVisit.patient?.last_name}
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Age</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {selectedVisit.patient?.date_of_birth
                          ? Math.floor((new Date().getTime() - new Date(selectedVisit.patient.date_of_birth).getTime()) / (1000 * 60 * 60 * 24 * 365))
                          : 'N/A'} yrs
                      </p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Gender</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white capitalize">{selectedVisit.patient?.gender}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Blood Type</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedVisit.patient?.blood_type || 'N/A'}</p>
                    </div>
                    <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Weight</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedVisit.weight || 'N/A'} kg</p>
                    </div>
                  </div>

                  {selectedVisit.diagnosis && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Doctor's Diagnosis</label>
                      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                        <p className="text-gray-900 dark:text-white">{selectedVisit.diagnosis}</p>
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Allergies</label>
                    <div className={`p-3 rounded-lg border ${selectedVisit.patient?.allergies ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800' : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600'}`}>
                      <p className="text-gray-900 dark:text-white">{selectedVisit.patient?.allergies || 'No known allergies'}</p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <FileText className="w-5 h-5" />
                      Add Lab Results
                    </h3>
                    <form onSubmit={addLabResult} className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Test Name</label>
                        <input
                          type="text"
                          value={newResult.test_name}
                          onChange={(e) => setNewResult({ ...newResult, test_name: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                          placeholder="e.g., Complete Blood Count"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Test Result</label>
                        <textarea
                          value={newResult.test_result}
                          onChange={(e) => setNewResult({ ...newResult, test_result: e.target.value })}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                          rows={4}
                          placeholder="Enter the test results..."
                          required
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Reference Range</label>
                          <input
                            type="text"
                            value={newResult.reference_range}
                            onChange={(e) => setNewResult({ ...newResult, reference_range: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                            placeholder="e.g., 4.5-11.0 x10^9/L"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Notes</label>
                          <input
                            type="text"
                            value={newResult.notes}
                            onChange={(e) => setNewResult({ ...newResult, notes: e.target.value })}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:text-white transition-all"
                            placeholder="Additional notes..."
                          />
                        </div>
                      </div>
                      <button
                        type="submit"
                        className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                      >
                        <Check className="w-5 h-5" />
                        Add Result
                      </button>
                    </form>
                  </div>

                  {labResults.length > 0 && (
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Previous Results</h3>
                      <div className="space-y-3">
                        {labResults.map(result => (
                          <div key={result.id} className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                            <div className="flex justify-between items-start">
                              <div>
                                <h4 className="font-medium text-gray-900 dark:text-white">{result.test_name}</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{result.test_result}</p>
                                {result.reference_range && (
                                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Reference: {result.reference_range}</p>
                                )}
                                {result.notes && (
                                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">Notes: {result.notes}</p>
                                )}
                              </div>
                              <span className="text-xs text-gray-500 dark:text-gray-500">
                                {format(new Date(result.created_at), 'PPp')}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => sendToLocation('doctor')}
                      disabled={sending}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      Send to Doctor
                    </button>
                    <button
                      onClick={() => sendToLocation('frontdesk')}
                      disabled={sending}
                      className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
                    >
                      <Send className="w-4 h-4" />
                      Send to Front Desk
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                <FlaskConical className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Select a Test Request</h3>
                <p className="text-gray-600 dark:text-gray-400">Choose a patient from the list to process lab tests</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
