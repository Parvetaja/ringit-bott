'use strict'

const axios = require('axios')
const cheerio = require('cheerio')
const puppeteer = require('puppeteer')

const ROTERMANN_URL = 'https://rotermann.ee/tana-lounaks/'
const BASIILIK_URL = 'https://basiilik.ee/en/daily-specials/'

const BLACKLIST = [
  'Siesta',
  'Purée',
  'Om.House',
  'Levier',
  'OASIS',
  'Nomade',
  'Gallery Cafe'
]

const DAYS_OF_WEEK = [
  'Esmaspäev',
  'Teisipäev',
  'Kolmapäev',
  'Neljapäev',
  'Reede'
]

async function getRotermanniLunchOffers () {
  const menus = {}
  const response = await axios(ROTERMANN_URL)
  const html = response.data
  const $ = cheerio.load(html)

  const selectedElem = '.lunch > .lunch--inner'

  $(selectedElem).each((parentIndex, parentElem) => {
    const restaurant = $(parentElem).find('.lunch--title > a').text().trim()
    const offers = $(parentElem).find('.single-offer > div').map((t, el) => {
      return `-${$(el).find('.single-offer--content > p').text()} ${$(el).find('.single-offer--price > p').text()}`
    }).toArray()

    if (BLACKLIST.findIndex((s) => restaurant.includes(s)) === -1 && restaurant !== '' && offers.length) {
      menus[restaurant] = offers
    }
  })
  return menus
}

const collectData = async (page) => {
  try {
    await page.goto(BASIILIK_URL)
    await page.waitForSelector('.day')
    return await page.content()
  } catch (err) {
    console.error(err.message)
    return false
  }
}

async function getBasiilikLunchOffer () {
  const offers = []
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
  const page = await browser.newPage()

  let data = false
  let attempts = 0

  while (data === false && attempts < 5) {
    data = await collectData(page)
    attempts += 1
    if (!data) {
      await new Promise((resolve) => setTimeout(resolve, 3000))
    }
  }
  if (!data) {
    return offers
  }

  const $ = cheerio.load(data)
  const selectedElem = '.day'

  $(selectedElem).children().each((parentIndex, parentElem) => {
    if ($(parentElem).text().includes(DAYS_OF_WEEK[new Date().getDay() - 1])) {
      $(parentElem).siblings().each((_, el) => {
        const offer = []
        $(el).children().each((_, e) => {
          offer.push($(e).text())
        })
        offers.push(offer.join(' '))
      })
    }
  })
  await browser.close()
  return offers.map((o) => `-${o}`)
}

async function getLunchOffers () {
  const menus = await getRotermanniLunchOffers()
  //menus.Basiilik = await getBasiilikLunchOffer()

  return menus
}

module.exports = getLunchOffers
