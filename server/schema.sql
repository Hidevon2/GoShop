CREATE TABLE IF NOT EXISTS schema_migrations (version INTEGER PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW());
CREATE TABLE IF NOT EXISTS users (
 id TEXT PRIMARY KEY, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL,
 role TEXT NOT NULL CHECK (role IN ('admin','staff','customer')), phone TEXT NOT NULL DEFAULT '',
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS sessions (
 token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
 expires_at TIMESTAMPTZ NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS categories (id TEXT PRIMARY KEY, name TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS products (
 id TEXT PRIMARY KEY, sku TEXT NOT NULL UNIQUE, name TEXT NOT NULL, description TEXT NOT NULL DEFAULT '',
 category_id TEXT NOT NULL REFERENCES categories(id), price_cents INTEGER NOT NULL CHECK(price_cents > 0),
 cost_cents INTEGER NOT NULL DEFAULT 0 CHECK(cost_cents >= 0), stock INTEGER NOT NULL DEFAULT 0 CHECK(stock >= 0),
 reorder_level INTEGER NOT NULL DEFAULT 10 CHECK(reorder_level >= 0), image_url TEXT NOT NULL DEFAULT '',
 color TEXT NOT NULL DEFAULT '#eeeaf6', active BOOLEAN NOT NULL DEFAULT TRUE,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS carts (
 user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, product_id TEXT NOT NULL REFERENCES products(id),
 quantity INTEGER NOT NULL CHECK(quantity BETWEEN 1 AND 99), PRIMARY KEY(user_id,product_id)
);
CREATE TABLE IF NOT EXISTS orders (
 id TEXT PRIMARY KEY, order_number TEXT NOT NULL UNIQUE, customer_id TEXT REFERENCES users(id),
 customer_name TEXT NOT NULL, customer_email TEXT NOT NULL DEFAULT '', phone TEXT NOT NULL DEFAULT '',
 channel TEXT NOT NULL CHECK(channel IN ('online','pos')),
 status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','processing','shipped','delivered','cancelled')),
 payment_method TEXT NOT NULL CHECK(payment_method IN ('cod','cash')),
 subtotal_cents INTEGER NOT NULL CHECK(subtotal_cents >= 0), shipping_cents INTEGER NOT NULL DEFAULT 0 CHECK(shipping_cents >= 0),
 total_cents INTEGER NOT NULL CHECK(total_cents = subtotal_cents + shipping_cents),
 address TEXT NOT NULL DEFAULT '', tracking_number TEXT NOT NULL DEFAULT '',
 idempotency_key TEXT NOT NULL, created_by TEXT NOT NULL REFERENCES users(id),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
 UNIQUE(created_by,idempotency_key)
);
CREATE TABLE IF NOT EXISTS order_items (
 id TEXT PRIMARY KEY, order_id TEXT NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
 product_id TEXT NOT NULL REFERENCES products(id), product_name TEXT NOT NULL, sku TEXT NOT NULL,
 quantity INTEGER NOT NULL CHECK(quantity > 0), unit_price_cents INTEGER NOT NULL CHECK(unit_price_cents > 0)
);
CREATE TABLE IF NOT EXISTS stock_movements (
 id TEXT PRIMARY KEY, product_id TEXT NOT NULL REFERENCES products(id), delta INTEGER NOT NULL CHECK(delta <> 0),
 balance INTEGER NOT NULL CHECK(balance >= 0), reason TEXT NOT NULL, order_id TEXT REFERENCES orders(id),
 actor_id TEXT NOT NULL REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS audit_logs (
 id TEXT PRIMARY KEY, actor_id TEXT REFERENCES users(id), action TEXT NOT NULL, entity_type TEXT NOT NULL,
 entity_id TEXT NOT NULL, details JSONB NOT NULL DEFAULT '{}', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS integration_runs (
 id TEXT PRIMARY KEY, source TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('completed','rejected')),
 records_count INTEGER NOT NULL, actor_id TEXT NOT NULL REFERENCES users(id), created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS settings (id TEXT PRIMARY KEY, value JSONB NOT NULL);
CREATE INDEX IF NOT EXISTS orders_created_idx ON orders(created_at DESC);
CREATE INDEX IF NOT EXISTS orders_customer_idx ON orders(customer_id);
CREATE INDEX IF NOT EXISTS movements_product_idx ON stock_movements(product_id,created_at DESC);
CREATE INDEX IF NOT EXISTS audit_created_idx ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS sessions_expiry_idx ON sessions(expires_at);
INSERT INTO schema_migrations(version) VALUES (1) ON CONFLICT DO NOTHING;
