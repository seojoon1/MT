// src/components/layout/Navbar.tsx
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Home, 
  PlusCircle, 
  Globe, 
  Menu, 
  X,
  LogIn,
  UserPlus,
  LogOut,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/cn';

interface NavbarProps {
  showAuthButtons?: boolean;
  isAuthenticated?: boolean;
  onLogout?: () => void;
  username?: string;
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ 
  showAuthButtons = true, 
  isAuthenticated = false, 
  onLogout, 
  username,
  className 
}) => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLanguageDropdownOpen, setIsLanguageDropdownOpen] = useState(false);
  
  const changeLanguage = (lng: 'ko' | 'lo') => {
    i18n.changeLanguage(lng);
    localStorage.setItem('preferred-language', lng);
    setIsLanguageDropdownOpen(false);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const languageOptions = [
    { code: 'ko' as const, label: '한국어', flag: '🇰🇷' },
    { code: 'lo' as const, label: 'ລາວ', flag: '🇱🇦' },
  ];

  const currentLanguage = languageOptions.find(lang => lang.code === i18n.language);

  return (
    <nav className={cn(
      "sticky top-0 z-50 w-full bg-gradient-to-r from-pink-500/10 to-purple-500/10 backdrop-blur-lg border-b border-white/20",
      className
    )}>
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="flex items-center gap-2 group"
            >
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-pink-500 to-purple-600">
                  <span className="text-lg font-bold text-white">M</span>
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  MentApp
                </span>
                <span className="text-xs text-slate-500 hidden sm:block">
                  {t('navbar.slogan', 'Share your thoughts')}
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <Link
              to="/"
              className={cn(
                "flex items-center gap-2 text-sm font-semibold transition-all duration-200",
                isActive('/') 
                  ? "text-pink-600" 
                  : "text-slate-700 hover:text-pink-500"
              )}
            >
              <Home className="h-4 w-4" />
              {t('navbar.home')}
            </Link>
            
            {isAuthenticated && (
              <>
                <Link
                  to="/ments"
                  className={cn(
                    "flex items-center gap-2 text-sm font-semibold transition-all duration-200",
                    isActive('/ments')
                      ? "text-pink-600"
                      : "text-slate-700 hover:text-pink-500"
                  )}
                >
                  <span className="h-2 w-2 rounded-full bg-pink-500"></span>
                  {t('navbar.ments')}
                </Link>
                
                <Link
                  to="/ments/new"
                  className={cn(
                    "flex items-center gap-2 text-sm font-semibold transition-all duration-200",
                    isActive('/ments/new')
                      ? "text-purple-600"
                      : "text-slate-700 hover:text-purple-500"
                  )}
                >
                  <PlusCircle className="h-4 w-4" />
                  {t('navbar.create')}
                </Link>
              </>
            )}
          </div>

          {/* Right Side Actions */}
          <div className="flex items-center gap-4">
            {/* Language Selector */}
            <div className="relative">
              <button
                onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                className="flex items-center gap-2 rounded-full bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-white transition-all duration-200 shadow-sm hover:shadow"
              >
                <Globe className="h-4 w-4" />
                <span className="hidden sm:inline">{currentLanguage?.label}</span>
                <span className="text-xs">{currentLanguage?.flag}</span>
                <svg 
                  className={`h-4 w-4 transition-transform ${isLanguageDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {isLanguageDropdownOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsLanguageDropdownOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 z-50 w-48 rounded-xl border border-slate-200 bg-white py-2 shadow-xl">
                    {languageOptions.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => changeLanguage(lang.code)}
                        className={cn(
                          "flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-all duration-200 hover:bg-slate-50",
                          i18n.language === lang.code 
                            ? "bg-gradient-to-r from-pink-50 to-purple-50 text-pink-600"
                            : "text-slate-700"
                        )}
                      >
                        <span className="text-base">{lang.flag}</span>
                        <span className="font-medium">{lang.label}</span>
                        {i18n.language === lang.code && (
                          <div className="ml-auto h-2 w-2 rounded-full bg-gradient-to-r from-pink-500 to-purple-500" />
                        )}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* User Menu / Auth Buttons */}
            {showAuthButtons && (
              <div className="hidden md:flex items-center gap-3">
                {isAuthenticated ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-500">
                        <span className="text-xs font-bold text-white">
                          {username?.charAt(0)?.toUpperCase() || 'U'}
                        </span>
                      </div>
                      <div className="hidden lg:block">
                        <p className="text-xs text-slate-500">{t('navbar.welcome')}</p>
                        {/* 변경: 닉네임을 클릭하면 마이페이지로 이동하도록 Link로 감쌌습니다. */}
                        <Link to="/mypage" className="text-sm font-semibold text-slate-700 hover:underline">
                          {username || 'User'}
                        </Link>
                      </div>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4" />
                      <span className="hidden lg:inline">{t('navbar.logout')}</span>
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link
                      to="/login"
                      className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      <LogIn className="h-4 w-4" />
                      {t('navbar.login')}
                    </Link>
                    <Link
                      to="/Register"
                      className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-2 text-sm font-semibold text-white hover:from-pink-600 hover:to-purple-700 transition-all duration-200 shadow hover:shadow-md"
                    >
                      <UserPlus className="h-4 w-4" />
                      {t('navbar.signup')}
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="md:hidden rounded-lg p-2 hover:bg-white/50 transition-colors"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6 text-slate-700" />
              ) : (
                <Menu className="h-6 w-6 text-slate-700" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-white/20 mt-2 py-4">
            <div className="space-y-2">
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all",
                  isActive('/')
                    ? "bg-gradient-to-r from-pink-50 to-purple-50 text-pink-600"
                    : "text-slate-700 hover:bg-slate-50"
                )}
              >
                <Home className="h-5 w-5" />
                {t('navbar.home')}
              </Link>
              
              {isAuthenticated && (
                <>
                  <Link
                    to="/ments"
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all",
                      isActive('/ments')
                        ? "bg-gradient-to-r from-pink-50 to-purple-50 text-pink-600"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <span className="h-2 w-2 rounded-full bg-pink-500"></span>
                    {t('navbar.ments')}
                  </Link>
                  
                  <Link
                    to="/ments/new"
                    onClick={() => setIsMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all",
                      isActive('/ments/new')
                        ? "bg-gradient-to-r from-pink-50 to-purple-50 text-purple-600"
                        : "text-slate-700 hover:bg-slate-50"
                    )}
                  >
                    <PlusCircle className="h-5 w-5" />
                    {t('navbar.create')}
                  </Link>
                </>
              )}

              {/* Language Options for Mobile */}
              <div className="px-4 pt-4 border-t border-slate-200">
                <p className="mb-2 text-xs font-semibold text-slate-500">{t('navbar.language')}</p>
                <div className="grid grid-cols-2 gap-2">
                  {languageOptions.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => {
                        changeLanguage(lang.code);
                        setIsMenuOpen(false);
                      }}
                      className={cn(
                        "flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-sm font-medium transition-all",
                        i18n.language === lang.code
                          ? "border-pink-300 bg-gradient-to-r from-pink-50 to-purple-50 text-pink-600"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      )}
                    >
                      <span className="text-base">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Auth Buttons for Mobile */}
              {showAuthButtons && (
                <div className="px-4 pt-4 border-t border-slate-200">
                  {isAuthenticated ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-pink-500 to-purple-500">
                          <span className="text-sm font-bold text-white">
                            {username?.charAt(0)?.toUpperCase() || 'U'}
                          </span>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">{t('navbar.welcome')}</p>
                          {/* 변경: 모바일 메뉴의 닉네임도 클릭 시 마이페이지로 이동, 메뉴 닫힘 처리 */}
                          <Link to="/mypage" onClick={() => setIsMenuOpen(false)} className="text-sm font-semibold text-slate-700">
                            {username || 'User'}
                          </Link>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsMenuOpen(false);
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <LogOut className="h-5 w-5" />
                        {t('navbar.logout')}
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link
                        to="/login"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <LogIn className="h-5 w-5" />
                        {t('navbar.login')}
                      </Link>
                      <Link
                        to="/login"
                        onClick={() => setIsMenuOpen(false)}
                        className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-pink-500 to-purple-600 px-4 py-3 text-sm font-semibold text-white"
                      >
                        <UserPlus className="h-5 w-5" />
                        {t('navbar.signup')}
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;