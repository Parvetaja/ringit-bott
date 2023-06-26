'use strict'

const getLunchOffers = require('../modules/scrape-food-offers')
getLunchOffers().then((offers) => {
  console.log(offers)
})
