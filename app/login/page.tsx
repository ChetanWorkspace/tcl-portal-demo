import LoginForm from './LoginForm';
import { Card } from '@/components/ui/Card';

export default function LoginPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50/50 p-6 md:p-10">
      <div className="w-full max-w-md space-y-8">
        <div className="flex flex-col items-center text-center space-y-2">
            <h1 className="text-3xl font-extrabold text-teal-600 tracking-loose">TCL-PORTAL</h1>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Welcome back</h1>
          <p className="text-sm text-slate-500 font-medium tracking-tight">Sign in to your account to manage orders</p>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
