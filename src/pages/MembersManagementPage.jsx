import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, ShieldAlert, Mail, Ban, UserCheck, UserX } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const MembersManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isSuspendModalOpen, setIsSuspendModalOpen] = useState(false);
  const [newRole, setNewRole] = useState('');
  const [suspensionReason, setSuspensionReason] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          pays:pays(name, code)
        `)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser) return;
    setProcessing(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole, updated_at: new Date().toISOString() })
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      
      toast.success(`Rôle modifié en "${newRole}"`);
      setIsRoleModalOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error("Erreur lors de la modification du rôle");
    } finally {
      setProcessing(false);
    }
  };

  const handleSuspendUser = async () => {
    if (!selectedUser) return;
    setProcessing(true);
    try {
      const isActive = selectedUser.is_active !== false;
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_active: !isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', selectedUser.id);
      
      if (error) throw error;
      
      toast.success(`Utilisateur ${isActive ? 'suspendu' : 'réactivé'} avec succès`);
      setIsSuspendModalOpen(false);
      setSuspensionReason('');
      fetchUsers();
    } catch (error) {
      console.error('Error suspending user:', error);
      toast.error("Erreur lors de la suspension");
    } finally {
      setProcessing(false);
    }
  };

  const sendEmail = async (user) => {
    // Cette fonction peut être implémentée avec un service email
    toast.info(`Fonction d'envoi d'email à ${user.email} à implémenter`);
  };

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role || 'member');
    setIsRoleModalOpen(true);
  };

  const openSuspendModal = (user) => {
    setSelectedUser(user);
    setSuspensionReason('');
    setIsSuspendModalOpen(true);
  };

  const filteredUsers = users.filter(u => 
    u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
    u.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleBadgeClass = (role) => {
    const classes = {
      'super_admin': 'bg-purple-500 text-white',
      'admin': 'bg-red-500 text-white',
      'tontinier': 'bg-blue-500 text-white',
      'pays_secretaire': 'bg-green-500 text-white',
      'secretaire_national': 'bg-orange-500 text-white',
      'member': 'bg-gray-500 text-white'
    };
    return classes[role] || 'bg-gray-500 text-white';
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Helmet><title>Gestion des Membres - Admin</title></Helmet>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gestion des Membres</h1>
          <p className="text-muted-foreground mt-1">Annuaire global des utilisateurs.</p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher par nom ou email..." 
              className="pl-9 bg-background"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Téléphone</TableHead>
                <TableHead>Pays</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date inscription</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8">Chargement...</TableCell></TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Aucun membre trouvé.</TableCell></TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/20">
                    <TableCell className="font-medium">{user.full_name || 'Sans nom'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.phone || '-'}</TableCell>
                    <TableCell>{user.pays?.name || '-'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeClass(user.role)}`}>
                        {user.role || 'member'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {user.is_active !== false ? (
                        <span className="text-green-600 text-sm">Actif</span>
                      ) : (
                        <span className="text-red-600 text-sm">Suspendu</span>
                      )}
                    </TableCell>
                    <TableCell>{formatDate(user.created_at)}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => sendEmail(user)}
                          title="Envoyer un email"
                        >
                          <Mail className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openRoleModal(user)}
                          title="Changer le rôle"
                          className="text-warning hover:text-warning hover:bg-warning/10"
                        >
                          <ShieldAlert className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => openSuspendModal(user)}
                          title={user.is_active !== false ? "Suspendre" : "Réactiver"}
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          {user.is_active !== false ? <Ban className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />}
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Modal de changement de rôle */}
      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Modifier le rôle</DialogTitle>
            <DialogDescription>
              Modifier le rôle de {selectedUser?.full_name || selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nouveau rôle</Label>
              <Select value={newRole} onValueChange={setNewRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Membre</SelectItem>
                  <SelectItem value="tontinier">Tontinier</SelectItem>
                  <SelectItem value="pays_secretaire">Secrétaire Pays</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="super_admin">Super Admin</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRoleModalOpen(false)}>Annuler</Button>
            <Button onClick={handleRoleChange} disabled={processing}>
              {processing ? 'Modification...' : 'Modifier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de suspension */}
      <Dialog open={isSuspendModalOpen} onOpenChange={setIsSuspendModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.is_active !== false ? 'Suspendre le membre' : 'Réactiver le membre'}
            </DialogTitle>
            <DialogDescription>
              {selectedUser?.is_active !== false 
                ? `Êtes-vous sûr de vouloir suspendre ${selectedUser?.full_name || selectedUser?.email} ?`
                : `Êtes-vous sûr de vouloir réactiver ${selectedUser?.full_name || selectedUser?.email} ?`}
            </DialogDescription>
          </DialogHeader>
          {selectedUser?.is_active !== false && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Motif de suspension (optionnel)</Label>
                <Input
                  placeholder="Ex: Non-respect des conditions d'utilisation"
                  value={suspensionReason}
                  onChange={(e) => setSuspensionReason(e.target.value)}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSuspendModalOpen(false)}>Annuler</Button>
            <Button 
              variant={selectedUser?.is_active !== false ? "destructive" : "default"} 
              onClick={handleSuspendUser} 
              disabled={processing}
            >
              {processing ? 'Traitement...' : (selectedUser?.is_active !== false ? 'Suspendre' : 'Réactiver')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MembersManagementPage;