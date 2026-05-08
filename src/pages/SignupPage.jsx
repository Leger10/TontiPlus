import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Coins, User, Phone, Lock, AlertCircle, Globe } from 'lucide-react';
import { Helmet } from 'react-helmet';

const SignupPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    password: '',
    passwordConfirm: '',
    pays_id: ''
  });
  const [countries, setCountries] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signupWithPhone } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCountries = async () => {
      try {
        const { data, error } = await supabase
          .from('pays')
          .select('id, name')
          .order('name');
        
        if (error) throw error;
        setCountries(data || []);
      } catch (err) {
        console.error('Failed to fetch countries', err);
      }
    };
    fetchCountries();
  }, []);

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleCountryChange = (value) => {
    setFormData(prev => ({ ...prev, pays_id: value === 'none' ? null : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!formData.fullName || !formData.phone || !formData.password || !formData.passwordConfirm) {
      setError('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    if (formData.password.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      setError('Les mots de passe ne correspondent pas.');
      return;
    }

    setLoading(true);
    const result = await signupWithPhone(
      formData.fullName,
      formData.phone,
      formData.password,
      formData.passwordConfirm,
      formData.pays_id
    );
    setLoading(false);

    if (result.success) {
      navigate('/');
    } else {
      setError(result.error);
    }
  };

  return (
    <>
      <Helmet>
        <title>Inscription - BonPlan Tontine</title>
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-[#1a1a1a] p-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-[hsl(var(--accent))]/5 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-[hsl(var(--primary))]/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <Card className="w-full max-w-md premium-shadow z-10 border border-[#4a4a4a] bg-[#2d2d2d] mt-8 mb-8">
          <CardHeader className="space-y-4 text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-r from-amber-500 to-emerald-500 rounded-2xl flex items-center justify-center mb-2 shadow-lg">
              <Coins className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-2xl font-extrabold text-white tracking-tight">Créer un compte</CardTitle>
            <CardDescription className="text-[#b0b0b0] font-medium">
              Inscrivez-vous avec votre numéro de téléphone
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-sm font-medium text-red-500">{error}</p>
                </div>
              )}
              
              <div className="space-y-2">
                <Label htmlFor="fullName" className="text-white font-bold">Nom complet *</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#808080]" />
                  <Input
                    id="fullName"
                    name="fullName"
                    type="text"
                    placeholder="Jean Dupont"
                    value={formData.fullName}
                    onChange={handleChange}
                    className="pl-11"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone" className="text-white font-bold">Téléphone *</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#808080]" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+226 70 00 00 00"
                    value={formData.phone}
                    onChange={handleChange}
                    className="pl-11"
                    disabled={loading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="pays_id" className="text-white font-bold">Pays (Optionnel)</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#808080] z-10" />
                  <Select onValueChange={handleCountryChange} value={formData.pays_id || 'none'} disabled={loading}>
                    <SelectTrigger className="pl-11 bg-[#2d2d2d] border-[#4a4a4a] text-[#f5f5f5] focus:ring-amber-500">
                      <SelectValue placeholder="Sélectionnez votre pays" />
                    </SelectTrigger>
                    <SelectContent className="bg-[#2d2d2d] border-[#4a4a4a] text-[#f5f5f5]">
                      <SelectItem value="none">Non spécifié</SelectItem>
                      {countries.map(country => (
                        <SelectItem key={country.id} value={country.id}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-white font-bold">Mot de passe *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#808080]" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className="pl-11"
                    disabled={loading}
                  />
                </div>
                <p className="text-xs text-[#808080] font-medium">Minimum 8 caractères</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="passwordConfirm" className="text-white font-bold">Confirmer le mot de passe *</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#808080]" />
                  <Input
                    id="passwordConfirm"
                    name="passwordConfirm"
                    type="password"
                    placeholder="••••••••"
                    value={formData.passwordConfirm}
                    onChange={handleChange}
                    className="pl-11"
                    disabled={loading}
                  />
                </div>
              </div>
              
              <Button 
                type="submit" 
                className="w-full h-12 text-base font-bold mt-4 bg-gradient-to-r from-amber-500 to-emerald-500 hover:from-amber-600 hover:to-emerald-600 text-white"
                disabled={loading}
              >
                {loading ? 'Inscription en cours...' : "S'inscrire"}
              </Button>
              
              <div className="text-center text-sm font-medium mt-6 pt-6 border-t border-[#4a4a4a]">
                <span className="text-[#b0b0b0]">Déjà un compte ? </span>
                <Link to="/login" className="text-amber-500 font-bold hover:underline">
                  Se connecter
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default SignupPage;