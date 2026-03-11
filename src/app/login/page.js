"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authAPI } from "@/lib/api";
import { Home } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [form,setForm] = useState({ email:"", password:"" });
  const [loading,setLoading] = useState(false);
  const [error,setError] = useState("");

  async function handleSubmit(e){
    e.preventDefault();
    setLoading(true);
    setError("");

    try{
      const data = await authAPI.login(form);
      localStorage.setItem("token",data.token);
      localStorage.setItem("user",JSON.stringify(data.user));
      router.push("/dashboard");
    }catch(err){
      setError(err.message);
    }finally{
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex" style={{ background:"#FAF7F4" }}>

      {/* LEFT PANEL */}
      <div
        className="hidden lg:flex lg:w-1/2 flex-col justify-between p-14 relative overflow-hidden"
        style={{ background:"linear-gradient(135deg,#2C1A0E,#3D2410)" }}
      >

        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full opacity-10"
          style={{ background:"radial-gradient(circle,#C8974A,transparent)" }}
        />

        <div className="absolute -bottom-16 -left-16 w-72 h-72 rounded-full opacity-10"
          style={{ background:"radial-gradient(circle,#C8974A,transparent)" }}
        />

        <div className="flex items-center gap-3 relative z-10">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background:"linear-gradient(135deg,#C8974A,#D4A85A)" }}
          >
            <Home size={18} color="#2C1A0E"/>
          </div>

          <span className="text-[#FAF7F4] text-xl font-semibold font-display">
            DesignCRM
          </span>
        </div>

        <div className="relative z-10">
          <h1 className="text-5xl font-bold text-[#FAF7F4] leading-tight font-display mb-5">
            Transform spaces,<br/>
            <span style={{ color:"#C8974A" }}>manage with</span><br/>
            precision.
          </h1>

          <p className="text-[#C4A882] text-lg leading-relaxed">
            All-in-one CRM for interior design teams.
          </p>
        </div>

        <div className="flex gap-10 relative z-10">
          {[["500+","Projects"],["98%","Satisfaction"],["4x","Faster Flow"]].map(([v,l]) => (
            <div key={l}>
              <p className="text-2xl font-bold font-display" style={{ color:"#C8974A" }}>{v}</p>
              <p className="text-[#C4A882] text-sm">{l}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex items-center justify-center p-8" style={{ background:"#FAF7F4" }}>
        <div className="w-full max-w-md">

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#2C1A0E] font-display mb-1">
              Welcome back
            </h2>
            <p className="text-[#8B6A50] text-sm">
              Sign in to your workspace
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div className="text-sm px-4 py-3 rounded-xl"
                style={{
                  background:"#fff5f5",
                  border:"1px solid #fecaca",
                  color:"#b91c1c"
                }}>
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#2C1A0E] mb-1.5">
                Email
              </label>

              <input
                type="email"
                required
                value={form.email}
                onChange={e=>setForm({...form,email:e.target.value})}
                placeholder="admin@designcrm.com"
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{
                  border:"1px solid #E6D6C6",
                  background:"#ffffff",
                  color:"#2C1A0E"
                }}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#2C1A0E] mb-1.5">
                Password
              </label>

              <input
                type="password"
                required
                value={form.password}
                onChange={e=>setForm({...form,password:e.target.value})}
                placeholder="••••••••"
                className="w-full px-4 py-3 rounded-xl text-sm"
                style={{
                  border:"1px solid #E6D6C6",
                  background:"#ffffff",
                  color:"#2C1A0E"
                }}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-[0.98]"
              style={{
                background:"linear-gradient(135deg,#C8974A,#D4A85A)",
                color:"#2C1A0E"
              }}
            >
              {loading ? "Signing in..." : "Sign in →"}
            </button>

          </form>

          {/* ADMIN CREDENTIALS */}
          <div
            className="mt-6 p-4 rounded-xl"
            style={{
              background:"#FFF8F1",
              border:"1px solid #EAD6B8"
            }}
          >
            <p className="text-xs font-semibold mb-1" style={{ color:"#8B6A50" }}>
              🔑 Default Super Admin Login
            </p>

            <p className="text-xs" style={{ color:"#8B6A50" }}>
              Email: admin@designcrm.com
            </p>

            <p className="text-xs" style={{ color:"#8B6A50" }}>
              Password: Admin@123
            </p>
          </div>

        </div>
      </div>

    </div>
  );
}