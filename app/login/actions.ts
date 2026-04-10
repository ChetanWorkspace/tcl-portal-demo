'use server';

import { createClient } from '@/utils/supabase/server';
import { getAuthErrorMessage } from '@/utils/auth-errors';

export async function authenticate(_prev: unknown, formData: FormData) {
  const intent = formData.get('intent') as string | null;
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();

  if (intent === 'signin') {
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { error: getAuthErrorMessage(error) };
    }

    return { success: 'Login successful' };
  }

  if (intent === 'signup') {
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return { error: getAuthErrorMessage(error) };
    }

    if (!data.session) {
      return { success: 'Check your email to confirm your account' };
    }

    return { success: 'Account created successfully' };
  }

  return { error: 'Something went wrong. Please try again.' };
}
