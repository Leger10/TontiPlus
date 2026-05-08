import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProfile = async (userId) => {
    if (!userId) return null;
    
    try {
      console.log('📋 [Auth] Fetching profile for user:', userId);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('❌ [Auth] Fetch profile error:', error);
        return null;
      }
      
      console.log('✅ [Auth] Profile fetched:', data?.email, 'Role:', data?.role);
      setProfile(data);
      return data;
    } catch (error) {
      console.error('❌ [Auth] Error fetching profile:', error);
      return null;
    }
  };

  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      try {
        console.log('🔐 [Auth] Init - Début');
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ [Auth] Session error:', sessionError);
          if (isMounted) setInitialLoading(false);
          return;
        }
        
        if (session?.user) {
          console.log('✅ [Auth] Session trouvée pour:', session.user.email);
          if (isMounted) {
            setUser(session.user);
            await fetchProfile(session.user.id);
          }
        } else {
          console.log('⚠️ [Auth] Aucune session trouvée');
          localStorage.removeItem('supabase.auth.token');
        }
      } catch (error) {
        console.error('❌ [Auth] Init error:', error);
      } finally {
        if (isMounted) {
          console.log('🔓 [Auth] Init terminé, loading = false');
          setInitialLoading(false);
        }
      }
    };

    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        console.log('🔄 [Auth] State changed:', _event, session?.user?.email);
        
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
          if (session) {
            localStorage.setItem('supabase.auth.token', JSON.stringify(session));
          }
        } else {
          setUser(null);
          setProfile(null);
          localStorage.removeItem('supabase.auth.token');
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email, password) => {
    try {
      if (!email || !password) {
        return { success: false, error: 'Veuillez remplir tous les champs.' };
      }

      console.log('🔑 [Auth] Tentative de connexion pour:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (error) {
        console.error('❌ [Auth] Erreur:', error);
        if (error.message === 'Invalid login credentials') {
          return { success: false, error: 'Email ou mot de passe incorrect.' };
        }
        return { success: false, error: error.message };
      }

      console.log('✅ [Auth] Connexion réussie:', data.user.email);
      
      setUser(data.user);
      const userProfile = await fetchProfile(data.user.id);
      
      if (data.session) {
        localStorage.setItem('supabase.auth.token', JSON.stringify(data.session));
      }
      
      toast.success('Connexion réussie !');
      
      // Utiliser navigate au lieu de window.location.href
      if (userProfile?.role === 'super_admin') {
        navigate('/super-admin-dashboard');
      } else if (userProfile?.role === 'tontinier') {
        navigate('/tontinier/dashboard');
      } else {
        navigate('/');
      }
      
      return { success: true, data };
    } catch (error) {
      console.error('❌ [Auth] Login error:', error);
      return { 
        success: false, 
        error: 'Échec de la connexion. Veuillez réessayer.' 
      };
    }
  };

  const signup = async (fullName, email, password, passwordConfirm, pays_id = null) => {
    try {
      if (!fullName || !email || !password || !passwordConfirm) {
        return { success: false, error: 'Veuillez remplir tous les champs obligatoires.' };
      }

      if (password.length < 8) {
        return { success: false, error: 'Le mot de passe doit contenir au moins 8 caractères.' };
      }

      if (password !== passwordConfirm) {
        return { success: false, error: 'Les mots de passe ne correspondent pas.' };
      }

      const cleanEmail = email.trim().toLowerCase();

      const { data: existingUser } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', cleanEmail)
        .maybeSingle();

      if (existingUser) {
        return { success: false, error: 'Cet email est déjà utilisé.' };
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            full_name: fullName,
            role: 'member'
          }
        }
      });

      if (signUpError) throw signUpError;

      if (!authData.user) {
        return { success: false, error: "Erreur lors de la création du compte." };
      }

      await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          pays_id: pays_id || 1,
          is_active: true
        })
        .eq('id', authData.user.id);

      await supabase
        .from('wallets')
        .insert([{ user_id: authData.user.id, balance: 0 }]);

      toast.success('Inscription réussie ! Vérifiez votre email.');
      return { success: true };
    } catch (error) {
      console.error('Signup error:', error);
      return { 
        success: false, 
        error: error.message || 'Échec de l\'inscription.' 
      };
    }
  };

  const resetPassword = async (email) => {
    try {
      if (!email) return { success: false, error: 'Veuillez entrer votre adresse email.' };

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return { success: false, error: 'Veuillez entrer une adresse email valide.' };
      }

      const cleanEmail = email.trim().toLowerCase();

      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;

      toast.success('Email de réinitialisation envoyé !');
      return { success: true };
    } catch (error) {
      console.error('Reset password error:', error);
      return { success: false, error: 'Erreur lors de l\'envoi.' };
    }
  };

  const updatePassword = async (newPassword) => {
    try {
      if (!newPassword || newPassword.length < 8) {
        return { success: false, error: 'Le mot de passe doit contenir au moins 8 caractères.' };
      }

      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;

      toast.success('Mot de passe mis à jour !');
      return { success: true };
    } catch (error) {
      console.error('Update password error:', error);
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    try {
      console.log('🚪 [Auth] Déconnexion en cours...');
      
      // Nettoyer le localStorage
      localStorage.clear();
      
      // Nettoyer le sessionStorage
      sessionStorage.clear();
      
      // Déconnexion Supabase
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ [Auth] Erreur signOut:', error);
      }
      
      // Mettre à jour l'état
      setUser(null);
      setProfile(null);
      
      console.log('✅ [Auth] Déconnexion réussie');
      toast.success('Déconnexion réussie');
      
      // Rediriger vers login
      window.location.href = '/login';
      
    } catch (error) {
      console.error('❌ [Auth] Logout error:', error);
      // En cas d'erreur, forcer la redirection
      window.location.href = '/login';
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!user) return { success: false, error: 'Vous devez être connecté.' };

      const { error } = await supabase
        .from('profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;
      
      await fetchProfile(user.id);
      toast.success('Profil mis à jour');
      return { success: true };
    } catch (error) {
      console.error('Update profile error:', error);
      return { success: false, error: 'Erreur lors de la mise à jour.' };
    }
  };

  const getUserProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Get user profile error:', error);
      return null;
    }
  };

  const isAdmin = () => profile?.role === 'admin' || profile?.role === 'super_admin';
  const isSuperAdmin = () => profile?.role === 'super_admin';
  const isTontinier = () => profile?.role === 'tontinier';

  const value = {
    user,
    profile,
    isAuthenticated: !!user,
    initialLoading,
    login,
    signup,
    logout,
    resetPassword,
    updatePassword,
    updateProfile,
    getUserProfile,
    isAdmin,
    isSuperAdmin,
    isTontinier,
    fetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};