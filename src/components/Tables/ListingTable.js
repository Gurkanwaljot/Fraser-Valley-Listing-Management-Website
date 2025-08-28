import React, {useState} from 'react'
import { Link } from 'react-router-dom'
import ActionsMenu from '../Modals/ActionsMenu'
import {
  Table,
  TableHeader,
  TableCell,
  TableBody,
  TableRow,
  TableContainer,
  Badge,
  Modal,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button
} from '@windmill/react-ui'

function ListingTable({ data }) {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedId, setSelectedId] = useState(null)
  const getBadgeType = (status) => {
    switch (status) {
      case 'draft':
        return 'warning'
      case 'delivered':
        return 'success'
      case 'archived':
        return 'neutral'
      default:
        return 'primary'
    }
  }
  const openDeleteModal = (id) => {
    setSelectedId(id);
    setIsModalOpen(true);
  }
  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedId(null);
  }

  const confirmDelete = async () => {
    try {
      const res = await fetch(`http://localhost:5002/api/listings/${selectedId}`, {method: 'DELETE'});
      if(!res.ok){
        const err = await res.json();
        throw new Error(err.message || 'Failed to Delete Listing');
      }
      // Refresh the page or trigger a data refetch
      window.location.reload()
    } catch (err){
      console.error('Delete failed:', err)
      alert(err.message)
    } finally {
      closeModal()
    }
  }

  return (
    <>
    <TableContainer>
      <Table>
        <TableHeader>
          <tr>
            <TableCell>Address</TableCell>
            <TableCell>Price</TableCell>
            <TableCell>Status</TableCell>
            <TableCell> </TableCell>
          </tr>
        </TableHeader>
        <TableBody>
          {data.map((listing) => 
          (
            
            <TableRow key={listing._id}>
              <TableCell>{listing.address}</TableCell>
              <TableCell>${listing.price.toLocaleString()}</TableCell>
              <TableCell>
                <Badge type={getBadgeType(listing.status)}>{listing.status}</Badge>
              </TableCell>
              {/* Inline actions: View and Delete */}
                  <div className="flex items-center space-x-4">
                     <ActionsMenu
                        listingId={listing._id}
                        viewHref={`/app/listings/${listing._id}`}
                        onDelete={() => openDeleteModal(listing._id)}
                      />
                  </div>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>

    <Modal isOpen={isModalOpen} onClose={closeModal}>
        <ModalHeader>Confirm Delete</ModalHeader>
        <ModalBody>
          Are you sure you want to delete this listing?
        </ModalBody>
        <ModalFooter>
          <Button layout="outline" onClick={closeModal}>
            Cancel
          </Button>
          <Button onClick={confirmDelete}>
            Delete
          </Button>
        </ModalFooter>
      </Modal>
    </>
  )
}

export default ListingTable
