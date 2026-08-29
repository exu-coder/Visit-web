const API_BASE = import.meta.env.VITE_API_URL || "";

type ApiResult<T> = { data: T | null; error: Error | null; count?: number };

class QueryBuilder<T = any> implements PromiseLike<ApiResult<T>> {
  private table: string;
  private method = "GET";
  private payload: any = {};
  private filters: Record<string, any> = {};

  constructor(table: string) { this.table = table; }
  select(_columns = "*") { return this; }
  eq(column: string, value: any) { this.filters[column] = value; return this; }
  neq(column: string, value: any) { this.filters[column] = { $ne: value }; return this; }
  order(column: string, options: { ascending?: boolean } = {}) {
    this.payload.sort = { [column]: options.ascending === false ? -1 : 1 }; return this;
  }
  limit(value: number) { this.payload.limit = value; return this; }
  maybeSingle() { this.payload.single = true; return this; }
  insert(data: any) { this.method = "POST"; this.payload.data = Array.isArray(data) ? data[0] : data; return this; }
  update(data: any) { this.method = "PATCH"; this.payload.data = data; return this; }
  delete() { this.method = "DELETE"; return this; }
  then<TResult1 = ApiResult<T>, TResult2 = never>(onfulfilled?: ((value: ApiResult<T>) => TResult1 | PromiseLike<TResult1>) | null, onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null) {
    return this.execute().then(onfulfilled, onrejected);
  }
  private async execute(): Promise<ApiResult<T>> {
    try {
      this.payload.filter = this.filters;
      const response = await fetch(`${API_BASE}/api/data/${encodeURIComponent(this.table)}`, {
        method: this.method,
        headers: { "Content-Type": "application/json" },
        body: this.method === "GET" ? undefined : JSON.stringify(this.payload),
      });
      const result = await response.json();
      if (!response.ok) return { data: null, error: new Error(result.error || "Request failed") };
      let data = result.data;
      if (this.payload.single) data = Array.isArray(data) ? (data[0] || null) : data;
      return { data, error: null, count: result.count };
    } catch (error) {
      return { data: null, error: error instanceof Error ? error : new Error(String(error)) };
    }
  }
}

export const supabase = {
  from: <T = any>(table: string) => new QueryBuilder<T>(table),
  auth: {
    async signUp({ email, password }: { email: string; password: string }) {
      const response = await fetch(`${API_BASE}/api/auth/signup`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const result = await response.json();
      if (result.session?.access_token) localStorage.setItem("visit_access_token", result.session.access_token);
      return { data: result, error: response.ok ? null : new Error(result.error || "Sign up failed") };
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      const response = await fetch(`${API_BASE}/api/auth/signin`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      const result = await response.json();
      if (result.session?.access_token) localStorage.setItem("visit_access_token", result.session.access_token);
      return { data: result, error: response.ok ? null : new Error(result.error || "Sign in failed") };
    },
    async getSession() {
      const token = localStorage.getItem("visit_access_token");
      if (!token) return { data: { session: null }, error: null };
      const response = await fetch(`${API_BASE}/api/auth/session`, { headers: { Authorization: `Bearer ${token}` } });
      if (!response.ok) { localStorage.removeItem("visit_access_token"); return { data: { session: null }, error: null }; }
      const result = await response.json();
      return { data: { session: result.session, user: result.user }, error: null };
    },
    onAuthStateChange(callback: (event: string, session: any) => void) {
      let active = true;
      this.getSession().then(({ data }) => { if (active) callback("INITIAL_SESSION", data.session); });
      return { data: { subscription: { unsubscribe: () => { active = false; } } } };
    },
    async signOut() { localStorage.removeItem("visit_access_token"); return { error: null }; },
  },
};
