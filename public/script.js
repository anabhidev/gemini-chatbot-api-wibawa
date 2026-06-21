// DOM Elements
const form = document.getElementById('chat-form');
const input = document.getElementById('user-input');
const chatBox = document.getElementById('chat-box');

// Conversation history to track all messages
let conversationHistory = [];

// API endpoint
const API_ENDPOINT = '/api/chat';

// Handle form submission
form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const userMessage = input.value.trim();
  if (!userMessage) return;

  try {
    // Add user message to chat box and history
    appendMessage('user', userMessage);
    conversationHistory.push({
      role: 'user',
      text: userMessage
    });

    // Clear input field
    input.value = '';

    // Add loading animation placeholder message
    const thinkingElement = appendMessage('bot', null, true);

    // Send request to backend API
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        conversation: conversationHistory
      })
    });

    // Handle HTTP errors
    if (!response.ok) {
      throw new Error(`Server error: ${response.status} ${response.statusText}`);
    }

    // Parse response JSON
    const data = await response.json();

    // Validate response has result property
    if (!data.result) {
      throw new Error('No result received from server');
    }

    const aiResponse = data.result;

    // Add AI response to history
    conversationHistory.push({
      role: 'model',
      text: aiResponse
    });

    // Replace "Thinking..." with actual response (formatted with markdown)
    const formattedResponse = parseMarkdown(aiResponse);
    thinkingElement.innerHTML = formattedResponse;

  } catch (error) {
    // Log error for debugging
    console.error('Chat error:', error);

    // Determine error message
    let errorMessage = 'Failed to get response from server.';
    
    if (error instanceof TypeError) {
      errorMessage = 'Network error. Please check your connection.';
    } else if (error.message.includes('Server error')) {
      errorMessage = `Server error: ${error.message}`;
    } else if (error.message === 'No result received from server') {
      errorMessage = 'Sorry, no response received.';
    }

    // Remove the "Thinking..." message if it exists
    const thinkingMessages = chatBox.querySelectorAll('.bot');
    if (thinkingMessages.length > 0) {
      const lastBotMessage = thinkingMessages[thinkingMessages.length - 1];
      if (lastBotMessage.querySelector('.loading')) {
        lastBotMessage.remove();
      }
    }

    // Show error message
    appendMessage('bot', errorMessage);
  }
});

/**
 * Appends a message to the chat box and scrolls to the bottom
 * @param {string} sender - 'user' or 'bot'
 * @param {string} text - Message text (can be null for loading animation)
 * @param {boolean} isLoading - Whether to show loading animation
 * @returns {HTMLElement} - The created message element
 */
function appendMessage(sender, text = null, isLoading = false) {
  const messageDiv = document.createElement('div');
  messageDiv.classList.add('message', sender);
  
  if (isLoading) {
    // Create loading animation element
    messageDiv.appendChild(createLoadingElement());
  } else if (text) {
    // For user messages, use textContent; for bot, use innerHTML for markdown
    if (sender === 'user') {
      messageDiv.textContent = text;
    } else {
      messageDiv.innerHTML = text;
    }
  }
  
  chatBox.appendChild(messageDiv);
  
  // Auto-scroll to bottom to show latest message
  chatBox.scrollTop = chatBox.scrollHeight;
  
  return messageDiv;
}

/**
 * Creates a loading animation element with three bouncing dots
 * @returns {HTMLElement} - The loading animation element
 */
function createLoadingElement() {
  const loadingDiv = document.createElement('div');
  loadingDiv.classList.add('loading');
  
  for (let i = 0; i < 3; i++) {
    const dot = document.createElement('div');
    dot.classList.add('loading-dot');
    loadingDiv.appendChild(dot);
  }
  
  return loadingDiv;
}

/**
 * Converts markdown text to HTML
 * @param {string} text - Markdown text
 * @returns {string} - HTML string
 */
function parseMarkdown(text) {
  let html = text;
  
  // Escape HTML special characters to prevent XSS
  html = escapeHtml(html);
  
  // Horizontal rule: ---
  html = html.replace(/^---+$/gm, '<hr>');
  
  // Headings: # Title, ## Title, etc.
  html = html.replace(/^### (.*?)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.*?)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.*?)$/gm, '<h1>$1</h1>');
  
  // Bold: **text** or __text__
  html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/__(.*?)__/g, '<strong>$1</strong>');
  
  // Italic: *text* or _text_
  html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
  html = html.replace(/_(.*?)_/g, '<em>$1</em>');
  
  // Inline code: `code`
  html = html.replace(/`(.*?)`/g, '<code>$1</code>');
  
  // Unordered lists: - item
  html = html.replace(/^\- (.*?)$/gm, '<li>$1</li>');
  html = html.replace(/(<li>.*<\/li>)/s, '<ul>$1</ul>');
  html = html.replace(/<\/li>\n<\/ul>\n<li>/g, '</li>\n<li>');
  
  // Line breaks: Convert newlines to <br> or <p>
  html = html.split('\n\n').map(paragraph => {
    paragraph = paragraph.replace(/\n/g, '<br>');
    return `<p>${paragraph}</p>`;
  }).join('');
  
  // Remove extra <p> tags around block elements
  html = html.replace(/<p>(<h[1-6]>.*?<\/h[1-6]>)<\/p>/g, '$1');
  html = html.replace(/<p>(<ul>.*?<\/ul>)<\/p>/g, '$1');
  html = html.replace(/<p>(<hr>)<\/p>/g, '$1');
  
  return html;
}

/**
 * Escapes HTML special characters to prevent XSS attacks
 * @param {string} text - Plain text
 * @returns {string} - Escaped text safe for HTML
 */
function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, char => map[char]);
}
