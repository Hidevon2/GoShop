import React, { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  Outlet,
  NavLink,
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  BarChart3,
  Layers,
  Settings,
  LogOut,
  ArrowUpRight,
  Search,
  Menu,
  X,
  ChevronDown,
  Store,
  ReceiptText,
  ShieldCheck,
  ArrowRight,
  RefreshCw,
  Boxes,
} from "lucide-react";
import {
  api,
  mutate,
  useAuth,
  useData,
  AuthContext,
  ConfigContext,
  ToastProvider,
  Brand,
  Loading,
  useSignOut,
  Field,
  type User,
  type Config,
} from "./lib";
import {
  DashboardPage,
  ProductsPage,
  InventoryPage,
  OrdersPage,
  CustomersPage,
  ReportsPage,
  IntegrationsPage,
  AuditPage,
  SettingsPage,
  PosPage,
} from "./workspace";
import { ShopPage, CartPage, MyOrdersPage } from "./shop";
import "./styles.css";
import "./dashboard-theme.css";

function AuthProvider() {
  const [user, setUser] = useState<User | null>(null),
    [ready, setReady] = useState(false);
  const { data: config } = useData<Config>("/config", false);
  useEffect(() => {
    api<User>("/auth/me")
      .then(setUser)
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  return (
    <AuthContext.Provider value={{ user, ready, setUser }}>
      <ConfigContext.Provider
        value={
          config || {
            storeName: "GoShop",
            shippingCents: 9900,
            freeShippingCents: 150000,
            currency: "PHP",
            database: "",
            demo: false,
          }
        }
      >
        <Outlet />
      </ConfigContext.Provider>
    </AuthContext.Provider>
  );
}
function Protected({ staff = false }: { staff?: boolean }) {
  const { user, ready } = useAuth();
  const location = useLocation();
  if (!ready) return <Loading />;
  if (!user)
    return (
      <Navigate
        to={`/login?next=${encodeURIComponent(location.pathname)}`}
        replace
      />
    );
  if (staff && user.role === "customer") return <Navigate to="/shop" replace />;
  return <Outlet />;
}
const nav = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "Products", path: "/products", icon: Package },
  { label: "Inventory", path: "/inventory", icon: Boxes },
  { label: "Orders", path: "/orders", icon: ShoppingBag },
  { label: "Customers", path: "/customers", icon: Users },
  { label: "Point of sale", path: "/pos", icon: ReceiptText },
];
const manage = [
  { label: "Sales reports", path: "/reports", icon: BarChart3 },
  { label: "Integrations", path: "/integrations", icon: Layers },
  { label: "Audit trail", path: "/audit", icon: ShieldCheck },
  { label: "Settings", path: "/settings", icon: Settings },
];
function WorkspaceLayout() {
  const { user } = useAuth(),
    [mobile, setMobile] = useState(false),
    [account, setAccount] = useState(false),
    [search, setSearch] = useState("");
  const location = useLocation(),
    navigate = useNavigate(),
    { signOut, signingOut } = useSignOut();
  const current =
    [...nav, ...manage].find((x) => x.path === location.pathname)?.label ||
    "Workspace";
  useEffect(() => {
    setMobile(false);
    setAccount(false);
  }, [location.pathname]);
  useEffect(() => {
    if (!mobile) return;
    const sidebar = document.getElementById("workspace-navigation");
    const previous = document.activeElement as HTMLElement | null;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () =>
      Array.from(
        sidebar?.querySelectorAll<HTMLElement>(
          "a[href],button:not(:disabled)",
        ) || [],
      );
    focusable()[0]?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobile(false);
      if (event.key === "Tab") {
        const items = focusable(),
          first = items[0],
          last = items.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [mobile]);
  return (
    <div className="workspace">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      {mobile && (
        <button
          className="nav-scrim"
          onClick={() => setMobile(false)}
          aria-label="Close navigation"
        />
      )}
      <aside
        id="workspace-navigation"
        className={`sidebar ${mobile ? "open" : ""}`}
        role={mobile ? "dialog" : undefined}
        aria-modal={mobile ? true : undefined}
        aria-label="Workspace navigation"
      >
        <Link to="/dashboard" className="brand-link">
          <Brand />
        </Link>
        <p className="sidebar-tagline">POINT OF SALE & MANAGEMENT</p>
        <nav aria-label="Main navigation">
          <p className="nav-label">WORKSPACE</p>
          {nav.map((item) => (
            <NavLink key={item.path} to={item.path}>
              <item.icon size={19} />
              {item.label}
              {item.path === "/pos" && <span className="new-label">POS</span>}
            </NavLink>
          ))}
          <p className="nav-label manage-label">MANAGEMENT</p>
          {manage
            .filter(
              (item) =>
                user?.role === "admin" ||
                !["/audit", "/settings"].includes(item.path),
            )
            .map((item) => (
              <NavLink key={item.path} to={item.path}>
                <item.icon size={19} />
                {item.label}
              </NavLink>
            ))}
        </nav>
        <div className="sidebar-bottom">
          <span className="role-label">{user?.role === "admin" ? "Administrator" : "Staff"}</span>
          <Link to="/shop" className="catalog-link">
            <Store size={17} /> Product catalog <ArrowUpRight size={15} />
          </Link>
          <div className="version">
            GoShop v1.0 <span>Final project</span>
          </div>
        </div>
      </aside>
      <div className="workspace-main">
        <header className="topbar">
          <div className="breadcrumb">
            <button
              className="icon-button mobile-menu"
              onClick={() => setMobile(!mobile)}
              aria-label="Open navigation"
              aria-controls="workspace-navigation"
              aria-expanded={mobile}
            >
              {mobile ? <X /> : <Menu />}
            </button>
            <span>GoShop</span>
            <span className="slash">/</span>
            <strong>{current}</strong>
          </div>
          <div className="topbar-actions">
            <form
              className="global-search"
              onSubmit={(e) => {
                e.preventDefault();
                navigate(`/products?q=${encodeURIComponent(search)}`);
              }}
            >
              <Search size={16} />
              <input
                aria-label="Search products"
                placeholder="Search products…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <kbd>↵</kbd>
            </form>
            <div className="topbar-divider" />
            <button
              className="account-button"
              onClick={() => setAccount(!account)}
              aria-expanded={account}
              aria-label="Account menu"
            >
              <span className="avatar">
                {user?.name
                  .split(" ")
                  .map((x) => x[0])
                  .join("")
                  .slice(0, 2)}
              </span>
              <ChevronDown size={14} />
            </button>
            <button type="button" className="topbar-signout icon-button"
              onClick={signOut} disabled={signingOut} aria-busy={signingOut}
              aria-label={signingOut ? "Signing out…" : "Sign out"} title="Sign out">
              <LogOut size={20} />
            </button>
            {account && (
              <div className="account-popover">
                <strong>{user?.name}</strong>
                <small>{user?.email}</small>
                <span className="role-label">{user?.role}</span>
                <button
                  type="button"
                  onClick={signOut}
                  disabled={signingOut}
                  aria-busy={signingOut}
                >
                  <LogOut size={16} />
                  {signingOut ? "Signing out…" : "Sign out"}
                </button>
              </div>
            )}
          </div>
        </header>
        <main id="main" className="content">
          <Outlet />
        </main>
        <footer className="workspace-footer">
          <span>GoShop — a little more connected.</span>
          <span>
            <span className="sync-dot" />
            Data refreshes every 15 seconds
          </span>
        </footer>
      </div>
    </div>
  );
}
function LoginPage() {
  const location = useLocation(),
    navigate = useNavigate(),
    { user, ready, setUser } = useAuth(),
    { data: config } = useData<Config>("/config", false);
  const register = location.pathname === "/register";
  const [name, setName] = useState(""),
    [email, setEmail] = useState(""),
    [password, setPassword] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const next = new URLSearchParams(location.search).get("next");
  const safeNext =
    next?.startsWith("/") && !next.startsWith("//") ? next : null;
  useEffect(() => {
    if (ready && user)
      navigate(
        safeNext || (user.role === "customer" ? "/shop" : "/dashboard"),
        { replace: true },
      );
  }, [user, ready, navigate, safeNext]);
  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = await mutate<User>(
        register ? "/auth/register" : "/auth/login",
        "POST",
        { name, email, password },
      );
      setUser(result);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="auth-page">
      <section className="auth-form-section">
        <div className="auth-form-wrap">
          <Link to="/" className="auth-brand" aria-label="GoShop home"><Brand /></Link>
          <span className="auth-caption">POINT OF SALE & MANAGEMENT</span>
          <h1>{register ? "Create your account" : "Welcome to GoShop"}</h1>
          <p>
            {register
              ? "Create your GoShop customer account."
              : "Sign in to manage your store or continue shopping."}
          </p>
          <form onSubmit={submit}>
            {register && (
              <Field label="Full name">
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                  minLength={2}
                  maxLength={100}
                />
              </Field>
            )}
            <Field label="Email address">
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                required
              />
            </Field>
            <Field
              label="Password"
              hint={register ? "Use at least 10 characters." : undefined}
            >
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete={register ? "new-password" : "current-password"}
                required
                minLength={register ? 10 : 1}
                maxLength={100}
              />
            </Field>
            {error && (
              <p className="form-error" role="alert">
                {error}
              </p>
            )}
            <button className="btn primary full" disabled={busy}>
              {busy ? <RefreshCw className="spin" size={17} /> : null}
              {register ? "Create account" : "Sign in"}
              <ArrowRight size={17} />
            </button>
          </form>
          <p className="auth-alternative">
            {register ? "Already have an account?" : "New to GoShop?"}{" "}
            <Link
              to={`${register ? "/login" : "/register"}${safeNext ? `?next=${encodeURIComponent(safeNext)}` : ""}`}
            >
              {register ? "Sign in" : "Create an account"}
            </Link>
          </p>
          {config?.demo && !register && (
            <div className="demo-access">
              <strong>Take a look around</strong>
              <p>This workspace contains synthetic demo data.</p>
              <div className="demo-buttons">
                {["Admin", "Staff", "Customer"].map((role) => (
                  <button
                    key={role}
                    onClick={() => {
                      setEmail(`${role.toLowerCase()}@goshop.local`);
                      setPassword("GoShopDemo!2026");
                      setError("");
                    }}
                  >
                    {role}
                    <ArrowUpRight size={13} />
                  </button>
                ))}
              </div>
              <small>
                Select a role to fill the demo credentials, then sign in.
              </small>
            </div>
          )}
        </div>
        <span className="auth-copyright">
          © {new Date().getFullYear()} GoShop · Final project
        </span>
      </section>
    </div>
  );
}
function Home() {
  const { user, ready } = useAuth();
  if (!ready) return <Loading />;
  return (
    <Navigate
      to={!user ? "/login" : user.role === "customer" ? "/shop" : "/dashboard"}
      replace
    />
  );
}
function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <Routes>
          <Route element={<AuthProvider />}>
            <Route index element={<Home />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<LoginPage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route element={<Protected />}>
              <Route path="/cart" element={<CartPage />} />
              <Route path="/my-orders" element={<MyOrdersPage />} />
            </Route>
            <Route element={<Protected staff />}>
              <Route element={<WorkspaceLayout />}>
                <Route path="/dashboard" element={<DashboardPage />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/inventory" element={<InventoryPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/pos" element={<PosPage />} />
                <Route path="/reports" element={<ReportsPage />} />
                <Route path="/integrations" element={<IntegrationsPage />} />
                <Route path="/audit" element={<AuditPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>
            <Route
              path="*"
              element={
                <div className="not-found">
                  <Brand />
                  <h1>We couldn’t find that page.</h1>
                  <p>The link may have changed.</p>
                  <Link className="btn primary" to="/">
                    Back to GoShop
                    <ArrowRight size={17} />
                  </Link>
                </div>
              }
            />
          </Route>
        </Routes>
      </ToastProvider>
    </BrowserRouter>
  );
}
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
