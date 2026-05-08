import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, Lock, AlertCircle, ArrowLeft, CheckCircle } from 'lucide-react';
import { Helmet } from 'react-helmet';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const { updatePassword } = useAuth();
  
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur a un token de réinitialisation actif
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsValidToken(false);
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!newPassword || !confirmPassword) {
      setError('Veuillez remplir tous les champs.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    const result = await updatePassword(newPassword);
    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } else {
      setError(result.error);
    }
  };

  if (!isValidToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] p-4">
        <Card className="w-full max-w-md bg-[#2d2d2d] border-[#4a4a4a]">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <CardTitle className="text-2xl text-white">Lien invalide</CardTitle>
            <CardDescription className="text-[#b0b0b0]">
              Ce lien de réinitialisation est invalide ou a expiré.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild className="w-full">
              <Link to="/forgot-password">Faire une nouvelle demande</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] p-4">
        <Card className="w-full max-w-md bg-[#2d2d2d] border-[#4a4a4a]">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-500" />
            </div>
            <CardTitle className="text-2xl text-white">Mot de passe mis à jour !</CardTitle>
            <CardDescription className="text-[#b0b0b0]">
              Votre mot de passe a été modifié avec succès.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <p className="text-sm text-[#808080] mb-4">
              Vous allez être redirigé vers la page de connexion...
            </p>
            <Button asChild className="w-full">
              <Link to="/login">Se connecter maintenant</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Réinitialisation du mot de passe - BonPlan Tontine</title>
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] p-4">
        <Card className="w-full max-w-md bg-[#2d2d2d] border-[#4a4a4a]">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">Nouveau mot de passe</CardTitle>
            <CardDescription className="text-[#b0b0b0]">
              Créez votre nouveau mot de passe
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
                <Label htmlFor="newPassword" className="text-white font-bold">Nouveau mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#808080]" />
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="••••••••"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="pl-11 bg-[#3a3a3a] border-[#4a4a4a] text-white"
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-[#808080]">Minimum 8 caractères</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white font-bold">Confirmer le mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#808080]" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                {loading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
              </Button>
              
              <div className="text-center">
                <Link to="/login" className="text-sm text-amber-500 hover:underline flex items-center justify-center gap-2">
                  <ArrowLeft className="w-4 h-4" /> Retour à la connexion
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default ResetPasswordPage;