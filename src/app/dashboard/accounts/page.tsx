'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { LogOut, DollarSign, CreditCard, CheckCircle, FileText, Printer } from 'lucide-react'
import { getVisitByLocation, getVisitById } from '@/lib/database'
import { signOut } from '@/lib/auth'
import { format } from 'date-fns'

export default function AccountsDashboard() {
  const { appUser } = useAuth()
  const router = useRouter()
  const [visits, setVisits] = useState<any[]>([])
  const [selectedVisit, setSelectedVisit] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)

  useEffect(() => {
    if (!appUser || appUser.role !== 'accounts') {
      router.push('/')
      return
    }

    loadVisits()
  }, [appUser, router])

  const loadVisits = async () => {
    try {
      const data = await getVisitByLocation('accounts')
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
    } catch (error) {
      console.error('Error loading visit:', error)
    }
  }

  const calculateTotal = () => {
    let total = 0
    const items: any[] = []

    if (selectedVisit) {
      items.push({
        type: 'consultation',
        name: 'Doctor Consultation',
        quantity: 1,
        unit_price: 100,
        total_price: 100
      })

      if (selectedVisit.lab_results && selectedVisit.lab_results.length > 0) {
        selectedVisit.lab_results.forEach((lab: any) => {
          items.push({
            type: 'lab_test',
            name: lab.test_name,
            quantity: 1,
            unit_price: 50,
            total_price: 50
          })
        })
      }

      if (selectedVisit.prescriptions && selectedVisit.prescriptions.length > 0) {
        selectedVisit.prescriptions.forEach((prescription: any) => {
          const price = prescription.drug?.sales_price || 0
          items.push({
            type: 'drug',
            name: prescription.drug?.name || 'Medication',
            quantity: 1,
            unit_price: price,
            total_price: price
          })
        })
      }

      total = items.reduce((sum, item) => sum + item.total_price, 0)
    }

    return { items, total }
  }

  const handlePayment = () => {
    setProcessing(true)
    setTimeout(() => {
      alert('Payment processed successfully!')
      setSelectedVisit(null)
      setProcessing(false)
      loadVisits()
    }, 1000)
  }

  const handlePrintReceipt = () => {
    const { items, total } = calculateTotal()
    const receiptContent = `
DREYCARE HOSPITAL
Receipt #${selectedVisit?.id}
Date: ${format(new Date(), 'PPp')}

Patient: ${selectedVisit?.patient?.first_name} ${selectedVisit?.patient?.last_name}
Phone: ${selectedVisit?.patient?.phone_number}

----------------------------
ITEMS:
${items.map(item => `${item.name} x${item.quantity} - $${item.total_price.toFixed(2)}`).join('\n')}
----------------------------
TOTAL: $${total.toFixed(2)}

Thank you for choosing DreyCare Hospital!
    `

    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(`<pre>${receiptContent}</pre>`)
      printWindow.document.close()
      printWindow.print()
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const { items, total } = calculateTotal()

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Accounts Dashboard</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Billing & Payments</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{appUser?.name}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Accounts</p>
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
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
                Bills to Process
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{visits.length} pending</p>
            </div>
            <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
              {visits.length === 0 ? (
                <p className="text-gray-600 dark:text-gray-400 text-center py-8">No pending bills</p>
              ) : (
                visits.map(visit => (
                  <button
                    key={visit.id}
                    onClick={() => selectVisit(visit.id)}
                    className={`w-full text-left p-4 rounded-lg transition-colors ${
                      selectedVisit?.id === visit.id
                        ? 'bg-green-50 dark:bg-green-900/20 border-2 border-green-500'
                        : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 border-2 border-transparent'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {visit.patient?.first_name} {visit.patient?.last_name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{visit.patient?.phone_number}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                          {format(new Date(visit.visit_date), 'PPp')}
                        </p>
                      </div>
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="mt-2 flex gap-2">
                      {visit.prescriptions?.length > 0 && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                          {visit.prescriptions.length} Meds
                        </span>
                      )}
                      {visit.lab_results?.length > 0 && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                          {visit.lab_results.length} Tests
                        </span>
                      )}
                    </div>
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
                    <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                    Invoice Details
                  </h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Patient: {selectedVisit.patient?.first_name} {selectedVisit.patient?.last_name}
                  </p>
                </div>

                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Patient Phone</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">{selectedVisit.patient?.phone_number}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Visit Date</p>
                      <p className="text-lg font-semibold text-gray-900 dark:text-white">
                        {format(new Date(selectedVisit.visit_date), 'PPp')}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Bill Items</h3>
                    <div className="space-y-3">
                      {items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              Qty: {item.quantity} × ${item.unit_price.toFixed(2)}
                            </p>
                          </div>
                          <p className="text-lg font-semibold text-gray-900 dark:text-white">
                            ${item.total_price.toFixed(2)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Total Amount Due</p>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white">${total.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 text-sm font-medium rounded-full">
                          <DollarSign className="w-4 h-4" />
                          Pending Payment
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Method</h3>
                    <div className="grid grid-cols-3 gap-3">
                      <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-500 transition-colors">
                        <CreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Card</span>
                      </button>
                      <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-500 transition-colors">
                        <DollarSign className="w-6 h-6 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Cash</span>
                      </button>
                      <button className="flex flex-col items-center gap-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border-2 border-gray-200 dark:border-gray-600 hover:border-green-500 dark:hover:border-green-500 transition-colors">
                        <FileText className="w-6 h-6 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-medium text-gray-900 dark:text-white">Insurance</span>
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <button
                      onClick={handlePayment}
                      disabled={processing}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                    >
                      <CheckCircle className="w-5 h-5" />
                      {processing ? 'Processing...' : 'Process Payment'}
                    </button>
                    <button
                      onClick={handlePrintReceipt}
                      className="flex items-center gap-2 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <Printer className="w-5 h-5" />
                      Print
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Select a Bill</h3>
                <p className="text-gray-600 dark:text-gray-400">Choose a patient from the list to process payment</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
