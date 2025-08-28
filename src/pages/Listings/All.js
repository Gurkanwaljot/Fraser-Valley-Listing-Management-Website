/* eslint-disable jsx-a11y/accessible-emoji */
import React, { useState, useEffect } from 'react'
import { useLocation, Link } from 'react-router-dom'
import PageTitle from '../../components/Typography/PageTitle'
import ListingTable from '../../components/Tables/ListingTable'
import { Input, Label, Select, Button } from '@windmill/react-ui'

const API_BASE = process.env.REACT_APP_API_BASE;

function All() {
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [listings, setListings] = useState([])
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (location.state?.status) {
      setStatusFilter(location.state.status)
    }
  }, [location.state])

  useEffect(() => {
    async function fetchListings() {
      setLoading(true)
      setError(null)
      try {
        const response = await fetch(`${API_BASE}/api/listings`)
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`)
        const data = await response.json()
        setListings(data)
      } catch (err) {
        console.error('Failed to fetch listings:', err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchListings()
  }, [])

  const filteredData = listings.filter((listing) => {
    const matchesTitle = listing.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || listing.status === statusFilter
    return matchesTitle && matchesStatus
  })

  return (
    <div>
      {/* Header with Page Title and Create Button */}
      <div className="flex items-center mb-6">
        <div className="flex-1">
          <PageTitle>All Listings</PageTitle>
        </div>
        <Link to="/app/listings/create">
          <Button>Create Listing</Button>
        </Link>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Label>
            <span>Search by Title</span>
            <Input
              className="mt-1"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Label>
        </div>
        <div>
          <Label>
            <span>Status</span>
            <Select
              className="mt-1"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All</option>
              <option value="draft">🟠 Draft</option>
              <option value="published">🟣 Published</option>
              <option value="archived">⚪ Archived</option>
            </Select>
          </Label>
        </div>
      </div>

      {/* Data Table */}
      {error && <p className="text-red-600 mb-4">{error}</p>}
      {loading ? (
        <p>Loading Listings...</p>
      ) : (
        <ListingTable data={filteredData} />
      )}
    </div>
  )
}

export default All
