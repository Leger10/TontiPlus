import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, Wallet, Bell, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

const BottomNavigation = () => {
  const location = useLocation();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (!user) return;
      
      try {
        const { count, error } = await supabase
          .from('notifications')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('is_read', false);
        
        if (error) throw error;
        setUnreadCount(count || 0);
      } catch (error) {
        console.error('Error fetching unread count:', error);
      }
    };
    
    fetchUnreadCount();
  }, [user, location.pathname]);

  const navItems = [
    { path: '/', icon: Home, label: 'Accueil' },
    { path: '/tontines', icon: Users, label: 'Tontines' },
    { path: '/wallet', icon: Wallet, label: 'Portefeuille' },
    { path: '/notifications', icon: Bell, label: 'Alertes', badge: unreadCount },
    { path: '/profile', icon: User, label: 'Profil' }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1a1a1a] border-t border-[#4a4a4a] z-50 safe-area-bottom pb-2 pt-2 shadow-[0_-8px_30px_rgba(0,0,0,0.4)]">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path));
          const Icon = item.icon;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full relative group rounded-lg transition-all duration-300 ${
                isActive ? 'bg-[#3a3a3a] border-t-2 border-t-[hsl(var(--primary))] text-white' : 'text-[#b0b0b0] hover:bg-[#2d2d2d] hover:text-[#f5f5f5]'
              }`}
            >
              <div className="flex flex-col items-center justify-center pt-1">
                <div className="relative">
                  <Icon className={`w-6 h-6 mb-1 transition-all duration-300 ${isActive ? 'scale-110 text-[hsl(var(--primary))]' : 'scale-100 group-hover:text-white'}`} />
                  {item.badge > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-[#1a1a1a] shadow-sm">
                      {item.badge > 9 ? '9+' : item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] ${isActive ? 'font-bold text-white' : 'font-medium'}`}>
                  {item.label}
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;