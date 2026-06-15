import api from './client'

export const getChatbotConversations = async () => {
  const { data } = await api.get('/api/chatbot/conversations')
  return data
}

export const createChatbotConversation = async (title) => {
  const { data } = await api.post('/api/chatbot/conversations', { title })
  return data
}

export const deleteChatbotConversation = async (id) => {
  await api.delete(`/api/chatbot/conversations/${id}`)
}

export const getChatbotMessages = async (conversationId) => {
  const { data } = await api.get(`/api/chatbot/conversations/${conversationId}/messages`)
  return data
}

export const sendChatbotMessage = async (conversationId, message) => {
  const { data } = await api.post('/api/chatbot/messages', { conversationId, message })
  return data
}
