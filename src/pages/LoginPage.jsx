import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, Mail, Lock, AlertCircle } from 'lucide-react';
import { Helmet } from 'react-helmet';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  // Rediriger si déjà connecté
  useEffect(() => {
    if (isAuthenticated && user) {
      console.log('✅ Déjà connecté, redirection vers home');
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      console.log('✅ Connexion réussie, redirection vers home');
      navigate('/', { replace: true });
    } else {
      setError(result.error);
    }
  };

  return (
    <>
      <Helmet>
        <title>Connexion - BonPlan Tontine</title>
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] p-4">
        <Card className="w-full max-w-md bg-[#2d2d2d] border-[#4a4a4a]">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-4">
              <Coins className="w-10 h-10 text-white" />
            </div>
            <CardTitle className="text-3xl text-white">Bienvenue</CardTitle>
            <CardDescription className="text-[#b0b0b0]">
              Connectez-vous avec votre email et mot de passe
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white font-bold">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#808080]" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11 bg-[#3a3a3a] border-[#4a4a4a] text-white"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-white font-bold">Mot de passe</Label>
                  <Link 
                    to="/forgot-password" 
                    className="text-xs text-amber-500 hover:underline"
                  >
                    Mot de passe oublié ?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#808080]" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 bg-[#3a3a3a] border-[#4a4a4a] text-white"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600"
                disabled={loading}
              >
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </Button>
              
              <div className="text-center text-sm">
                <span className="text-[#b0b0b0]">Pas encore de compte ? </span>
                <Link to="/signup" className="text-amber-500 font-bold hover:underline">
                  S'inscrire
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default LoginPage;