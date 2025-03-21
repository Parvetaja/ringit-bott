'use strict'

const config = require('../config')
const Botkit = require('botkit')
const getLunchOffers = require('../modules/scrape-food-offers')


if (![6, 0].includes(new Date().getDay())) {
  const controller = Botkit.slackbot({})
  const bot = controller.spawn()

  bot.configureIncomingWebhook({ url: config('WEBHOOK_URL') })

  getLunchOffers().then((offers) => {
    const menus = Object.entries(offers).map(([key, value]) => ({
      text: [key, ...value].join('\n'),
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: key
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: value.join('\n')
          }
        }
      ]
    }))

    menus.forEach((m) => {
      bot.sendWebhook(m, (err) => {
        if (err) throw err
      })
    })
    console.log('\nMenus delivered!')
  })
} else {
  console.log("It's the weekend, no lunch offers today!")
}
