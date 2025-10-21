import { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

type UserProfile = {
  id: string;
  restaurant_name: string;
  plan: "Básico" | "Profissional" | "Premium";
  role: "user" | "admin";
  logo_url?: string;
  primary_color?: string;
  font_family?: string;
  whatsapp_number?: string;
  subscription_renews_at?: string;
};

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  restaurantId: string | null;
  refetchProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchProfileAndRestaurantId = useCallback(async (user: User) => {
    const { data: teamMemberData } = await supabase
      .from('team_members')
      .select('restaurant_id')
      .eq('user_id', user.id)
      .single();

    const currentRestaurantId = teamMemberData ? teamMemberData.restaurant_id : user.id;
    setRestaurantId(currentRestaurantId);

    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentRestaurantId)
      .single();

    if (profileData) {
      setProfile(profileData);
    } else if (profileError) {
      console.error("Erro ao buscar perfil do restaurante:", profileError.message);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const fetchSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setSession(session);
        setUser(session.user);
        await fetchProfileAndRestaurantId(session.user);
      }
      setLoading(false);
    };

    fetchSessionAndProfile();

    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (event === 'SIGNED_IN' && session) {
        await fetchProfileAndRestaurantId(session.user);
        navigate('/dashboard');
      }
      
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setRestaurantId(null);
        navigate('/login');
      }
      if (event !== 'INITIAL_SESSION') {
        setLoading(false);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [navigate, fetchProfileAndRestaurantId]);

  const refetchProfile = useCallback(async () => {
    if (user) {
      await fetchProfileAndRestaurantId(user);
    }
  }, [user, fetchProfileAndRestaurantId]);

  const value = {
    session,
    user,
    profile,
    loading,
    restaurantId,
    refetchProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};