import { lazy } from 'react'
const Dashboard = lazy(() => import('../pages/Dashboard'))
const Agents = lazy(() => import('../pages/Agents/'))
const ListingDetail = lazy(() => import('../pages/Listings/Detail/Detail'))
const AllListings = lazy(() => import('../pages/Listings/All'))
const createListing = lazy(() => import('../pages/Listings/CreateListing'));
const createAgent = lazy(() => import('../pages/Agents/Create'));
const EditListing   = lazy(() => import('../pages/Listings/EditListing'))

const routes = [
  {
    path: '/dashboard',
    component: Dashboard,
  },
  {
    path: '/listings',
    component: AllListings,
    exact: true
  },
  {
    path: '/listings/create',
    component: createListing
  },
  {
    path: '/agents/create',
    component: createAgent
  },
  {
    path: '/listings/:id/edit',
    component: EditListing 
  },
  {
    path: '/agents',
    component: Agents,
  },
  {
    path: '/listings/:id',
    component: ListingDetail,
  }
]

export default routes
