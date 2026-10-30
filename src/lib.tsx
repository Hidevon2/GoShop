import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { AlertCircle, Check, Loader2, Package, X } from "lucide-react";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "staff" | "customer";
  phone: string;
};
export type Product = {
  id: string;
  sku: string;
  name: string;
  description: string;
  category_id: string;
  category: string;
  price_cents: number;
  cost_cents: number;
  stock: number;
  reorder_level: number;
  image_url: string;
  color: string;
  active: boolean;
};
export type CartItem = Product & { quantity: number };
export type Order = {
  id: string;
  order_number: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  phone: string;
  channel: "online" | "pos";
  status: string;
  payment_method: string;
  subtotal_cents: number;
  shipping_cents: number;
  total_cents: number;
  address: string;
  tracking_number: string;
  created_at: string;
  item_count: number;
  items?: {
    id: string;
    product_name: string;
    sku: string;
    quantity: number;
    unit_price_cents: number;
  }[];
};
export type Config = {
  storeName: string;
  shippingCents: number;
  freeShippingCents: number;
  currency: string;
  database: string;
  demo: boolean;
};
export type Dashboard = {
  summary: {
    sales: number;
    orders: number;
    previous_sales: number;
    online_sales: number;
    pos_sales: number;
  };
  inventory: { products: number; units: number; low_stock: number };
  customers: number;
  daily: { date: string; online: number; pos: number }[];
  topProducts: (Product & { sold: number; sales: number })[];
  recent: Order[];
  days: number;
};
export const money = (value: number | string = 0) =>
  new Intl.NumberFormat("en-PH", {
    style: "currency",
    currency: "PHP",
    maximumFractionDigits: 2,
  }).format(Number(value) / 100);
export const number = (value: number | string = 0) =>
  new Intl.NumberFormat("en-PH").format(Number(value));
export const date = (value: string, full = false) =>
  new Date(value).toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    ...(full ? { year: "numeric" as const } : {}),
    timeZone: "Asia/Manila",
  });
export const dateTime = (value: string) =>
  new Date(value).toLocaleString("en-PH", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "Asia/Manila",
  });
export async function api<T = any>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...options,
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...options.headers },
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "The request failed.");
  return data;
}
export async function mutate<T = any>(
  path: string,
  method: string,
  body?: unknown,
): Promise<T> {
  const result = await api<T>(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  refresh();
  return result;
}
export function refresh() {
  window.dispatchEvent(new Event("goshop:refresh"));
}
export function useData<T>(path: string | null, poll = true) {
  const [data, setData] = useState<T | null>(null),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    if (!path) {
      setLoading(false);
      setData(null);
      return;
    }
    setLoading(true);
    setError("");
    const load = () =>
      api<T>(path)
        .then((value) => {
          if (active) {
            setData(value);
            setError("");
          }
        })
        .catch((e) => {
          if (active) setError(e.message);
        })
        .finally(() => {
          if (active) setLoading(false);
        });
    void load();
    window.addEventListener("goshop:refresh", load);
    const timer = poll ? window.setInterval(load, 15000) : undefined;
    return () => {
      active = false;
      window.removeEventListener("goshop:refresh", load);
      if (timer) clearInterval(timer);
    };
  }, [path, poll]);
  return { data, error, loading };
}
export const AuthContext = createContext<{
  user: User | null;
  ready: boolean;
  setUser: (u: User | null) => void;
}>({ user: null, ready: false, setUser: () => {} });
export const useAuth = () => useContext(AuthContext);
export const ConfigContext = createContext<Config>({
  storeName: "GoShop",
  shippingCents: 9900,
  freeShippingCents: 150000,
  currency: "PHP",
  database: "",
  demo: false,
});
export const useConfig = () => useContext(ConfigContext);
const ToastContext = createContext<(message: string, error?: boolean) => void>(
  () => {},
);
export const useToast = () => useContext(ToastContext);
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<{
    message: string;
    error: boolean;
    id: number;
  } | null>(null);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);
  return (
    <ToastContext.Provider
      value={(message, error = false) =>
        setToast({ message, error, id: Date.now() })
      }
    >
      {children}
      {toast && (
        <div
          className={`toast ${toast.error ? "error" : ""}`}
          role={toast.error ? "alert" : "status"}
        >
          {toast.error ? <AlertCircle size={19} /> : <Check size={19} />}
          <span>{toast.message}</span>
          <button
            aria-label="Dismiss notification"
            onClick={() => setToast(null)}
          >
            <X size={16} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}
export function Brand({ small = false }: { small?: boolean }) {
  return (
    <span className={`brand ${small ? "small" : ""}`}>
      <img src="/favicon.svg" alt="" />
      <span>
        GoShop<span className="brand-dot">.</span>
      </span>
    </span>
  );
}
export function ProductImage({
  product,
  className = "",
}: {
  product: Partial<Product>;
  className?: string;
}) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className={`product-image ${className}`}
      style={{ background: product.color || "#eeeaf6" }}
    >
      {product.image_url && !failed ? (
        <img
          src={product.image_url}
          alt={product.name || ""}
          onError={() => setFailed(true)}
          loading="lazy"
        />
      ) : (
        <Package size={28} strokeWidth={1.2} />
      )}
    </div>
  );
}
export function Status({ value }: { value: string }) {
  return (
    <span className={`status status-${value}`}>
      <i />
      {value === "pos"
        ? "In-store"
        : value === "online"
          ? "Online"
          : value.replaceAll("_", " ")}
    </span>
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <Package size={34} strokeWidth={1.3} />
      <h3>{title}</h3>
      <p>{description}</p>
      {action}
    </div>
  );
}
export function Loading() {
  return (
    <div className="loading" role="status">
      <Loader2 size={22} className="spin" />
      <span>Getting your shop ready…</span>
    </div>
  );
}
export function ErrorState({ message }: { message: string }) {
  return (
    <div className="error-state" role="alert">
      <AlertCircle size={22} />
      <div>
        <strong>We couldn’t load this data.</strong>
        <p>{message}</p>
      </div>
      <button className="btn secondary" onClick={refresh}>
        Try again
      </button>
    </div>
  );
}
export function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: ReactNode;
  hint?: string;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {hint && <small>{hint}</small>}
    </label>
  );
}
export function Drawer({
  title,
  children,
  onClose,
  wide = false,
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  wide?: boolean;
}) {
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const old = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const panel = document.querySelector<HTMLElement>("[data-drawer]");
    const getFocusable = () =>
      Array.from(
        panel?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href]",
        ) || [],
      );
    getFocusable()[0]?.focus();
    const handler = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
      if (event.key === "Tab") {
        const elements = getFocusable();
        const first = elements[0],
          last = elements.at(-1);
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last?.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first?.focus();
        }
      }
    };
    document.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = old;
      document.removeEventListener("keydown", handler);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="drawer-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <section
        data-drawer
        className={`drawer ${wide ? "wide" : ""}`}
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <h2>{title}</h2>
          <button
            className="icon-button"
            onClick={onClose}
            aria-label="Close panel"
          >
            <X size={21} />
          </button>
        </header>
        <div className="drawer-body">{children}</div>
      </section>
    </div>
  );
}
