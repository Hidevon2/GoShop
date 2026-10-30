import { useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  ArrowUpRight,
  ArrowRight,
  Plus,
  Download,
  Search,
  SlidersHorizontal,
  ShoppingBag,
  Package,
  Users,
  ReceiptText,
  ChevronRight,
  ArrowDownLeft,
  ArrowUpLeft,
  MoreHorizontal,
  Grid2X2,
  List,
  Check,
  RefreshCw,
  Upload,
  ShieldCheck,
  Database,
  FileSpreadsheet,
  Store,
  Link2,
  AlertTriangle,
  Minus,
  X,
  ExternalLink,
  Save,
  Truck,
  CheckCircle2,
} from "lucide-react";
import {
  useData,
  mutate,
  api,
  refresh,
  useAuth,
  useConfig,
  useToast,
  money,
  number,
  date,
  dateTime,
  ProductImage,
  Status,
  Loading,
  ErrorState,
  Empty,
  Drawer,
  Field,
  type Product,
  type Order,
  type Dashboard,
  type CartItem,
} from "./lib";

type Category = { id: string; name: string };
function PageHeading({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="page-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <div className="page-actions">{children}</div>
    </div>
  );
}
function Period({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <select
      className="period-select"
      aria-label="Reporting period"
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
    >
      <option value={7}>Last 7 days</option>
      <option value={30}>Last 30 days</option>
      <option value={90}>Last 90 days</option>
    </select>
  );
}
function SearchInput({
  value,
  onChange,
  placeholder = "Search products…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="search-input">
      <Search size={17} />
      <input
        aria-label={placeholder}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          aria-label="Clear search"
          onClick={() => onChange("")}
          type="button"
        >
          <X size={14} />
        </button>
      )}
    </label>
  );
}
function OverviewStats({ data }: { data: Dashboard }) {
  const { summary: s, inventory: i } = data;
  return (
    <div className="stats-strip">
      <div className="stat">
        <div>
          <span>Total sales</span>
          <ShoppingBag size={18} />
        </div>
        <strong>{money(s.sales)}</strong>
        <small>
          <span className="stat-indicator">
            {s.previous_sales
              ? `${Math.round(((Number(s.sales) - Number(s.previous_sales)) / Number(s.previous_sales)) * 100)}%`
              : "—"}
          </span>
          vs. previous {data.days} days
        </small>
      </div>
      <div className="stat">
        <div>
          <span>Total orders</span>
          <ReceiptText size={18} />
        </div>
        <strong>{number(s.orders)}</strong>
        <small>Across online & in-store</small>
      </div>
      <div className="stat">
        <div>
          <span>Active products</span>
          <Package size={18} />
        </div>
        <strong>{number(i.products)}</strong>
        <small>
          <span className="amber-text">{i.low_stock} need attention</span> ·{" "}
          {number(i.units)} units
        </small>
      </div>
      <div className="stat">
        <div>
          <span>Customers</span>
          <Users size={18} />
        </div>
        <strong>{number(data.customers)}</strong>
        <small>Connected customer profiles</small>
      </div>
    </div>
  );
}
function SalesChart({ data }: { data: Dashboard }) {
  const [channel, setChannel] = useState("all");
  const rows = Array.from({ length: data.days }, (_, i) => {
    const day = new Date(
      Date.now() + 8 * 3600000 - (data.days - 1 - i) * 86400000,
    )
      .toISOString()
      .slice(0, 10);
    const record = data.daily.find((row) => row.date === day);
    return {
      date: day,
      Online: Number(record?.online || 0) / 100,
      "In-store": Number(record?.pos || 0) / 100,
    };
  });
  return (
    <div className="panel chart-panel">
      <div className="panel-heading">
        <div>
          <h2>Sales overview</h2>
          <p>A shared view of every channel.</p>
        </div>
        <select
          aria-label="Chart channel"
          value={channel}
          onChange={(e) => setChannel(e.target.value)}
        >
          <option value="all">All channels</option>
          <option value="online">Online store</option>
          <option value="pos">In-store</option>
        </select>
      </div>
      <div className="chart-legend">
        <span>
          <i className="legend-online" />
          Online store
        </span>
        <span>
          <i className="legend-pos" />
          In-store
        </span>
      </div>
      <div className="sales-chart">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart
            data={rows}
            margin={{ top: 12, right: 8, bottom: 0, left: 0 }}
          >
            <defs>
              <linearGradient id="onlineArea" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#9d8bcc" stopOpacity={0.18} />
                <stop offset="100%" stopColor="#9d8bcc" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid
              vertical={false}
              stroke="#eeedf1"
              strokeDasharray="3 4"
            />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#827e8c" }}
              minTickGap={32}
              tickFormatter={(value) =>
                new Date(`${value}T00:00:00+08:00`).toLocaleDateString(
                  "en-PH",
                  { month: "short", day: "numeric", timeZone: "Asia/Manila" },
                )
              }
            />
            <YAxis
              width={53}
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: "#827e8c" }}
              tickFormatter={(value) =>
                value >= 1000 ? `₱${value / 1000}k` : `₱${value}`
              }
            />
            <Tooltip
              contentStyle={{
                border: "1px solid #e8e5ec",
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(value) => money(Number(value) * 100)}
              labelFormatter={(value) => date(`${value}T00:00:00+08:00`)}
            />
            {channel !== "pos" && (
              <Area
                type="monotone"
                dataKey="Online"
                stroke="#8770bd"
                strokeWidth={2.5}
                fill="url(#onlineArea)"
                activeDot={{ r: 4 }}
              />
            )}
            {channel !== "online" && (
              <Area
                type="monotone"
                dataKey="In-store"
                stroke="#b7c69b"
                strokeWidth={2.5}
                fill="transparent"
                strokeDasharray="5 4"
              />
            )}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="chart-footnote">
        Order value includes shipping. Cancelled orders are excluded.
      </div>
    </div>
  );
}
export function DashboardPage() {
  const [days, setDays] = useState(30),
    { data, error } = useData<Dashboard>(`/dashboard?days=${days}`),
    { data: products } = useData<Product[]>("/products"),
    { user } = useAuth();
  const [selected, setSelected] = useState<string | null>(null);
  const low = products?.filter((p) => p.stock <= p.reorder_level) || [];
  if (error) return <ErrorState message={error} />;
  if (!data) return <Loading />;
  return (
    <>
      <PageHeading
        title="Your shop, at a glance."
        description={`Welcome back, ${user?.name.split(" ")[0]}. Here’s what’s happening with your business.`}
      >
        <Link className="btn secondary" to="/shop">
          View storefront
          <ArrowUpRight size={16} />
        </Link>
        <Link className="btn primary" to="/pos">
          <Plus size={17} />
          New sale
        </Link>
      </PageHeading>
      <div className="section-line">
        <div className="section-tabs">
          <span className="active">Business overview</span>
          <span className="live-label">
            <i />
            Live workspace
          </span>
        </div>
        <Period value={days} onChange={setDays} />
      </div>
      <OverviewStats data={data} />
      <div className="dashboard-middle">
        <SalesChart data={data} />
        <div className="stock-docket">
          <div className="stock-docket-top">
            <span className="stock-symbol">
              <Package size={22} />
            </span>
            <Link to="/inventory" aria-label="Open inventory">
              <ArrowUpRight size={21} />
            </Link>
          </div>
          <h2>
            A little stock
            <br />
            check-in.
          </h2>
          <p>
            <strong>{low.length} products</strong> are running low.
            <br />
            Keep your shelves ready.
          </p>
          <div className="stock-shortlist">
            {low.length ? (
              low.slice(0, 3).map((p) => (
                <div key={p.id}>
                  <ProductImage product={p} />
                  <div>
                    <strong>{p.name}</strong>
                    <span>{p.stock} left in stock</span>
                  </div>
                  <span className="low-qty">{p.stock}</span>
                </div>
              ))
            ) : (
              <p>Everything is stocked up.</p>
            )}
          </div>
          <Link className="btn stock-action" to="/inventory">
            Review inventory
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
      <div className="dashboard-bottom">
        <div className="panel">
          <div className="panel-heading">
            <div>
              <h2>Recent orders</h2>
              <p>The latest from your shop.</p>
            </div>
            <Link className="text-link" to="/orders">
              View all
              <ArrowRight size={15} />
            </Link>
          </div>
          <OrderTable orders={data.recent} onSelect={setSelected} compact />
        </div>
        <div className="panel bestsellers">
          <div className="panel-heading">
            <div>
              <h2>Top products</h2>
              <p>Your most-loved picks by sales.</p>
            </div>
            <Link
              className="icon-button"
              to="/reports"
              aria-label="View sales reports"
            >
              <ArrowUpRight size={19} />
            </Link>
          </div>
          {data.topProducts.length ? (
            data.topProducts.map((p, i) => (
              <div className="bestseller-row" key={p.id}>
                <span className="rank">{i + 1}</span>
                <ProductImage product={p} />
                <div>
                  <strong>{p.name}</strong>
                  <span>{p.sold} sold</span>
                </div>
                <b>{money(p.sales)}</b>
              </div>
            ))
          ) : (
            <Empty
              title="Your first bestseller awaits"
              description="Completed checkouts will appear here."
            />
          )}
        </div>
      </div>
      {selected && (
        <OrderPanel id={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
export function OrderTable({
  orders,
  onSelect,
  compact = false,
}: {
  orders: Order[];
  onSelect: (id: string) => void;
  compact?: boolean;
}) {
  return orders.length ? (
    <div className="table-scroll">
      <table className="data-table orders-table">
        <thead>
          <tr>
            <th>Order</th>
            <th>Customer</th>
            {!compact && <th>Date</th>}
            <th>Channel</th>
            <th>Status</th>
            <th className="align-right">Total</th>
            <th>
              <span className="sr-only">Details</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>
                <button
                  className="table-link"
                  onClick={() => onSelect(order.id)}
                >
                  {order.order_number}
                </button>
                <small>
                  {compact
                    ? dateTime(order.created_at)
                    : `${order.item_count || ""} items`}
                </small>
              </td>
              <td>{order.customer_name}</td>
              {!compact && <td>{dateTime(order.created_at)}</td>}
              <td>
                <span className="channel-label">
                  {order.channel === "online" ? (
                    <ShoppingBag size={13} />
                  ) : (
                    <Store size={13} />
                  )}{" "}
                  {order.channel === "online" ? "Online" : "In-store"}
                </span>
              </td>
              <td>
                <Status value={order.status} />
              </td>
              <td className="align-right cell-money">
                {money(order.total_cents)}
              </td>
              <td>
                <button
                  className="icon-button"
                  onClick={() => onSelect(order.id)}
                  aria-label={`View order ${order.order_number}`}
                >
                  <ChevronRight size={16} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  ) : (
    <Empty
      title="No orders here yet"
      description="Orders will appear when a customer checks out or a staff member records a sale."
    />
  );
}
export function ProductsPage() {
  const [params, setParams] = useSearchParams(),
    search = params.get("q") || "",
    [category, setCategory] = useState("all"),
    [view, setView] = useState("list"),
    [editing, setEditing] = useState<Product | null | undefined>(undefined),
    [archived, setArchived] = useState(false);
  const { data: products, error } = useData<Product[]>(
      `/products${archived ? "?archived=true" : ""}`,
    ),
    { data: categories } = useData<Category[]>("/categories");
  const filtered =
    products?.filter(
      (p) =>
        (category === "all" || p.category_id === category) &&
        `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase()),
    ) || [];
  return (
    <>
      <PageHeading
        title="Products"
        description="Good products. All the details in one place."
      >
        <a className="btn secondary" href="/samples/products.csv" download>
          <Download size={16} />
          CSV template
        </a>
        <button className="btn primary" onClick={() => setEditing(null)}>
          <Plus size={17} />
          Add product
        </button>
      </PageHeading>
      <div className="panel">
        <div className="table-toolbar">
          <div className="toolbar-left">
            <SearchInput
              value={search}
              onChange={(value) => setParams(value ? { q: value } : {})}
            />
            <select
              aria-label="Product category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All categories</option>
              {categories?.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
          <div className="toolbar-right">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={archived}
                onChange={(e) => setArchived(e.target.checked)}
              />
              Include archived
            </label>
            <div className="view-switch">
              <button
                aria-label="List view"
                aria-pressed={view === "list"}
                onClick={() => setView("list")}
              >
                <List size={17} />
              </button>
              <button
                aria-label="Grid view"
                aria-pressed={view === "grid"}
                onClick={() => setView("grid")}
              >
                <Grid2X2 size={16} />
              </button>
            </div>
          </div>
        </div>
        {error ? (
          <ErrorState message={error} />
        ) : !products ? (
          <Loading />
        ) : !filtered.length ? (
          <Empty
            title="No products found"
            description="Try another search or add your first product."
          />
        ) : view === "grid" ? (
          <div className="catalog-grid">
            {filtered.map((p) => (
              <button
                key={p.id}
                className="catalog-card"
                onClick={() => setEditing(p)}
              >
                <ProductImage product={p} />
                <span className="product-category">{p.category}</span>
                <strong>{p.name}</strong>
                <span>
                  {money(p.price_cents)}
                  <small>{p.stock} in stock</small>
                </span>
              </button>
            ))}
          </div>
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Category</th>
                  <th>Stock</th>
                  <th className="align-right">Price</th>
                  <th>Status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="product-cell">
                        <ProductImage product={p} />
                        <button
                          className="table-link"
                          onClick={() => setEditing(p)}
                        >
                          {p.name}
                        </button>
                      </div>
                    </td>
                    <td className="muted sku">{p.sku}</td>
                    <td>{p.category}</td>
                    <td>
                      <span
                        className={
                          p.stock <= p.reorder_level ? "amber-text" : ""
                        }
                      >
                        {p.stock} units
                      </span>
                      {p.stock <= p.reorder_level && <small>Low stock</small>}
                    </td>
                    <td className="align-right cell-money">
                      {money(p.price_cents)}
                    </td>
                    <td>
                      <Status value={p.active ? "active" : "archived"} />
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        onClick={() => setEditing(p)}
                        aria-label={`Edit ${p.name}`}
                      >
                        <MoreHorizontal size={19} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="table-footer">
          {filtered.length} products{" "}
          <span>Stock is shared across all sales channels.</span>
        </div>
      </div>
      {editing !== undefined && (
        <ProductForm
          product={editing}
          categories={categories || []}
          onClose={() => setEditing(undefined)}
        />
      )}
    </>
  );
}
function ProductForm({
  product,
  categories,
  onClose,
}: {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    [newCategory, setNewCategory] = useState(""),
    toast = useToast();
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const f = new FormData(e.currentTarget);
    const data = {
      name: String(f.get("name")),
      sku: String(f.get("sku")),
      category_id: String(f.get("category_id")),
      description: String(f.get("description")),
      price_cents: Math.round(Number(f.get("price")) * 100),
      cost_cents: Math.round(Number(f.get("cost")) * 100),
      stock: Number(f.get("stock") || 0),
      reorder_level: Number(f.get("reorder_level")),
      image_url: String(f.get("image_url") || ""),
      color: product?.color || "#eeebf5",
      active: f.get("active") === "on",
    };
    try {
      await mutate(
        product ? `/products/${product.id}` : "/products",
        product ? "PATCH" : "POST",
        data,
      );
      toast(product ? "Product updated." : "Product added to your catalog.");
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Drawer
      title={product ? "Edit product" : "Add a product"}
      onClose={onClose}
    >
      <form onSubmit={submit} className="form-stack">
        {product && (
          <div className="edit-product-intro">
            <ProductImage product={product} />
            <div>
              <strong>{product.name}</strong>
              <p>{product.stock} units in shared inventory</p>
            </div>
          </div>
        )}
        <Field label="Product name">
          <input
            name="name"
            defaultValue={product?.name}
            required
            minLength={2}
            maxLength={140}
          />
        </Field>
        <div className="form-row">
          <Field label="SKU">
            <input
              name="sku"
              defaultValue={product?.sku}
              required
              minLength={3}
              maxLength={40}
              placeholder="GS-NEW-001"
            />
          </Field>
          <Field label="Category">
            <select
              name="category_id"
              defaultValue={product?.category_id || categories[0]?.id}
              required
            >
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
        </div>
        <Field label="Description">
          <textarea
            name="description"
            defaultValue={product?.description}
            rows={3}
            maxLength={2000}
          />
        </Field>
        <div className="form-row">
          <Field label="Selling price (₱)">
            <input
              name="price"
              type="number"
              min="0.01"
              step="0.01"
              defaultValue={product ? product.price_cents / 100 : ""}
              required
            />
          </Field>
          <Field label="Cost price (₱)">
            <input
              name="cost"
              type="number"
              min="0"
              step="0.01"
              defaultValue={(product?.cost_cents || 0) / 100}
              required
            />
          </Field>
        </div>
        <div className="form-row">
          {!product && (
            <Field label="Opening stock">
              <input
                name="stock"
                type="number"
                min="0"
                step="1"
                defaultValue={0}
                required
              />
            </Field>
          )}
          <Field label="Low-stock threshold">
            <input
              name="reorder_level"
              type="number"
              min="0"
              defaultValue={product?.reorder_level ?? 10}
              required
            />
          </Field>
        </div>
        <Field
          label="Image URL"
          hint="Use an HTTPS URL or an existing /products/ image path."
        >
          <input
            name="image_url"
            defaultValue={product?.image_url}
            placeholder="https://…"
          />
        </Field>
        <label className="checkbox-label">
          <input
            type="checkbox"
            name="active"
            defaultChecked={product?.active ?? true}
          />
          Active in the storefront
        </label>
        {product && (
          <p className="form-hint">
            Adjust quantities from Inventory to keep a record of every stock
            change.
          </p>
        )}
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button className="btn primary full" disabled={busy}>
          <Save size={16} />
          {busy ? "Saving…" : "Save product"}
        </button>
      </form>
      <details className="add-category">
        <summary>Need another category?</summary>
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              await mutate("/categories", "POST", { name: newCategory });
              setNewCategory("");
              toast("Category added.");
            } catch (err) {
              toast((err as Error).message, true);
            }
          }}
        >
          <input
            aria-label="New category name"
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            required
            minLength={2}
            maxLength={60}
          />
          <button className="btn secondary">Add category</button>
        </form>
      </details>
    </Drawer>
  );
}
export function InventoryPage() {
  const { data: products, error } = useData<Product[]>("/products"),
    { data: movements } = useData<any[]>("/inventory/movements"),
    [search, setSearch] = useState(""),
    [lowOnly, setLowOnly] = useState(false),
    [selected, setSelected] = useState<Product | null>(null);
  const low = products?.filter((p) => p.stock <= p.reorder_level) || [];
  const filtered =
    products?.filter(
      (p) =>
        (!lowOnly || p.stock <= p.reorder_level) &&
        `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase()),
    ) || [];
  return (
    <>
      <PageHeading
        title="Inventory"
        description="One stock count, from the shelf to the shopping cart."
      >
        <Link className="btn secondary" to="/integrations">
          <Upload size={16} />
          Import stock
        </Link>
      </PageHeading>
      <div className="inventory-summary">
        <div>
          <Package size={22} />
          <span>
            <strong>
              {number(products?.reduce((sum, p) => sum + p.stock, 0) || 0)}
            </strong>
            units on hand
          </span>
        </div>
        <div>
          <AlertTriangle size={22} />
          <span>
            <strong>{low.length}</strong>products need restocking
          </span>
        </div>
        <div>
          <Link2 size={22} />
          <span>
            <strong>One source of truth</strong>Online & in-store inventory
          </span>
        </div>
      </div>
      <div className="panel">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={setSearch} />
          <label className="checkbox-label">
            <input
              type="checkbox"
              checked={lowOnly}
              onChange={(e) => setLowOnly(e.target.checked)}
            />
            Low stock only
          </label>
        </div>
        {error ? (
          <ErrorState message={error} />
        ) : !products ? (
          <Loading />
        ) : !filtered.length ? (
          <Empty
            title="No stock to review"
            description="Change your filters or add products to the catalog."
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>On hand</th>
                  <th>Reorder at</th>
                  <th>Stock status</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <div className="product-cell">
                        <ProductImage product={p} />
                        <strong>{p.name}</strong>
                      </div>
                    </td>
                    <td className="sku muted">{p.sku}</td>
                    <td className="cell-money">{p.stock}</td>
                    <td>{p.reorder_level} units</td>
                    <td>
                      <Status
                        value={
                          !p.stock
                            ? "out_of_stock"
                            : p.stock <= p.reorder_level
                              ? "low_stock"
                              : "in_stock"
                        }
                      />
                    </td>
                    <td className="align-right">
                      <button
                        className="btn small secondary"
                        onClick={() => setSelected(p)}
                      >
                        <Plus size={14} />
                        Adjust stock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      <div className="panel section-spaced">
        <div className="panel-heading">
          <div>
            <h2>Stock movement ledger</h2>
            <p>Every unit in and out, with a reason.</p>
          </div>
          <span className="muted text-small">Latest 200 movements</span>
        </div>
        {movements?.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Product</th>
                  <th>Reason</th>
                  <th>Change</th>
                  <th>Balance</th>
                  <th>Recorded by</th>
                </tr>
              </thead>
              <tbody>
                {movements.map((m) => (
                  <tr key={m.id}>
                    <td className="muted">{dateTime(m.created_at)}</td>
                    <td>{m.product_name}</td>
                    <td>{m.reason}</td>
                    <td className={m.delta > 0 ? "green-text" : "muted"}>
                      {m.delta > 0 ? "+" : ""}
                      {m.delta}
                    </td>
                    <td>{m.balance}</td>
                    <td>{m.actor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No stock movements yet"
            description="Opening balances, sales and adjustments will be recorded here."
          />
        )}
      </div>
      {selected && (
        <StockForm product={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
function StockForm({
  product,
  onClose,
}: {
  product: Product;
  onClose: () => void;
}) {
  const [delta, setDelta] = useState(10),
    [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(""),
    toast = useToast();
  return (
    <Drawer title="Adjust stock" onClose={onClose}>
      <div className="edit-product-intro">
        <ProductImage product={product} />
        <div>
          <strong>{product.name}</strong>
          <p>{product.sku}</p>
        </div>
      </div>
      <form
        className="form-stack"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            await mutate("/inventory/adjust", "POST", {
              productId: product.id,
              delta,
              reason,
            });
            toast("Stock adjusted across all channels.");
            onClose();
          } catch (err) {
            setError((err as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="stock-preview">
          <span>
            Current stock<strong>{product.stock}</strong>
          </span>
          <ArrowRight size={20} />
          <span>
            After adjustment<strong>{product.stock + delta}</strong>
          </span>
        </div>
        <Field
          label="Quantity change"
          hint="Use a positive number to add stock, a negative number to remove it."
        >
          <input
            type="number"
            value={delta}
            onChange={(e) => setDelta(Number(e.target.value))}
            min={-product.stock}
            max={1000000}
            step={1}
            required
          />
        </Field>
        <Field label="Reason for adjustment">
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Supplier delivery received"
            minLength={5}
            maxLength={200}
            required
            rows={3}
          />
        </Field>
        {error && (
          <p className="form-error" role="alert">
            {error}
          </p>
        )}
        <button
          disabled={busy || delta === 0 || product.stock + delta < 0}
          className="btn primary full"
        >
          {busy ? "Updating…" : "Update inventory"}
        </button>
        <p className="form-hint">
          This adjustment is recorded in the stock ledger and audit trail.
        </p>
      </form>
    </Drawer>
  );
}
export function OrdersPage() {
  const { data: orders, error } = useData<Order[]>("/orders"),
    [search, setSearch] = useState(""),
    [status, setStatus] = useState("all"),
    [channel, setChannel] = useState("all"),
    [selected, setSelected] = useState<string | null>(null);
  const filtered =
    orders?.filter(
      (o) =>
        (status === "all" || o.status === status) &&
        (channel === "all" || o.channel === channel) &&
        `${o.order_number} ${o.customer_name}`
          .toLowerCase()
          .includes(search.toLowerCase()),
    ) || [];
  return (
    <>
      <PageHeading
        title="Orders"
        description="From checkout to doorstep. Follow every order."
      >
        <Link className="btn primary" to="/pos">
          <Plus size={17} />
          New sale
        </Link>
      </PageHeading>
      <div className="order-tabs">
        <button
          className={status === "all" ? "active" : ""}
          onClick={() => setStatus("all")}
        >
          All orders <b>{orders?.length || 0}</b>
        </button>
        {["pending", "processing", "shipped", "delivered", "cancelled"].map(
          (s) => (
            <button
              className={status === s ? "active" : ""}
              key={s}
              onClick={() => setStatus(s)}
            >
              {s}
              <b>{orders?.filter((o) => o.status === s).length || 0}</b>
            </button>
          ),
        )}
      </div>
      <div className="panel">
        <div className="table-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search orders or customers…"
          />
          <select
            aria-label="Sales channel"
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
          >
            <option value="all">All channels</option>
            <option value="online">Online store</option>
            <option value="pos">In-store</option>
          </select>
        </div>
        {error ? (
          <ErrorState message={error} />
        ) : !orders ? (
          <Loading />
        ) : (
          <OrderTable orders={filtered} onSelect={setSelected} />
        )}
        <div className="table-footer">
          {filtered.length} orders<span>Showing up to 500 recent orders</span>
        </div>
      </div>
      {selected && (
        <OrderPanel id={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
export function OrderPanel({
  id,
  onClose,
}: {
  id: string;
  onClose: () => void;
}) {
  const { data: order, error } = useData<Order>(`/orders/${id}`),
    { user } = useAuth(),
    [tracking, setTracking] = useState(""),
    [busy, setBusy] = useState(false),
    [confirmCancel, setConfirmCancel] = useState(false),
    toast = useToast();
  const staff = user?.role !== "customer";
  async function change(status: string) {
    setBusy(true);
    try {
      await mutate(`/orders/${id}/status`, "PATCH", {
        status,
        trackingNumber: tracking,
      });
      toast(
        status === "cancelled"
          ? "Order cancelled and stock restored."
          : "Order status updated.",
      );
      setConfirmCancel(false);
    } catch (err) {
      toast((err as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <Drawer title="Order details" onClose={onClose}>
      {error ? (
        <ErrorState message={error} />
      ) : !order ? (
        <Loading />
      ) : (
        <>
          <div className="order-detail-title">
            <div>
              <h3>{order.order_number}</h3>
              <p>{dateTime(order.created_at)}</p>
            </div>
            <Status value={order.status} />
          </div>
          <div className="detail-section">
            <h4>Customer</h4>
            <strong>{order.customer_name}</strong>
            <p>{order.customer_email}</p>
            <p>{order.phone}</p>
            {order.address && <p>{order.address}</p>}
          </div>
          <div className="detail-section">
            <h4>Items</h4>
            {order.items?.map((item) => (
              <div className="order-line" key={item.id}>
                <div>
                  <strong>{item.product_name}</strong>
                  <span>
                    {item.quantity} × {money(item.unit_price_cents)}
                  </span>
                </div>
                <b>{money(item.quantity * item.unit_price_cents)}</b>
              </div>
            ))}
          </div>
          <div className="order-totals">
            <p>
              <span>Subtotal</span>
              <span>{money(order.subtotal_cents)}</span>
            </p>
            <p>
              <span>Shipping</span>
              <span>{money(order.shipping_cents)}</span>
            </p>
            <p className="grand-total">
              <strong>Total</strong>
              <strong>{money(order.total_cents)}</strong>
            </p>
          </div>
          <div className="detail-section">
            <h4>Payment & delivery</h4>
            <p>
              {order.payment_method === "cod"
                ? "Cash on delivery · collection not tracked"
                : "Cash · in-store sale"}
            </p>
            {order.tracking_number && (
              <p className="tracking">
                <Truck size={16} />
                {order.tracking_number}
              </p>
            )}
            <small>
              Courier handoff is recorded manually. No external courier
              connection is configured.
            </small>
          </div>
          <div className="order-actions">
            {staff && order.status === "pending" && (
              <button
                disabled={busy}
                className="btn primary full"
                onClick={() => change("processing")}
              >
                Start processing
                <ArrowRight size={17} />
              </button>
            )}
            {staff && order.status === "processing" && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void change("shipped");
                }}
              >
                <Field label="Tracking number">
                  <input
                    value={tracking}
                    onChange={(e) => setTracking(e.target.value)}
                    required
                    maxLength={100}
                  />
                </Field>
                <button className="btn primary full" disabled={busy}>
                  <Truck size={16} />
                  Mark as shipped
                </button>
              </form>
            )}
            {staff && order.status === "shipped" && (
              <button
                className="btn primary full"
                disabled={busy}
                onClick={() => change("delivered")}
              >
                <CheckCircle2 size={17} />
                Mark as delivered
              </button>
            )}
            {((staff && ["pending", "processing"].includes(order.status)) ||
              (!staff && order.status === "pending")) &&
              (confirmCancel ? (
                <div className="cancel-confirm">
                  <p>Cancel this order? All items will return to inventory.</p>
                  <button
                    className="btn danger"
                    disabled={busy}
                    onClick={() => change("cancelled")}
                  >
                    Yes, cancel order
                  </button>
                  <button
                    className="btn secondary"
                    onClick={() => setConfirmCancel(false)}
                  >
                    Keep order
                  </button>
                </div>
              ) : (
                <button
                  className="btn text-danger full"
                  onClick={() => setConfirmCancel(true)}
                >
                  Cancel order
                </button>
              ))}
          </div>
        </>
      )}
    </Drawer>
  );
}
export function CustomersPage() {
  const { data: customers, error } = useData<any[]>("/customers"),
    [search, setSearch] = useState(""),
    [selected, setSelected] = useState<any>(null),
    { data: orders } = useData<Order[]>(selected ? "/orders" : null);
  const filtered =
    customers?.filter((c) =>
      `${c.name} ${c.email}`.toLowerCase().includes(search.toLowerCase()),
    ) || [];
  return (
    <>
      <PageHeading
        title="Customers"
        description="Put a name to every order. Get to know your regulars."
      />
      <div className="panel">
        <div className="table-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search customers…"
          />
          <span className="muted text-small">
            {customers?.length || 0} customer profiles
          </span>
        </div>
        {error ? (
          <ErrorState message={error} />
        ) : !customers ? (
          <Loading />
        ) : !filtered.length ? (
          <Empty
            title="No customers found"
            description="Customers appear here when they create a storefront account."
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Phone</th>
                  <th>Orders</th>
                  <th>Total order value</th>
                  <th>Last order</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr key={c.id}>
                    <td>
                      <div className="customer-cell">
                        <span className="avatar">
                          {c.name
                            .split(" ")
                            .map((n: string) => n[0])
                            .join("")
                            .slice(0, 2)}
                        </span>
                        <div>
                          <button
                            className="table-link"
                            onClick={() => setSelected(c)}
                          >
                            {c.name}
                          </button>
                          <small>{c.email}</small>
                        </div>
                      </div>
                    </td>
                    <td>{c.phone || "—"}</td>
                    <td>{c.order_count}</td>
                    <td className="cell-money">{money(c.total_spent)}</td>
                    <td>
                      {c.last_order
                        ? date(c.last_order, true)
                        : "No orders yet"}
                    </td>
                    <td>
                      <button
                        className="icon-button"
                        onClick={() => setSelected(c)}
                        aria-label={`View ${c.name}`}
                      >
                        <ChevronRight size={17} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selected && (
        <Drawer title="Customer profile" onClose={() => setSelected(null)}>
          <div className="profile-header">
            <span className="avatar large">{selected.name[0]}</span>
            <h3>{selected.name}</h3>
            <p>{selected.email}</p>
            <p>{selected.phone || "No phone provided"}</p>
          </div>
          <div className="profile-stats">
            <span>
              <strong>{selected.order_count}</strong>orders
            </span>
            <span>
              <strong>{money(selected.total_spent)}</strong>total order value
            </span>
          </div>
          <h4 className="section-spaced">Order history</h4>
          {orders
            ?.filter((o) => o.customer_id === selected.id)
            .map((o) => (
              <div className="customer-order" key={o.id}>
                <div>
                  <strong>{o.order_number}</strong>
                  <span>{date(o.created_at, true)}</span>
                </div>
                <Status value={o.status} />
                <b>{money(o.total_cents)}</b>
              </div>
            ))}
          {orders && !orders.some((o) => o.customer_id === selected.id) && (
            <p className="muted">This customer hasn’t placed an order yet.</p>
          )}
        </Drawer>
      )}
    </>
  );
}
export function ReportsPage() {
  const [days, setDays] = useState(30),
    { data, error } = useData<Dashboard>(`/dashboard?days=${days}`);
  if (error) return <ErrorState message={error} />;
  if (!data) return <Loading />;
  const total = Number(data.summary.sales),
    online = Number(data.summary.online_sales),
    pos = Number(data.summary.pos_sales);
  return (
    <>
      <PageHeading
        title="Sales reports"
        description="The bigger picture, without the spreadsheets."
      >
        <Period value={days} onChange={setDays} />
        <a className="btn primary" href="/api/reports/export">
          <Download size={16} />
          Export all orders
        </a>
      </PageHeading>
      <OverviewStats data={data} />
      <div className="report-grid">
        <SalesChart data={data} />
        <div className="panel channel-report">
          <h2>Where sales happen</h2>
          <p>Order value by sales channel</p>
          <div
            className="channel-stack"
            aria-label={`${Math.round((online / (total || 1)) * 100)} percent online`}
          >
            <div style={{ width: `${(online / (total || 1)) * 100}%` }} />
          </div>
          <div className="channel-report-row">
            <ShoppingBag size={19} />
            <div>
              <strong>Online store</strong>
              <span>{Math.round((online / (total || 1)) * 100)}% of sales</span>
            </div>
            <b>{money(online)}</b>
          </div>
          <div className="channel-report-row">
            <Store size={19} />
            <div>
              <strong>In-store POS</strong>
              <span>{Math.round((pos / (total || 1)) * 100)}% of sales</span>
            </div>
            <b>{money(pos)}</b>
          </div>
          <div className="report-average">
            <span>Average order value</span>
            <strong>{money(total / (data.summary.orders || 1))}</strong>
          </div>
          <p className="form-hint">
            Sales represent booked order value, including delivery fees. COD
            collection and payment settlement are outside this report.
          </p>
        </div>
      </div>
      <div className="panel section-spaced">
        <div className="panel-heading">
          <div>
            <h2>Best-selling products</h2>
            <p>Ranked by product sales, excluding shipping.</p>
          </div>
        </div>
        <div className="table-scroll">
          <table className="data-table">
            <thead>
              <tr>
                <th>Product</th>
                <th>SKU</th>
                <th>Units sold</th>
                <th className="align-right">Product sales</th>
              </tr>
            </thead>
            <tbody>
              {data.topProducts.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="product-cell">
                      <ProductImage product={p} />
                      <strong>{p.name}</strong>
                    </div>
                  </td>
                  <td className="sku muted">{p.sku}</td>
                  <td>{p.sold}</td>
                  <td className="align-right cell-money">{money(p.sales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
export function IntegrationsPage() {
  const { data, error } = useData<any>("/integrations"),
    [csv, setCsv] = useState(""),
    [preview, setPreview] = useState<any>(null),
    [busy, setBusy] = useState(false),
    toast = useToast();
  async function validate() {
    setBusy(true);
    try {
      setPreview(
        await api("/integrations/preview", {
          method: "POST",
          body: JSON.stringify({ csv }),
        }),
      );
    } catch (err) {
      toast((err as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  async function importCsv() {
    setBusy(true);
    try {
      const result = await mutate("/integrations/import", "POST", { csv });
      toast(`${result.imported} products imported. Shared inventory updated.`);
      setPreview(null);
      setCsv("");
    } catch (err) {
      toast((err as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        title="Everything, connected."
        description="Retail data that agrees, wherever the sale happens."
      >
        <a
          className="btn secondary"
          href="https://neon.com/docs/connect/connect-from-any-app"
          target="_blank"
          rel="noreferrer"
        >
          <Database size={16} />
          Neon setup
          <ArrowUpRight size={15} />
        </a>
      </PageHeading>
      {error && <ErrorState message={error} />}
      <div className="integration-map">
        <div className="integration-source">
          <Store size={25} />
          <strong>In-store POS</strong>
          <span>Sales & stock deductions</span>
        </div>
        <span className="map-line" />
        <div className="integration-hub">
          <Database size={26} />
          <strong>GoShop database</strong>
          <span>
            {data?.database === "neon-postgres"
              ? "Connected PostgreSQL"
              : "Local PostgreSQL mode"}
          </span>
          <Status value="connected" />
        </div>
        <span className="map-line" />
        <div className="integration-source">
          <ShoppingBag size={25} />
          <strong>Online storefront</strong>
          <span>Orders & customer records</span>
        </div>
      </div>
      <div className="integration-summary">
        <span>
          <ShieldCheck size={18} />
          <strong>{data?.quality?.checked ?? "—"}</strong> products checked
        </span>
        <span>
          <CheckCircle2 size={18} />
          <strong>{data?.quality?.invalid ?? "—"}</strong> invalid core records
        </span>
        <span>
          <RefreshCw size={17} />
          Transactional stock updates
        </span>
      </div>
      {data?.database !== "neon-postgres" && (
        <div className="info-banner">
          <Database size={22} />
          <div>
            <strong>Your app is running on local PostgreSQL.</strong>
            <p>
              To store data in Neon, create a project, put its connection string
              in your local .env file, then restart GoShop. Local records are
              not automatically transferred.
            </p>
            <a
              href="https://neon.com/docs/connect/connect-from-any-app"
              target="_blank"
              rel="noreferrer"
            >
              Read the setup guide
              <ArrowUpRight size={14} />
            </a>
          </div>
        </div>
      )}
      <div className="panel section-spaced">
        <div className="panel-heading">
          <div>
            <h2>Bring your product data together</h2>
            <p>Validate, standardize and load a product CSV.</p>
          </div>
          <a className="text-link" href="/samples/products.csv" download>
            <Download size={15} />
            Download example
          </a>
        </div>
        <div className="import-content">
          <div className="import-intro">
            <FileSpreadsheet size={30} />
            <h3>A clean import starts here.</h3>
            <p>
              Required columns: sku, name, category, price, stock. Price is in
              pesos; stock is the complete on-hand balance.
            </p>
            <p>
              SKUs are standardized to uppercase. Existing SKUs update the same
              product. Duplicate SKUs and invalid values are rejected.
            </p>
            <label className="btn secondary file-button">
              <Upload size={16} />
              Choose CSV
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 500000) {
                    toast("Choose a CSV smaller than 500 KB.", true);
                    return;
                  }
                  setCsv(await file.text());
                  setPreview(null);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <div className="import-editor">
            <Field
              label="CSV contents"
              hint="Up to 500 rows. Validate before importing."
            >
              <textarea
                value={csv}
                onChange={(e) => {
                  setCsv(e.target.value);
                  setPreview(null);
                }}
                rows={9}
                placeholder={
                  "sku,name,category,price,stock\nGS-NEW-101,Travel organizer,Accessories,449.00,30"
                }
              />
            </Field>
            <div className="import-actions">
              <button
                className="btn secondary"
                disabled={!csv.trim() || busy}
                onClick={validate}
              >
                <ShieldCheck size={16} />
                {busy ? "Working…" : "Validate CSV"}
              </button>
              <button
                className="btn primary"
                disabled={!preview?.valid || busy}
                onClick={importCsv}
              >
                <Upload size={16} />
                Import{" "}
                {preview?.valid
                  ? `${preview.rows.length} products`
                  : "products"}
              </button>
            </div>
          </div>
        </div>
        {preview && (
          <div
            className={`import-result ${preview.valid ? "valid" : "invalid"}`}
            role="status"
          >
            <strong>
              {preview.valid
                ? `${preview.rows.length} rows are ready to import.`
                : `${preview.errors.length} validation issues found.`}
            </strong>
            {preview.valid ? (
              <p>
                Stock balances in this file replace the current balances. Review
                your file before importing.
              </p>
            ) : (
              <ul>
                {preview.errors.slice(0, 20).map((e: any, i: number) => (
                  <li key={i}>
                    {e.row ? `Row ${e.row}: ` : ""}
                    {e.message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
      <div className="panel section-spaced">
        <div className="panel-heading">
          <div>
            <h2>Import history</h2>
            <p>Completed loads into your shared database.</p>
          </div>
        </div>
        {data?.runs?.length ? (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Source</th>
                  <th>Records</th>
                  <th>Status</th>
                  <th>Imported by</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {data.runs.map((run: any) => (
                  <tr key={run.id}>
                    <td>{run.source}</td>
                    <td>{run.records_count}</td>
                    <td>
                      <Status value={run.status} />
                    </td>
                    <td>{run.actor}</td>
                    <td>{dateTime(run.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No imports yet"
            description="Your completed CSV imports will appear here."
          />
        )}
      </div>
    </>
  );
}
export function AuditPage() {
  const { user } = useAuth(),
    { data, error } = useData<any[]>(user?.role === "admin" ? "/audit" : null),
    [search, setSearch] = useState("");
  if (user?.role !== "admin")
    return (
      <Empty
        title="Administrator access required"
        description="Ask your administrator to review the audit trail."
      />
    );
  const filtered =
    data?.filter((row) =>
      `${row.action} ${row.actor} ${row.entity_type}`
        .toLowerCase()
        .includes(search.toLowerCase()),
    ) || [];
  return (
    <>
      <PageHeading
        title="Audit trail"
        description="A clear record of who changed what, and when."
      />
      <div className="panel">
        <div className="table-toolbar">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Search activity…"
          />
          <span className="muted text-small">Latest 200 events</span>
        </div>
        {error ? (
          <ErrorState message={error} />
        ) : !data ? (
          <Loading />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Recorded by</th>
                  <th>Entity</th>
                  <th>Details</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row) => (
                  <tr key={row.id}>
                    <td className="audit-action">
                      {row.action.replaceAll(".", " · ").replaceAll("_", " ")}
                    </td>
                    <td>{row.actor || "System"}</td>
                    <td>
                      {row.entity_type}
                      <small className="audit-id">
                        {row.entity_id.slice(0, 12)}
                      </small>
                    </td>
                    <td className="audit-details">
                      {Object.entries(row.details || {}).map(([key, value]) => (
                        <span key={key}>
                          {key}: {String(value)}
                        </span>
                      ))}
                    </td>
                    <td className="nowrap muted">{dateTime(row.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
export function SettingsPage() {
  const config = useConfig(),
    { user } = useAuth(),
    [busy, setBusy] = useState(false),
    toast = useToast();
  if (user?.role !== "admin")
    return (
      <Empty
        title="Administrator access required"
        description="Store settings are managed by your administrator."
      />
    );
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setBusy(true);
    try {
      await mutate("/settings", "PATCH", {
        storeName: form.get("storeName"),
        currency: "PHP",
        shippingCents: Math.round(Number(form.get("shipping")) * 100),
        freeShippingCents: Math.round(Number(form.get("freeShipping")) * 100),
      });
      toast("Store settings saved.");
    } catch (err) {
      toast((err as Error).message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <PageHeading
        title="Store settings"
        description="Make the everyday details work for your store."
      />
      <div className="settings-layout">
        <div>
          <h2>Store & delivery</h2>
          <p>Your storefront name and online delivery charges.</p>
          <p>
            Currency: Philippine peso (PHP). Cash on delivery is available for
            online orders. In-store checkout records cash sales.
          </p>
        </div>
        <form
          className="panel settings-form"
          onSubmit={save}
          key={
            config.storeName + config.shippingCents + config.freeShippingCents
          }
        >
          <Field label="Store name">
            <input
              name="storeName"
              defaultValue={config.storeName}
              minLength={2}
              maxLength={60}
              required
            />
          </Field>
          <Field label="Delivery fee (₱)">
            <input
              name="shipping"
              type="number"
              min={0}
              max={1000}
              step="0.01"
              defaultValue={config.shippingCents / 100}
              required
            />
          </Field>
          <Field
            label="Free delivery from (₱)"
            hint="Set to 0 to make all deliveries free."
          >
            <input
              name="freeShipping"
              type="number"
              min={0}
              max={100000}
              step="0.01"
              defaultValue={config.freeShippingCents / 100}
              required
            />
          </Field>
          <button disabled={busy} className="btn primary">
            <Save size={16} />
            {busy ? "Saving…" : "Save settings"}
          </button>
        </form>
      </div>
      <div className="settings-layout section-spaced">
        <div>
          <h2>Database connection</h2>
          <p>
            Secrets stay on the server. Connection strings are never exposed to
            the browser.
          </p>
        </div>
        <div className="panel settings-form">
          <div className="database-state">
            <Database size={24} />
            <div>
              <strong>
                {config.database === "neon-postgres"
                  ? "Connected PostgreSQL"
                  : "Local PostgreSQL"}
              </strong>
              <p>
                {config.database === "neon-postgres"
                  ? "Using the configured DATABASE_URL."
                  : "Persistent development data in .data/goshop."}
              </p>
            </div>
            <Status value="connected" />
          </div>
          <a
            className="text-link"
            href="https://neon.com/docs/connect/connect-from-any-app"
            target="_blank"
            rel="noreferrer"
          >
            Neon connection instructions
            <ArrowUpRight size={16} />
          </a>
          <p className="form-hint">
            Demo data and accounts must not be used in a live store. See the
            deployment guide for production setup.
          </p>
        </div>
      </div>
    </>
  );
}
export function PosPage() {
  const { data: products, error } = useData<Product[]>("/products"),
    [search, setSearch] = useState(""),
    [category, setCategory] = useState("all"),
    [bag, setItems] = useState<{ product: Product; quantity: number }[]>([]),
    [name, setName] = useState("Walk-in customer"),
    [key, setKey] = useState(crypto.randomUUID()),
    [busy, setBusy] = useState(false),
    [receipt, setReceipt] = useState<Order | null>(null),
    toast = useToast();
  const items = bag.map((item) => ({
    ...item,
    product: products?.find((p) => p.id === item.product.id) || {
      ...item.product,
      active: false,
    },
  }));
  const categories = [...new Set(products?.map((p) => p.category) || [])];
  const filtered =
    products?.filter(
      (p) =>
        (category === "all" || p.category === category) &&
        `${p.name} ${p.sku}`.toLowerCase().includes(search.toLowerCase()),
    ) || [];
  function add(product: Product) {
    setItems((previous) => {
      const existing = previous.find((i) => i.product.id === product.id);
      if ((existing?.quantity || 0) >= Math.min(product.stock, 99)) {
        toast("Available stock limit reached.", true);
        return previous;
      }
      return existing
        ? previous.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + 1 }
              : i,
          )
        : [...previous, { product, quantity: 1 }];
    });
  }
  function change(id: string, delta: number) {
    setItems((previous) =>
      previous
        .map((i) =>
          i.product.id === id
            ? {
                ...i,
                quantity: Math.min(
                  products?.find((p) => p.id === id)?.stock ?? i.product.stock,
                  99,
                  i.quantity + delta,
                ),
              }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }
  async function checkout() {
    setBusy(true);
    try {
      const order = await mutate<Order>("/checkout", "POST", {
        channel: "pos",
        name,
        idempotencyKey: key,
        expectedTotalCents: total,
        items: items.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
      });
      setReceipt(order);
      setItems([]);
      setKey(crypto.randomUUID());
      toast("Sale recorded. Inventory updated.");
    } catch (err) {
      toast((err as Error).message, true);
      refresh();
    } finally {
      setBusy(false);
    }
  }
  const total = items.reduce(
    (sum, i) => sum + i.quantity * i.product.price_cents,
    0,
  );
  return (
    <>
      <PageHeading
        title="A good day for a new sale."
        description="Ring it up. We’ll keep the inventory in sync."
      >
        <span className="live-label">
          <i />
          In-store checkout
        </span>
      </PageHeading>
      <div className="pos-layout">
        <div className="pos-catalog">
          <div className="pos-search">
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search name or scan a SKU…"
            />
            <select
              aria-label="Category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          {error ? (
            <ErrorState message={error} />
          ) : !products ? (
            <Loading />
          ) : !filtered.length ? (
            <Empty
              title="No matching products"
              description="Try another name or SKU."
            />
          ) : (
            <div className="pos-grid">
              {filtered.map((p) => (
                <button
                  disabled={!p.stock || busy}
                  key={p.id}
                  onClick={() => add(p)}
                  className="pos-product"
                >
                  <ProductImage product={p} />
                  <span>{p.category}</span>
                  <strong>{p.name}</strong>
                  <div>
                    <b>{money(p.price_cents)}</b>
                    <small>
                      {p.stock ? p.stock + " left" : "Out of stock"}
                    </small>
                  </div>
                  <span className="pos-add">
                    <Plus size={16} />
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
        <aside className="pos-cart panel">
          <div className="panel-heading">
            <div>
              <h2>Current sale</h2>
              <p>
                {items.reduce((sum, i) => sum + i.quantity, 0)} items in the bag
              </p>
            </div>
            {items.length > 0 && (
              <button
                className="text-link"
                disabled={busy}
                onClick={() => setItems([])}
              >
                Clear
              </button>
            )}
          </div>
          <Field label="Customer name">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={100}
              minLength={2}
            />
          </Field>
          <div className="pos-cart-lines">
            {items.length ? (
              items.map(({ product, quantity }) => (
                <div className="pos-line" key={product.id}>
                  <ProductImage product={product} />
                  <div>
                    <strong>{product.name}</strong>
                    <span>{money(product.price_cents)}</span>
                    <div className="quantity-control">
                      <button
                        disabled={busy}
                        aria-label={`Remove one ${product.name}`}
                        onClick={() => change(product.id, -1)}
                      >
                        <Minus size={12} />
                      </button>
                      <span>{quantity}</span>
                      <button
                        disabled={
                          busy || quantity >= Math.min(product.stock, 99)
                        }
                        aria-label={`Add one ${product.name}`}
                        onClick={() => change(product.id, 1)}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                  </div>
                  <b>{money(product.price_cents * quantity)}</b>
                </div>
              ))
            ) : (
              <Empty
                title="An empty bag, for now."
                description="Select a product to start the sale."
              />
            )}
          </div>
          <div className="pos-checkout">
            {items.some(
              (i) => !i.product.active || i.quantity > i.product.stock,
            ) && (
              <p className="form-error">
                Stock changed. Remove unavailable items or reduce quantities
                before recording the sale.
              </p>
            )}
            <p>
              <span>Subtotal</span>
              <b>{money(total)}</b>
            </p>
            <p>
              <span>Delivery</span>
              <span>In-store · no fee</span>
            </p>
            <div className="pos-total">
              <strong>Total</strong>
              <strong>{money(total)}</strong>
            </div>
            <button
              className="btn primary full"
              disabled={
                !items.length ||
                busy ||
                name.trim().length < 2 ||
                items.some(
                  (i) => !i.product.active || i.quantity > i.product.stock,
                )
              }
              onClick={checkout}
            >
              <ReceiptText size={18} />
              {busy ? "Recording sale…" : "Record cash sale"}
            </button>
            <small>Confirm cash has been received before recording.</small>
          </div>
        </aside>
      </div>
      {receipt && (
        <Drawer title="Sale complete" onClose={() => setReceipt(null)}>
          <div className="receipt" id="receipt">
            <div className="receipt-check">
              <Check size={30} />
            </div>
            <h2>Thank you. You’re all set.</h2>
            <p>{receipt.order_number}</p>
            <p>{dateTime(receipt.created_at)}</p>
            <div className="detail-section">
              {receipt.items?.map((i) => (
                <div className="order-line" key={i.id}>
                  <span>
                    {i.quantity} × {i.product_name}
                  </span>
                  <b>{money(i.quantity * i.unit_price_cents)}</b>
                </div>
              ))}
            </div>
            <div className="grand-total">
              <strong>Total paid · cash</strong>
              <strong>{money(receipt.total_cents)}</strong>
            </div>
            <p>GoShop · In-store sale</p>
          </div>
          <button
            className="btn primary full section-spaced"
            onClick={() => setReceipt(null)}
          >
            Start another sale
            <ArrowRight size={17} />
          </button>
        </Drawer>
      )}
    </>
  );
}
