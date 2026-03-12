import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { User } from '@/types';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    async function fetchUser() {
        const token = localStorage.getItem('access_token');
        if (!token) {
            setLoading(false);
            return;
        }

        try {
            const res = await api.get('users/me');
            const userData = res.data;
            setUser(userData);
            localStorage.setItem('user_info', JSON.stringify(userData));
        } catch (err) {
            console.error('Failed to fetch user', err);
            // If it fails, maybe token is invalid, but Axios interceptor should handle 401
            const savedUser = localStorage.getItem('user_info');
            if (savedUser) {
                setUser(JSON.parse(savedUser));
            }
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchUser();
    }, []);

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
        setUser(null);
        router.push('/login');
    };

    return { user, loading, logout, setUser, fetchUser };
}
