import React, { useState, useEffect } from 'react'
import {
  Table,
  TableHeader,
  TableCell,
  TableBody,
  TableRow,
  TableContainer,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Label,
  Input,
  Button,
} from '@windmill/react-ui'

function AgentTable({ data }) {
  // --- Delete Modal State ---
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [deleteId, setDeleteId] = useState(null)

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false)

  // Images Set For Deleting
  const [deleteAgentImage, setDeleteAgentImages] = useState();
  const [deleteAgentLogo, setDeleteAgentLogos] = useState([]);
  const [deleteBrokerageLogo, setDeleteBrokerageLogos] = useState([]);

  // Existing Images Type state
  const [agentImages, setAgentImages] = useState([]);
  const [agentLogos, setAgentLogos] = useState([]);
  const [brokerageLogos, setBrokerageLogos] = useState([]);

  // Updated Images To be Uploaded
  const [updatedAgentImage, setUpdatedAgentImages] = useState([]);
  const [updatedAgentLogo, setUpdatedAgentLogo] = useState([]);
  const [updatedBrokeragelogo, setUpdatedBrokerageLogo] = useState([]);

  // --- Edit Modal State ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({
    id: '',
    name: '',
    phone: '',
    email: '',
    url: '',
    brokerage: '',
    logo: '',
  })
  async function load(agent) {
    try{
      setLoading(true);
      // fetch images related to agent
      const resImg =  await fetch(`http://localhost:5002/api/files`);
      if(!resImg.ok) throw new Error(`Error ${resImg.status}`);
      const imagesData = await resImg.json();
      // map agent ID with the images
      const recordForThisAgent = imagesData.find(i => i.agent === agent._id) || null;
      const imagesForListing = Array.isArray(recordForThisAgent?.agentImages) ? recordForThisAgent.agentImages : [];

      // eslint-disable-next-line array-callback-return
      imagesForListing.map((image, idx) => {
        if(image.altText === 'agent-photo'){
          setAgentImages((prev) => [...prev, image])
        } else if (image.altText === 'agent-logo'){
          setAgentLogos((prev) => [...prev, image])
        } else if (image.altText === 'brokerage-logo'){
          setBrokerageLogos((prev) => [...prev, image])
        }
      })
      
    } catch (err){
      console.error(err)
      setError(err.message)
    }
  }

  // Open Delete Confirmation
  const openDeleteModal = (id) => {
    setDeleteId(id)
    setIsDeleteModalOpen(true)
  }
  const closeDeleteModal = () => {
    setIsDeleteModalOpen(false)
    setDeleteId(null)
  }
  const confirmDelete = async () => {
    try {
      const res = await fetch(`http://localhost:5002/api/agents/${deleteId}`, {
        method: 'DELETE',
      })
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error(err.message || 'Failed to delete agent.')
      }
      // Simple full-page reload; you could also lift state up and splice out the agent
      window.location.reload()
    } catch (err) {
      alert(err.message)
    } finally {
      closeDeleteModal()
    }
  }

  // Open Edit Modal & preload form
  const openEditModal = (agent) => {
    load(agent);
    setEditForm({
      id:        agent._id,
      name:      agent.name,
      phone:     agent.phone,
      email:     agent.email,
      url:       agent.url,
      brokerage: agent.brokerage,
      logo:      agent.logo,
    })
    setIsEditModalOpen(true)
  }
  const closeEditModal = () => {
    setIsEditModalOpen(false)
    setAgentImages([]);
    setAgentLogos([])
    setBrokerageLogos([])
    setUpdatedAgentImages([]);
    setUpdatedAgentLogo([]);
    setUpdatedBrokerageLogo([]);
    setEditForm({
      id: '',
      name: '',
      phone: '',
      email: '',
      url: '',
      brokerage: '',
      logo: '',
    })
  }
  // Handle Edit Related to Agent Input and Images
  const handleEditChange = (e) => {
    const { name, value } = e.target
    setEditForm((f) => ({ ...f, [name]: value }))
  }
  const handleAgentImageChange = (e) => {
    const files = Array.from(e.target.files || [])
    setUpdatedAgentImages((prev) => [...prev, ...files])
  }
  const handleAgentLogoChange = (e) => {
    const files = Array.from(e.target.files || [])
    setUpdatedAgentLogo((prev) => [...prev, ...files])
  }
  
  const handleBrokeragetLogoChange = (e) => {
    const files = Array.from(e.target.files || [])
    setUpdatedBrokerageLogo((prev) => [...prev, ...files])
  }

  // Handle Removal of images from 
  const handleRemoveAgentImage = (index) => {
    setAgentImages((prev) => {
      const removedFile = prev[index];
      setDeleteAgentImages(removedFile)
      return prev.filter((_, i) => i !== index)});
  }
  const handleRemoveUpdatedAgentImage = (index) => {
    setUpdatedAgentImages((prev => prev.filter((_, i) => i !== index)))
    var inputText = document.getElementById('agentPhoto');
    inputText.value = '';
  }
  const handleRemoveAgentLogo = (index) => {
    setAgentLogos((prev) =>  {
      const removedFile = prev[index];
      setDeleteAgentLogos(removedFile);
      return prev.filter((_, i) => i !== index)
    });
  }
  const handleRemoveUpdatedAgentLogo = (index) => {
    setUpdatedAgentLogo((prev => prev.filter((_, i) => i !== index)))
    var inputText = document.getElementById('agentLogo');
    inputText.value = '';
  }
  const handleRemoveBrokerageLogo = (index) => {
    setBrokerageLogos((prev) => {
      const removedFile = prev[index];
      setDeleteBrokerageLogos(removedFile);
      return prev.filter((_, i) => i !== index)});
  }
  const handleRemoveUpdatedBrokerageLogo = (index) => {
    setUpdatedBrokerageLogo((prev => prev.filter((_, i) => i !== index)))
    var inputText = document.getElementById('brokerageLogo');
    inputText.value = '';
  }

  const confirmEdit = async () => {
    try {
      const { id, ...payload } = editForm
      const resAgent = await fetch(`http://localhost:5002/api/agents/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (!resAgent.ok) {
        const err = await resAgent.json().catch(() => ({}))
        throw new Error(err.message || 'Failed to update agent.')
      }
      if(deleteAgentImage  !== undefined){
        await fetch(`http://localhost:5002/api/files/agent/${id}/by-alt/${deleteAgentImage.altText}`, { method: 'DELETE' });
        setDeleteAgentImages([])
      }
      if(deleteAgentLogo  !== undefined){
        await fetch(`http://localhost:5002/api/files/agent/${id}/by-alt/${deleteAgentLogo.altText}`, { method: 'DELETE' });
        setDeleteAgentLogos([])
      }
      if(deleteBrokerageLogo  !== undefined){
        await fetch(`http://localhost:5002/api/files/agent/${id}/by-alt/${deleteBrokerageLogo.altText}`, { method: 'DELETE' });
        setDeleteBrokerageLogos([])
      }
      if(updatedAgentImage.length > 0 && agentImages.legnth === undefined){
        try{
          const formData = new FormData();
          formData.append('agent', id)
          updatedAgentImage.forEach((file) => {
            formData.append('image', file);
            formData.append('altText', 'agent-photo');
          })

          const res = await fetch(`http://localhost:5002/api/files/agent/${id}/replace`, {
              method: 'POST',
              body: formData, // DO NOT set Content-Type; the browser handles boundary
            });

          if (!res.ok) throw new Error((await res.json()).message || 'Replace failed');
        } catch (e){
          console.error(e);
          alert(e.message);    
        }
      }
      
      if(updatedAgentLogo.length > 0 && agentLogos.legnth === undefined){
        try{
          const formData = new FormData();
          
          formData.append('agent', id)
          updatedAgentLogo.forEach((file) => {
            formData.append('image', file);
            formData.append('altText', 'agent-logo');
          })
          const res = await fetch(`http://localhost:5002/api/files/agent/${id}/replace`, {
              method: 'POST',
              body: formData, // DO NOT set Content-Type; the browser handles boundary
            });

          if (!res.ok) throw new Error((await res.json()).message || 'Replace failed');
        } catch (e){
          console.error(e);
          alert(e.message);    
        }
      }
      if(updatedBrokeragelogo.length > 0 && brokerageLogos.legnth === undefined){
        try{
          const formData = new FormData();
          formData.append('agent', id)
          updatedBrokeragelogo.forEach((file) => {
            formData.append('image', file);
            formData.append('altText', 'brokerage-logo');
          })
          const res = await fetch(`http://localhost:5002/api/files/agent/${id}/replace`, {
              method: 'POST',
              body: formData, // DO NOT set Content-Type; the browser handles boundary
            });

          if (!res.ok) throw new Error((await res.json()).message || 'Replace failed');
        } catch (e){
          console.error(e);
          alert(e.message);    
        }
      }
      // window.location.reload()
    } catch (err) {
      alert(err.message)
    } finally {
      closeEditModal()
    }
  }
  const allAgentImages = [...agentImages, ...updatedAgentImage]
  const allAgentLogos = [...agentLogos, ...updatedAgentLogo]
  const allBrokergageLogos = [...brokerageLogos, ...updatedBrokeragelogo];
  return (
    <>
      <TableContainer>
        <Table>
          <TableHeader>
            <tr>
              <TableCell>Name</TableCell>
              <TableCell>Phone</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>URL</TableCell>
              <TableCell>Brokerage</TableCell>
              <TableCell></TableCell>
            </tr>
          </TableHeader>
          <TableBody>
            {data.map((agent) => (
              <TableRow key={agent._id}>
                <TableCell>{agent.name}</TableCell>
                <TableCell>{agent.phone}</TableCell>
                <TableCell>{agent.email}</TableCell>
                <TableCell>
                  <a
                    href={agent.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline"
                  >
                    Website
                  </a>
                </TableCell>
                <TableCell>{agent.brokerage}</TableCell>
                <TableCell>
                  <span className="inline-flex items-center gap-4">
                    {/* Edit button */}
                    <Button
                      onClick={() => openEditModal(agent)}
                      className="w-10 h-10 flex items-center justify-center rounded-full bg-purple-600 hover:bg-purple-700 transition duration-200 cursor-pointer"
                      title="Edit Agent"
                    >
                      <i className="fas fa-edit text-white text-sm"></i>
                    </Button>
                    {/* Delete button */}
                    <Button
                      onClick={() => openDeleteModal(agent._id)}
                      className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-red-100 transition duration-200 cursor-pointer"
                      title="Delete Agent"
                    >
                      <i className="fas fa-trash text-red-600 text-sm"></i>
                    </Button>
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={closeDeleteModal}>
        <ModalHeader>Confirm Delete</ModalHeader>
        <ModalBody>Are you sure you want to delete this agent?</ModalBody>
        <ModalFooter>
          <Button layout="outline" onClick={closeDeleteModal}>
            Cancel
          </Button>
          <Button onClick={confirmDelete}>Delete</Button>
        </ModalFooter>
      </Modal>

      {/* Edit Agent Modal */}
      <Modal isOpen={isEditModalOpen} onClose={closeEditModal}>
        <ModalHeader>Edit Agent</ModalHeader>
        <ModalBody className='modal-body'>
          {/** Name **/}
          <Label>
            <span>Name</span>
            <Input
              name="name"
              value={editForm.name}
              onChange={handleEditChange}
              className="mt-1"
            />
          </Label>
          {/** Phone **/}
          <Label>
            <span>Phone</span>
            <Input
              name="phone"
              value={editForm.phone}
              onChange={handleEditChange}
              className="mt-1"
            />
          </Label>
          {/** Email **/}
          <Label>
            <span>Email</span>
            <Input
              name="email"
              value={editForm.email}
              onChange={handleEditChange}
              className="mt-1"
            />
          </Label>
          {/** URL **/}
          <Label>
            <span>Website URL</span>
            <Input
              name="url"
              value={editForm.url}
              onChange={handleEditChange}
              className="mt-1"
            />
          </Label>
          {/** Brokerage **/}
          <Label>
            <span>Brokerage</span>
            <Input
              name="brokerage"
              value={editForm.brokerage}
              onChange={handleEditChange}
              className="mt-1"
            />
          </Label>
        {/* Image Upload & Preview */}
        <Label>
          <span>Agent Photo</span>
          <Input
            id="agentPhoto"
            type="file"
            accept="image/*"
            className="mt-2"
            onChange={handleAgentImageChange}
            disabled={agentImages.length > 0} // ✅ disable if already has an image
          />
          {agentImages.length > 0 && (
            <p className="mt-1 text-sm" style={{ color: 'red' }}>
              You cannot upload Image if there is already one.
            </p>
          )}
        </Label>
        {allAgentImages.length > 0 && (
           <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {allAgentImages.map((file, idx) => (
              <div key={idx} className="relative">
                <button
                  type="button"
                  onClick={() => handleRemoveAgentImage(idx) || handleRemoveUpdatedAgentImage(idx)}
                  className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded-full"
                  title="Remove"
                >
                  ×
                </button>
                <img
                  src={file?.url || (file instanceof File && URL.createObjectURL(file))}
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
            id="agentLogo"
            type="file"
            accept="image/*"
            className="mt-2"
            onChange={handleAgentLogoChange}
            disabled={agentLogos.length > 0} // ✅ disable if already has an logo
          />
          {agentLogos.length > 0 && (
            <p className="mt-1 text-sm" style={{ color: 'red' }}>
              You cannot upload Image if there is already one.
            </p>
          )}
        </Label>
        {allAgentLogos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {allAgentLogos.map((file, idx) => (
              <div key={idx} className="relative">
                <button
                  type="button"
                  onClick={() => handleRemoveAgentLogo(idx) || handleRemoveUpdatedAgentLogo(idx)}
                  className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded-full"
                  title="Remove"
                >
                  ×
                </button>
                <img
                   src={file?.url || (file instanceof File && URL.createObjectURL(file))}
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
            id="brokerageLogo"
            type="file"
            accept="image/*"
            className="mt-2"
            onChange={handleBrokeragetLogoChange}
            disabled={brokerageLogos.length > 0} // ✅ disable if already has an logo
          />
          {brokerageLogos.length > 0 && (
            <p className="mt-1 text-sm" style={{ color: 'red' }}>
              You cannot upload Image if there is already one.
            </p>
          )}
        </Label>
        {allBrokergageLogos.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
            {allBrokergageLogos.map((file, idx) => (
              <div key={idx} className="relative">
                <button
                  type="button"
                  onClick={() => handleRemoveBrokerageLogo(idx) || handleRemoveUpdatedBrokerageLogo(idx)}
                  className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded-full"
                  title="Remove"
                >
                  ×
                </button>
                <img
                  src={file?.url || (file instanceof File && URL.createObjectURL(file))}
                  alt={`Preview ${idx}`}
                  className="w-full h-32 object-cover rounded"
                />
              </div>
            ))}
          </div>
        )}
        </ModalBody>
        <ModalFooter>
          <Button layout="outline" onClick={closeEditModal}>
            Cancel
          </Button>
          <Button onClick={confirmEdit}>Save</Button>
        </ModalFooter>
      </Modal>
    </>
  )
}

export default AgentTable
