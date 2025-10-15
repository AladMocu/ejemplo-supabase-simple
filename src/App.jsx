import { useEffect, useMemo, useState } from "react";
import { supabase } from "./lib/supabase";

export default function App() {
  const [items, setItems] = useState([]);
  const [title, setTitle] = useState("");
  const [filter, setFilter] = useState("all"); // all | open | done
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const filtered = useMemo(() => {
    if (filter === "open") return items.filter((i) => !i.done);
    if (filter === "done") return items.filter((i) => i.done);
    return items;
  }, [items, filter]);

  async function load() {
    setLoading(true);
    setErr(null);
    const { data, error } = await supabase
      .from("items")
      .select("id,title,done,created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) setErr(error.message);
    setItems(data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    const channel = supabase
      .channel("public:items")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "items" },
        () => load()
      )
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, []);

  async function addItem(e) {
    e?.preventDefault();
    const name = title.trim();
    if (!name) return;
    const { error } = await supabase.from("items").insert({ title: name });
    if (error) return setErr(error.message);
    setTitle("");
  }

  async function toggleDone(id, done) {
    const { error } = await supabase.from("items").update({ done: !done }).eq("id", id);
    if (error) setErr(error.message);
  }

  async function removeItem(id) {
    const { error } = await supabase.from("items").delete().eq("id", id);
    if (error) setErr(error.message);
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <div className="mx-auto max-w-2xl p-6">
        <header className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold tracking-tight">Supabase No-Auth Demo</h1>
          <button
            onClick={load}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-black disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Loading…" : "Refresh"}
          </button>
        </header>

        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <form onSubmit={addItem} className="flex gap-3">
            <input
              className="flex-1 rounded-xl border border-gray-300 px-3 py-2 text-sm outline-none ring-indigo-500 focus:ring-2"
              placeholder="Add a new item…"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <button
              className="rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-indigo-700"
              type="submit"
            >
              Add
            </button>
          </form>
          {err && (
            <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {err}
            </div>
          )}
        </section>

        <div className="mt-4 flex gap-2">
          {["all", "open", "done"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              disabled={filter === f}
              className={`rounded-xl px-3 py-2 text-sm font-medium shadow-sm
                ${filter === f
                  ? "bg-gray-900 text-white"
                  : "bg-gray-200 text-gray-900 hover:bg-gray-300"
                }`}
            >
              {f[0].toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <section className="mt-4 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <ul className="divide-y divide-gray-100">
            {filtered.map((i) => (
              <li key={i.id} className="grid grid-cols-[28px_1fr_auto] items-center gap-3 px-4 py-3">
                <input
                  type="checkbox"
                  className="size-4 accent-indigo-600"
                  checked={i.done}
                  onChange={() => toggleDone(i.id, i.done)}
                />
                <div>
                  <div className={`text-sm ${i.done ? "line-through text-gray-500" : "font-medium"}`}>
                    {i.title}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(i.created_at).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={() => removeItem(i.id)}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white shadow hover:bg-red-700"
                >
                  Delete
                </button>
              </li>
            ))}
            {filtered.length === 0 && (
              <li className="px-4 py-6 text-center text-sm text-gray-500">No items yet. Add one above.</li>
            )}
          </ul>
        </section>

        <footer className="mt-6 text-center text-xs text-gray-500">
          Uses <code>public.items</code> with RLS disabled. Add Tailwind via PostCSS/Vite config.
        </footer>
      </div>
    </div>
  );
}
