import { createContext, useState, useEffect } from 'react';
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../services/api";
import { supabase } from "../services/supabase";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        try {
          const { data } = await supabase
            .from('users')
            .select('full_name, profile_image')
            .eq('email', currentUser.email)
            .maybeSingle();

          setUser({
            ...currentUser,
            displayName: data?.full_name || currentUser.displayName,
            photoURL: data?.profile_image || currentUser.photoURL
          });
        } catch (err) {
          console.error("Error enriching user profile:", err);
          setUser(currentUser);
        }
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  const refreshUser = async () => {
    if (auth.currentUser) {
      try {
        const { data } = await supabase
          .from('users')
          .select('full_name, profile_image')
          .eq('email', auth.currentUser.email)
          .maybeSingle();

        setUser({
          ...auth.currentUser,
          displayName: data?.full_name || auth.currentUser.displayName,
          photoURL: data?.profile_image || auth.currentUser.photoURL
        });
      } catch (err) {
        console.error("Error refreshing user profile:", err);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, setUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};
