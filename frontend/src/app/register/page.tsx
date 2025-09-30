'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { apiClient } from '../../lib/api';
import { track } from '@/analytics/client';

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [passwordStrength, setPasswordStrength] = useState('');
  const router = useRouter();

  // Check password strength
  const checkPasswordStrength = (password: string) => {
    if (password.length === 0) return '';
    if (password.length < 6) return 'Too short';
    
    const hasLower = /[a-z]/.test(password);
    const hasUpper = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    
    const strength = [hasLower, hasUpper, hasNumber].filter(Boolean).length;
    
    if (strength === 3) return 'Strong';
    if (strength === 2) return 'Medium';
    return 'Weak';
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    
    // Update password strength when password changes
    if (name === 'password') {
      setPasswordStrength(checkPasswordStrength(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    // Client-side validation
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setIsLoading(false);
      return;
    }

    // Check password requirements
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
    if (!passwordRegex.test(formData.password)) {
      setError('Password must contain at least one uppercase letter, one lowercase letter, and one number');
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.auth.register({
        name: formData.name,
        email: formData.email,
        password: formData.password
      });
      
      const { token, user } = response.data;
      
      // Get registration source from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const source = urlParams.get('source') || 'register_page';
      const feature = urlParams.get('feature') || 'general';
      
      // Track account creation
      track('account_created', { 
        source: source,
        feature: feature,
        has_name: !!formData.name,
        has_email: !!formData.email,
        category: 'conversion',
        action: 'account_created'
      });
      
      // Store token in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // Check for pending fit check data
      const pendingFitCheck = localStorage.getItem('pendingFitCheck');
      if (pendingFitCheck) {
        // Save the fit check to the user's account
        try {
          const fitCheckData = JSON.parse(pendingFitCheck);
          await apiClient.fitChecks.submitFitCheck({
            imageUrl: fitCheckData.originalImageUrl,
            eventContext: fitCheckData.eventContext || 'General outfit feedback',
            specificQuestion: fitCheckData.specificQuestion,
            analysis: fitCheckData.analysis
          });
          
          // Clear pending fit check
          localStorage.removeItem('pendingFitCheck');
          
          // Redirect to onboarding (fit check is now saved in their account)
          router.push('/onboarding');
        } catch (fitCheckError) {
          console.error('Failed to save fit check:', fitCheckError);
          // Still redirect to onboarding, but the fit check won't be saved
          router.push('/onboarding');
        }
        } else {
          // No pending fit check, redirect to onboarding
          router.push('/onboarding');
        }
    } catch (error: any) {
      console.error('Registration error:', error.response?.data);
      
      // Handle specific error cases
      if (error.response?.status === 409) {
        setError('An account with this email already exists. Please try logging in instead.');
      } else if (error.response?.data?.details) {
        // Handle validation errors
        const validationErrors = error.response.data.details.map((err: any) => err.message).join(', ');
        setError(`Validation error: ${validationErrors}`);
      } else if (error.response?.data?.message) {
        setError(error.response.data.message);
      } else {
        setError('Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // Use environment-specific API URL - ensure production URL is used in production
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' && window.location.hostname === 'localhost' ? 'http://localhost:4002' : 'https://jules-dating.onrender.com');
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
          <p className="text-gray-300">Create your account to get started</p>
        </div>

        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 p-3 rounded-lg mb-6">
            <p>{error}</p>
            {error.includes('already exists') && (
              <p className="mt-2">
                <Link href="/login" className="text-purple-300 hover:text-purple-200 underline">
                  Click here to log in instead
                </Link>
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-gray-300 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Enter your full name"
            />
          </div>

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
              minLength={6}
              className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-gray-300 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Create a password (min 6 characters)"
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-400">
                Password must contain at least one uppercase letter, one lowercase letter, and one number
              </p>
              {passwordStrength && (
                <span className={`text-xs px-2 py-1 rounded ${
                  passwordStrength === 'Strong' ? 'bg-green-500/20 text-green-300' :
                  passwordStrength === 'Medium' ? 'bg-yellow-500/20 text-yellow-300' :
                  'bg-red-500/20 text-red-300'
                }`}>
                  {passwordStrength}
                </span>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              className="w-full px-4 py-3 bg-white/20 backdrop-blur-sm text-white placeholder-gray-300 border border-white/20 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? 'Creating account...' : 'Create Account'}
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
            Already have an account?{' '}
            <Link href="/login" className="text-purple-400 hover:text-purple-300 font-semibold">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 