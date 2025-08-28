import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import InfoCard from '../components/Cards/InfoCard'
import PageTitle from '../components/Typography/PageTitle'
import { ChatIcon, CartIcon, MoneyIcon } from '../icons'
import RoundIcon from '../components/RoundIcon'
import response from '../utils/demo/tableData'

function Dashboard() {
  const [page, setPage] = useState(1)
  const [data, setData] = useState([])

  // pagination setup
  const resultsPerPage = 10

  // on page change, load new sliced data
  // here you would make another server request for new data
  useEffect(() => {
    setData(response.slice((page - 1) * resultsPerPage, page * resultsPerPage))
  }, [page])

  return (
    <>
      {/* Listings Section */}
      <PageTitle>Listings</PageTitle>
      <div className="grid gap-6 mb-8 md:grid-cols-2 xl:grid-cols-3">
        <Link to={{ pathname: "/app/listings", state: { status: "draft" } }}>
          <InfoCard title="Active Listings" value="12">
            <RoundIcon
              icon={CartIcon}
              iconColorClass="text-blue-500 dark:text-blue-100"
              bgColorClass="bg-blue-100 dark:bg-blue-500"
              className="mr-4"
            />
          </InfoCard>
        </Link>
        <Link to={{ pathname: "/app/listings", state: { status: "published" } }}>
          <InfoCard title="Published Listings" value="8">
            <RoundIcon
              icon={MoneyIcon}
              iconColorClass="text-green-500 dark:text-green-100"
              bgColorClass="bg-green-100 dark:bg-green-500"
              className="mr-4"
            />
          </InfoCard>
        </Link>
        <Link to={{ pathname: "/app/listings", state: { status: "archived" } }}>
          <InfoCard title="Archived Listings" value="5">
            <RoundIcon
              icon={ChatIcon}
              iconColorClass="text-gray-500 dark:text-gray-100"
              bgColorClass="bg-gray-100 dark:bg-gray-500"
              className="mr-4"
            />
          </InfoCard>
        </Link>
      </div>
    </>
  )
}

export default Dashboard