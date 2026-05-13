import { useState, useEffect, useCallback } from "react";
import { trackEvent } from "@/lib/meta-pixel";
import { useNavigate, useSearchParams, Link, Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth-context";
import { useProperty } from "@/lib/property-context";
import logoIcon from "@/assets/logo-icon.png";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;
const OTP_RESEND_COOLDOWN = 60;

export default function AuthPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { properties, loading: propLoading } = useProperty();
  const [searchParams] = useSearchParams();

  const [isLogin, setIsLogin] = useState(
    !searchParams.get("tab") || searchParams.get("tab") !== "register"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nama, setNama] = useState("");
  const [noHp, setNoHp] = useState("");
  const [formLoading, setFormLoading] = useState(false);

  // OTP state
  const [step, setStep] = useState<"credentials" | "otp">("credentials");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  const isOtpVerified = (userId: string) =>
    sessionStorage.getItem("otp_verified") === userId;

  // Jika ada sesi aktif tapi OTP belum diverifikasi → langsung ke step OTP
  useEffect(() => {
    if (!authLoading && user && !isOtpVerified(user.id)) {
      setStep("otp");
    }
  }, [authLoading, user]);

  // Kirim OTP otomatis ketika step berubah ke 'otp'
  const handleSendOtp = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    setFormLoading(true);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: SUPABASE_ANON_KEY,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim OTP");
      setOtpSent(true);
      setResendCooldown(OTP_RESEND_COOLDOWN);
      toast.success("Kode OTP dikirim ke email Anda");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Gagal mengirim OTP");
    } finally {
      setFormLoading(false);
    }
  }, []);

  useEffect(() => {
    if (step === "otp" && user && !otpSent) {
      handleSendOtp();
    }
  }, [step, user, otpSent, handleSendOtp]);

  // Timer cooldown kirim ulang OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [resendCooldown]);

  // === Early Returns ===

  if (authLoading || propLoading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#ffffff",
        }}
      >
        <div
          style={{
            width: "2rem",
            height: "2rem",
            border: "2px solid #0d9488",
            borderTopColor: "transparent",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
          }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  // Redirect user yang sudah auth + OTP verified
  if (user && isOtpVerified(user.id)) {
    return (
      <Navigate
        to={properties.length > 0 ? "/beranda" : "/onboarding"}
        replace
      />
    );
  }

  // === Handlers ===

  const handleLogin = async () => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      toast.error(error.message);
      return false;
    }
    return !!data.session;
  };

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      toast.error("Kata sandi dan konfirmasi tidak cocok");
      return false;
    }
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { nama, no_hp: noHp } },
    });
    if (error) {
      toast.error(error.message);
      return false;
    }
    trackEvent("CompleteRegistration");
    toast.success("Akun berhasil dibuat! Silakan cek email untuk verifikasi.");
    return false; // signup tidak langsung ke OTP, user perlu verifikasi email dulu
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);

    if (isLogin) {
      const ok = await handleLogin();
      if (ok) setStep("otp");
    } else {
      await handleSignup();
    }

    setFormLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpCode.length !== 6) {
      toast.error("Masukkan 6 digit kode OTP");
      return;
    }

    setFormLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sesi tidak ditemukan");

      const res = await fetch(`${SUPABASE_URL}/functions/v1/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
          apikey: SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({ code: otpCode }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verifikasi gagal");

      // Tandai OTP verified di session storage
      sessionStorage.setItem("otp_verified", session.user.id);
      navigate(properties.length > 0 ? "/beranda" : "/onboarding", {
        replace: true,
      });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Kode OTP tidak valid");
    } finally {
      setFormLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setOtpSent(false);
    await handleSendOtp();
  };

  const handleCancelOtp = async () => {
    await supabase.auth.signOut();
    setStep("credentials");
    setOtpCode("");
    setOtpSent(false);
  };

  // === Render ===

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm"
      >
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-4 overflow-hidden">
            <img
              src={logoIcon}
              alt="KosPintar"
              width={80}
              height={80}
              className="w-full h-full object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-foreground">KosPintar</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola kos-kosan lebih mudah
          </p>
        </div>

        <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
          <AnimatePresence mode="wait">
            {step === "otp" ? (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <ShieldCheck size={20} className="text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">
                      Verifikasi Login
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Kode OTP dikirim ke{" "}
                      <span className="font-medium text-foreground">
                        {email || user?.email}
                      </span>
                    </p>
                  </div>
                </div>

                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="otp">Kode OTP (6 digit)</Label>
                    <Input
                      id="otp"
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={otpCode}
                      onChange={(e) =>
                        setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 6))
                      }
                      placeholder="123456"
                      className="text-center text-2xl font-mono tracking-widest"
                      required
                      autoFocus
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={formLoading || otpCode.length !== 6}
                  >
                    {formLoading ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Memverifikasi...
                      </>
                    ) : (
                      "Verifikasi"
                    )}
                  </Button>
                </form>

                <div className="mt-3 flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    className="w-full text-sm"
                    onClick={handleResendOtp}
                    disabled={resendCooldown > 0 || formLoading}
                  >
                    {resendCooldown > 0
                      ? `Kirim ulang dalam ${resendCooldown}s`
                      : "Kirim ulang kode"}
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full text-sm text-muted-foreground"
                    onClick={handleCancelOtp}
                    disabled={formLoading}
                  >
                    Batal, kembali ke login
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="credentials"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="flex gap-2 mb-6 bg-muted rounded-lg p-1">
                  <button
                    onClick={() => setIsLogin(true)}
                    className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
                      isLogin
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground"
                    }`}
                  >
                    Masuk
                  </button>
                  <button
                    onClick={() => setIsLogin(false)}
                    className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
                      !isLogin
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground"
                    }`}
                  >
                    Daftar
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="nama">Nama Lengkap</Label>
                      <Input
                        id="nama"
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                        placeholder="Nama Anda"
                        required
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@contoh.com"
                      required
                    />
                  </div>
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="noHp">No. HP</Label>
                      <Input
                        id="noHp"
                        value={noHp}
                        onChange={(e) => setNoHp(e.target.value)}
                        placeholder="08123456789"
                        required
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="password">Kata Sandi</Label>
                      {isLogin && (
                        <Link
                          to="/lupa-sandi"
                          className="text-xs text-primary hover:underline"
                        >
                          Lupa kata sandi?
                        </Link>
                      )}
                    </div>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 6 karakter"
                      required
                      minLength={6}
                    />
                  </div>
                  {!isLogin && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">
                        Konfirmasi Kata Sandi
                      </Label>
                      <Input
                        id="confirmPassword"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Ulangi kata sandi"
                        required
                        minLength={6}
                      />
                    </div>
                  )}
                  <Button type="submit" className="w-full" disabled={formLoading}>
                    {formLoading ? (
                      <>
                        <Loader2 size={16} className="mr-2 animate-spin" />
                        Memproses...
                      </>
                    ) : isLogin ? (
                      "Masuk"
                    ) : (
                      "Daftar"
                    )}
                  </Button>
                </form>

                {isLogin && (
                  <Button
                    variant="outline"
                    className="w-full mt-3"
                    onClick={() =>
                      window.open(
                        "https://wa.me/628184776220?text=Halo%2C%20saya%20tertarik%20ingin%20mencoba%20demo%20KosPintar%20%F0%9F%8F%A0",
                        "_blank"
                      )
                    }
                  >
                    Coba Demo
                  </Button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
