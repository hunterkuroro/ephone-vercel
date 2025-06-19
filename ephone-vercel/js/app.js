
class EPhoneApp {
constructor() {
this.memorySync = new MemorySync();
this.currentModel = 'gemini-pro';
this.systemPrompt = '你是一個友善的AI助手。';
this.init();
}


init() {
    this.bindEvents();
    this.loadSettings();
    this.loadChatHistory();
}

bindEvents() {
    // 發送按鈕點擊
    document.getElementById('sendBtn').addEventListener('click', () => {
        this.sendMessage();
    });

    // 輸入框回車
    document.getElementById('messageInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            this.sendMessage();
        }
    });

    // 設置按鈕
    document.getElementById('settingsBtn').addEventListener('click', () => {
        this.openSettings();
    });

    // 關閉設置彈窗
    document.querySelector('.close').addEventListener('click', () => {
        this.closeSettings();
    });

    // 保存設置
    document.getElementById('saveSettings').addEventListener('click', () => {
        this.saveSettings();
    });
}

async sendMessage() {
    const input = document.getElementById('messageInput');
    const message = input.value.trim();
    
    if (!message) return;

    // 清空輸入框
    input.value = '';

    // 顯示用戶訊息
    this.addMessage(message, 'user');

    // 顯示載入中
    const loadingId = this.addMessage('思考中...', 'assistant');

    try {
        // 調用 API
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    { role: 'system', content: this.systemPrompt },
                    { role: 'user', content: message }
                ],
                model: this.currentModel
            })
        });

        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }

        const aiResponse = data.choices[0].message.content;
        
        // 移除載入中訊息
        this.removeMessage(loadingId);
        
        // 顯示 AI 回覆
        this.addMessage(aiResponse, 'assistant');

        // 保存到記憶
        await this.memorySync.saveMessage(message, aiResponse);

    } catch (error) {
        console.error('發送訊息失敗:', error);
        this.removeMessage(loadingId);
        this.addMessage('抱歉，發生錯誤：' + error.message, 'assistant');
    }
}

addMessage(content, role) {
    const chatContainer = document.getElementById('chatContainer');
    const messageId = 'msg_' + Date.now();
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${role}`;
    messageDiv.id = messageId;
    
    const bubbleDiv = document.createElement('div');
    bubbleDiv.className = 'message-bubble';
    bubbleDiv.textContent = content;
    
    messageDiv.appendChild(bubbleDiv);
    chatContainer.appendChild(messageDiv);
    
    // 滾動到底部
    chatContainer.scrollTop = chatContainer.scrollHeight;
    
    return messageId;
}

removeMessage(messageId) {
    const messageElement = document.getElementById(messageId);
    if (messageElement) {
        messageElement.remove();
    }
}

openSettings() {
    document.getElementById('settingsModal').style.display = 'block';
    
    // 載入當前設置
    document.getElementById('modelSelect').value = this.currentModel;
    document.getElementById('systemPrompt').value = this.systemPrompt;
}

closeSettings() {
    document.getElementById('settingsModal').style.display = 'none';
}

saveSettings() {
    this.currentModel = document.getElementById('modelSelect').value;
    this.systemPrompt = document.getElementById('systemPrompt').value;
    
    // 保存到本地存儲
    localStorage.setItem('ephone_model', this.currentModel);
    localStorage.setItem('ephone_system_prompt', this.systemPrompt);
    
    this.closeSettings();
    alert('設置已保存！');
}

loadSettings() {
    this.currentModel = localStorage.getItem('ephone_model') || 'gemini-pro';
    this.systemPrompt = localStorage.getItem('ephone_system_prompt') || '你是一個友善的AI助手。';
}

async loadChatHistory() {
    try {
        const history = await this.memorySync.loadChatHistory();
        
        // 顯示最近的對話
        history.slice(-10).forEach(item => {
            this.addMessage(item.message, 'user');
            this.addMessage(item.response, 'assistant');
        });
    } catch (error) {
        console.error('載入聊天歷史失敗:', error);
    }
}


}

// 初始化應用
document.addEventListener('DOMContentLoaded', () => {
new EPhoneApp();
});
