export function getAuthErrorMessage(error: { message?: string; code?: string }): string {
  const code = error.code ?? '';
  const msg = (error.message ?? '').toLowerCase();

  if (code === 'email_not_confirmed' || msg.includes('email not confirmed')) {
    return 'Confirm your email using the link we sent, then sign in.';
  }
  if (
    code === 'invalid_credentials' ||
    msg.includes('invalid login credentials') ||
    msg.includes('invalid credentials')
  ) {
    return 'Invalid email or password.';
  }
  if (msg.includes('user already registered') || msg.includes('already been registered')) {
    return 'An account with this email already exists. Sign in instead.';
  }

  return error.message || 'Something went wrong.';
}
