'use strict'

const config = require('../config')
const Botkit = require('botkit')
const getLunchOffers = require('../modules/scrape-food-offers')
const selectBestLunchOffers = require('../modules/gemini-lunch-selector')
async function main() {
  if ([6, 0].includes(new Date().getDay())) {
    console.log("It's the weekend, no lunch offers today!")
    return
  }
  const controller = Botkit.slackbot({})
  const bot = controller.spawn()
  bot.configureIncomingWebhook({ url: config('WEBHOOK_URL') })
  try {
    const offers = await getLunchOffers()
    console.log('Scraped lunch offers from', Object.keys(offers).length, 'restaurants')
    const allMenus = Object.entries(offers).map(([key, value]) => ({
      text: [key, ...value].join('\n'),
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: `:clipboard: ${key}`
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
    for (const menu of allMenus) {
      try {
        await bot.sendWebhook(menu)
      } catch (err) {
        console.error('Error sending all offers:', err)
      }
    }
    console.log('Analyzing offers with Gemini AI...')
    try {
      const aiSelection = await selectBestLunchOffers(offers)
      if (aiSelection?.selected_offers?.length > 0) {
        const recommendationHeader = {
          text: ':robot_face: AI Soovitused',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: ':robot_face: AI Soovitatud Lõunapakkumised'
              }
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: 'Tänased parimad valikud on:'
              }
            }
          ]
        }
        try {
          await bot.sendWebhook(recommendationHeader)
          for (let index = 0; index < aiSelection.selected_offers.length; index++) {
            const selection = aiSelection.selected_offers[index]
            const recommendedMenu = {
              text: `:star: ${selection.restaurant}`,
              blocks: [
                {
                  type: 'header',
                  text: {
                    type: 'plain_text',
                    text: `:star: #${index + 1} - ${selection.restaurant}`
                  }
                },
                {
                  type: 'section',
                  text: {
                    type: 'mrkdwn',
                    text: selection.items.join('\n')
                  }
                },
                {
                  type: 'context',
                  elements: [
                    {
                      type: 'mrkdwn',
                      text: `:bulb: *Põhjus:* ${selection.reason}`
                    }
                  ]
                }
              ]
            }
            await new Promise(r => setTimeout(r, 500));
            await bot.sendWebhook(recommendedMenu)
          }
        } catch (err) {
          console.error('Error sending recommendations:', err)
          return
        }
        console.log(`\nAI selected ${aiSelection.selected_offers.length} best lunch options!`)
      } else {
        console.log('No AI recommendations received.')
      }
    } catch (error) {
      console.error('Error getting AI recommendations:', error)
    }
    console.log('\nMenus delivered!')
  } catch (error) {
    console.error('Error scraping lunch offers:', error)
  }
}
main().catch((error) => {
  console.error('Unhandled error in main function:', error)
})