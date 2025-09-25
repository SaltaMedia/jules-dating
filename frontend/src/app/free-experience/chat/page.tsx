'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import Link from 'next/link';
import { track } from '@/analytics/client';
import MessageCounter from '../components/MessageCounter';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  products?: Product[];
  allProducts?: Product[];
  images?: StyleImage[];
  hasMoreProducts?: boolean;
  hasMore?: boolean;
  totalFound?: number;
}

interface Product {
  title: string;
  link: string;
  image: string;
  price: string;
  description: string;
  brand?: string;
}

interface StyleImage {
  id: string;
  url?: string;
  image?: string;
  thumb?: string;
  thumbnail?: string;
  alt?: string;
  title?: string;
  photographer?: string;
  photographerUrl?: string;
  downloadUrl?: string;
  width?: number;
  height?: number;
}

interface ChatResponse {
  response: string;
  intent: string;
  products: Product[];
  allProducts: Product[];
  images: StyleImage[];
  hasMoreProducts: boolean;
  isAnonymous: boolean;
  remainingUsage: { chatMessages: number };
  showConversionPrompt: boolean;
}

function AnonymousChatPageContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [anonymousSessionId, setAnonymousSessionId] = useState<string>('');
  const [remainingMessages, setRemainingMessages] = useState<number>(5);
  const [showConversionPrompt, setShowConversionPrompt] = useState(false);
  const [hasReachedLimit, setHasReachedLimit] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const router = useRouter();

  // Focus input on mount and after messages are sent
  useEffect(() => {
    if (inputRef.current && !isLoading) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    // Track page view
    track('page_view', {
      page: '/free-experience/chat',
      category: 'free_experience',
      action: 'anonymous_chat_opened'
    });

    // Generate or retrieve anonymous session ID
    let sessionId = localStorage.getItem('anonymous-session-id');
    if (!sessionId) {
      sessionId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('anonymous-session-id', sessionId);
    }
    setAnonymousSessionId(sessionId);

    // Load any existing messages for this session
    const savedMessages = localStorage.getItem(`anonymous-messages-${sessionId}`);
    if (savedMessages) {
      try {
        const parsedMessages = JSON.parse(savedMessages);
        setMessages(parsedMessages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
        
        // Calculate remaining messages
        const userMessages = parsedMessages.filter((msg: any) => msg.role === 'user').length;
        const remaining = Math.max(0, 5 - userMessages);
        setRemainingMessages(remaining);
        
        if (remaining === 0) {
          setHasReachedLimit(true);
          setShowConversionPrompt(true);
        }
      } catch (error) {
        console.error('Error loading saved messages:', error);
      }
    }

    scrollToBottom();
  }, []);

  useEffect(() => {
    // Save messages to localStorage
    if (messages.length > 0 && anonymousSessionId) {
      localStorage.setItem(`anonymous-messages-${anonymousSessionId}`, JSON.stringify(messages));
    }
  }, [messages, anonymousSessionId]);

  useEffect(() => {
    // Scroll when new messages are added
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading || hasReachedLimit) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    
    // Update remaining messages
    const newRemaining = Math.max(0, remainingMessages - 1);
    setRemainingMessages(newRemaining);

    // Track chat message sent
    track('anonymous_chat_message_sent', { 
      author: 'user', 
      content_type: 'text',
      message_length: input.trim().length,
      remaining_messages: newRemaining
    });

    try {
      const response = await fetch('/api/chat/anonymous', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Anonymous-Session': anonymousSessionId
        },
        body: JSON.stringify({
          message: input.trim(),
          context: messages.map(msg => ({ role: msg.role, content: msg.content }))
        })
      });

      if (!response.ok) {
        if (response.status === 429) {
          // Rate limit reached
          setHasReachedLimit(true);
          setShowConversionPrompt(true);
          const errorMessage: Message = {
            role: 'assistant',
            content: 'You\'ve reached your free message limit! Sign up to continue chatting with Jules.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
          return;
        }
        throw new Error('Failed to send message');
      }

      const data: ChatResponse = await response.json();
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        products: data.products,
        allProducts: data.allProducts,
        images: data.images,
        hasMoreProducts: data.hasMoreProducts
      };

      setMessages(prev => [...prev, assistantMessage]);
      
      // Update remaining usage from response
      if (data.remainingUsage) {
        setRemainingMessages(data.remainingUsage.chatMessages);
      }
      
      // Check if conversion prompt should be shown
      if (data.showConversionPrompt) {
        setShowConversionPrompt(true);
        setHasReachedLimit(true);
      }

      // Track if products were shown
      if (data.products && data.products.length > 0) {
        track('anonymous_products_shown', {
          product_count: data.products.length,
          total_found: data.allProducts.length || 0,
          has_more: data.hasMoreProducts || false
        });
      }

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSignupClick = () => {
    // Save current conversation to migrate to user account
    if (anonymousSessionId && messages.length > 0) {
      localStorage.setItem('migrate-anonymous-chat', JSON.stringify({
        sessionId: anonymousSessionId,
        messages: messages
      }));
    }
    
    track('anonymous_signup_clicked', {
      source: 'conversion_prompt',
      messages_sent: messages.filter(m => m.role === 'user').length
    });
    
    router.push('/register?source=anonymous-chat');
  };

  return (
    <div className="min-h-screen chat-container bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex flex-col">
      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/10 backdrop-blur-sm border-b border-white/20 p-3 sm:p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <Link href="/free-experience" className="text-gray-300 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </Link>
            <img
              src="/Jules_Logo_White_Final_NoOutline.png"
              alt="Jules"
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
              style={{ transform: 'scale(3.75) translateX(10px)', transformOrigin: 'center' }}
            />
          </div>
          
          <MessageCounter 
            remaining={remainingMessages} 
            total={5}
            showUpgradePrompt={showConversionPrompt}
            onUpgradeClick={handleSignupClick}
          />
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 messages-area overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-300 pt-8 pb-8 px-4">
              <div className="mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-3">Try Jules for Free!</h2>
                <p className="text-base sm:text-lg mb-4">Get personalized style advice with 5 free messages</p>
                <div className="bg-blue-500/20 border border-blue-400/30 rounded-lg p-4 max-w-md mx-auto">
                  <p className="text-blue-200 text-sm">
                    💬 <strong>5 messages remaining</strong><br/>
                    Ask about outfits, style advice, or anything fashion-related!
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 max-w-2xl mx-auto">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white p-4 rounded-xl text-left">
                  <div className="text-lg mb-2">💕</div>
                  <h3 className="font-semibold text-sm mb-1">First Date Outfit</h3>
                  <p className="text-xs opacity-90">Get advice for that special night</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white p-4 rounded-xl text-left">
                  <div className="text-lg mb-2">👟</div>
                  <h3 className="font-semibold text-sm mb-1">Shoe Recommendations</h3>
                  <p className="text-xs opacity-90">Find the perfect casual kicks</p>
                </div>
                
                <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white p-4 rounded-xl text-left">
                  <div className="text-lg mb-2">👔</div>
                  <h3 className="font-semibold text-sm mb-1">Capsule Wardrobe</h3>
                  <p className="text-xs opacity-90">Build a versatile wardrobe</p>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/20 text-white p-4 rounded-xl text-left">
                  <div className="text-lg mb-2">🎨</div>
                  <h3 className="font-semibold text-sm mb-1">Color Matching</h3>
                  <p className="text-xs opacity-90">Find your perfect color palette</p>
                </div>
              </div>
            </div>
          )}
          
          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 message-bubble ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white'
                    : 'bg-white/10 backdrop-blur-sm text-white border border-white/20'
                }`}
              >
                <div className="text-white leading-tight">
                  
                  <ReactMarkdown
                    components={{
                      a: ({ node, ...props }) => (
                        <a 
                          {...props} 
                          className="text-purple-300 hover:text-purple-200 underline font-semibold"
                          target="_blank"
                          rel="noopener noreferrer"
                        />
                      ),
                      br: () => <br className="mb-2" />,
                      strong: ({ node, ...props }) => (
                        <strong {...props} className="font-bold text-white" />
                      ),
                      p: ({ node, ...props }) => {
                        const content = props.children?.toString() || '';
                        const isProductLine = /\*\*.*\*\* - \$/.test(content);
                        const isWhyILove = content.includes('Why I love these:');
                        const isEmptyOrWhitespace = content.trim() === '';
                        
                        let spacingClass = 'mb-1';
                        if (isProductLine) {
                          spacingClass = 'mb-6'; // Reduced space after product lines
                        } else if (isWhyILove) {
                          spacingClass = 'mb-4'; // Reduced space after descriptions
                        } else if (isEmptyOrWhitespace) {
                          spacingClass = 'mb-3'; // Reduced space for empty lines
                        }
                        
                        return <p {...props} className={spacingClass} />;
                      }
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </div>
                
                {/* Product Grid - Simplified for anonymous users */}
                {message.products && message.products.length > 0 && (
                  <div className="mt-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {message.products.map((product, idx) => (
                        <div key={idx} className="bg-white/5 rounded-lg p-3 border border-white/10">
                          <div className="aspect-square bg-gray-700 rounded-lg mb-3 flex items-center justify-center">
                            {product.image ? (
                              <img 
                                src={product.image} 
                                alt={product.title}
                                className="w-full h-full object-cover rounded-lg"
                              />
                            ) : (
                              <div className="text-gray-400 text-2xl">👔</div>
                            )}
                          </div>
                          <h4 className="font-semibold text-white text-sm mb-1 line-clamp-2">
                            {product.title}
                          </h4>
                          <p className="text-blue-300 font-bold text-sm mb-2">
                            {product.price}
                          </p>
                          <a
                            href={product.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white text-center py-2 rounded-lg text-sm font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-200"
                          >
                            View Product
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-lg p-4">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Full Screen Signup Modal */}
      {hasReachedLimit && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 rounded-2xl p-6 sm:p-8 max-w-md w-full mx-4 border border-white/20 shadow-2xl">
            <div className="text-center">
              {/* Jules Logo */}
              <div className="mb-6">
                <img
                  src="/Jules_Logo_White_Final_NoOutline.png"
                  alt="Jules"
                  className="w-16 h-16 mx-auto object-contain"
                  style={{ transform: 'scale(3.75)', transformOrigin: 'center' }}
                />
              </div>
              
              {/* Main Heading */}
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4 flex items-center justify-center gap-3">
                <svg className="w-12 h-12 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Ready to unlock the full Jules experience?
              </h2>
              
              {/* Benefits */}
              <p className="text-gray-300 text-base sm:text-lg mb-6 leading-relaxed">
                Get more style advice, fit checks, connect with the community, and more!
              </p>
              
              {/* Sign Up Button */}
              <button
                onClick={handleSignupClick}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-4 rounded-xl text-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-200 transform hover:scale-105 shadow-lg mb-4"
              >
                Sign Up to Continue
              </button>
              
              {/* Beta Message */}
              <p className="text-gray-400 text-sm">
                Join the beta and help craft the Jules experience
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sticky Input */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/10 backdrop-blur-sm border-t border-white/20 p-3 sm:p-4 input-area">
        <div className="max-w-4xl mx-auto">
          
          <div className="flex space-x-3 sm:space-x-4">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={
                hasReachedLimit 
                  ? "Sign up to continue chatting with Jules" 
                  : isLoading 
                    ? "Jules is responding..." 
                    : `Ask Jules anything about style (${remainingMessages} messages left)`
              }
              disabled={hasReachedLimit}
              className="flex-1 bg-white/20 backdrop-blur-sm text-white placeholder-gray-300 border border-white/20 rounded-lg p-2 sm:p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base disabled:opacity-50 disabled:cursor-not-allowed"
              rows={1}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading || hasReachedLimit}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
            >
              {isLoading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AnonymousChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen chat-container bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading chat...</p>
        </div>
      </div>
    }>
      <AnonymousChatPageContent />
    </Suspense>
  );
}
