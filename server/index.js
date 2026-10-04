import express from 'express'
import { pathToFileURL } from 'node:url'
import { products } from './products.js'

export function createApp() {
  const app = express()
  const orders = []

  app.use(express.json())

  app.get('/api/health', (_request, response) => {
    response.json({ status: 'ok' })
  })

  app.get('/api/products', (_request, response) => {
    response.json(products)
  })

  app.post('/api/orders', (request, response) => {
    const { customer, items } = request.body ?? {}
    const name = typeof customer?.name === 'string' ? customer.name.trim() : ''
    const email = typeof customer?.email === 'string' ? customer.email.trim() : ''

    if (name.length < 2 || name.length > 100) {
      return response.status(400).json({ error: 'Please enter a name between 2 and 100 characters.' })
    }
    if (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return response.status(400).json({ error: 'Please enter a valid email address.' })
    }
    if (!Array.isArray(items) || items.length === 0 || items.length > products.length) {
      return response.status(400).json({ error: 'Your cart must contain between 1 and 8 different products.' })
    }

    const orderItems = []
    const seen = new Set()
    for (const item of items) {
      if (!item || typeof item.productId !== 'string' || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
        return response.status(400).json({ error: 'Each item needs a valid product and a quantity between 1 and 20.' })
      }
      if (seen.has(item.productId)) {
        return response.status(400).json({ error: 'Each product can only appear once in your cart.' })
      }
      const product = products.find((entry) => entry.id === item.productId)
      if (!product) {
        return response.status(400).json({ error: 'Your cart contains a product that is no longer available.' })
      }
      seen.add(item.productId)
      orderItems.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
      })
    }

    const order = {
      id: `CR-${Date.now().toString(36).toUpperCase()}-${(orders.length + 1).toString().padStart(3, '0')}`,
      customer: { name, email },
      items: orderItems,
      total: orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
      createdAt: new Date().toISOString(),
    }
    orders.push(order)
    return response.status(201).json({ order })
  })

  app.use((error, _request, response, _next) => {
    if (error instanceof SyntaxError && 'body' in error) {
      return response.status(400).json({ error: 'Request body must be valid JSON.' })
    }
    console.error(error)
    return response.status(500).json({ error: 'Something went wrong. Please try again.' })
  })

  return app
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const port = Number(process.env.PORT) || 3001
  createApp().listen(port, () => {
    console.log(`Crate API listening on http://localhost:${port}`)
  })
}
