'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { LogOut, Pill, Plus, AlertTriangle, Check, Send, Minus, Trash2, Edit, X } from 'lucide-react'
import { getVisitByLocation, getVisitById, updateVisit, getDrugInventory, updateDrug, reduceDrugStock, createDrug, deleteDrug } from '@/lib/database'
import { signOut } from '@/lib/auth'
import type { Drug } from '@/types'
import { format } from 'date-fns'

export default function PharmacyDashboard() {
  const { appUser } = useAuth()
  const router = useRouter()
  const [visits, setVisits] = useState<any[]>([])
  const [selectedVisit, setSelectedVisit] = useState<any>(null)
  const [drugs, setDrugs] = useState<Drug[]>([])
  const [showInventory, setShowInventory] = useState(false)
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)

  const [newDrug, setNewDrug] = useState({
    name: '',
    generic_name: '',
    category: '',
    purchase_price: '',
    sales_price: '',
    stock_quantity: '',
    reorder_level: '',
    unit: 'tablets'
  })
  const [editingDrug, setEditingDrug] = useState<string | null>(null)

  useEffect(() => {
    if (appUser && appUser.role !== 'pharmacy') {
      router.push('/')
      return
    }

    if (appUser) {
      loadVisits()
      loadDrugs()
    }
  }, [appUser, router])

  const loadVisits = async () => {
    try {
      const data = await getVisitByLocation('pharmacy')
      setVisits(data)
      setLoading(false)
    } catch (error) {
      console.error('Error loading visits:', error)
      setLoading(false)
    }
  }

  const loadDrugs = async () => {
    try {
      const data = await getDrugInventory()
      setDrugs(data)
    } catch (error: any) {
      console.error('Error loading drugs:', error)
      alert(`Failed to load drugs: ${error.message || 'Unknown error'}`)
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

  const dispenseDrug = async (prescription: any) => {
    try {
      await reduceDrugStock(prescription.drug_id, 1)
      await loadDrugs()
      const visit = await getVisitById(selectedVisit.id)
      setSelectedVisit(visit)
    } catch (error) {
      console.error('Error dispensing drug:', error)
      alert('Failed to dispense drug')
    }
  }

  const sendToAccounts = async () => {
    if (!selectedVisit) return

    setSending(true)
    try {
      await updateVisit(selectedVisit.id, {
        status: 'billing',
        current_location: 'accounts'
      })
      setSelectedVisit(null)
      await loadVisits()
    } catch (error: any) {
      console.error('Error loading visits:', error)
      alert(`Failed to load visits: ${error.message || 'Unknown error'}`)
    } finally {
      setSending(false)
    }
  }

  const handleAddDrug = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (editingDrug) {
        await updateDrug(editingDrug, {
          name: newDrug.name,
          generic_name: newDrug.generic_name,
          description: '',
          category: newDrug.category,
          purchase_price: parseFloat(newDrug.purchase_price),
          sales_price: parseFloat(newDrug.sales_price),
          stock_quantity: parseInt(newDrug.stock_quantity),
          reorder_level: parseInt(newDrug.reorder_level),
          unit: newDrug.unit
        })
      } else {
        await createDrug({
          name: newDrug.name,
          generic_name: newDrug.generic_name,
          description: '',
          category: newDrug.category,
          purchase_price: parseFloat(newDrug.purchase_price),
          sales_price: parseFloat(newDrug.sales_price),
          stock_quantity: parseInt(newDrug.stock_quantity),
          reorder_level: parseInt(newDrug.reorder_level),
          unit: newDrug.unit
        })
      }
      resetDrugForm()
      loadDrugs()
    } catch (error: any) {
      console.error('Error saving drug:', error)
      alert(`Failed to save drug: ${error.message || 'Unknown error'}`)
    }
  }

  const resetDrugForm = () => {
    setNewDrug({
      name: '',
      generic_name: '',
      category: '',
      purchase_price: '',
      sales_price: '',
      stock_quantity: '',
      reorder_level: '',
      unit: 'tablets'
    })
    setEditingDrug(null)
  }

  const handleEditDrug = (drug: Drug) => {
    setNewDrug({
      name: drug.name,
      generic_name: drug.generic_name || '',
      category: drug.category || '',
      purchase_price: drug.purchase_price.toString(),
      sales_price: drug.sales_price.toString(),
      stock_quantity: drug.stock_quantity.toString(),
      reorder_level: drug.reorder_level.toString(),
      unit: drug.unit
    })
    setEditingDrug(drug.id)
    setShowInventory(true)
  }

  const handleDeleteDrug = async (drugId: string) => {
    if (!confirm('Are you sure you want to delete this drug?')) {
      return
    }

    try {
      await deleteDrug(drugId)
      loadDrugs()
    } catch (error: any) {
      console.error('Error deleting drug:', error)
      alert(`Failed to delete drug: ${error.message || 'Unknown error'}`)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    router.push('/')
  }

  const lowStockDrugs = drugs.filter(d => d.stock_quantity <= d.reorder_level)
  const outOfStockDrugs = drugs.filter(d => d.stock_quantity === 0)

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
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Pharmacy Dashboard</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">Drug Inventory & Dispensing</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowInventory(!showInventory)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                showInventory
                  ? 'bg-purple-600 text-white hover:bg-purple-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-white'
              }`}
            >
              {showInventory ? 'View Dispensing' : 'View Inventory'}
            </button>
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900 dark:text-white">{appUser?.name}</p>
              <p className="text-xs text-gray-600 dark:text-gray-400">Pharmacist</p>
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
        {showInventory ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Drugs</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">{drugs.length}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Low Stock</p>
                <p className="text-3xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{lowStockDrugs.length}</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border border-gray-200 dark:border-gray-700">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Out of Stock</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400 mt-1">{outOfStockDrugs.length}</p>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Pill className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Drug Inventory
                </h2>
                <button
                  onClick={() => document.getElementById('addDrugForm')?.classList.toggle('hidden')}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Add Drug
                </button>
              </div>

              <form id="addDrugForm" onSubmit={handleAddDrug} className="hidden p-6 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  {editingDrug ? 'Edit Drug' : 'Add New Drug'}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <input
                    type="text"
                    placeholder="Drug Name"
                    value={newDrug.name}
                    onChange={(e) => setNewDrug({ ...newDrug, name: e.target.value })}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Generic Name"
                    value={newDrug.generic_name}
                    onChange={(e) => setNewDrug({ ...newDrug, generic_name: e.target.value })}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                  <input
                    type="text"
                    placeholder="Category"
                    value={newDrug.category}
                    onChange={(e) => setNewDrug({ ...newDrug, category: e.target.value })}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                  <select
                    value={newDrug.unit}
                    onChange={(e) => setNewDrug({ ...newDrug, unit: e.target.value })}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value="tablets">Tablets</option>
                    <option value="capsules">Capsules</option>
                    <option value="syrup">Syrup</option>
                    <option value="injection">Injection</option>
                    <option value="drops">Drops</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Purchase Price"
                    value={newDrug.purchase_price}
                    onChange={(e) => setNewDrug({ ...newDrug, purchase_price: e.target.value })}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Sales Price"
                    value={newDrug.sales_price}
                    onChange={(e) => setNewDrug({ ...newDrug, sales_price: e.target.value })}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Stock Quantity"
                    value={newDrug.stock_quantity}
                    onChange={(e) => setNewDrug({ ...newDrug, stock_quantity: e.target.value })}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />
                  <input
                    type="number"
                    placeholder="Reorder Level"
                    value={newDrug.reorder_level}
                    onChange={(e) => setNewDrug({ ...newDrug, reorder_level: e.target.value })}
                    className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div className="mt-4 flex justify-end gap-2">
                  {editingDrug && (
                    <button
                      type="button"
                      onClick={resetDrugForm}
                      className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    {editingDrug ? (
                      <>
                        <Edit className="w-4 h-4" />
                        Update Drug
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Add Drug
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Drug Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Category</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Stock</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Purchase</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Sales</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-600 dark:text-gray-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {drugs.map(drug => (
                      <tr key={drug.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-gray-900 dark:text-white">{drug.name}</p>
                            {drug.generic_name && (
                              <p className="text-xs text-gray-600 dark:text-gray-400">{drug.generic_name}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{drug.category || '-'}</td>
                        <td className="py-3 px-4">
                          <span className={`font-semibold ${
                            drug.stock_quantity === 0 ? 'text-red-600' :
                            drug.stock_quantity <= drug.reorder_level ? 'text-yellow-600' :
                            'text-green-600'
                          }`}>
                            {drug.stock_quantity} {drug.unit}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">₦{drug.purchase_price.toFixed(2)}</td>
                        <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">₦{drug.sales_price.toFixed(2)}</td>
                        <td className="py-3 px-4">
                          {drug.stock_quantity === 0 ? (
                            <span className="px-2 py-1 bg-red-100 text-red-700 text-xs font-medium rounded-full">Out of Stock</span>
                          ) : drug.stock_quantity <= drug.reorder_level ? (
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">Low Stock</span>
                          ) : (
                            <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">In Stock</span>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditDrug(drug)}
                              className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                              title="Edit drug"
                            >
                              <Edit className="w-5 h-5" />
                            </button>
                            <button
                              onClick={() => handleDeleteDrug(drug.id)}
                              className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Delete drug"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Pill className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  Prescriptions to Dispense
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{visits.length} pending</p>
              </div>
              <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto">
                {visits.length === 0 ? (
                  <p className="text-gray-600 dark:text-gray-400 text-center py-8">No pending prescriptions</p>
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
                      <p className="font-medium text-gray-900 dark:text-white">
                        {visit.patient?.first_name} {visit.patient?.last_name}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{visit.patient?.phone_number}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">{visit.prescriptions?.length} drugs prescribed</p>
                    </button>
                  ))
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              {selectedVisit ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
                  <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Dispense Prescription</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Patient: {selectedVisit.patient?.first_name} {selectedVisit.patient?.last_name}
                    </p>
                  </div>

                  <div className="p-6">
                    <div className="space-y-4">
                      {selectedVisit.prescriptions?.map((prescription: any) => (
                        <div key={prescription.id} className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-semibold text-gray-900 dark:text-white">{prescription.drug?.name}</h4>
                              <p className="text-sm text-gray-600 dark:text-gray-400">
                                {prescription.dosage} - {prescription.frequency} - {prescription.duration}
                              </p>
                              <p className="text-sm text-gray-900 dark:text-white mt-2 font-medium">
                                Price: ₦{prescription.drug?.sales_price?.toFixed(2)}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                prescription.drug?.stock_quantity > 0
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                              }`}>
                                Stock: {prescription.drug?.stock_quantity}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => dispenseDrug(prescription)}
                            disabled={prescription.drug?.stock_quantity === 0}
                            className={`mt-3 px-4 py-2 text-sm rounded-lg transition-colors ${
                              prescription.drug?.stock_quantity === 0
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700'
                            }`}
                          >
                            {prescription.drug?.stock_quantity === 0 ? 'Out of Stock' : 'Dispense'}
                          </button>
                        </div>
                      ))}
                    </div>

                    <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Total Bill</p>
                          <p className="text-2xl font-bold text-gray-900 dark:text-white">
                            ₦{selectedVisit.prescriptions?.reduce((sum: number, p: any) => sum + (p.drug?.sales_price || 0), 0).toFixed(2)}
                          </p>
                        </div>
                        <button
                          onClick={sendToAccounts}
                          disabled={sending}
                          className="flex items-center gap-2 px-6 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 transition-colors"
                        >
                          <Send className="w-4 h-4" />
                          Send to Accounts
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
                  <Pill className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Select a Prescription</h3>
                  <p className="text-gray-600 dark:text-gray-400">Choose a patient from the list to dispense medications</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
