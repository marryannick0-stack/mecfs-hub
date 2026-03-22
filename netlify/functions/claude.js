// netlify/functions/claude.js
// Generischer Anthropic API Proxy – versteckt den API Key

import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  }

  try {
    const { messages, system, max_tokens = 2048 } = JSON.parse(event.body)

    if (!messages || !Array.isArray(messages)) {
      return { statusCode: 400, headers, body: JSON.stringify({ error: 'messages fehlt' }) }
    }

    const params = {
      model: 'claude-sonnet-4-20250514',
      max_tokens,
      messages
    }
    if (system) params.system = system

    const response = await client.messages.create(params)

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        content: response.content[0]?.text || '',
        usage: response.usage
      })
    }
  } catch (err) {
    console.error('Claude API Error:', err)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: err.message })
    }
  }
}
