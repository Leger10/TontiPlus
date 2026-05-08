import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import BottomNavigation from '@/components/BottomNavigation';
import { User, LogOut, Save } from 'lucide-react';
import { Helmet } from 'react-helmet';
import { toast } from 'sonner';
import BackButton from '@/components/BackButton.jsx';

const ProfilePage = () => {
  const { user, profile, logout, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    email: user?.email || '',
    phone: profile?.phone || ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSave = async () => {
    if (!formData.full_name) {
      toast.error('Le nom est requis');
      return;
    }

    try {
      setSaving(true);
      const result = await updateProfile({
        full_name: formData.full_name,
        phone: formData.phone
      });

      if (result.success) {
        toast.success('Profil mis à jour');
        setEditing(false);
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Échec de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('Êtes-vous sûr de vouloir vous déconnecter ?')) {
      logout();
    }
  };

  const getUserName = () => {
    return profile?.full_name || user?.email?.split('@')[0] || 'Utilisateur';
  };

  const getUserEmail = () => {
    return user?.email || '';
  };

  return (
    <>
      <Helmet>
        <title>Profil - BonPlan Tontine</title>
        <meta name="description" content="Gérez votre profil et vos paramètres." />
      </Helmet>
      
      <div className="min-h-screen bg-[#1a1a1a] pb-24">
        <div className="bg-[#2d2d2d] text-white pt-10 pb-16 px-4 rounded-b-[2.5rem] border-b border-[hsl(var(--accent))] premium-shadow relative overflow-hidden">
          <div className="absolute top-4 left-4 z-20">
            <BackButton className="text-[#f5f5f5] hover:text-white hover:bg-[#4a4a4a]" />
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-[hsl(var(--accent))]/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
          <div className="max-w-lg mx-auto text-center relative z-10">
            <div className="w-24 h-24 bg-[#1a1a1a] border-2 border-[hsl(var(--accent))] rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_4px_20px_rgba(212,175,55,0.2)]">
              <User className="w-12 h-12 text-[hsl(var(--accent))]" />
            </div>
            <h1 className="text-3xl font-extrabold mb-1 text-white">{getUserName()}</h1>
            <p className="text-[#b0b0b0] font-medium">{getUserEmail()}</p>
            {profile?.phone && (
              <p className="text-[#808080] text-sm mt-1">{profile.phone}</p>
            )}
          </div>
        </div>

        <div className="max-w-lg mx-auto px-4 -mt-8 space-y-6 relative z-20">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Informations personnelles</CardTitle>
                {!editing && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditing(true)}
                  >
                    Modifier
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="font-bold">Nom complet</Label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  disabled={!editing}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="font-bold">Email</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">L'email ne peut pas être modifié</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone" className="font-bold">Téléphone</Label>
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={!editing}
                  placeholder="+226 XX XX XX XX"
                />
              </div>

              {editing && (
                <div className="flex gap-4 pt-4 border-t border-[#4a4a4a]">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditing(false);
                      setFormData({
                        full_name: profile?.full_name || '',
                        email: user?.email || '',
                        phone: profile?.phone || ''
                      });
                    }}
                    disabled={saving}
                    className="flex-1"
                  >
                    Annuler
                  </Button>
                  <Button
                    variant="premium"
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Enregistrement...' : 'Enregistrer'}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Paramètres du compte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-[#2d2d2d] border border-[#4a4a4a] rounded-xl shadow-inner">
                <div>
                  <p className="font-bold text-white">Langue</p>
                  <p className="text-sm text-[#b0b0b0] font-medium">Français</p>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-[#2d2d2d] border border-[#4a4a4a] rounded-xl shadow-inner">
                <div>
                  <p className="font-bold text-white">Notifications</p>
                  <p className="text-sm text-[#b0b0b0] font-medium">Activées</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-[hsl(var(--destructive))]/30">
            <CardContent className="p-6">
              <Button
                variant="destructive"
                onClick={handleLogout}
                className="w-full h-12 text-base font-bold"
              >
                <LogOut className="w-5 h-5 mr-2" />
                Se déconnecter
              </Button>
            </CardContent>
          </Card>
        </div>

        <BottomNavigation />
      </div>
    </>
  );
};

export default ProfilePage;