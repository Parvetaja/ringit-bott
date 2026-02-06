'use strict'

const { GoogleGenerativeAI } = require('@google/generative-ai')
const config = require('../config')

const genAI = new GoogleGenerativeAI(config('GEMINI_API_KEY'))

async function selectBestLunchOffers(offers) {
  try {
    const formattedOffers = Object.entries(offers).map(([restaurant, items]) => {
      return `**${restaurant}:**\n${items.join('\n')}`
    }).join('\n\n')

    const prompt = `
You are a lunch recommendation and nutritional expert that speaks Estonian. I will provide you with lunch offers from different restaurants.

Please analyze all the offers and select the 2 best options based on the following criteria:
- Burgers and ribs are the most preferred foods
- If available, caesar salad with chicken from Orangerie should always be the first choice (This applies only to Orangerie restaurant!)
- Chicken and meat dishes are also great options
- Most preferred restaurants are Orangerie, Pull
- Second most preferred are Stalker, Chicago 1933, Platz, LaBocca
- Restaurants that have similar offers weekly are Taqueria, FLAMM, SANGA, Viru burger, Vapiano. Suggest one of these when no great options are available
- Do not suggest offers that contain fish or mushrooms. Also no salads as the main dish (it's okay as a side) except for caesar salad with chicken
- Pizza is a good fallback option if nothing else stands out, especially if it's with chicken or pepperoni
- Suggest FLAMM when their daily is either Chick or Nero and no excellent options are available elsewhere

Additionally, identify all main components of the selected best offers and estimate their weights in grams.
Calculate the approximate calories (kcal), protein (proteiin), fats (rasvad), and carbohydrates (süsivesikud).
Add the total nutritional information next to each selected offer in the format (kcal: XXX, proteiin: XXg, rasvad: XXg, süsivesikud: XXg).

Example:
Input:
- Chicken burger with fries
Output:
- Chicken burger with fries kcal: 900kcal, proteiin: 40g, rasvad: 35g, süsivesikud: 25g)

Best option should be the first one in the response.

Please respond ONLY with a JSON object in this exact format:
{
  "selected_offers": [
    {
      "restaurant": "Restaurant Name",
      "items": ["item1", "item2"],
      "reason": "Brief explanation why this was selected in estonian"
    }
  ]
}

Here are today's lunch offers:

${formattedOffers}
`
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' })
    const result = await model.generateContent(prompt)
    const response = await result.response
    const text = response.text()

    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const selectedOffers = JSON.parse(jsonMatch[0])
        return selectedOffers
      } else {
        throw new Error('No JSON found in response')
      }
    } catch (parseError) {
      console.error('Error parsing Gemini response:', parseError)
      console.log('Raw response:', text)
    }

  } catch (error) {
    console.error('Error calling Gemini API:', error)
  }
}

module.exports = selectBestLunchOffers