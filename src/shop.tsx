import { useState, type ReactNode, type FormEvent } from "react";
import {
  Link,
  useNavigate,
  useSearchParams,
  useLocation,
} from "react-router-dom";
import {
  ArrowRight,
  ArrowUpRight,
  ShoppingBag,
  Search,
  Plus,
  Minus,
  Trash2,
  Package,
  Truck,
  ShieldCheck,
  Store,
  LogOut,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import {
  api,
  mutate,
  useAuth,
  useConfig,
  useData,
  useToast,
  useSignOut,
  Brand,
  ProductImage,
  Loading,
  ErrorState,
  Empty,
  Field,
  money,
  type Product,
  type CartItem,
  type Order,
} from "./lib";
import { OrderPanel, OrderTable } from "./workspace";

function ShopShell({ children }: { children: ReactNode }) {
  const config = useConfig(),
    { user } = useAuth(),
    { data: cart } = useData<CartItem[]>(user ? "/cart" : null),
    { signOut, signingOut } = useSignOut();
  const count = cart?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  return (
    <div className="shop">
      <a className="skip-link" href="#shop-main">
        Skip to products
      </a>
      <div className="shop-announcement">
        {config.freeShippingCents > 0 ? (
          <>
            A little extra, on us. Free delivery on orders from{" "}
            {money(config.freeShippingCents)}.
          </>
        ) : (
          "Everyday finds, delivered. Free delivery on all orders."
        )}
        <ArrowRight size={14} />
      </div>
      <header className="shop-header">
        <Link to="/shop" className="brand-link">
          <Brand />
        </Link>
        <nav aria-label="Store navigation">
          <Link to="/shop">Shop all</Link>
          <Link to="/shop?category=home-living">Home & living</Link>
          <Link to="/shop?category=lifestyle">Lifestyle</Link>
          <Link to="/shop?category=accessories">Accessories</Link>
        </nav>
        <div className="shop-account">
          {user ? (
            <>
              <Link className="my-orders-link" to="/my-orders">
                My orders
              </Link>
              {user.role !== "customer" && (
                <Link className="workspace-link" to="/dashboard">
                  Workspace
                  <ArrowUpRight size={13} />
                </Link>
              )}
              <button
                type="button"
                className="shop-sign-out"
                onClick={signOut}
                disabled={signingOut}
                aria-busy={signingOut}
              >
                <LogOut size={18} />
                <span>{signingOut ? "Signing out…" : "Sign out"}</span>
              </button>
            </>
          ) : (
            <Link to="/login">Sign in</Link>
          )}
          <Link
            className="shop-bag"
            to={user ? "/cart" : "/login?next=/cart"}
            aria-label={`Shopping bag, ${count} items`}
          >
            <ShoppingBag size={20} />
            <span>{count}</span>
          </Link>
        </div>
      </header>
      <main id="shop-main">{children}</main>
      <footer className="shop-footer">
        <div>
          <Brand />
          <p>
            Good things for your everyday.
            <br />
            One connected little shop.
          </p>
        </div>
        <div>
          <strong>Make yourself at home</strong>
          <Link to="/shop">Shop all products</Link>
          <Link to="/my-orders">Track your orders</Link>
          <Link to="/login">Your account</Link>
        </div>
        <div>
          <strong>About this project</strong>
          <p>
            GoShop is a retail & e-commerce final project.
            <br />
            Products, prices and customers are demo data.
          </p>
        </div>
        <div className="shop-footer-bottom">
          <span>
            © {new Date().getFullYear()} {config.storeName}
          </span>
          <span>PHP · Philippines · Cash on delivery</span>
        </div>
      </footer>
    </div>
  );
}
export function ShopPage() {
  const [params, setParams] = useSearchParams(),
    category = params.get("category") || "all",
    [search, setSearch] = useState(""),
    [sort, setSort] = useState("featured"),
    [adding, setAdding] = useState<string | null>(null),
    [detail, setDetail] = useState<Product | null>(null);
  const { data: products, error } = useData<Product[]>("/products"),
    { data: categories } =
      useData<{ id: string; name: string }[]>("/categories"),
    { user } = useAuth(),
    navigate = useNavigate(),
    toast = useToast(),
    config = useConfig(),
    { data: cart } = useData<CartItem[]>(user ? "/cart" : null);
  const filtered = (
    products?.filter(
      (p) =>
        (category === "all" || p.category_id === category) &&
        `${p.name} ${p.description}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    ) || []
  ).sort((a, b) =>
    sort === "low"
      ? a.price_cents - b.price_cents
      : sort === "high"
        ? b.price_cents - a.price_cents
        : sort === "name"
          ? a.name.localeCompare(b.name)
          : 0,
  );
  async function add(product: Product) {
    if (!user) {
      toast("Sign in to save products to your bag.");
      navigate("/login?next=/shop");
      return;
    }
    setAdding(product.id);
    try {
      const quantity =
        (cart?.find((i) => i.id === product.id)?.quantity || 0) + 1;
      await mutate(`/cart/${product.id}`, "PUT", { quantity });
      toast(`${product.name} added to your bag.`);
    } catch (err) {
      toast((err as Error).message, true);
    } finally {
      setAdding(null);
    }
  }
  return (
    <ShopShell>
      <section className="shop-hero">
        <div className="shop-hero-copy">
          <h1>
            Little things.
            <br />
            Better days.
          </h1>
          <p>
            Thoughtful finds for your space, your routine, and wherever the day
            takes you.
          </p>
          <a className="btn shop-primary" href="#collection">
            Find your everyday
            <ArrowRight size={18} />
          </a>
          <div className="hero-fineprint">
            <span className="mini-dot" />A demo collection, made for exploring.
          </div>
        </div>
        <div className="shop-hero-image">
          <img
            src="/products/hero.jpg"
            alt="A bright, thoughtfully arranged home interior"
          />
          <div className="hero-image-caption">
            <span>Make room for the everyday.</span>
            <ArrowUpRight size={23} />
          </div>
        </div>
        <span className="hero-side-note">GOOD FINDS. GOOD DAYS.</span>
      </section>
      <div className="shop-benefits">
        <span>
          <Package size={19} />A little of everything you love
        </span>
        <span>
          <Truck size={19} />
          {config.freeShippingCents > 0
            ? `Free delivery from ${money(config.freeShippingCents)}`
            : "Free delivery on every order"}
        </span>
        <span>
          <ShieldCheck size={19} />
          Pay with cash on delivery
        </span>
      </div>
      <section className="collection" id="collection">
        <div className="collection-heading">
          <div>
            <h2>Find your next favorite.</h2>
            <p>Simple essentials. A few happy discoveries.</p>
          </div>
          <span>{filtered.length} good finds</span>
        </div>
        <div className="collection-toolbar">
          <div className="category-tabs">
            <button
              className={category === "all" ? "active" : ""}
              onClick={() => setParams({})}
            >
              All finds
            </button>
            {categories?.map((c) => (
              <button
                key={c.id}
                className={category === c.id ? "active" : ""}
                onClick={() => setParams({ category: c.id })}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="collection-controls">
            <label className="search-input">
              <Search size={16} />
              <input
                aria-label="Search collection"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Find something good…"
              />
            </label>
            <select
              aria-label="Sort products"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
            >
              <option value="featured">Featured</option>
              <option value="low">Price: low to high</option>
              <option value="high">Price: high to low</option>
              <option value="name">Name: A–Z</option>
            </select>
          </div>
        </div>
        {error ? (
          <ErrorState message={error} />
        ) : !products ? (
          <Loading />
        ) : !filtered.length ? (
          <Empty
            title="No finds this time."
            description="Try another category or a different search."
          />
        ) : (
          <div className="shop-products">
            {filtered.map((p) => (
              <article key={p.id} className="shop-product">
                <button
                  className="shop-product-photo"
                  onClick={() => setDetail(p)}
                  aria-label={`View ${p.name}`}
                >
                  <ProductImage product={p} />
                  {p.stock <= p.reorder_level && (
                    <span className="stock-tag">
                      {p.stock ? "Last few" : "Out of stock"}
                    </span>
                  )}
                  <span className="photo-arrow">
                    <ArrowUpRight size={19} />
                  </span>
                </button>
                <div className="shop-product-info">
                  <div>
                    <span className="product-category">{p.category}</span>
                    <button
                      className="product-title"
                      onClick={() => setDetail(p)}
                    >
                      {p.name}
                    </button>
                    <span className="product-price">
                      {money(p.price_cents)}
                    </span>
                  </div>
                  <button
                    className="product-add"
                    onClick={() => add(p)}
                    disabled={!p.stock || adding !== null}
                    aria-label={`Add ${p.name} to bag`}
                  >
                    <Plus size={19} />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
      <section className="shop-closing">
        <ShoppingBag size={32} strokeWidth={1.3} />
        <h2>
          A shop that keeps
          <br />
          everything together.
        </h2>
        <p>
          Browse online. Sell in store. GoShop keeps every product,
          <br />
          order and stock count connected behind the scenes.
        </p>
        <Link
          to={user && user.role !== "customer" ? "/dashboard" : "/login"}
          className="text-link"
        >
          Explore the workspace
          <ArrowUpRight size={17} />
        </Link>
      </section>
      {detail && (
        <div
          className="product-detail-backdrop"
          onClick={(e) => {
            if (e.currentTarget === e.target) setDetail(null);
          }}
        >
          <ProductDetail
            product={detail}
            onClose={() => setDetail(null)}
            onAdd={() => add(detail)}
            busy={adding !== null}
          />
        </div>
      )}
    </ShopShell>
  );
}
import { Drawer } from "./lib";
function ProductDetail({
  product,
  onClose,
  onAdd,
  busy,
}: {
  product: Product;
  onClose: () => void;
  onAdd: () => void;
  busy: boolean;
}) {
  return (
    <Drawer title="A closer look" onClose={onClose}>
      <ProductImage product={product} className="product-detail-image" />
      <span className="product-category">{product.category}</span>
      <h2 className="product-detail-name">{product.name}</h2>
      <p className="product-detail-price">{money(product.price_cents)}</p>
      <p className="product-detail-description">{product.description}</p>
      <p className="muted text-small">
        {product.stock
          ? `${product.stock} available · SKU ${product.sku}`
          : "Currently out of stock"}
      </p>
      <button
        className="btn primary full section-spaced"
        disabled={!product.stock || busy}
        onClick={onAdd}
      >
        <ShoppingBag size={17} />
        Add to bag
      </button>
      <p className="form-hint">
        Demo product and price. Cash on delivery at checkout.
      </p>
    </Drawer>
  );
}
export function CartPage() {
  const { data: cart, error } = useData<CartItem[]>("/cart"),
    config = useConfig(),
    { user } = useAuth(),
    [busy, setBusy] = useState(false),
    [key] = useState(crypto.randomUUID()),
    [formError, setFormError] = useState(""),
    toast = useToast(),
    navigate = useNavigate();
  const subtotal =
      cart?.reduce((sum, i) => sum + i.quantity * i.price_cents, 0) || 0,
    shipping = subtotal >= config.freeShippingCents ? 0 : config.shippingCents;
  async function change(item: CartItem, quantity: number) {
    setBusy(true);
    try {
      await mutate(`/cart/${item.id}`, "PUT", { quantity });
    } catch (err) {
      toast((err as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  async function checkout(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setFormError("");
    const f = new FormData(e.currentTarget);
    try {
      const order = await mutate<Order>("/checkout", "POST", {
        channel: "online",
        idempotencyKey: key,
        name: f.get("name"),
        phone: f.get("phone"),
        address: f.get("address"),
      });
      navigate(`/my-orders?order=${order.id}`, { state: { placed: true } });
    } catch (err) {
      setFormError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <ShopShell>
      <div className="shop-page-content">
        <div className="shop-page-heading">
          <Link className="text-link" to="/shop">
            Keep exploring
            <ArrowUpRight size={15} />
          </Link>
          <h1>Your good finds.</h1>
          <p>A few steps from your doorstep.</p>
        </div>
        {error ? (
          <ErrorState message={error} />
        ) : !cart ? (
          <Loading />
        ) : !cart.length ? (
          <Empty
            title="Your bag is waiting for something good."
            description="Explore the collection and add a few everyday favorites."
            action={
              <Link to="/shop#collection" className="btn primary">
                Browse the collection
                <ArrowRight size={17} />
              </Link>
            }
          />
        ) : (
          <div className="checkout-layout">
            <div>
              <div className="bag-items">
                {cart.map((item) => (
                  <div className="bag-line" key={item.id}>
                    <ProductImage product={item} />
                    <div className="bag-product-details">
                      <h3>{item.name}</h3>
                      <p>{item.sku}</p>
                      <span>{money(item.price_cents)}</span>
                      {(!item.active || item.quantity > item.stock) && (
                        <p className="form-error">
                          {!item.active
                            ? "This item is no longer available. Remove it to continue."
                            : `Only ${item.stock} left. Please reduce the quantity.`}
                        </p>
                      )}
                      <div className="quantity-control">
                        <button
                          disabled={busy}
                          onClick={() => change(item, item.quantity - 1)}
                          aria-label={`Remove one ${item.name}`}
                        >
                          <Minus size={14} />
                        </button>
                        <span>{item.quantity}</span>
                        <button
                          disabled={
                            busy || item.quantity >= Math.min(item.stock, 99)
                          }
                          onClick={() => change(item, item.quantity + 1)}
                          aria-label={`Add one ${item.name}`}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </div>
                    <div className="bag-line-total">
                      <strong>{money(item.quantity * item.price_cents)}</strong>
                      <button
                        disabled={busy}
                        className="icon-button"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => change(item, 0)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="delivery-note">
                <Truck size={21} />
                <span>
                  {shipping ? (
                    <>
                      You’re {money(config.freeShippingCents - subtotal)} away
                      from free delivery.
                    </>
                  ) : (
                    <>A little extra: your delivery is on us.</>
                  )}
                </span>
              </div>
              <p className="bag-disclaimer">
                Prices and availability are checked again when you place your
                order. Your bag does not reserve stock.
              </p>
            </div>
            <form className="checkout-form panel" onSubmit={checkout}>
              <h2>Make it yours.</h2>
              <p>Where should your order go?</p>
              <Field label="Full name">
                <input
                  name="name"
                  defaultValue={user?.name}
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                />
              </Field>
              <Field label="Phone number">
                <input
                  name="phone"
                  type="tel"
                  defaultValue={user?.phone}
                  autoComplete="tel"
                  required
                  minLength={7}
                  maxLength={30}
                  placeholder="09…"
                />
              </Field>
              <Field label="Complete delivery address">
                <textarea
                  name="address"
                  autoComplete="street-address"
                  required
                  minLength={10}
                  maxLength={500}
                  rows={3}
                  placeholder="House/unit, street, barangay, city, province & postal code"
                />
              </Field>
              <div className="payment-choice">
                <span className="radio-dot" />
                <div>
                  <strong>Cash on delivery</strong>
                  <p>Pay when your order arrives.</p>
                </div>
              </div>
              <div className="order-totals">
                <p>
                  <span>Subtotal</span>
                  <span>{money(subtotal)}</span>
                </p>
                <p>
                  <span>Delivery</span>
                  <span>{shipping ? money(shipping) : "On us"}</span>
                </p>
                <p className="grand-total">
                  <strong>Total</strong>
                  <strong>{money(subtotal + shipping)}</strong>
                </p>
              </div>
              {formError && (
                <p className="form-error" role="alert">
                  {formError}
                </p>
              )}
              <button
                className="btn primary full"
                disabled={
                  busy || cart.some((i) => !i.active || i.quantity > i.stock)
                }
              >
                {busy ? "Placing your order…" : "Place order"}
                <ArrowRight size={17} />
              </button>
              <small className="checkout-disclaimer">
                Demo project. No online payment is collected. Courier
                fulfillment is recorded manually.
              </small>
            </form>
          </div>
        )}
      </div>
    </ShopShell>
  );
}
export function MyOrdersPage() {
  const { data: orders, error } = useData<Order[]>("/orders"),
    [params, setParams] = useSearchParams(),
    selected = params.get("order"),
    location = useLocation();
  return (
    <ShopShell>
      <div className="shop-page-content">
        <div className="shop-page-heading">
          <h1>Your orders, all here.</h1>
          <p>From the first click to the final delivery.</p>
        </div>
        {location.state?.placed && (
          <div className="success-banner" role="status">
            <CheckCircle2 size={24} />
            <div>
              <strong>Your order is in. Thank you!</strong>
              <p>You can follow its progress right here.</p>
            </div>
          </div>
        )}
        <div className="panel">
          {error ? (
            <ErrorState message={error} />
          ) : !orders ? (
            <Loading />
          ) : (
            <OrderTable
              orders={orders}
              onSelect={(id) => setParams({ order: id })}
            />
          )}
        </div>
        <p className="form-hint">
          You can cancel a pending order from its details. Need a delivery
          update? Check the tracking number recorded by the store.
        </p>
        <Link className="text-link" to="/shop">
          Find something else you love
          <ArrowRight size={17} />
        </Link>
      </div>
      {selected && <OrderPanel id={selected} onClose={() => setParams({})} />}
    </ShopShell>
  );
}
