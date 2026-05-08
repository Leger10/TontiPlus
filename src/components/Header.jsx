import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Button } from '@/components/ui/button.jsx';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu.jsx';
import { Avatar, AvatarFallback } from '@/components/ui/avatar.jsx';
import { LogOut, User, Settings, LayoutDashboard, Shield, Wallet, Crown } from 'lucide-react';
import NotificationBell from '@/components/NotificationBell.jsx';
import { supabase } from '@/lib/supabase';

const Header = () => {
  const { user, profile, logout, isAuthenticated, fetchProfile } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [forceProfile, setForceProfile] = useState(null);

  // Forcer le rechargement du profil si nécessaire
  useEffect(() => {
    const loadProfile = async () => {
      if (user && !profile) {
        console.log('🔄 Header: Rechargement du profil...');
        const loadedProfile = await fetchProfile(user.id);
        setForceProfile(loadedProfile);
      }
    };
    loadProfile();
  }, [user, profile, fetchProfile]);

  const activeProfile = profile || forceProfile;

  const getDashboardLink = () => {
    if (!activeProfile) return '/';
    if (activeProfile.role === 'super_admin') return '/super-admin-dashboard';
    if (activeProfile.role === 'secretaire_national') return '/secretaire-national-dashboard';
    if (activeProfile.role === 'dg_pays') return '/dg-pays-dashboard';
    if (activeProfile.role === 'pays_secretaire') return '/secretaire-pays-dashboard';
    if (activeProfile.role === 'tontinier') return '/tontinier/dashboard';
    return '/';
  };

  const getUserInitial = () => {
    if (activeProfile?.full_name) {
      return activeProfile.full_name.charAt(0).toUpperCase();
    }
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return 'U';
  };

  const getUserName = () => {
    return activeProfile?.full_name || user?.email?.split('@')[0] || 'Utilisateur';
  };

  const getUserEmail = () => {
    return user?.email || '';
  };

  const isSuperAdmin = activeProfile?.role === 'super_admin';

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container max-w-7xl mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center space-x-2 mr-6">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">B</span>
          </div>
          <span className="font-bold text-xl hidden sm:inline-block text-foreground">BonPlan</span>
        </Link>
        
        {isAuthenticated && (
          <nav className="flex items-center space-x-4 lg:space-x-6 mx-6 hidden md:flex">
            <Link to="/tontines" className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname.startsWith('/tontines') ? 'text-primary' : 'text-muted-foreground'}`}>Explorer</Link>
            <Link to="/wallet" className={`text-sm font-medium transition-colors hover:text-primary ${location.pathname.startsWith('/wallet') ? 'text-primary' : 'text-muted-foreground'}`}>Portefeuille</Link>
          </nav>
        )}

        <div className="ml-auto flex items-center space-x-4">
          {isAuthenticated ? (
            <>
              {/* Bouton Super Admin visible pour les super admins */}
              {isSuperAdmin && (
                <Link 
                  to="/super-admin-dashboard" 
                  className="hidden md:flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  <Crown className="w-4 h-4" />
                  Super Admin
                </Link>
              )}
              <NotificationBell />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {getUserInitial()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <div className="flex flex-col space-y-1 p-2">
                    <p className="text-sm font-medium leading-none text-foreground">{getUserName()}</p>
                    <p className="text-xs leading-none text-muted-foreground">{getUserEmail()}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to={getDashboardLink()} className="cursor-pointer flex items-center">
                      <LayoutDashboard className="mr-2 h-4 w-4" /> Tableau de bord
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/wallet" className="cursor-pointer flex items-center">
                      <Wallet className="mr-2 h-4 w-4" /> Mon Portefeuille
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/subscription-management" className="cursor-pointer flex items-center">
                      <Crown className="mr-2 h-4 w-4" /> Mon Abonnement
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer flex items-center">
                      <User className="mr-2 h-4 w-4" /> Profil
                    </Link>
                  </DropdownMenuItem>
                  
                  {activeProfile && ['super_admin', 'secretaire_national'].includes(activeProfile.role) && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem asChild>
                        <Link to="/admin/dashboard" className="cursor-pointer flex items-center">
                          <Shield className="mr-2 h-4 w-4" /> Administration
                        </Link>
                      </DropdownMenuItem>
                      {activeProfile.role === 'super_admin' && (
                        <DropdownMenuItem asChild>
                          <Link to="/admin/subscriptions-management" className="cursor-pointer flex items-center">
                            <Crown className="mr-2 h-4 w-4" /> Gestion Abonnements
                          </Link>
                        </DropdownMenuItem>
                      )}
                    </>
                  )}
                  
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={handleLogout} 
                    className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
                  >
                    <LogOut className="mr-2 h-4 w-4" /> Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Button variant="ghost" asChild className="hidden sm:inline-flex text-muted-foreground hover:text-foreground">
                <Link to="/login">Connexion</Link>
              </Button>
              <Button asChild className="bg-primary text-primary-foreground hover:bg-primary/90">
                <Link to="/signup">S'inscrire</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;