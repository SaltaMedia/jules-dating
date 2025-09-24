'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '../../lib/api';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (error) {
      setError('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await apiClient.auth.login(formData);
      const { token, user } = response.data;
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Redirect to onboarding or chat
      if (user.settings?.aboutMe) {
        router.push('/chat');
      } else {
        router.push('/onboarding');
      }
    } catch (error: any) {
      // Handle different types of errors
      if (error.response?.status === 401) {
        setError('Invalid email or password. Please check your credentials and try again.');
      } else if (error.response?.status === 404) {
        setError('No account found with this email address. Please check your email or create a new account.');
      } else if (error.response?.status === 422) {
        setError('This account was created with Google. Please use the "Continue with Google" button to sign in.');
      } else if (error.response?.status === 409) {
        setError('Email already exists. Please try logging in or use "Forgot Password" to reset your account.');
      } else if (error.response?.status === 400) {
        setError('Please check your email and password format and try again.');
      } else if (error.response?.status >= 500) {
        setError('Server error. Please try again in a few moments or contact support if the problem persists.');
      } else if (error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error')) {
        setError('Connection error. Please check your internet connection and try again.');
      } else if (error.response?.data?.error) {
        // Use the specific error message from the server if available
        setError(error.response.data.error);
      } else {
        setError('Login failed. Please try again or contact support if the problem persists.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Use environment-specific API URL - ensure production URL is used in production
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:4002' : 'https://jules-dating-backend.onrender.com');
    console.log('🔧 OAuth Redirect:', `${apiUrl}/api/auth/google`);
    window.location.href = `${apiUrl}/api/auth/google`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center">
      <div className="bg-white/10 backdrop-blur-sm rounded-lg p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-6">
            <div className="text-center max-w-full -ml-3 sm:-ml-6 md:-ml-8">
              <div className="text-xs sm:text-base text-gray-400 mb-2 font-medium">beta</div>
              <img
                src="/Jules_Logo_White_Final_NoOutline.png"
                alt="Jules"
                className="h-32 w-auto max-w-full object-contain"
              />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome Back</h1>
          <p className="text-gray-300">Sign-in</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-gray-300 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-gray-300 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your password"
            />
            <div className="text-right mt-2">
              <Link href="/forgot-password" className="text-sm text-purple-400 hover:text-purple-300">
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-gray-300">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleGoogleLogin}
            className="w-full mt-4 bg-white text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200 flex items-center justify-center space-x-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-300">
            Don't have an account?{' '}
            <Link href="/register" className="text-purple-400 hover:text-purple-300 font-semibold">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 