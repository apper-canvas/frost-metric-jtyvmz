import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import contactService from "@/services/api/contactService";
import { getAll } from "@/services/api/customFieldService";
import ApperIcon from "@/components/ApperIcon";
import Contacts from "@/components/pages/Contacts";
import SearchBar from "@/components/molecules/SearchBar";
import ContactCard from "@/components/molecules/ContactCard";
import FilterBuilder from "@/components/organisms/FilterBuilder";
import Button from "@/components/atoms/Button";

function ContactList() {
  const [contacts, setContacts] = useState([])
  const [filteredContacts, setFilteredContacts] = useState([])
  const [availableFields, setAvailableFields] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showFilters, setShowFilters] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  // Load contacts on component mount
  useEffect(() => {
    const initializeData = async () => {
      await Promise.all([
        loadContacts(),
        loadFilterFields()
      ])
    }
    
    initializeData()
  }, [])

  // Handle search filtering
  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch(searchQuery)
    } else {
      setFilteredContacts(contacts)
    }
  }, [searchQuery, contacts])

  const loadContacts = async () => {
    try {
      setLoading(true)
      setError(null)
      const result = await contactService.getAll()
      if (result && Array.isArray(result)) {
        setContacts(result)
        setFilteredContacts(result)
      } else {
        throw new Error('Invalid contact data received')
      }
    } catch (error) {
      console.error('Failed to load contacts:', error)
      setError('Failed to load contacts')
      toast.error('Failed to load contacts')
      setContacts([])
      setFilteredContacts([])
    } finally {
      setLoading(false)
    }
  }

  const loadFilterFields = async () => {
    try {
      const fields = await contactService.getFilterFields()
      if (fields && Array.isArray(fields)) {
        setAvailableFields(fields)
      } else {
        setAvailableFields([])
      }
    } catch (error) {
      console.error('Failed to load filter fields:', error)
      setAvailableFields([])
      // Don't show toast for filter fields failure as it's not critical
    }
  }

  const handleSearch = async (query) => {
    try {
      setLoading(true)
      const filtered = await contactService.search(query)
      if (filtered && Array.isArray(filtered)) {
        setFilteredContacts(filtered)
      } else {
        setFilteredContacts([])
      }
    } catch (error) {
      console.error('Search failed:', error)
      toast.error('Search failed')
      setFilteredContacts(contacts) // Fallback to all contacts
    } finally {
      setLoading(false)
    }
  }

  const handleApplyFilter = async (filterConfig) => {
    try {
      setLoading(true)
      const filtered = await contactService.advancedFilter(filterConfig)
      if (filtered && Array.isArray(filtered)) {
        setFilteredContacts(filtered)
      } else {
        setFilteredContacts([])
      }
      setShowFilters(false)
    } catch (error) {
      console.error('Filter failed:', error)
      toast.error('Filter application failed')
      setFilteredContacts(contacts) // Fallback to all contacts
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (contact) => {
    if (contact?.id) {
      navigate(`/contacts/${contact.id}/edit`)
    }
  }

  const handleDelete = async (contact) => {
    if (!contact?.id || !contact?.name) {
      toast.error('Invalid contact data')
      return
    }

    if (window.confirm(`Are you sure you want to delete ${contact.name}?`)) {
      try {
        await contactService.delete(contact.id)
        toast.success('Contact deleted successfully')
        // Reload contacts after deletion
        await loadContacts()
      } catch (error) {
        console.error('Failed to delete contact:', error)
        toast.error('Failed to delete contact')
      }
    }
  }

  // Show loading state
  if (loading && contacts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    )
  }

  // Show error state
  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <ApperIcon name="AlertCircle" className="h-12 w-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Contacts</h3>
        <p className="text-gray-600 mb-4">{error}</p>
        <Button onClick={loadContacts} variant="primary">
          Try Again
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with search and filter controls */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex-1 max-w-md">
          <SearchBar
            placeholder="Search contacts..."
            value={searchQuery}
            onChange={setSearchQuery}
          />
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => setShowFilters(!showFilters)}
            variant={showFilters ? 'primary' : 'secondary'}
          >
            <ApperIcon name="Filter" className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button onClick={() => navigate('/contacts/new')} variant="primary">
            <ApperIcon name="Plus" className="h-4 w-4 mr-2" />
            Add Contact
          </Button>
        </div>
      </div>

      {/* Filter Builder */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <FilterBuilder
              availableFields={availableFields}
              onApplyFilter={handleApplyFilter}
              onCancel={() => setShowFilters(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Contacts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {filteredContacts.length > 0 ? (
            filteredContacts.map((contact, index) => (
              <ContactCard
                key={contact?.id || index}
                contact={contact}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full flex flex-col items-center justify-center h-64 text-center"
            >
              <ApperIcon name="Users" className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Contacts Found</h3>
              <p className="text-gray-600 mb-4">
                {searchQuery ? 'Try adjusting your search criteria' : 'Get started by adding your first contact'}
              </p>
              <Button onClick={() => navigate('/contacts/new')} variant="primary">
                <ApperIcon name="Plus" className="h-4 w-4 mr-2" />
                Add Contact
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Loading overlay for filter/search operations */}
      {loading && contacts.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-10 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-4 shadow-lg">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-2 text-sm text-gray-600">Processing...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default ContactList