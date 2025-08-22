'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Shield, Building2, Users, UserCheck } from 'lucide-react';
import { FormEvent } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'owner' | 'labourer'>('labourer');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const result = await login(email, password, role);
      if (result.success) {
        // Redirect based on role
        if (role === 'admin') {
          router.push('/admin');
        } else if (role === 'owner') {
          router.push('/owner');
        } else {
          router.push('/dashboard');
        }
      } else {
        setError(result.message || 'Login failed');
      }
    } catch (error) {
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const roleOptions = [
    {
      value: 'admin' as const,
      label: 'Admin',
      description: 'System administrator',
      icon: Shield,
      color: 'bg-red-500 hover:bg-red-600',
      borderColor: 'border-red-200'
    },
    {
      value: 'owner' as const,
      label: 'Factory Owner',
      description: 'Factory manager',
      icon: Building2,
      color: 'bg-green-500 hover:bg-green-600',
      borderColor: 'border-green-200'
    },
    {
      value: 'labourer' as const,
      label: 'Labourer',
      description: 'Factory worker',
      icon: Users,
      color: 'bg-blue-500 hover:bg-blue-600',
      borderColor: 'border-blue-200'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-16 w-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-white">S</span>
          </div>
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
          <p className="text-gray-600">Sign in to your account</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Role Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Your Role
              </label>
              <div className="grid grid-cols-3 gap-3">
                {roleOptions.map((option) => {
                  const IconComponent = option.icon;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setRole(option.value)}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 text-center ${
                        role === option.value
                          ? `${option.borderColor} bg-gradient-to-br from-gray-50 to-white shadow-md`
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      <IconComponent className={`w-6 h-6 mx-auto mb-2 ${
                        role === option.value ? 'text-gray-700' : 'text-gray-500'
                      }`} />
                      <div className={`text-xs font-medium ${
                        role === option.value ? 'text-gray-900' : 'text-gray-600'
                      }`}>
                        {option.label}
                      </div>
                      <div className={`text-xs ${
                        role === option.value ? 'text-gray-600' : 'text-gray-400'
                      }`}>
                        {option.description}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <input
                  id="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Enter your email"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors duration-200"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className={`w-full py-3 px-4 rounded-xl font-medium text-white transition-all duration-200 ${
                role === 'admin' ? 'bg-red-500 hover:bg-red-600 disabled:bg-red-400' :
                role === 'owner' ? 'bg-green-500 hover:bg-green-600 disabled:bg-green-400' :
                'bg-blue-500 hover:bg-blue-600 disabled:bg-blue-400'
              } ${isLoading ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center justify-center">
                  <UserCheck className="w-5 h-5 mr-2" />
                  Sign In
                </div>
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 bg-gray-50 rounded-xl">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Demo Credentials</h4>
            <div className="space-y-2 text-xs text-gray-600">
              <div><strong>Admin:</strong> admin@steel.com / admin123</div>
              <div><strong>Owner:</strong> owner@steelfactory.com / owner123</div>
              <div><strong>Labourer:</strong> labourer1@steelfactory.com / labourer1</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <span className="text-orange-600 font-medium">
              Contact your administrator
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}