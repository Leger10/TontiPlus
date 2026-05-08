import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Coins, Mail, AlertCircle, ArrowLeft, Send } from 'lucide-react';
import { Helmet } from 'react-helmet';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email) {
      setError('Veuillez entrer votre adresse email.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Veuillez entrer une adresse email valide.');
      return;
    }

    setLoading(true);
    const result = await resetPassword(email);
    setLoading(false);

    if (result.success && !result.error) {
      setEmailSent(true);
    } else if (result.error) {
      setError(result.error);
    }
  };

  if (emailSent) {
    return (
      <>
        <Helmet>
          <title>Email envoyé - BonPlan Tontine</title>
        </Helmet>
        
        <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] p-4">
          <Card className="w-full max-w-md bg-[#2d2d2d] border-[#4a4a4a]">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-4">
                <Send className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">Email envoyé !</CardTitle>
              <CardDescription className="text-[#b0b0b0]">
                Nous avons envoyé un lien de réinitialisation à<br />
                <span className="text-amber-500 font-bold">{email}</span>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-[#808080] text-center">
                Cliquez sur le lien dans l'email pour réinitialiser votre mot de passe. 
                Le lien expire dans 1 heure.
              </p>
              <Button 
                onClick={() => navigate('/login')}
                className="w-full bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600"
              >
                Retour à la connexion
              </Button>
              <div className="text-center">
                <button
                  onClick={() => setEmailSent(false)}
                  className="text-sm text-amber-500 hover:underline"
                >
                  Renvoyer l'email
                </button>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Mot de passe oublié - BonPlan Tontine</title>
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] p-4">
        <Card className="w-full max-w-md bg-[#2d2d2d] border-[#4a4a4a]">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-4">
              <Mail className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl text-white">Mot de passe oublié</CardTitle>
            <CardDescription className="text-[#b0b0b0]">
              Entrez votre email pour recevoir un lien de réinitialisation
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
                <Label htmlFor="email" className="text-white font-bold">Adresse email</Label>
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
              
              <Button 
                type="submit" 
                className="w-full h-12 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600"
                disabled={loading}
              >
                {loading ? 'Envoi en cours...' : 'Envoyer le lien de réinitialisation'}
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

export default ForgotPasswordPage;