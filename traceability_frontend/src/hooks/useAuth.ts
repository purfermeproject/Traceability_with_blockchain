import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { User } from '@/types';

export function useAuth() {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        async function fetchUser() {
            const token = localStorage.getItem('access_token');
            if (!token) {
                setLoading(false);
                return;
            }

            try {
                // Assuming we have a me endpoint or we can decode token
                // For now let's just use the users list or a specific me endpoint if we had one
                // Let's assume we store user info initially in localStorage for speed
                const savedUser = localStorage.getItem('user_info');
                if (savedUser) {
                    setUser(JSON.parse(savedUser));
                }
            } catch (err) {
                console.error('Failed to fetch user', err);
            } finally {
                setLoading(false);
            }
        }

        fetchUser();
    }, []);

    const logout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
        setUser(null);
        router.push('/login');
    };

    return { user, loading, logout, setUser };
}
