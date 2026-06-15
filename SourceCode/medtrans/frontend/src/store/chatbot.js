import { create } from 'zustand'
import {
  getChatbotConversations,
  createChatbotConversation,
  deleteChatbotConversation,
  getChatbotMessages,
  sendChatbotMessage
} from '../api/chatbot'

export const useChatbotStore = create((set, get) => ({
  conversations: [],
  currentConversationId: null,
  messages: [],
  loadingConversations: false,
  loadingMessages: false,
  sendingMessage: false,

  fetchConversations: async () => {
    set({ loadingConversations: true })
    try {
      const list = await getChatbotConversations()
      set({ conversations: list, loadingConversations: false })
      return list
    } catch (err) {
      console.error(err)
      set({ loadingConversations: false })
      return []
    }
  },

  createConversation: async (title) => {
    try {
      const newConv = await createChatbotConversation(title)
      set((state) => ({
        conversations: [newConv, ...state.conversations],
        currentConversationId: newConv.id,
        messages: []
      }))
      return newConv
    } catch (err) {
      console.error(err)
      throw err
    }
  },

  selectConversation: async (id) => {
    set({ currentConversationId: id, loadingMessages: true, messages: [] })
    try {
      const msgs = await getChatbotMessages(id)
      set({ messages: msgs, loadingMessages: false })
    } catch (err) {
      console.error(err)
      set({ loadingMessages: false })
    }
  },

  deleteConversation: async (id) => {
    try {
      await deleteChatbotConversation(id)
      const { currentConversationId } = get()
      set((state) => ({
        conversations: state.conversations.filter((c) => c.id !== id),
        currentConversationId: currentConversationId === id ? null : currentConversationId,
        messages: currentConversationId === id ? [] : state.messages
      }))
    } catch (err) {
      console.error(err)
    }
  },

  sendMessage: async (messageText) => {
    const { currentConversationId } = get()
    if (!currentConversationId || !messageText.trim()) return

    const userMsg = {
      id: `temp-${Date.now()}`,
      conversationId: currentConversationId,
      senderType: 'USER',
      text: messageText,
      createdAt: new Date().toISOString()
    }

    set((state) => ({
      messages: [...state.messages, userMsg],
      sendingMessage: true
    }))

    try {
      const response = await sendChatbotMessage(currentConversationId, messageText)
      
      // Update conversations list so the active chat displays the latest message as title if it was "New chat"
      const { conversations } = get()
      const updatedConversations = conversations.map(c => {
        if (c.id === currentConversationId && c.title === "New chat") {
          return { ...c, title: messageText.length > 60 ? messageText.substring(0, 60) + '…' : messageText }
        }
        return c
      })

      set((state) => ({
        conversations: updatedConversations,
        messages: [...state.messages.filter(m => m.id !== userMsg.id), { ...userMsg, id: response.id - 1 }, response],
        sendingMessage: false
      }))
    } catch (err) {
      console.error(err)
      set((state) => ({
        messages: state.messages.filter(m => m.id !== userMsg.id),
        sendingMessage: false
      }))
    }
  }
}))
