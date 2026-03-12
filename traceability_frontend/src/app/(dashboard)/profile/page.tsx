'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    User as UserIcon, Mail, Shield, Lock,
    Save, Loader2, KeyRound, AlertCircle, Camera
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import api from '@/lib/api';
import toast from 'react-hot-toast';

export default function ProfilePage() {
    const { user, fetchUser } = useAuth();
    const [submitting, setSubmitting] = useState(false);
    const [passwordData, setPasswordData] = useState({
        old_password: '',
        new_password: '',
        confirm_password: ''
    });

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        if (passwordData.new_password !== passwordData.confirm_password) {
            return toast.error("New passwords don't match");
        }

        setSubmitting(true);
        try {
            await api.post('users/me/change-password', {
                old_password: passwordData.old_password,
                new_password: passwordData.new_password
            });
            toast.success('Password updated successfully');
            setPasswordData({ old_password: '', new_password: '', confirm_password: '' });
        } catch (err: any) {
            toast.error(err.response?.data?.detail || 'Failed to update password');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-8 font-sans pb-20">
            <header>
                <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 font-outfit">My Profile</h1>
                <p className="text-slate-500">Manage your personal account settings and security.</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile Overview */}
                <div className="lg:col-span-1 space-y-6">
                    <div className="glass dark:glass-dark rounded-[2.5rem] p-8 text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-24 bg-primary/10" />
                        <div className="relative pt-4">
                            <div className="w-32 h-32 rounded-[2.5rem] bg-slate-200 dark:bg-slate-800 mx-auto flex items-center justify-center border-4 border-white dark:border-slate-900 shadow-xl mb-6 group cursor-pointer">
                                <UserIcon className="w-16 h-16 text-slate-400 group-hover:text-primary transition-colors" />
                                <div className="absolute inset-x-0 bottom-4 flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="bg-primary p-2 rounded-xl text-white">
                                        <Camera className="w-4 h-4" />
                                    </div>
                                </div>
                            </div>
                            <h2 className="text-2xl font-bold dark:text-white font-outfit">{user?.full_name}</h2>
                            <p className="text-slate-500 mb-6">{user?.email}</p>

                            <div className="flex justify-center gap-2">
                                <div className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-black uppercase tracking-widest">
                                    <Shield className="w-3.5 h-3.5" />
                                    {user?.role}
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="glass dark:glass-dark rounded-[2.5rem] p-8">
                        <h3 className="text-lg font-bold dark:text-white mb-6 font-outfit">Account Status</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500 text-sm">Account Type</span>
                                <span className="text-slate-200 text-sm font-semibold">Standard Staff</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-slate-500 text-sm">Member Since</span>
                                <span className="text-slate-200 text-sm font-semibold">
                                    {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Account Settings */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Security Section */}
                    <div className="glass dark:glass-dark rounded-[2.5rem] p-8 lg:p-12">
                        <div className="flex items-center gap-4 mb-10">
                            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center">
                                <KeyRound className="w-6 h-6 text-amber-500" />
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold dark:text-white font-outfit">Security Settings</h3>
                                <p className="text-sm text-slate-500">Update your account password regularly.</p>
                            </div>
                        </div>

                        <form onSubmit={handlePasswordChange} className="max-w-md space-y-6">
                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-2 ml-1">Current Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary transition-all"
                                        placeholder="••••••••"
                                        value={passwordData.old_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, old_password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <hr className="border-slate-100 dark:border-slate-800 my-8" />

                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-2 ml-1">New Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary transition-all"
                                        placeholder="••••••••"
                                        value={passwordData.new_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, new_password: e.target.value })}
                                    />
                                </div>
                                <p className="mt-2 text-xs text-slate-500 ml-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" /> Minimum 8 characters
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-500 mb-2 ml-1">Confirm New Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-primary transition-colors" />
                                    <input
                                        type="password"
                                        required
                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:border-primary transition-all"
                                        placeholder="••••••••"
                                        value={passwordData.confirm_password}
                                        onChange={(e) => setPasswordData({ ...passwordData, confirm_password: e.target.value })}
                                    />
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 px-6 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 mt-4 group"
                            >
                                {submitting ? (
                                    <Loader2 className="w-6 h-6 animate-spin" />
                                ) : (
                                    <>
                                        Update Password
                                        <Save className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
