import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { fetchAllWeapons } from '../weaponService';

export const useWeapons = () => {
    const { getToken } = useAuth();

    return useQuery({
        queryKey: ['weapons', 'all'], // specific key
        queryFn: async () => {
            const token = await getToken();
            // Fetch page 1 with 100 limit to ensure we get most weapons for the dropdown
            const data = await fetchAllWeapons(() => Promise.resolve(token), 1, 100);
            return data.weapons || [];
        },
        staleTime: 1000 * 60 * 5, // 5 minutes
    });
};
