import { useState } from "react";
import { supabase } from "./lib/supabase";
import Card from "./components/Card";
import Input from "./components/Input";
import { Button } from "./components/Button";
import Banner from "./components/Banner";

export default function AuthView() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState(null);

  const sendMagicLink = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-4">Sign in</h2>
      <p className="text-sm text-gray-600 mb-4">
        We'll email you a magic link. After signing in, you can create/update your row in <code>public.usuarios</code>.
      </p>
      <form onSubmit={sendMagicLink} className="space-y-3">
        <Input
          label="Email"
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <Button disabled={loading || !email}>
            {loading ? "Sending..." : "Send magic link"}
          </Button>
          {sent && <span className="text-sm text-gray-600">Check your inbox ✨</span>}
        </div>
        {error && <Banner tone="err">{error}</Banner>}
      </form>
    </Card>
  );
}