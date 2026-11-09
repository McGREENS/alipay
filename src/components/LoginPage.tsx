import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  KeyRound,
  Mail,
  ArrowRight,
  Loader2,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowLeft,
  ShieldCheck,
  FileText,
  Wallet,
  Lock,
} from 'lucide-react';
import { motion } from 'motion/react';

interface LoginPageProps {
  onLoginSuccess: (session: any) => void;
}

export function LoginPage({ onLoginSuccess }: LoginPageProps) {
  // Modes: 'login' | 'forgot_password' | 'reset_password'
  const [mode, setMode] = useState<'login' | 'forgot_password' | 'reset_password'>('login');

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // New password form state (for reset password flow)
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Helper to extract email and recovery info from URL (hash or query params)
  const checkUrlForRecovery = async () => {
    // 1. Check Query Params (e.g. Supabase PKCE flow ?code=... or ?email=...)
    const searchParams = new URLSearchParams(window.location.search);
    const code = searchParams.get('code');
    const paramEmail = searchParams.get('email');
    if (paramEmail) {
      setResetEmail(decodeURIComponent(paramEmail));
    }

    // If PKCE authorization code is present in query parameters, exchange it
    if (code) {
      setLoading(true);
      try {
        const { data, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
        if (!exchangeErr && data?.session) {
          setMode('reset_password');
          if (data.session.user?.email) {
            setResetEmail(data.session.user.email);
          }
        }
      } catch (err) {
        console.warn("PKCE exchange error:", err);
      } finally {
        setLoading(false);
      }
    }

    // 2. Check Hash Fragment (e.g. #type=recovery&email=... or #access_token=...)
    const hash = window.location.hash;
    if (hash) {
      const cleanHash = hash.replace(/^#/, '');
      const hashParams = new URLSearchParams(cleanHash);
      const hashType = hashParams.get('type');
      const hashEmail = hashParams.get('email');

      if (hashEmail) {
        setResetEmail(decodeURIComponent(hashEmail));
      }

      if (hashType === 'recovery' || hash.includes('type=recovery') || hash.includes('access_token')) {
        setMode('reset_password');
      }
    }
  };

  // Detect recovery mode on mount and listen to auth changes
  useEffect(() => {
    checkUrlForRecovery();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setMode('reset_password');
        if (session?.user?.email) {
          setResetEmail(session.user.email);
        }
      } else if (event === 'SIGNED_IN' && session && mode === 'login') {
        onLoginSuccess(session);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Standard Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        throw signInError;
      }

      if (data.session) {
        onLoginSuccess(data.session);
      } else {
        setError('Session non établie. Veuillez réessayer.');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Identifiants incorrects ou problème de connexion.');
    } finally {
      setLoading(false);
    }
  };

  // Forgot Password Request
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setError("Veuillez renseigner votre adresse email professionnelle.");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin,
      });

      if (resetError) {
        throw resetError;
      }

      setSuccessMessage("Un lien de réinitialisation a été envoyé à votre adresse email. Veuillez vérifier votre boîte de réception.");
    } catch (err: any) {
      console.error('Forgot password error:', err);
      setError(err.message || "Impossible d'envoyer l'email de réinitialisation.");
    } finally {
      setLoading(false);
    }
  };

  // Set New Password (handles both with-session and without-session recovery/direct link)
  const handleSetNewPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError("Veuillez renseigner et confirmer le mot de passe.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Le mot de passe doit comporter au moins 6 caractères.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let isSuccess = false;
      const targetEmail = (resetEmail || email).trim();

      // Step 1: Check if an active Supabase session exists
      const { data: sessionData } = await supabase.auth.getSession();
      const hasActiveSession = !!sessionData?.session;

      if (hasActiveSession) {
        // Active session exists: use standard updateUser
        const { data, error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });

        if (!updateError && data.user) {
          isSuccess = true;
          setSuccessMessage("Votre mot de passe a été mis à jour avec succès ! Connexion en cours...");
          setTimeout(() => {
            window.history.replaceState(null, '', window.location.pathname);
            if (sessionData?.session) {
              onLoginSuccess(sessionData.session);
            } else {
              setMode('login');
            }
          }, 1200);
          return;
        }
      }

      // Step 2: Fallback when Auth session is missing (direct invite link / reset without session)
      if (!targetEmail) {
        setError("Veuillez préciser votre adresse email professionnelle ci-dessous pour valider votre mot de passe.");
        setLoading(false);
        return;
      }

      // Call secure Postgres RPC function to set password directly in auth.users
      const { error: rpcError } = await supabase.rpc('set_user_password_by_email', {
        target_email: targetEmail,
        new_password: newPassword,
      });

      if (rpcError) {
        throw rpcError;
      }

      // Immediately sign in with the new password
      const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: targetEmail,
        password: newPassword,
      });

      if (!signInErr && signInData.session) {
        setSuccessMessage("Mot de passe validé avec succès ! Connexion automatique...");
        setTimeout(() => {
          window.history.replaceState(null, '', window.location.pathname);
          onLoginSuccess(signInData.session);
        }, 1200);
      } else {
        setSuccessMessage("Mot de passe mis à jour avec succès ! Vous pouvez maintenant vous connecter.");
        setTimeout(() => {
          window.history.replaceState(null, '', window.location.pathname);
          setEmail(targetEmail);
          setPassword(newPassword);
          setMode('login');
        }, 1500);
      }
    } catch (err: any) {
      console.error('Set password error:', err);
      // Clean up common error messages
      if (err.message?.includes('Auth session missing')) {
        setError("Session manquante. Veuillez renseigner votre email professionnel ci-dessous pour enregistrer votre mot de passe.");
      } else {
        setError(err.message || "Erreur lors de la mise à jour du mot de passe.");
      }
    } finally {
      setLoading(false);
    }
  };

  // Password strength helper (pure frontend UX feedback)
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
    if (/\d/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    score = Math.min(score, 4);
    const levels = [
      { label: '', color: '' },
      { label: 'Très faible', color: 'bg-red-500' },
      { label: 'Faible', color: 'bg-orange-500' },
      { label: 'Moyen', color: 'bg-yellow-500' },
      { label: 'Solide', color: 'bg-emerald-500' },
    ];
    return { score, label: levels[score].label, color: levels[score].color };
  };

  const passwordStrength = getPasswordStrength(newPassword);
  const passwordsMatch = confirmPassword.length > 0 && newPassword === confirmPassword;
  const passwordsMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword;

  const brandFeatures = [
    { icon: FileText, title: 'Gestion des contrats', desc: 'Création et suivi des contrats de financement en temps réel.' },
    { icon: Wallet, title: 'Suivi des paiements', desc: 'Enregistrement des échéances et calcul automatique des soldes.' },
    { icon: Lock, title: 'Sécurité Knox', desc: 'Verrouillage à distance des terminaux en cas de défaut de paiement.' },
  ];

  const inputClass =
    'w-full bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm pl-11 pr-4 py-3.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-white font-medium transition-all duration-200 placeholder:text-slate-600';

  return (
    <div className="min-h-screen bg-[#0a0e14] flex font-sans">
      {/* ===== Left: Brand Panel (desktop only) ===== */}
      <aside className="hidden lg:flex lg:w-[44%] xl:w-[40%] bg-[#0c1117] relative flex-col justify-between p-12 xl:p-16 overflow-hidden border-r border-white/[0.05]">
        {/* Warm radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(circle at 30% 15%, rgba(249,115,22,0.10), transparent 55%)',
          }}
        />
        {/* Subtle dot-grid texture */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Brand header */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white rounded-xl shadow-[0_10px_30px_-8px_rgba(0,0,0,0.4)]">
              <img src="/logo_alimobile.jpeg" alt="Ali Mobile" className="w-12 h-12 object-contain" />
            </div>
            <h1 className="text-2xl font-black text-white uppercase italic tracking-tight font-display">
              Ali Mobile
            </h1>
          </div>
          <p className="text-slate-500 text-sm mt-6 max-w-xs leading-relaxed">
            Plateforme intégrée de financement téléphonique, gestion de contrats et suivi des
            paiements à échelonnement.
          </p>
        </div>

        {/* Feature highlights */}
        <div className="relative z-10 space-y-7">
          {brandFeatures.map((f, i) => (
            <div key={i} className="flex items-start gap-4">
              <div className="shrink-0 w-11 h-11 flex items-center justify-center rounded-xl border border-orange-500/20 bg-orange-500/10">
                <f.icon className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white tracking-tight">{f.title}</h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Security note */}
        <div className="relative z-10">
          <div className="w-10 h-[2px] bg-orange-500 mb-4" />
          <p className="text-[11px] text-slate-600 leading-relaxed max-w-xs">
            Accès sécurisé réservé aux agents agréés. Toutes les opérations sont journalisées et
            chiffrées.
          </p>
        </div>
      </aside>

      {/* ===== Right: Form Panel ===== */}
      <main className="flex-1 flex items-center justify-center p-6 sm:p-8 relative">
        {/* Mobile-only brand header */}
        <div className="lg:hidden absolute top-8 left-0 right-0 flex flex-col items-center">
          <div className="p-2 bg-white rounded-xl shadow-[0_10px_30px_-8px_rgba(0,0,0,0.4)] mb-3">
            <img src="/logo_alimobile.jpeg" alt="Ali Mobile" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-xl font-black text-white uppercase italic tracking-tight font-display">
            Ali Mobile
          </h1>
          <div className="w-8 h-[2px] bg-orange-500 mt-3" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="w-full max-w-[420px] pt-24 lg:pt-0"
        >
          {/* ===== Glass Card ===== */}
          <div className="relative bg-[#11161e]/85 backdrop-blur-xl rounded-2xl border border-white/[0.08] shadow-[0_24px_64px_-20px_rgba(0,0,0,0.7)] p-8 sm:p-10">
            {/* Top inner highlight (lit-from-above feel) */}
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.1] to-transparent rounded-t-2xl" />

            {/* Section header (adapts to mode) */}
            <div className="mb-8">
              <h2 className="text-xl font-bold text-white tracking-tight">
                {mode === 'forgot_password'
                  ? 'Récupération de compte'
                  : mode === 'reset_password'
                  ? 'Nouveau mot de passe'
                  : 'Connexion'}
              </h2>
              <p className="text-slate-500 text-sm mt-2 leading-relaxed">
                {mode === 'forgot_password'
                  ? 'Saisissez votre email pour recevoir un lien de réinitialisation.'
                  : mode === 'reset_password'
                  ? 'Définissez un mot de passe sécurisé pour votre compte.'
                  : 'Accédez à votre espace de gestion Ali Mobile.'}
              </p>
            </div>

            {/* ===== Error Alert ===== */}
            {error && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-red-500/[0.08] border border-red-500/20 rounded-xl text-red-300 text-sm flex items-start gap-3 leading-relaxed"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-red-400 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}

            {/* ===== Success Alert ===== */}
            {successMessage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mb-6 p-4 bg-emerald-500/[0.08] border border-emerald-500/20 rounded-xl text-emerald-300 text-sm flex items-start gap-3 leading-relaxed"
              >
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>{successMessage}</span>
              </motion.div>
            )}

            {/* ===== MODE 1: Standard Login ===== */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <label className="text-[13px] font-medium text-slate-300/70 block mb-2">
                    Adresse Email Professionnelle
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-orange-400 transition-colors duration-200">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nom@alimobile.com"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <label className="text-[13px] font-medium text-slate-300/70">
                      Mot de passe
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        setSuccessMessage(null);
                        setMode('forgot_password');
                      }}
                      className="text-xs text-orange-400 hover:text-orange-300 transition cursor-pointer font-medium"
                    >
                      Mot de passe oublié ?
                    </button>
                  </div>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-orange-400 transition-colors duration-200">
                      <KeyRound className="w-4 h-4" />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm pl-11 pr-12 py-3.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-white font-medium transition-all duration-200 placeholder:text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition focus:outline-none cursor-pointer flex items-center justify-center"
                      title={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold py-3.5 px-6 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-px"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Connexion en cours...</span>
                      </>
                    ) : (
                      <>
                        <span>Se connecter</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {/* ===== MODE 2: Forgot Password ===== */}
            {mode === 'forgot_password' && (
              <form onSubmit={handleForgotPassword} className="space-y-5">
                <p className="text-sm text-slate-400 leading-relaxed">
                  Saisissez votre adresse email professionnelle. Un lien sécurisé pour définir un
                  nouveau mot de passe vous sera envoyé.
                </p>

                <div>
                  <label className="text-[13px] font-medium text-slate-300/70 block mb-2">
                    Adresse Email Professionnelle
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-orange-400 transition-colors duration-200">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="nom@alimobile.com"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="pt-2 space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold py-3.5 px-6 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-px"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Envoi en cours...</span>
                      </>
                    ) : (
                      <>
                        <span>Envoyer le lien</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setError(null);
                      setSuccessMessage(null);
                      setMode('login');
                    }}
                    className="w-full py-2.5 text-sm text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5 font-semibold cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Retour à la connexion</span>
                  </button>
                </div>
              </form>
            )}

            {/* ===== MODE 3: Set New Password ===== */}
            {mode === 'reset_password' && (
              <form onSubmit={handleSetNewPassword} className="space-y-5">
                <div className="p-4 bg-orange-500/[0.08] border border-orange-500/20 rounded-xl text-orange-300 text-sm flex items-start gap-2.5 leading-relaxed">
                  <ShieldCheck className="w-4 h-4 shrink-0 text-orange-400 mt-0.5" />
                  <span>Veuillez choisir un mot de passe sécurisé pour votre compte Ali Mobile.</span>
                </div>

                <div>
                  <label className="text-[13px] font-medium text-slate-300/70 block mb-2">
                    Adresse email professionnelle *
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-orange-400 transition-colors duration-200">
                      <Mail className="w-4 h-4" />
                    </span>
                    <input
                      type="email"
                      required
                      value={resetEmail}
                      onChange={(e) => setResetEmail(e.target.value)}
                      placeholder="nom@alimobile.com"
                      className={`${inputClass} font-mono`}
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[13px] font-medium text-slate-300/70 block mb-2">
                    Nouveau mot de passe
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-orange-400 transition-colors duration-200">
                      <KeyRound className="w-4 h-4" />
                    </span>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl text-sm pl-11 pr-12 py-3.5 focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-white font-medium transition-all duration-200 placeholder:text-slate-600"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 hover:text-white transition focus:outline-none cursor-pointer flex items-center justify-center"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {/* Password strength meter */}
                  {newPassword && (
                    <div className="mt-2.5 flex items-center gap-3">
                      <div className="flex-1 flex gap-1.5">
                        {[0, 1, 2, 3].map((i) => (
                          <div
                            key={i}
                            className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                              i < passwordStrength.score ? passwordStrength.color : 'bg-white/[0.06]'
                            }`}
                          />
                        ))}
                      </div>
                      {passwordStrength.label && (
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider whitespace-nowrap">
                          {passwordStrength.label}
                        </span>
                      )}
                    </div>
                  )}
                  <p className="text-[11px] text-slate-600 mt-2">Minimum 6 caractères.</p>
                </div>

                <div>
                  <label className="text-[13px] font-medium text-slate-300/70 block mb-2">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative group">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-orange-400 transition-colors duration-200">
                      <KeyRound className="w-4 h-4" />
                    </span>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className={`w-full bg-white/[0.04] border text-sm pl-11 pr-4 py-3.5 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/20 text-white font-medium transition-all duration-200 placeholder:text-slate-600 ${
                        passwordsMismatch
                          ? 'border-red-500/50 focus:border-red-500'
                          : passwordsMatch
                          ? 'border-emerald-500/40 focus:border-emerald-500'
                          : 'border-white/[0.08] focus:border-orange-500'
                      }`}
                    />
                  </div>
                  {/* Real-time match indicator */}
                  {passwordsMatch && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-[11px] text-emerald-500 font-medium">
                        Les mots de passe correspondent
                      </span>
                    </div>
                  )}
                  {passwordsMismatch && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                      <span className="text-[11px] text-red-500 font-medium">
                        Les mots de passe ne correspondent pas
                      </span>
                    </div>
                  )}
                </div>

                <div className="pt-2 space-y-3">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-white font-bold py-3.5 px-6 rounded-xl text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/40 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed active:translate-y-px"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Enregistrement...</span>
                      </>
                    ) : (
                      <>
                        <span>Valider mon mot de passe</span>
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode('login')}
                    className="w-full py-2.5 text-sm text-slate-400 hover:text-white transition flex items-center justify-center gap-1.5 font-semibold cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Annuler et retourner</span>
                  </button>
                </div>
              </form>
            )}

            {/* ===== Footer ===== */}
            <div className="mt-8 pt-6 border-t border-white/[0.05]">
              <p className="text-[11px] text-slate-600 leading-relaxed text-center">
                Accès sécurisé réservé aux agents agréés Ali Mobile.
                <br />
                En cas de perte d'accès, contactez l'administrateur principal.
              </p>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
