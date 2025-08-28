import React, { useState } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import { Input, Label, Button } from '@windmill/react-ui'

const API_BASE = process.env.REACT_APP_API_BASE;

export default function AgentForm({ onSuccess }) {
  const history = useHistory()
  const { id } = useParams()
  const editMode = Boolean(id)
  const [form, setForm] = useState({
    name: '',
    phone: '',
    email: '',
    url: '',
    brokerage: '',
    fileId: []
  })
  const [error, setError] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [selectedAgentImages, setSelectedAgentImages] = useState([]);
  const [selectedAgentLogo, setSelectedAgentLogo] = useState([]);
  const [selectedBrokerageLogo, setSelectedBrokerageLogo] = useState([]);

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleAgentImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    setSelectedAgentImages((prev) => [...prev, ...files])
  }

  const handleAgentLogoChange = (e) => {
    const files = Array.from(e.target.files || [])
    setSelectedAgentLogo((prev) => [...prev, ...files])
  }
  
  const handleBrokeragetLogoChange = (e) => {
    const files = Array.from(e.target.files || [])
    setSelectedBrokerageLogo((prev) => [...prev, ...files])
  }

  const handleRemoveBrokerageLogo = (index) => {
    setSelectedBrokerageLogo((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveAgentImage = (index) => {
    setSelectedAgentImages((prev) => prev.filter((_, i) => i !== index))
  }

  const handleRemoveAgentLogo = (index) => {
    setSelectedAgentLogo((prev) => prev.filter((_, i) => i !== index))
  }

  const handleCancel = () => {
    if(onSuccess){
      onSuccess();
    } else{
      history.push('/app/agents')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
        const agentPayload = {
          name: form.name,
          phone: form.phone,
          email: form.email,
          url: form.url,
          brokerage: form.brokerage,
          fileId: form.fileId
        }
        console.log("agent: ", agentPayload)
      const res = await fetch(
        editMode ? `${API_BASE}/api/agents/${id}` : `${API_BASE}/api/agents`,
        {
          method: editMode ? 'PUT' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(agentPayload)
        }
      )
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.message || 'Failed to save agent.')
      }
      if (onSuccess) {
        onSuccess()
      } else {
        history.push('/app/agents')
      }
      const data = await res.json();
      console.log("data: ", data)
      const agentId =  data._id;
      if(selectedAgentImages.length > 0 || selectedAgentLogo.length > 0 || selectedBrokerageLogo.length > 0){
        const formData = new FormData();
        formData.append('agent', agentId)

         // 1) Agent Photos
        selectedAgentImages.forEach((file) => {
          formData.append('images', file);                  // files array
          formData.append('altText', 'agent-photo');        // parallel altText array
        });
        // 2) Personal Agent Logo
        selectedAgentLogo.forEach((file) => {
          formData.append('images', file);
          formData.append('altText', 'agent-logo');
        });
        // 3) Brokerage Logo
        selectedBrokerageLogo.forEach((file) => {
          formData.append('images', file);
          formData.append('altText', 'brokerage-logo');
        });
         try {
            const res = await fetch(`${API_BASE}/api/files/agent/${agentId}/multi`, {
              method: 'POST',
              body: formData, // DO NOT set Content-Type; the browser handles boundary
            });

            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.message || 'Upload failed');
            }

            const imgDoc = await res.json();
            // data.images is an array [{url, altText, ...}]
            console.log('Uploaded:', data.images);

            // Clear local state if you want
            // setSelectedAgentImages([]); setSelectedAgentLogo([]); setSelectedBrokerageLogo([]);
            // If Listing.fileId is a SINGLE ref (recommended):
            await fetch(`${API_BASE}/api/agents/${agentId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ fileId: imgDoc._id }),
            })
          } catch (e) {
            console.error(e);
            alert(e.message);
          }
      }
    } catch (err) {
      console.error(err)
      setError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      {error && <p className="text-red-600 mb-4">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-4">
        {['name', 'phone', 'email', 'url', 'brokerage'].map(
          (field) => (
            <Label key={field}>
              {field.charAt(0).toUpperCase() + field.slice(1)}
              <Input
                name={field}
                value={form[field]}
                onChange={handleChange}
                required
                className="mt-1"
              />
            </Label>
          )
        )}
        {/* Image Upload & Preview */}
        <Label>
          <span>Agent Photo</span>
          <Input
            type="file"
            accept="image/*"
            className="mt-2"
            onChange={handleAgentImageChange}
          />
        </Label>
        {selectedAgentImages.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {selectedAgentImages.map((file, idx) => (
              <div key={idx} className="relative">
                <button
                  type="button"
                  onClick={() => handleRemoveAgentImage(idx)}
                  className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded-full"
                  title="Remove"
                >
                  ×
                </button>
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${idx}`}
                  className="w-full h-32 object-cover rounded"
                />
              </div>
            ))}
          </div>
        )}
         {/* Upload Personal Agent Logo */}
        <Label>
          <span>Personal Agent Logo</span>
          <Input
            type="file"
            accept="image/*"
            className="mt-2"
            onChange={handleAgentLogoChange}
          />
        </Label>
        {selectedAgentLogo.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {selectedAgentLogo.map((file, idx) => (
              <div key={idx} className="relative">
                <button
                  type="button"
                  onClick={() => handleRemoveAgentLogo(idx)}
                  className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded-full"
                  title="Remove"
                >
                  ×
                </button>
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${idx}`}
                  className="w-full h-32 object-cover rounded"
                />
              </div>
            ))}
          </div>
        )}
           {/* Upload Brokerage Logo */}
        <Label>
          <span>Brokerage Logo</span>
          <Input
            type="file"
            accept="image/*"
            className="mt-2"
            onChange={handleBrokeragetLogoChange}
          />
        </Label>
        {selectedBrokerageLogo.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {selectedBrokerageLogo.map((file, idx) => (
              <div key={idx} className="relative">
                <button
                  type="button"
                  onClick={() => handleRemoveBrokerageLogo(idx)}
                  className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded-full"
                  title="Remove"
                >
                  ×
                </button>
                <img
                  src={URL.createObjectURL(file)}
                  alt={`Preview ${idx}`}
                  className="w-full h-32 object-cover rounded"
                />
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end">
          <Button layout="outline" onClick={handleCancel} disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" disabled={submitting}>
            {submitting ? (editMode ? 'Updating...' : 'Saving...') : editMode ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </div>
  )
}