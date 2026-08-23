import { Notification } from './app.js';
import api from './api.js';

class Assistant {
    constructor() {
        this.conversation = [];
        this.quickReplies = [
            'What are the symptoms of flu?',
            'How to reduce stress?',
            'Healthy diet tips',
            'Best exercises for weight loss',
            'How to improve sleep?'
        ];
        this.init();
    }

    init() {
        this.setupQuickActions();
        this.setupInput();
        this.loadHistory();
    }

    setupQuickActions() {
        const container = document.querySelector('.quick-actions');
        if (!container) return;

        // Add default quick actions
        this.quickReplies.forEach(text => {
            const btn = document.createElement('button');
            btn.className = 'quick-btn';
            btn.textContent = text;
            btn.onclick = () => this.sendMessage(text);
            container.appendChild(btn);
        });
    }

    setupInput() {
        const input = document.getElementById('chatInput');
        const sendBtn = document.querySelector('.input-area button');

        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const message = input.value.trim();
                    if (message) {
                        this.sendMessage(message);
                        input.value = '';
                    }
                }
            });
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', () => {
                const input = document.getElementById('chatInput');
                const message = input.value.trim();
                if (message) {
                    this.sendMessage(message);
                    input.value = '';
                }
            });
        }
    }

    async sendMessage(message) {
        // Add user message to chat
        this.addMessage('user', message);

        // Show typing indicator
        this.showTyping();

        try {
            // Send to AI
            const response = await api.askAssistant(message);

            // Hide typing indicator
            this.hideTyping();

            // Add assistant response
            this.addMessage('assistant', response.message);

            // Save to history
            this.saveToHistory(message, response.message);

        } catch (error) {
            this.hideTyping();
            Notification.error('Failed to get response');
            console.error('Assistant error:', error);

            // Add error message
            this.addMessage('assistant', 'I apologize, but I encountered an error. Please try again.');
        }
    }

    addMessage(type, content) {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;

        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';

        // Process content (support markdown-like formatting)
        if (Array.isArray(content)) {
            // Content is a list of items
            const list = document.createElement('ul');
            content.forEach(item => {
                const li = document.createElement('li');
                li.textContent = item;
                list.appendChild(li);
            });
            contentDiv.appendChild(list);
        } else if (typeof content === 'string') {
            // Check if content has bullet points
            if (content.includes('\n- ')) {
                const lines = content.split('\n');
                const ul = document.createElement('ul');
                lines.forEach(line => {
                    if (line.trim().startsWith('- ')) {
                        const li = document.createElement('li');
                        li.textContent = line.trim().substring(2);
                        ul.appendChild(li);
                    } else if (line.trim()) {
                        const p = document.createElement('p');
                        p.textContent = line.trim();
                        contentDiv.appendChild(p);
                    }
                });
                if (ul.children.length > 0) {
                    contentDiv.appendChild(ul);
                }
            } else {
                const p = document.createElement('p');
                p.textContent = content;
                contentDiv.appendChild(p);
            }
        }

        // Add time
        const timeSpan = document.createElement('span');
        timeSpan.className = 'message-time';
        timeSpan.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        contentDiv.appendChild(timeSpan);

        messageDiv.appendChild(contentDiv);
        container.appendChild(messageDiv);

        // Scroll to bottom
        container.scrollTop = container.scrollHeight;

        // Update conversation history
        this.conversation.push({ type, content, time: new Date() });
    }

    showTyping() {
        const container = document.getElementById('chatMessages');
        if (!container) return;

        const typingDiv = document.createElement('div');
        typingDiv.className = 'message assistant typing';
        typingDiv.id = 'typingIndicator';
        typingDiv.innerHTML = `
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        container.appendChild(typingDiv);
        container.scrollTop = container.scrollHeight;
    }

    hideTyping() {
        const typing = document.getElementById('typingIndicator');
        if (typing) {
            typing.remove();
        }
    }

    loadHistory() {
        const saved = localStorage.getItem('assistant_conversation');
        if (saved) {
            try {
                const history = JSON.parse(saved);
                history.forEach(msg => {
                    this.addMessage(msg.type, msg.content);
                });
            } catch (error) {
                console.error('Failed to load history:', error);
            }
        }
    }

    saveToHistory(userMessage, assistantMessage) {
        const history = JSON.parse(localStorage.getItem('assistant_conversation') || '[]');
        history.push(
            { type: 'user', content: userMessage, time: new Date() },
            { type: 'assistant', content: assistantMessage, time: new Date() }
        );
        // Keep only last 100 messages
        if (history.length > 100) {
            history.splice(0, history.length - 100);
        }
        localStorage.setItem('assistant_conversation', JSON.stringify(history));
    }
}

// Initialize assistant
document.addEventListener('DOMContentLoaded', () => {
    const assistant = new Assistant();
    window.assistant = assistant;
});

// Send quick message
function sendQuickMessage(message) {
    if (window.assistant) {
        window.assistant.sendMessage(message);
    }
}