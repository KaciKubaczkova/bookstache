import React, { useState, useEffect } from 'react';
import { X, LogIn, UserPlus, User, MapPin, Mail, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function AuthModal({ isOpen, onClose }) {
  const { currentUser, userProfile, login, register, logout, updateProfileData } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'profile'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [location, setLocation] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (currentUser && userProfile) {
      setMode('profile');
      setDisplayName(userProfile.displayName || '');
      setLocation(userProfile.location || '');
    } else {
      setMode('login');
      setEmail('');
      setPassword('');
    }
  }, [currentUser, userProfile, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        setSuccessMsg('Úspěšně přihlášeno!');
        setTimeout(() => onClose(), 800);
      } else if (mode === 'register') {
        if (!displayName.trim()) {
          setError('Vyplňte prosím své jméno nebo přezdívku.');
          setLoading(false);
          return;
        }
        await register(email, password, displayName.trim(), location.trim() || 'Ostrava-Poruba');
        setSuccessMsg('Účet byl úspěšně vytvořen!');
        setTimeout(() => onClose(), 800);
      } else if (mode === 'profile') {
        await updateProfileData({
          displayName: displayName.trim(),
          location: location.trim()
        });
        setSuccessMsg('Profil byl úspěšně aktualizován!');
        setTimeout(() => setSuccessMsg(''), 2000);
      }
    } catch (err) {
      console.error('Auth error:', err);
      let msg = err.message || 'Nastala chyba.';
      if (msg.includes('auth/invalid-credential') || msg.includes('auth/wrong-password')) {
        msg = 'Nesprávný e-mail nebo heslo.';
      } else if (msg.includes('auth/email-already-in-use')) {
        msg = 'Tento e-mail je již zaregistrován.';
      } else if (msg.includes('auth/weak-password')) {
        msg = 'Heslo musí mít alespoň 6 znaků.';
      } else if (msg.includes('auth/invalid-email')) {
        msg = 'Zadejte platnou e-mailovou adresu.';
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    setMode('login');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
      <div className="bg-[#f7f3ed] border-2 border-[#8b2626]/20 rounded-3xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#5c3a21] hover:text-[#8b2626] p-1 rounded-full hover:bg-[#efe6d5] transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title / Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="p-3 bg-[#8b2626]/10 text-[#8b2626] rounded-2xl">
            {mode === 'profile' ? <User className="w-6 h-6" /> : mode === 'register' ? <UserPlus className="w-6 h-6" /> : <LogIn className="w-6 h-6" />}
          </div>
          <div>
            <h2 className="text-xl font-serif font-bold text-[#3a2212]">
              {mode === 'profile'
                ? 'Váš účet a profil'
                : mode === 'register'
                ? 'Registrace účtu'
                : 'Přihlášení do aplikace'}
            </h2>
            <p className="text-xs text-[#5c3a21]">
              {mode === 'profile'
                ? 'Upravte své kontaktní údaje pro Knižní Vinted'
                : mode === 'register'
                ? 'Vytvořte si účet pro nabízení a půjčování knih'
                : 'Přihlaste se ke svému účtu'}
            </p>
          </div>
        </div>

        {/* Status Messages */}
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-300 text-red-800 text-xs rounded-xl font-medium">
            {error}
          </div>
        )}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs rounded-xl font-medium">
            {successMsg}
          </div>
        )}

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'profile' && currentUser && (
            <div className="bg-[#efe6d5] p-3 rounded-xl text-xs text-[#3a2212] space-y-1 border border-[#d7ccc8]">
              <p><span className="font-semibold text-[#5c3a21]">E-mail:</span> {currentUser.email}</p>
              <p className="text-[11px] text-[#8b2626] italic">Tento e-mail se zobrazí zájemcům o vaše knihy v Knižním Vinted.</p>
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <div>
              <label className="block text-xs font-bold text-[#3a2212] mb-1">E-mail</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-2.5 text-[#8b2626]/60" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="vass-email@domena.cz"
                  className="w-full pl-9 pr-3 py-2 bg-[#efe6d5] border border-[#a1887f] rounded-xl text-xs text-[#3a2212] focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
                />
              </div>
            </div>
          )}

          {(mode === 'login' || mode === 'register') && (
            <div>
              <label className="block text-xs font-bold text-[#3a2212] mb-1">Heslo</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-2.5 text-[#8b2626]/60" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-9 pr-3 py-2 bg-[#efe6d5] border border-[#a1887f] rounded-xl text-xs text-[#3a2212] focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
                />
              </div>
            </div>
          )}

          {(mode === 'register' || mode === 'profile') && (
            <div>
              <label className="block text-xs font-bold text-[#3a2212] mb-1">Jméno nebo přezdívka</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-2.5 text-[#8b2626]/60" />
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="např. Jan Novák"
                  className="w-full pl-9 pr-3 py-2 bg-[#efe6d5] border border-[#a1887f] rounded-xl text-xs text-[#3a2212] focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
                />
              </div>
            </div>
          )}

          {(mode === 'register' || mode === 'profile') && (
            <div>
              <label className="block text-xs font-bold text-[#3a2212] mb-1">
                Lokalita (Město / Část obec)
              </label>
              <div className="relative">
                <MapPin className="w-4 h-4 absolute left-3 top-2.5 text-[#8b2626]/60" />
                <input
                  type="text"
                  required
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="např. Ostrava-Poruba"
                  className="w-full pl-9 pr-3 py-2 bg-[#efe6d5] border border-[#a1887f] rounded-xl text-xs text-[#3a2212] focus:outline-none focus:ring-2 focus:ring-[#8b2626]"
                />
              </div>
              <p className="text-[11px] text-[#5c3a21] mt-1">
                Slouží k vyhledávání nabídek knih v okolí. Přesná adresa se nezobrazuje.
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-[#8b2626] hover:bg-[#701e1e] text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : mode === 'profile' ? (
              'Uložit změny'
            ) : mode === 'register' ? (
              'Zaregistrovat se'
            ) : (
              'Přihlásit se'
            )}
          </button>
        </form>

        {/* Footer actions */}
        <div className="mt-5 pt-4 border-t border-[#d7ccc8] flex flex-wrap items-center justify-between gap-2 text-xs text-[#5c3a21]">
          {mode === 'profile' ? (
            <button
              onClick={handleLogout}
              className="text-[#8b2626] font-bold hover:underline cursor-pointer"
            >
              Odhlásit se
            </button>
          ) : mode === 'login' ? (
            <div className="w-full text-center">
              <span>Nemáte ještě účet? </span>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setMode('register');
                }}
                className="text-[#8b2626] font-bold hover:underline cursor-pointer"
              >
                Zaregistrujte se
              </button>
            </div>
          ) : (
            <div className="w-full text-center">
              <span>Již máte účet? </span>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setMode('login');
                }}
                className="text-[#8b2626] font-bold hover:underline cursor-pointer"
              >
                Přihlaste se
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
