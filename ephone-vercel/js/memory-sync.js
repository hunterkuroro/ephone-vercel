class MemorySync {
  constructor(apiBase = '/api') {
    this.apiBase = apiBase;
    this.userId = this.getUserId();
  }

  getUserId() {
    // 從 localStorage 或其他方式獲取用戶ID
    let userId = localStorage.getItem('userId');
    if (!userId) {
      userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('userId', userId);
    }
    return userId;
  }

  async getMemory() {
    try {
      const response = await fetch(`${this.apiBase}/memory?userId=${this.userId}`);
      const result = await response.json();
      return result.success ? result.data : [];
    } catch (error) {
      console.error('獲取記憶失敗:', error);
      return [];
    }
  }

  async saveMessage(message, response, source = 'ephone') {
    try {
      const memory = await this.getMemory();
      const newItem = {
        timestamp: Date.now(),
        message,
        response,
        source
      };

      memory.push(newItem);
      
      // 限制記憶條數
      if (memory.length > 100) {
        memory.shift();
      }

      await fetch(`${this.apiBase}/memory`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: this.userId,
          memory
        })
      });
    } catch (error) {
      console.error('保存記憶失敗:', error);
    }
  }

  async loadChatHistory() {
    const memory = await this.getMemory();
    return memory.map(item => ({
      message: item.message,
      response: item.response,
      timestamp: item.timestamp,
      source: item.source
    }));
  }
}
