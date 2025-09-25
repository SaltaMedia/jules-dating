'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import ProductGrid from '../../components/ProductGrid';
import ImageGrid from '../../components/ImageGrid';
import { apiClient } from '../../lib/api';
import { track } from '@/analytics/client';
import { captureImageMobile, openFilePicker } from '../../lib/cameraUtils';

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
  userImage?: string; // Base64 encoded image from user upload
  imageContext?: string; // Context information about uploaded images
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

function ChatPageContent() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isProductSearch, setIsProductSearch] = useState(false);
  const [queuedMessage, setQueuedMessage] = useState<string>('');
  const [user, setUser] = useState<any>(null);

  const [showWishlistSuccess, setShowWishlistSuccess] = useState(false);
  // Removed expandedMessages state since we only show 3 products
  const [sessionId, setSessionId] = useState<string>('');
  const [isJustChatMode, setIsJustChatMode] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Focus input on mount and after messages are sent
  useEffect(() => {
    if (inputRef.current && !isLoading) {
      inputRef.current.focus();
    }
  }, [isLoading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToTop = () => {
    const messagesArea = document.querySelector('.messages-area');
    if (messagesArea) {
      messagesArea.scrollTop = 0;
    }
  };

  // Function to detect if a message is likely to trigger a product search
  const isProductSearchMessage = (message: string): boolean => {
    const productKeywords = [
      'shoes', 'sneakers', 'boots', 'shirt', 'jeans', 'pants', 'jacket', 'coat', 'sweater', 'hoodie',
      't-shirt', 'polo', 'henley', 'shorts', 'chinos', 'joggers', 'sweatpants', 'vest', 'waistcoat',
      'loafers', 'vans', 'necklace', 'ring', 'earrings', 'bracelet', 'jewelry', 'pendant', 'chain',
      'button-down', 'button down', 'buttonup', 'button-up', 'blazer', 'suit', 'tie', 'belt', 'watch',
      'sunglasses', 'hat', 'cap', 'beanie', 'scarf', 'gloves', 'underwear', 'socks', 'shoes',
      'running shoes', 'dress shoes', 'casual shoes', 'formal shoes', 'athletic shoes'
    ];
    
    const searchPhrases = [
      'show me', 'find me', 'recommend', 'suggest', 'pull up', 'get me', 'buy', 'purchase', 
      'shop for', 'looking for', 'need', 'under $', 'under ', 'budget', 'affordable', 
      'cheap', 'expensive', 'price', 'links', 'where can i buy', 'where to buy'
    ];
    
    const messageLower = message.toLowerCase();
    
    // Check if message contains product keywords
    const hasProductKeyword = productKeywords.some(keyword => 
      messageLower.includes(keyword)
    );
    
    // Check if message contains search phrases
    const hasSearchPhrase = searchPhrases.some(phrase => 
      messageLower.includes(phrase)
    );
    
    // Check for specific patterns that indicate product search
    const hasProductPattern = /\$[\d,]+|under\s+\$[\d,]+|budget|price|buy|shop|purchase|links/i.test(message);
    
    // More specific check: must have both product keyword AND search intent
    return hasProductKeyword && (hasSearchPhrase || hasProductPattern);
  };

  // Function to load a chat session from the backend
  const loadChatSession = async (sessionId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/chat-sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        const session = data.session;
        
        if (session && session.messages) {
          // Convert backend messages to frontend format
          const formattedMessages = session.messages.map((msg: any) => ({
            role: msg.role,
            content: msg.content,
            timestamp: new Date(msg.timestamp),
            ...(msg.userImage && { userImage: msg.userImage }), // Preserve image info for display
            ...(msg.imageContext && { imageContext: msg.imageContext }) // Preserve image context for AI
          }));
          
          setMessages(formattedMessages);
          setSessionId(sessionId);
          
          // Save to localStorage for persistence
          localStorage.setItem('currentChatSessionId', sessionId);
          localStorage.setItem(`chatMessages_${sessionId}`, JSON.stringify(formattedMessages));
          
          console.log('Loaded chat session:', sessionId);
        }
      } else {
        console.error('Failed to load chat session:', response.statusText);
      }
    } catch (error) {
      console.error('Error loading chat session:', error);
    }
  };

  useEffect(() => {
    // Check authentication
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    

    
    if (!token) {
      router.push('/login');
      return;
    }

    if (userData) {
      try {
        const parsedUser = JSON.parse(userData);
        setUser(parsedUser);
      } catch (error) {
        console.error('Error parsing user data:', error);
      }
    }

    // Check for pre-filled message from other pages
    const prefillMessage = localStorage.getItem('prefillMessage');
    if (prefillMessage) {
      setInput(prefillMessage);
      localStorage.removeItem('prefillMessage'); // Clear the flag
    }

    // Track chat opened
    track('chat_opened', { source: 'home' });

    // Check if we're loading a specific session from URL parameters
    const urlSessionId = searchParams.get('session');
    if (urlSessionId) {
      // Load the session from backend
      loadChatSession(urlSessionId);
      return; // Exit early, don't run the rest of the logic
    }

    // Check if we're loading a specific session from settings (legacy)
    const loadSessionId = localStorage.getItem('loadSessionId');
    if (loadSessionId) {
      // Load the specific session
      setSessionId(loadSessionId);
      localStorage.removeItem('loadSessionId'); // Clear the flag
      
      const savedMessages = localStorage.getItem(`chatMessages_${loadSessionId}`);
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages);
          setMessages(parsedMessages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          })));
        } catch (error) {
          console.error('Error loading saved messages:', error);
        }
      }
    } else {
      // Check if user just completed onboarding (fresh start)
      const justCompletedOnboarding = localStorage.getItem('justCompletedOnboarding');
      if (justCompletedOnboarding === 'true') {
        // Fresh start after onboarding - clear all old sessions
        localStorage.removeItem('currentChatSessionId');
        localStorage.removeItem('justCompletedOnboarding');
        
        // Generate new session ID for this chat session
        const newSessionId = `session_${Date.now()}`;
        setSessionId(newSessionId);
        localStorage.setItem('currentChatSessionId', newSessionId);
        
        // Start with empty messages
        setMessages([]);
      } else {
        // Check for existing active session
        const currentSessionId = localStorage.getItem('currentChatSessionId');
        if (currentSessionId) {
          // Use existing session
          setSessionId(currentSessionId);
          
          const savedMessages = localStorage.getItem(`chatMessages_${currentSessionId}`);
          if (savedMessages) {
            try {
              const parsedMessages = JSON.parse(savedMessages);
              setMessages(parsedMessages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              })));
            } catch (error) {
              console.error('Error loading saved messages:', error);
            }
          }
        } else {
          // Generate new session ID for this chat session
          const newSessionId = `session_${Date.now()}`;
          setSessionId(newSessionId);
          localStorage.setItem('currentChatSessionId', newSessionId);

          // Check if this is a new session (no saved messages for this session)
          const savedMessages = localStorage.getItem(`chatMessages_${newSessionId}`);
          if (savedMessages) {
            try {
              const parsedMessages = JSON.parse(savedMessages);
              setMessages(parsedMessages.map((msg: any) => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              })));
            } catch (error) {
              console.error('Error loading saved messages:', error);
            }
          } else {
            // New session - clear any old messages
            setMessages([]);
            localStorage.removeItem('chatMessages');
          }
        }
      }
    }

    // Add global function for wishlist
    (window as any).addToWishlist = (title: string, link: string, price: string) => {
      const product = {
        title,
        link,
        price,
        image: '',
        description: '',
        brand: ''
      };
      handleAddToWishlist(product);
    };

    scrollToBottom();
  }, [router, searchParams.get('session')]);

  useEffect(() => {
    // Only scroll when new messages are added, not on every render
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages.length]); // Only depend on messages length, not the full messages array

  // Save messages to localStorage with session ID (debounced to avoid typing delays)
  // Only keep the last 20 messages to prevent localStorage quota issues
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (messages.length > 0) {
        try {
          // Only save the last 20 messages to prevent localStorage quota issues
          const recentMessages = messages.slice(-20);
          localStorage.setItem(`chatMessages_${sessionId}`, JSON.stringify(recentMessages));
        } catch (error) {
          // If localStorage is full, try to clear old sessions first
          console.warn('localStorage quota exceeded, clearing old chat sessions');
          try {
            // Clear all old chat sessions except current
            const keys = Object.keys(localStorage);
            const chatKeys = keys.filter(key => key.startsWith('chatMessages_') && key !== `chatMessages_${sessionId}`);
            chatKeys.forEach(key => localStorage.removeItem(key));
            
            // Try again with just the last 10 messages
            const recentMessages = messages.slice(-10);
            localStorage.setItem(`chatMessages_${sessionId}`, JSON.stringify(recentMessages));
          } catch (secondError) {
            console.error('Failed to save messages to localStorage:', secondError);
            // Continue without localStorage - messages will still work in current session
          }
        }
      }
    }, 1000); // Debounce for 1 second

    return () => clearTimeout(timeoutId);
  }, [messages, sessionId]);

  const sendMessage = async (file?: File) => {
    const messageText = input.trim();
    if (!messageText) return;

    // If Jules is currently responding, queue this message
    if (isLoading) {
      setQueuedMessage(messageText);
      setInput('');
      return;
    }

    const userMessage: Message = {
      role: 'user',
      content: messageText,
      timestamp: new Date(),
      userImage: selectedImageUrl || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsJustChatMode(false); // Turn off just chat mode when user sends a message
    
    // Clear selected image immediately when user sends message
    if (selectedImageUrl) {
      setSelectedImageUrl(null);
      setSelectedFile(null);
      // Reset file input to allow selecting the same file again
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
    
    // Store the file for sending (don't clear yet)
    const fileToSend = selectedFile;
    
    // Detect if this is likely a product search
    const isProductSearch = isProductSearchMessage(input.trim());
    setIsProductSearch(isProductSearch);

    // Track chat message sent
    const contentLength = input.trim().length;
    const tokensEstimateBucket = contentLength <= 50 ? '1-50' : contentLength <= 200 ? '51-200' : '201+';
    track('chat_message_sent', { 
      author: 'user', 
      content_type: 'text', 
      tokens_estimate_bucket: tokensEstimateBucket,
      message_length: contentLength,
      has_products: false // Will be updated when products are shown
    });

    try {
      // Validate messages before sending
      const validMessages = messages.filter(msg => 
        msg && typeof msg === 'object' && msg.role && msg.content
      );
      
      if (validMessages.length !== messages.length) {
        console.error('🚨 WARNING: Filtered out malformed messages:', {
          original: messages.length,
          valid: validMessages.length,
          malformed: messages.filter(msg => !msg || typeof msg !== 'object' || !msg.role || !msg.content)
        });
      }
      
      // Build context with image information preserved
      const contextWithImages = validMessages.map(msg => ({
        role: msg.role,
        content: msg.content,
        ...(msg.userImage && { userImage: msg.userImage }), // Preserve image info for display
        ...(msg.imageContext && { imageContext: msg.imageContext }) // Preserve image context for AI
      }));

      console.log('🚨 DEBUG: Sending message to backend:', {
        message: input.trim(),
        context: contextWithImages,
        user: user?._id,
        hasToken: !!localStorage.getItem('token')
      });
      
      // Track response time
      const startTime = Date.now();
      
      // Use different API method based on whether we have an image
      
      const response = fileToSend 
        ? await apiClient.chat.sendWithImage(
            messageText,
            fileToSend,
            contextWithImages,
            user?._id
          )
        : await apiClient.chat.send(
            messageText,
            contextWithImages,
            user?._id
          );
      
      console.log('🚨 DEBUG: Response received:', response.data);
      const responseTime = Date.now() - startTime;
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
        products: response.data.products,
        allProducts: response.data.allProducts,
        images: response.data.images,
        hasMoreProducts: response.data.hasMoreProducts,
        totalFound: response.data.totalFound
      };

      // Track response time
      track('chat_response_received', {
        response_time_ms: responseTime,
        response_length: response.data.response?.length || 0,
        has_products: !!(response.data.products && response.data.products.length > 0),
        product_count: response.data.products?.length || 0,
        category: 'chat',
        action: 'response_received'
      });

      // Track if products were shown
      if (response.data.products && response.data.products.length > 0) {
        track('products_shown_in_chat', {
          product_count: response.data.products.length,
          total_found: response.data.totalFound || 0,
          has_more: response.data.hasMoreProducts || false,
          response_time_ms: responseTime
        });
      }

      setMessages(prev => [...prev, assistantMessage]);
      
      // Image already cleared when user sent message
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
      setIsProductSearch(false);
      
      // If there's a queued message, send it now
      if (queuedMessage) {
        const queuedUserMessage: Message = {
          role: 'user',
          content: queuedMessage,
          timestamp: new Date()
        };

        setMessages(prev => [...prev, queuedUserMessage]);
        setInput('');
        setIsLoading(true);
        
        // Detect if this is likely a product search
        const isProductSearch = isProductSearchMessage(queuedMessage);
        setIsProductSearch(isProductSearch);

        try {
                  const response = await apiClient.chat.send(
          queuedMessage,
          [...messages, queuedUserMessage].map(msg => ({ role: msg.role, content: msg.content }))
        );

          const assistantMessage: Message = {
            role: 'assistant',
            content: response.data.response,
            timestamp: new Date(),
            products: response.data.products,
            allProducts: response.data.allProducts,
            images: response.data.images,
            hasMoreProducts: response.data.hasMoreProducts,
            totalFound: response.data.totalFound
          };

          setMessages(prev => [...prev, assistantMessage]);
        } catch (error) {
          console.error('Error sending queued message:', error);
          const errorMessage: Message = {
            role: 'assistant',
            content: 'Sorry, I encountered an error. Please try again.',
            timestamp: new Date()
          };
          setMessages(prev => [...prev, errorMessage]);
        } finally {
          setIsLoading(false);
          setIsProductSearch(false);
          setQueuedMessage('');
        }
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  const startNewChat = () => {
    // Generate new session ID
    const newSessionId = `session_${Date.now()}`;
    setSessionId(newSessionId);
    localStorage.setItem('currentChatSessionId', newSessionId);
    
    // Clear messages
    setMessages([]);
    
    // Clear any saved messages for the old session
    const oldSessionId = localStorage.getItem('currentChatSessionId');
    if (oldSessionId && oldSessionId !== newSessionId) {
      localStorage.removeItem(`chatMessages_${oldSessionId}`);
    }
    
    // Scroll to top to show the welcome message
    setTimeout(() => {
      scrollToTop();
    }, 100);
  };



  const handleAddToWishlist = async (product: Product) => {
    try {
      // Track wishlist addition
      track('wishlist_item_added', {
        product_title: product.title,
        product_price: product.price,
        product_brand: product.brand,
        category: 'wishlist',
        action: 'item_added'
      });
  
      
      const wishlistData = {
        title: product.title,
        link: product.link,
        price: product.price,
        image: product.image,
        description: product.description,
        brand: product.brand
      };
      

      
      await apiClient.wishlist.add(wishlistData);

      // Track wishlist addition
      track('wishlist_item_added', {
        product_title: product.title,
        product_price: product.price,
        product_brand: product.brand,
        source: 'chat'
      });

      setShowWishlistSuccess(true);
      setTimeout(() => setShowWishlistSuccess(false), 3000);
      
      // Return success to update the button state
      return Promise.resolve();
    } catch (error: any) {
      console.error('Error adding to wishlist:', error);
      
      // Check if it's the "already exists" error
      if ((error.response?.status === 400 || error.response?.status === 409) && 
          error.response?.data?.error?.includes('already exists')) {
        // This is actually a success case - item is already in wishlist
        setShowWishlistSuccess(true);
        setTimeout(() => setShowWishlistSuccess(false), 3000);
        return Promise.resolve();
      }
      
      return Promise.reject(error);
    }
  };

  const handleAddImageToWishlist = async (image: StyleImage) => {
    try {
      const imageUrl = image.url || image.image || '';
      const imageTitle = image.alt || image.title || 'Style inspiration';
      
      await apiClient.wishlist.add({
        title: `Style Inspiration - ${imageTitle}`,
        link: imageUrl,
        price: 'N/A',
        image: imageUrl,
        description: `Style inspiration image: ${imageTitle}`,
        brand: 'Style Inspiration'
      });

      setShowWishlistSuccess(true);
      setTimeout(() => setShowWishlistSuccess(false), 3000);
      
      // Return success to update the button state
      return Promise.resolve();
    } catch (error: any) {
      console.error('Error adding image to wishlist:', error);
      
      // Check if it's the "already exists" error
      if ((error.response?.status === 400 || error.response?.status === 409) && 
          error.response?.data?.error?.includes('already exists')) {
        // This is actually a success case - item is already in wishlist
        setShowWishlistSuccess(true);
        setTimeout(() => setShowWishlistSuccess(false), 3000);
        return Promise.resolve();
      }
      
      return Promise.reject(error);
    }
  };

  // Image upload handler for chat
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🚨 DEBUG: handleImageUpload called');
    const file = event.target.files?.[0];
    if (!file) {
      console.log('🚨 DEBUG: No file selected');
      return;
    }

    console.log('🚨 DEBUG: File selected:', {
      name: file.name,
      size: file.size,
      type: file.type
    });

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setSelectedImageUrl(result);
      console.log('🚨 DEBUG: Image URL set:', result.substring(0, 50) + '...');
      
      // Don't pre-populate any text - let user type their own message
    };
    reader.readAsDataURL(file);
  };

  // Removed handleShowMoreProducts since we only show 3 products

  const getDisplayProducts = (message: Message) => {
    // Always show all products since we limit to 3 in the backend
    return message.products || [];
  };

  const hasMoreProducts = (message: Message) => {
    // Always false since we only show 3 products
    return false;
  };

  const extractProductsFromText = (text: string) => {
    const productRegex = /\*\*\[([^\]]+)\]\(([^)]+)\)\*\* - \$([\d,]+)/g;
    const products = [];
    let match;

    while ((match = productRegex.exec(text)) !== null) {
      products.push({
        title: match[1],
        link: match[2],
        price: match[3]
      });
    }

    return products;
  };

  const addWishlistButtonsToText = (text: string) => {
    const productRegex = /\*\*\[([^\]]+)\]\(([^)]+)\)\*\* - \$([\d,]+)/g;
    return text.replace(productRegex, (match, title, link, price) => {
      return `${match} <button class="ml-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-2 py-1 rounded text-xs font-medium transition-all duration-200" onclick="window.addToWishlist('${title}', '${link}', '${price}')">Add to Wishlist</button>`;
    });
  };

  const handlePromptClick = async (promptType: string) => {
    switch (promptType) {
      case 'outfit-advice':
        await sendMessageDirectly('I need outfit advice');
        break;
      case 'fit-check':
        // Navigate to fit check page instead of sending a message
        router.push('/fit-check');
        break;
      case 'just-chat':
        // Clear messages, set just chat mode, and focus input field
        setMessages([]);
        setIsJustChatMode(true);
        // Focus the input field and scroll to top after a short delay to ensure it's rendered
        setTimeout(() => {
          scrollToTop();
          if (inputRef.current) {
            inputRef.current.focus();
          }
        }, 100);
        break;
    }
  };

  const sendMessageDirectly = async (messageText: string) => {
    if (!messageText.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: messageText.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await apiClient.chat.send(
        messageText.trim(),
        messages.length === 0 ? [] : messages.map(msg => ({ role: msg.role, content: msg.content }))
      );

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
        products: response.data.products,
        allProducts: response.data.allProducts,
        images: response.data.images,
        hasMoreProducts: response.data.hasMoreProducts,
        totalFound: response.data.totalFound
      };

      setMessages(prev => [...prev, assistantMessage]);
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

  return (
    <div className="min-h-screen chat-container bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex flex-col">
      {/* Always-available file input for image uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleImageUpload}
        className="hidden"
        id="chat-image-upload"
      />
      
      {/* Wishlist Success Notification */}
      {showWishlistSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-2">
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          <span>Added to wishlist!</span>
        </div>
      )}

      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/10 backdrop-blur-sm border-b border-white/20 p-3 sm:p-4 sticky-header">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2 sm:space-x-3">
            <img
              src="/Jules_Logo_White_Final_NoOutline.png"
              alt="Jules"
              className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
              style={{ transform: 'scale(3.75) translateX(10px)', transformOrigin: 'center' }}
            />

          </div>
          <div className="flex items-center space-x-2 sm:space-x-4">
            <button
              onClick={startNewChat}
              className="bg-gradient-to-r from-green-500 to-green-600 text-white px-2 sm:px-4 py-1.5 sm:py-2 rounded-lg hover:from-green-600 hover:to-green-700 transition-all duration-200 text-xs sm:text-sm mobile-button"
            >
              New Chat
            </button>
            <button
              onClick={() => router.push('/settings')}
              className="text-gray-300 hover:text-white transition-colors p-1.5 sm:p-2 rounded-lg hover:bg-white/10 mobile-button"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div 
        className="flex-1 messages-area overflow-y-auto"
        style={{
          paddingTop: '120px',
          paddingBottom: '100px'
        }}
      >
        <div className="max-w-4xl mx-auto space-y-4 p-4">
          {messages.length === 0 && (
            <div className="text-center text-gray-300 pt-4 pb-8 px-4">
              {/* New Welcome Message with Two-Line Heading */}
              <div className="mb-8 max-w-2xl mx-auto text-center">
                <h2 className="text-xl sm:text-2xl font-bold text-white mb-2">Hey, I'm Jules!</h2>
                <h3 className="text-lg sm:text-xl font-medium text-white mb-4">Here are a few things you can ask me to get started.</h3>
                
                {/* Suggestion Chips */}
                <div className="flex flex-wrap justify-center gap-3 mb-6">
                  {[
                    "Help me reply to this text",
                    "Give me an opener for her profile", 
                    "Where should I go for a first date?",
                    "What's a smooth way to ask her out again?",
                    "Help me plan a date outfit"
                  ].map((suggestion, index) => (
                    <div
                      key={index}
                      className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-full text-sm sm:text-base"
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
                
                {/* Image Upload Section */}
                <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-6">
                  <p className="text-white mb-4">Got a screenshot of her profile? Upload it and I'll help you figure out what to say</p>
                  <div className="relative">
                    <label
                      htmlFor="chat-image-upload"
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-blue-600 text-white rounded-lg hover:from-purple-600 hover:to-blue-700 transition-all duration-200 cursor-pointer shadow-lg"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Upload Image
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {messages.map((message, index) => {
            
            return (
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
                  {/* Show user uploaded image if present */}
                  {message.userImage && (
                    <div className="mb-3">
                      <img 
                        src={message.userImage} 
                        alt="Uploaded by user" 
                        className="max-w-full h-auto rounded-lg max-h-64 object-contain"
                      />
                    </div>
                  )}
                  
                  
                  <ReactMarkdown
                    components={{
                      a: ({ node, ...props }) => {
                  
                        return (
                          <a 
                            {...props} 
                            className="text-purple-300 hover:text-purple-200 underline font-semibold"
                            target="_blank"
                            rel="noopener noreferrer"
                          />
                        );
                      },
                      br: () => <br className="mb-2" />,
                      strong: ({ node, ...props }) => {
                        // Make bold product names clickable by finding matching product
                        const productName = Array.isArray(props.children) ? props.children[0] : props.children;
                        const productNameStr = String(productName || '').trim();
                        
                        // Always try to match with products if we have them
                        if (message.products && message.products.length > 0) {
                          
                          
                          const matchingProduct = message.products.find(p => {
                            const titleLower = p.title.toLowerCase();
                            const nameLower = productNameStr.toLowerCase();
                            
                            // Extract brand names (first word)
                            const titleBrand = p.title.split(' ')[0].toLowerCase();
                            const nameBrand = productNameStr.split(' ')[0].toLowerCase();
                            
                            // Must match brand first
                            const brandMatch = titleBrand === nameBrand;
                            
                            // Then check for product type match
                            const hasProductMatch = titleLower.includes(nameLower) || nameLower.includes(titleLower);
                            
                            const isMatch = brandMatch && hasProductMatch;
                      
                            return isMatch;
                          });
                          
                          if (matchingProduct && matchingProduct.link) {
                            return (
                              <a 
                                href={matchingProduct.link}
                                className="text-purple-300 hover:text-purple-200 underline font-semibold cursor-pointer"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => track('product_link_clicked', {
                                  product_title: matchingProduct.title,
                                  product_link: matchingProduct.link,
                                  product_price: matchingProduct.price,
                                  product_brand: matchingProduct.brand,
                                  source: 'chat'
                                })}
                              >
                                {props.children}
                              </a>
                            );
                          }
                        }
                        
                        return <strong {...props} className="font-bold text-white" />;
                      },
                      p: ({ node, ...props }) => {
                        // Check if this paragraph contains product recommendations
                        const content = props.children?.toString() || '';
                        const isProductLine = /\*\*.*\*\* - \$/.test(content);
                        const isWhyILove = content.includes('Why I love these:');
                        const isEmptyOrWhitespace = content.trim() === '';
                        
                        // Add tighter spacing for better message density
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
                
                {/* Product Grid */}
                {message.products && message.products.length > 0 && (
                  <div className="mt-4">
                    <ProductGrid 
                      products={getDisplayProducts(message)}
                      title="Recommended Products"
                      subtitle="Here are some products that match your style"
                      onAddToWishlist={handleAddToWishlist}
                      showWishlistButton={false}
                      hasMore={false}
                      totalFound={message.products?.length || 0}
                    />
                  </div>
                )}
                
                {/* Image Grid */}
                {(() => {
                  
                  return message.images && message.images.length > 0 && (
                    <div className="mt-4">
                      <ImageGrid 
                        images={message.images}
                        onAddToWishlist={handleAddImageToWishlist}
                        showWishlistButton={false}
                      />
                    </div>
                  );
                })()}
                
                <div className={`text-xs mt-2 ${
                  message.role === 'user' ? 'text-blue-100' : 'text-gray-400'
                }`}>
                  {message.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          );
          })}
          
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-white/10 backdrop-blur-sm text-white border border-white/20 rounded-lg p-4">
                {isProductSearch ? (
                  <div className="flex items-center space-x-3">
                    <span className="italic text-white/90">Finding the best options for you. This could take 10 to 15 seconds</span>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                ) : (
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-white rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Sticky Input */}
      <div className="fixed bottom-14 left-0 right-0 z-40 bg-white/10 backdrop-blur-sm border-t border-white/20 p-3 sm:p-4 input-area">
        <div className="max-w-4xl mx-auto">
          {queuedMessage && (
            <div className="mb-2 p-2 bg-blue-500/20 border border-blue-400/30 rounded-lg text-blue-200 text-sm">
              💬 Message queued: "{queuedMessage}" - will send after Jules responds
            </div>
          )}
          
          {/* Image Preview */}
          {selectedImageUrl && (
            <div className="mb-3 p-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <img 
                    src={selectedImageUrl} 
                    alt="Selected" 
                    className="w-12 h-12 object-cover rounded-lg"
                  />
                  <span className="text-white text-sm">Image ready to send</span>
                </div>
                <button
                  onClick={() => {
                    setSelectedImageUrl(null);
                    setSelectedFile(null);
                  }}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          <div className="flex space-x-3 sm:space-x-4">
            {/* Photo Upload Button */}
            <button
              onClick={() => {
                fileInputRef.current?.click();
              }}
              className="bg-white/20 backdrop-blur-sm border border-white/20 rounded-lg p-2 sm:p-3 hover:bg-white/30 transition-all duration-200 flex items-center justify-center text-white"
              title="Add Photo"
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </button>
            
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={isLoading ? "Jules is responding... you can type your next message" : "Chat with Jules"}
              className="flex-1 bg-white/20 backdrop-blur-sm text-white placeholder-gray-300 border border-white/20 rounded-lg p-2 sm:p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm sm:text-base mobile-button"
              rows={1}
            />
            <button
              onClick={() => sendMessage(selectedFile || undefined)}
              disabled={!input.trim() && !selectedImageUrl}
              className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base mobile-button"
            >
              {isLoading ? 'Queued' : 'Send'}
            </button>
          </div>
          
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen chat-container bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 flex items-center justify-center">
        <div className="text-center text-white">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading chat...</p>
        </div>
      </div>
    }>
      <ChatPageContent />
    </Suspense>
  );
}