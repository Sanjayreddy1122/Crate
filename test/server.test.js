import assert from 'node:assert/strict'
import { after, before, test } from 'node:test'
import { createApp } from '../server/index.js'
import { products } from '../server/products.js'

let server
let baseUrl

before(async () => {
  server = createApp().listen(0)
  await new Promise((resolve) => server.once('listening', resolve))
  baseUrl = `http://127.0.0.1:${server.address().port}`
})

after(async () => {
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()))
})

test('lists the seeded products', async () => {
  const response = await fetch(`${baseUrl}/api/products`)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), products)
})

test('creates an order using trusted product prices', async () => {
  const response = await fetch(`${baseUrl}/api/orders`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customer: { name: 'Sam Shopper', email: 'sam@example.com' },
      items: [{ productId: 'canvas-tote', quantity: 2, price: 0.01 }],
    }),
  })
  const data = await response.json()
  assert.equal(response.status, 201)
  assert.equal(data.order.total, 56)
  assert.equal(data.order.items[0].price, 28)
  assert.equal(data.order.customer.email, 'sam@example.com')
})

test('rejects invalid customer details and unavailable products', async (context) => {
  const invalidCases = [
    { customer: { name: 'S', email: 'sam@example.com' }, items: [{ productId: 'canvas-tote', quantity: 1 }] },
    { customer: { name: 'Sam Shopper', email: 'not-an-email' }, items: [{ productId: 'canvas-tote', quantity: 1 }] },
    { customer: { name: 'Sam Shopper', email: 'sam@example.com' }, items: [{ productId: 'not-a-product', quantity: 1 }] },
  ]

  for (const body of invalidCases) {
    await context.test('rejects invalid order data', async () => {
      const response = await fetch(`${baseUrl}/api/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      assert.equal(response.status, 400)
      assert.ok((await response.json()).error)
    })
  }
})
