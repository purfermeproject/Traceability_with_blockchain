'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, UserPlus, Mail, Shield, CheckCircle2, XCircle,
    Search, Edit2, X, Loader2, Lock, User as UserIcon,
    AlertCircle, Trash2
} from 'lucide-react';
import api from '@/lib/api';
import { User, UserRole } from '@/types';
import toast from 'react-hot-toast';

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Modal state
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [currentUser, setCurrentUser] = useState<User | null>(null);

    // Form state
    const [formData, setFormData] = useState({
        email: '',
        full_name: '',
        password: '',
        role: 'ADMIN' as UserRole
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            const res = await api.get('users');
            setUsers(res.data);
        } catch (err) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    }

    const handleAddUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            await api.post('users', formData);
            toast.success('User onboarded successfully');
            setIsAddModalOpen(false);
            setFormData({ email: '', full_name: '', password: '', role: 'ADMIN' });
            fetchUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to onboard user');
        } finally {
            setSubmitting(false);
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;
        setSubmitting(true);
        try {
            await api.patch(`users/${currentUser.id}`, {
                full_name: formData.full_name,
                role: formData.role
            });
            toast.success('User updated successfully');
            setIsEditModalOpen(false);
            fetchUsers();
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to update user');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleStatus = async (user: User) => {
        const action = user.is_active ? 'deactivate' : 'activate';
        if (!confirm(`Are you sure you want to ${action} ${user.full_name}?`)) return;

        try {
            if (user.is_active) {
                await api.delete(`users/${user.id}`);
                toast.success('User deactivated');
            } else {
                await api.patch(`users/${user.id}`, { is_active: true });
                toast.success('User activated');
            }
            fetchUsers();
        } catch (err) {
            toast.error('Failed to update user status');
        }
    };

    const openEditModal = (user: User) => {
        setCurrentUser(user);
        setFormData({
            email: user.email,
            full_name: user.full_name,
            password: '',
            role: user.role
        });
        setIsEditModalOpen(true);
    };

    const filteredUsers = users.filter(u =>
        u.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (role: string) => {
        const styles: any = {
            'SUPER_ADMIN': 'bg-purple-500/10 text-purple-500 border-purple-500/20',
            'ADMIN': 'bg-blue-500/10 text-blue-500 border-blue-500/20',
            'QA': 'bg-amber-500/10 text-amber-500 border-amber-500/20',
            'FARMER': 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
        };
        return styles[role] || 'bg-slate-500/10 text-slate-500 border-slate-500/20';
    };

    return (
        <div className="space-y-8 font-sans pb-20">
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-outfit">Staff & Roles</h1>
                    <p className="text-slate-500">Manage internal access levels and platform administrators.</p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-primary/20 group"
                >
                    <UserPlus className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    Onboard User
                </button>
            </header>

            <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                <input
                    type="text"
                    placeholder="Search staff by name or email..."
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary transition-all shadow-sm"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <AnimatePresence>
                    {filteredUsers.map((u, idx) => (
                        <motion.div
                            key={u.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            className="glass dark:glass-dark rounded-[2rem] p-6 group hover:border-primary/50 transition-all border border-transparent"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-black text-slate-500 group-hover:bg-primary group-hover:text-white transition-all">
                                    {u.full_name.charAt(0)}
                                </div>
                                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getRoleBadge(u.role)}`}>
                                    <Shield className="w-3 h-3" />
                                    {u.role}
                                </div>
                            </div>

                            <div className="space-y-1 mb-6">
                                <h3 className="text-xl font-bold dark:text-white font-outfit">{u.full_name}</h3>
                                <div className="flex items-center gap-2 text-sm text-slate-500">
                                    <Mail className="w-4 h-4" />
                                    {u.email}
                                </div>
                            </div>

                            <div className="flex items-center justify-between pt-6 border-t border-slate-100 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => handleToggleStatus(u)}
                                        className={`flex items-center gap-1.5 text-xs font-bold transition-colors ${u.is_active ? 'text-emerald-500 hover:text-red-500' : 'text-red-500 hover:text-emerald-500'}`}
                                    >
                                        {u.is_active ? (
                                            <>
                                                <CheckCircle2 className="w-4 h-4" /> Active
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-4 h-4" /> Suspended
                                            </>
                                        )}
                                    </button>
                                </div>
                                <button
                                    onClick={() => openEditModal(u)}
                                    className="p-2 hover:bg-primary/10 hover:text-primary rounded-xl transition-all"
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {(isAddModalOpen || isEditModalOpen) && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            className="bg-white dark:bg-slate-900 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
                        >
                            <div className="p-8">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-2xl font-bold dark:text-white font-outfit">
                                        {isAddModalOpen ? 'Onboard New Staff' : 'Update Staff Member'}
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setIsAddModalOpen(false);
                                            setIsEditModalOpen(false);
                                        }}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                                    >
                                        <X className="w-6 h-6 dark:text-slate-400" />
                                    </button>
                                </div>

                                <form onSubmit={isAddModalOpen ? handleAddUser : handleUpdateUser} className="space-y-6">
                                    <div>
                                        <label className="block text-sm font-bold text-slate-500 mb-2 ml-1">Full Name</label>
                                        <div className="relative group">
                                            <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="text"
                                                required
                                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary transition-all"
                                                placeholder="John Doe"
                                                value={formData.full_name}
                                                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-bold text-slate-500 mb-2 ml-1">Email Address</label>
                                        <div className="relative group">
                                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            <input
                                                type="email"
                                                required
                                                disabled={isEditModalOpen}
                                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary transition-all disabled:opacity-50"
                                                placeholder="john@purferme.com"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    {isAddModalOpen && (
                                        <div>
                                            <label className="block text-sm font-bold text-slate-500 mb-2 ml-1">Password</label>
                                            <div className="relative group">
                                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                                <input
                                                    type="password"
                                                    required
                                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary transition-all"
                                                    placeholder="••••••••"
                                                    value={formData.password}
                                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                />
                                            </div>
                                            <p className="mt-2 text-xs text-slate-500 ml-1 flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3" /> Minimum 8 characters
                                            </p>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-bold text-slate-500 mb-2 ml-1">Platform Role</label>
                                        <div className="relative group">
                                            <Shield className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                            <select
                                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary transition-all appearance-none"
                                                value={formData.role}
                                                onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                                            >
                                                <option value="ADMIN">ADMIN - General Staff</option>
                                                <option value="QA">QA - Quality Inspector</option>
                                                <option value="FARMER">FARMER - Field Manager</option>
                                                <option value="SUPER_ADMIN">SUPER_ADMIN - Full Access</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="pt-4 flex gap-4">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setIsAddModalOpen(false);
                                                setIsEditModalOpen(false);
                                            }}
                                            className="flex-1 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-white font-bold py-4 px-6 rounded-2xl transition-all"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="flex-1 bg-primary hover:bg-primary-dark text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-50"
                                        >
                                            {submitting ? (
                                                <Loader2 className="w-6 h-6 animate-spin" />
                                            ) : (
                                                isAddModalOpen ? 'Onboard User' : 'Save Changes'
                                            )}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {loading && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-60 bg-slate-100 dark:bg-slate-900 animate-pulse rounded-[2rem]" />)}
                </div>
            )}

            {!loading && filteredUsers.length === 0 && (
                <div className="py-20 text-center glass rounded-[2rem]">
                    <Users className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">No users found matching your search.</p>
                </div>
            )}
        </div>
    );
}
