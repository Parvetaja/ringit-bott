'use strict'

const axios = require('axios')
const cheerio = require('cheerio')
const puppeteer = require('puppeteer')

const ROTERMANN_URL = 'https://www.rotermann.eu/lounapakkumised/'
const BASIILIK_URL = 'https://basiilik.ee/en/daily-specials/'

const BLACKLIST = [
  'Siesta',
  'Purée',
  'R14',
  'Om House',
  'Levier',
  'Orangerie',
  'OASIS'
]

const DAYS_OF_WEEK = [
  'Esmaspäev',
  'Teisipäev',
  'Kolmapäev',
  'Neljapäev',
  'Reede'
]

async function getRotermanniLunchOffers() {
  const menus = {}
  const response = await axios(ROTERMANN_URL)
  const html = response.data
  const $ = cheerio.load(html)

  const selectedElem = 'body > main > div > div.row.gutter-20 > div:nth-child(1) > div > div'

  $(selectedElem).each((parentIndex, parentElem) => {
    $(parentElem)
      .children()
      .each((childId, childElem) => {
        const value = $(childElem).text()
          .split('\n')
          .map((item) => item.trim())
          .filter((item) => item !== '')
          .filter((item, i) => item.startsWith('-') || i === 0)

        if (BLACKLIST.findIndex((s) => value[0].includes(s)) === -1) {
          menus[value[0]] = value.slice(1)
        }
      })
  })
  return menus
}

async function getBasiilikLunchOffer() {
  const offers = []
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] })
  const page = await browser.newPage()
  await page.goto(BASIILIK_URL)
  await page.waitForSelector('.day')
  const $ = cheerio.load((await page.content()))

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

async function getLunchOffers() {
  const menus = await getRotermanniLunchOffers()
  menus.Basiilik = await getBasiilikLunchOffer()

  return menus
}

module.exports = getLunchOffers
