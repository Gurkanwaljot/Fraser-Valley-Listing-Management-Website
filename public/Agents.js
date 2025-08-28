import React from 'react'
import PageTitle from '../src/components/Typography/PageTitle'
import agentsData from '../src/data/agentsData'
import AgentTable from '../src/components/Tables/AgentTable'
// import agentsData from '../src/data/agentsData'

function Agents() {
  return (
    <div>
      <PageTitle>Realtors</PageTitle>
      <AgentTable data={agentsData} />
    </div>
  )
}

export default Agents;