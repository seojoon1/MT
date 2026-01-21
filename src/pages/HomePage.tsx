import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // ตรวจสอบการ authen แบบง่าย
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
    setIsAuthenticated(!!token);
    
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // SVG Icons แทน heroicons
  const LanguageIcon = () => (
    <svg className="h-10 w-10 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" />
    </svg>
  );

  const ShieldCheckIcon = () => (
    <svg className="h-10 w-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );

  const GlobeAltIcon = () => (
    <svg className="h-10 w-10 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  );

  const HeartIcon = () => (
    <svg className="h-10 w-10 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
    </svg>
  );

  const UserPlusIcon = () => (
    <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
    </svg>
  );

  const PencilSquareIcon = () => (
    <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );

  const UserGroupIcon = () => (
    <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  return (
    <div className="min-h-screen">
        
      {/* Hero Section - จัดให้อยู่กลางจอ */}
      <section className="relative overflow-hidden min-h-[50vh] flex items-center justify-center px-4">

      
        <div className="mx-auto max-w-4xl text-center">
          {/* Hero Text ที่อยู่กลาง */}
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            <span className="block">Where Words Create</span>
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mt-2">
              Connections
            </span>
          </h1>
          
          <p className="mt-6 text-lg text-gray-600 sm:text-xl max-w-2xl mx-auto">
            MentApp is more than just a social platform. It's a space where 
            meaningful conversations begin, relationships blossom, and 
            communities thrive across borders and languages.
          </p>
          
          {/* CTA Buttons ที่อยู่กลาง */}
          <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            {!isAuthenticated ? (
              <>
                <button
                  onClick={() => navigate('/register')}
                  className="px-8 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
                >
                  Get Started Free
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="px-8 py-3 rounded-full border-2 border-purple-600 text-purple-600 font-semibold hover:bg-purple-50 transition-colors duration-300"
                >
                  Login
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/ments')}
                className="px-8 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300"
              >
                Explore Ments
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Stats Section - อยู่ใต้ Hero */}


      {/* Features Section */}
      <section className="py-12 bg-gradient-to-b from-white to-purple-50 px-4">
        
        <div className="mx-auto max-w-7xl">
            
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Why Choose MentApp?
          </h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: <LanguageIcon />,
                title: 'AI Translation',
                desc: 'Real-time translation across languages. Break language barriers instantly.'
              },
              {
                icon: <ShieldCheckIcon />,
                title: 'Safe & Secure',
                desc: 'All ments are moderated for respectful and meaningful conversations.'
              },
              {
                icon: <GlobeAltIcon />,
                title: 'Global Community',
                desc: 'Connect with people from different cultures and backgrounds.'
              },
              {
                icon: <HeartIcon />,
                title: 'Romantic Connections',
                desc: 'Specialized in helping people build meaningful romantic relationships.'
              },
            ].map((feature, index) => (
              <div key={index} className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works - Mobile Optimized */}
      <section className="py-12 px-4">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            How It Works
          </h2>
          
          <div className="flex flex-col sm:flex-row items-center justify-between">
            {[
              { step: 1, icon: <UserPlusIcon />, title: 'Sign Up', desc: 'Create account ' },
              { step: 2, icon: <PencilSquareIcon />, title: 'Create Ment', desc: 'Share your thoughts' },
              { step: 3, icon: <LanguageIcon />, title: 'AI Translate', desc: 'Auto translate to others' },
              { step: 4, icon: <UserGroupIcon />, title: 'Connect', desc: 'Start conversations' },
            ].map((item, index) => (
              <div key={index} className="flex flex-col items-center mb-8 sm:mb-0">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 flex items-center justify-center mb-4 shadow-lg">
                    {item.icon}
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-white border-2 border-purple-600 flex items-center justify-center text-sm font-bold text-purple-600">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
                <p className="text-sm text-gray-600 text-center mt-1">{item.desc}</p>
                
                {index < 3 && (
                  <div className="hidden sm:block absolute left-1/2 transform translate-x-16 mt-8 text-gray-400">
                    <span className="text-2xl">→</span>
                  </div>
                )}
              </div>
            ))}
          </div>
          
          {/* Mobile Steps with arrows */}
          {isMobile && (
            <div className="mt-4 flex justify-center space-x-2">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="text-gray-400 text-lg">↓</div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-12 px-4 text-center bg-gradient-to-r from-pink-500/10 to-purple-600/10 mx-4 rounded-3xl mb-12">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to Start Connecting?
        </h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          Join thousands of users finding meaningful connections today
        </p>
        
        <button
          onClick={() => navigate(isAuthenticated ? '/ments' : '/register')}
          className="px-10 py-4 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold text-lg shadow-xl hover:shadow-2xl transform hover:-translate-y-1 transition-all duration-300"
        >
          {isAuthenticated ? 'Browse Ments Now' : 'Get Started Now — Free'}
        </button>
        
        {!isAuthenticated && (
          <p className="mt-4 text-sm text-gray-500">
            No credit card required • Sign up in 30 seconds
          </p>
        )}
      </section>
    </div>
  );
};

export default HomePage;