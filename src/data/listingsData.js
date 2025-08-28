const listingsData = [
  {
    id: 1,
    basic: {
      title: "Modern Family Home",
      address: "123 Maple Street, Surrey, BC",
      location: {
        lat: 49.1044,
        lng: -122.8011,
      },
      description: "Spacious and modern 4-bedroom home perfect for families.",
      price: 975000,
    },
    specs: {
      beds: 4,
      baths: 3,
      garage: 2,
      yearBuilt: 2015,
      livingAreaSqFt: 2400,
      lotSizeSqFt: 5000,
      propertyType: "detached",
      propertyTax: 3200,
      taxYear: 2023,
    },
    status: "draft",
    purpose: "Full listing entry containing all property details and relationships to realtor and media assets.",
  },
  {
    id: 2,
    basic: {
      title: "Luxury Downtown Condo",
      address: "701 W Georgia St, Vancouver, BC",
      location: {
        lat: 49.2827,
        lng: -123.1207,
      },
      description: "2 bed, 2 bath condo in the heart of downtown with ocean views.",
      price: 1150000,
    },
    specs: {
      beds: 2,
      baths: 2,
      garage: 1,
      yearBuilt: 2018,
      livingAreaSqFt: 1100,
      lotSizeSqFt: null,
      propertyType: "condo",
      propertyTax: 4200,
      taxYear: 2023,
    },
    status: "published",
    purpose: "Property with complete media suite delivered to client and published online.",
  },
  {
    id: 3,
    basic: {
      title: "Cozy Townhome in Langley",
      address: "456 Willow Ave, Langley, BC",
      location: {
        lat: 49.1049,
        lng: -122.6603,
      },
      description: "Well-maintained 3 bed townhome with private backyard.",
      price: 689000,
    },
    specs: {
      beds: 3,
      baths: 2,
      garage: 1,
      yearBuilt: 2009,
      livingAreaSqFt: 1400,
      lotSizeSqFt: 2000,
      propertyType: "townhome",
      propertyTax: 2700,
      taxYear: 2023,
    },
    status: "archived",
    purpose: "Archived listing for recordkeeping and reactivation if needed.",
  }
]

export default listingsData;