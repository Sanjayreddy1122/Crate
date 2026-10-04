import { useEffect, useMemo, useState } from 'react'

const money = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

function ProductCard({ product, onAdd }) {
  return (
    <article className="product-card">
      <div className={`product-art ${product.color}`} aria-hidden="true">
        <span className="product-symbol">{product.symbol}</span>
        {product.label && <span className="product-label">{product.label}</span>}
      </div>
      <div className="product-info">
        <div>
          <p className="product-category">{product.category}</p>
          <h3>{product.name}</h3>
          <p className="product-description">{product.description}</p>
        </div>
        <div className="product-buy">
          <span>{money.format(product.price)}</span>
          <button className="add-button" onClick={() => onAdd(product)} aria-label={`Add ${product.name} to cart`}>
            Add <span aria-hidden="true">+</span>
          </button>
        </div>
      </div>
    </article>
  )
}

function Cart({ items, onQuantityChange, onRemove, onClose, onCheckout }) {
  const [customer, setCustomer] = useState({ name: '', email: '' })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const total = items.reduce((sum, item) => sum + item.product.price * item.quantity, 0)

  async function submitOrder(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer,
          items: items.map(({ product, quantity }) => ({ productId: product.id, quantity })),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'We could not place your order.')
      onCheckout(data.order)
    } catch (checkoutError) {
      setError(checkoutError.message || 'Could not connect to the store. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="overlay" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section className="cart-panel" role="dialog" aria-modal="true" aria-labelledby="cart-title">
        <div className="cart-heading">
          <div>
            <p className="eyebrow">YOUR GOOD THINGS</p>
            <h2 id="cart-title">Your crate <span>({items.length})</span></h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close cart">×</button>
        </div>
        {items.length === 0 ? (
          <div className="empty-cart">
            <span aria-hidden="true">✳</span>
            <h3>A little room for good things.</h3>
            <p>Your crate is empty for now.</p>
            <button className="dark-button" onClick={onClose}>Explore the shop</button>
          </div>
        ) : (
          <>
            <div className="cart-items">
              {items.map(({ product, quantity }) => (
                <div className="cart-item" key={product.id}>
                  <div className={`cart-art ${product.color}`} aria-hidden="true">{product.symbol}</div>
                  <div className="cart-item-copy">
                    <h3>{product.name}</h3>
                    <p>{money.format(product.price)}</p>
                    <div className="quantity-control" aria-label={`Quantity for ${product.name}`}>
                      <button onClick={() => onQuantityChange(product.id, quantity - 1)} aria-label={`Decrease ${product.name} quantity`}>−</button>
                      <span aria-live="polite">{quantity}</span>
                      <button onClick={() => onQuantityChange(product.id, quantity + 1)} aria-label={`Increase ${product.name} quantity`} disabled={quantity >= 20}>+</button>
                    </div>
                  </div>
                  <div className="cart-item-end">
                    <strong>{money.format(product.price * quantity)}</strong>
                    <button className="remove-button" onClick={() => onRemove(product.id)}>Remove</button>
                  </div>
                </div>
              ))}
            </div>
            <form className="checkout-form" onSubmit={submitOrder}>
              <div className="cart-total"><span>Subtotal</span><strong>{money.format(total)}</strong></div>
              <p className="shipping-note">Shipping calculated at checkout. This is a demo — no payment will be collected.</p>
              <label>
                Name
                <input required minLength="2" maxLength="100" autoComplete="name" value={customer.name} onChange={(event) => setCustomer({ ...customer, name: event.target.value })} />
              </label>
              <label>
                Email
                <input required type="email" maxLength="254" autoComplete="email" value={customer.email} onChange={(event) => setCustomer({ ...customer, email: event.target.value })} />
              </label>
              {error && <p className="form-error" role="alert">{error}</p>}
              <button className="dark-button checkout-button" type="submit" disabled={submitting}>
                {submitting ? 'Placing order…' : 'Place demo order'} <span aria-hidden="true">↗</span>
              </button>
            </form>
          </>
        )}
      </section>
    </div>
  )
}

export default function App() {
  const [products, setProducts] = useState([])
  const [loadError, setLoadError] = useState('')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('All things')
  const [sort, setSort] = useState('featured')
  const [cart, setCart] = useState([])
  const [cartOpen, setCartOpen] = useState(false)
  const [confirmation, setConfirmation] = useState(null)

  useEffect(() => {
    fetch('/api/products')
      .then((response) => {
        if (!response.ok) throw new Error('We couldn’t load the collection.')
        return response.json()
      })
      .then(setProducts)
      .catch((error) => setLoadError(error.message || 'Could not connect to the store.'))
  }, [])

  const categories = useMemo(() => ['All things', ...new Set(products.map((product) => product.category))], [products])
  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase()
    const filtered = products.filter((product) => {
      const matchesCategory = category === 'All things' || product.category === category
      const matchesSearch = !query || `${product.name} ${product.category} ${product.description}`.toLowerCase().includes(query)
      return matchesCategory && matchesSearch
    })
    if (sort === 'price-low') return [...filtered].sort((a, b) => a.price - b.price)
    if (sort === 'price-high') return [...filtered].sort((a, b) => b.price - a.price)
    return filtered
  }, [category, products, search, sort])
  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  function addToCart(product) {
    setCart((current) => {
      const existing = current.find((item) => item.product.id === product.id)
      if (existing) return current.map((item) => item.product.id === product.id ? { ...item, quantity: Math.min(20, item.quantity + 1) } : item)
      return [...current, { product, quantity: 1 }]
    })
    setConfirmation(null)
  }

  function changeQuantity(productId, quantity) {
    if (quantity < 1) {
      setCart((current) => current.filter((item) => item.product.id !== productId))
      return
    }
    setCart((current) => current.map((item) => item.product.id === productId ? { ...item, quantity: Math.min(20, quantity) } : item))
  }

  function completeCheckout(order) {
    setCart([])
    setCartOpen(false)
    setConfirmation(order)
  }

  return (
    <div className="site-shell">
      <div className="announcement">A little something for your everyday <span aria-hidden="true">✳</span> Free shipping on orders over $75</div>
      <header className="site-header">
        <a href="#" className="wordmark" aria-label="Crate home">crate<span>®</span></a>
        <nav className="main-nav" aria-label="Main navigation">
          <a href="#shop">Shop all</a>
          <a href="#story">Our point of view</a>
        </nav>
        <button className="cart-button" onClick={() => { setConfirmation(null); setCartOpen(true) }}>
          Your crate <span className="cart-count" aria-label={`${cartCount} items in cart`}>{cartCount}</span>
        </button>
      </header>

      <main>
        <section className="hero" id="story">
          <div className="hero-copy">
            <p className="eyebrow"><span aria-hidden="true">✳</span> THE EVERYDAY, REIMAGINED</p>
            <h1>Good things,<br /><em>gathered.</em></h1>
            <p className="hero-description">Thoughtful objects for slower mornings, shared tables, and all the little rituals in between.</p>
            <a href="#shop" className="hero-link">Find your everyday thing <span aria-hidden="true">↘</span></a>
          </div>
          <div className="hero-visual" aria-label="Colorful shapes inspired by everyday objects">
            <div className="hero-sun" />
            <div className="hero-arch"><span>c</span></div>
            <div className="hero-flower" aria-hidden="true">✿</div>
            <div className="hero-sparkle sparkle-one" aria-hidden="true">✳</div>
            <div className="hero-sparkle sparkle-two" aria-hidden="true">✳</div>
            <div className="hero-caption">MADE FOR THE MOMENTS<br />THAT MAKE A DAY.</div>
          </div>
          <div className="hero-index"><span>01</span><span>—</span><span>08</span></div>
        </section>

        <section className="shop-section" id="shop">
          <div className="section-heading">
            <div>
              <p className="eyebrow">A CURATED COLLECTION</p>
              <h2>Meet your new <em>favorites.</em></h2>
            </div>
            <p className="section-aside">Useful, beautiful, and made to be lived with.<br />That’s the whole idea.</p>
          </div>

          <div className="shop-controls">
            <div className="category-tabs" role="group" aria-label="Filter by category">
              {categories.map((item) => (
                <button key={item} className={category === item ? 'category-tab active' : 'category-tab'} onClick={() => setCategory(item)} aria-pressed={category === item}>{item}</button>
              ))}
            </div>
            <div className="shop-tools">
              <label className="search-field">
                <span className="visually-hidden">Search products</span>
                <span aria-hidden="true">⌕</span>
                <input type="search" placeholder="Search the crate" value={search} onChange={(event) => setSearch(event.target.value)} />
              </label>
              <label className="sort-field">
                <span className="visually-hidden">Sort products</span>
                <select value={sort} onChange={(event) => setSort(event.target.value)}>
                  <option value="featured">Featured</option>
                  <option value="price-low">Price: low to high</option>
                  <option value="price-high">Price: high to low</option>
                </select>
              </label>
            </div>
          </div>

          {loadError ? (
            <div className="state-message" role="alert">{loadError} Refresh the page to try again.</div>
          ) : products.length === 0 ? (
            <div className="state-message" role="status">Gathering the good things…</div>
          ) : visibleProducts.length ? (
            <div className="product-grid">
              {visibleProducts.map((product) => <ProductCard key={product.id} product={product} onAdd={addToCart} />)}
            </div>
          ) : (
            <div className="state-message" role="status">Nothing in this crate yet. Try another search.</div>
          )}
        </section>

        <section className="note-section">
          <span className="note-flower" aria-hidden="true">✳</span>
          <p>Fewer, better things.</p>
          <span className="note-divider" aria-hidden="true">✳</span>
          <p>Made to be kept.</p>
          <span className="note-divider" aria-hidden="true">✳</span>
          <p>Every day, considered.</p>
        </section>
      </main>

      <footer className="site-footer">
        <a href="#" className="wordmark">crate<span>®</span></a>
        <p>Good things for the everyday.</p>
        <p>© {new Date().getFullYear()} Crate Goods Co.</p>
      </footer>

      {cartOpen && <Cart items={cart} onQuantityChange={changeQuantity} onRemove={(id) => changeQuantity(id, 0)} onClose={() => setCartOpen(false)} onCheckout={completeCheckout} />}
      {confirmation && (
        <div className="toast" role="status">
          <span className="toast-mark" aria-hidden="true">✳</span>
          <div><strong>Order placed. Nice choice.</strong><p>Order {confirmation.id} · {money.format(confirmation.total)} · Demo only, no payment taken.</p></div>
          <button onClick={() => setConfirmation(null)} aria-label="Dismiss confirmation">×</button>
        </div>
      )}
    </div>
  )
}
