import React, { useEffect, useState } from 'react'
import PageTitle from '../../components/Typography/PageTitle'
// import { fetchAgents, deleteAgent } from '../../services/api'
import AgentTable from '../../components/Tables/AgentTable'
import CreateAgent from './Create';
import {  Button , Modal, ModalHeader, ModalBody} from '@windmill/react-ui'

const API_BASE =  process.env.REACT_APP_API_BASE

export default function AgentsPage() {
  const [agents, setAgents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)

  const fetchAgents = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`${API_BASE}/api/agents`)
      if (!res.ok) throw new Error(`Error ${res.status}: ${res.statusText}`)
      const data = await res.json()
      setAgents(data)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  const handleCreateSuccess = () => {
    setIsCreateModalOpen(false)
    fetchAgents()
  }
  return (
    <div>
       {/* Header with Page Title and Create Button */}
      <div className="flex items-center mb-6">
        <div className="flex-1">
          <PageTitle>All Agents</PageTitle>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>Create Agent</Button>
      </div>
       {/* Create Agent Modal */}
      <Modal  isOpen={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
        <ModalHeader>Create Agent</ModalHeader>
        <ModalBody className="modal-body">
          <CreateAgent onSuccess={handleCreateSuccess} />
        </ModalBody>
      </Modal>
      {error && <p className='text-red-600 mb-4'>{error}</p>}
      {loading ? (
        <p>Loading Agents...</p>
      ): (
        <AgentTable data={agents} />
      )}
    </div>
  )
}