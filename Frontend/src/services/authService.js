import { supabase } from '../lib/supabaseClient';

const listeners = new Set();

function notify(user) {
  listeners.forEach((callback) => callback(user));
}

function mapUser(user) {
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name:
      user.user_metadata?.name ||
      user.email?.split('@')[0] ||
      'User',
    role: user.user_metadata?.role || 'donor',
    bloodGroup: user.user_metadata?.bloodGroup || '',
    phone: user.user_metadata?.phone || '',
    city: user.user_metadata?.city || '',
    isAvailable: true,
    donationsCount: 0,
    livesSaved: 0,
    authVerified: true,
  };
}

export const authService = {
  subscribe(callback) {
    listeners.add(callback);

    return () => {
      listeners.delete(callback);
    };
  },

  async getCurrentUser() {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    return mapUser(user);
  },

  async login(email, password, role = 'donor') {
    const { data, error } =
      await supabase.auth.signInWithPassword({
        email,
        password,
      });

    if (error) throw error;

    const user = mapUser(data.user);

    if (user) {
      user.role = role;
    }

    notify(user);
    return user;
  },

  async signup({
    name,
    email,
    password,
    role,
    bloodGroup,
    phone,
    city,
  }) {
    const { data, error } =
      await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name || '',
            role: role || 'donor',
            bloodGroup: bloodGroup || '',
            phone: phone || '',
            city: city || '',
          },
        },
      });

    if (error) throw error;

    const user = data.user;

    if (!user) {
      throw new Error('Account could not be created.');
    }

    // Create the real donor profile in public.donors
    if ((role || 'donor') === 'donor') {
      const { error: donorError } =
        await supabase
          .from('donors')
          .insert({
            user_id: user.id,
            full_name: name,
            email,
            phone: phone || null,
            blood_group: bloodGroup,
            city: city || null,
            available: true,
            last_donation_date: null,
            latitude: null,
            longitude: null,
          });

      if (donorError) {
        console.error(
          'Donor profile creation error:',
          donorError
        );

        throw new Error(
          `Account created, but donor profile failed: ${donorError.message}`
        );
      }
    }

    const mappedUser = mapUser(user);

    notify(mappedUser);

    return mappedUser;
  },

  async logout() {
    const { error } = await supabase.auth.signOut();

    if (error) throw error;

    notify(null);
    return null;
  },

  async switchRole(role) {
    const { data, error } =
      await supabase.auth.updateUser({
        data: { role },
      });

    if (error) throw error;

    const user = mapUser(data.user);

    notify(user);

    return user;
  },
};