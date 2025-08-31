<template>
  <div class="flex-1 overflow-hidden bg-white">
    <div ref="messagesContainer" class="h-full overflow-y-auto p-4 space-y-4">
      <!-- Welcome message for new conversations -->
      <div v-if="messages.length === 0" class="text-center py-12">
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
          <div class="text-4xl mb-4">🤖</div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Resume Builder Assistant</h3>
          <p class="text-gray-600">I'll help you create a professional resume step by step. Let's start!</p>
        </div>
      </div>

      <!-- Chat messages -->
      <div class="space-y-4">
        <div v-for="message in messages" :key="message.id" class="flex gap-3" :class="{ 'flex-row-reverse': message.sender === 'user' }">
          <!-- Avatar -->
          <div class="flex-shrink-0">
            <div class="w-8 h-8 rounded-full flex items-center justify-center text-lg" :class="message.sender === 'bot' ? 'bg-blue-100' : 'bg-gray-100'">
              {{ message.sender === 'bot' ? '🤖' : '👤' }}
            </div>
          </div>
          
          <!-- Message content -->
          <div class="flex-1 max-w-3xl">
            <div class="flex items-center gap-2 mb-1" :class="{ 'justify-end': message.sender === 'user' }">
              <span class="text-sm font-medium text-gray-900">{{ message.sender === 'user' ? 'You' : 'Resume Assistant' }}</span>
              <span class="text-xs text-gray-500">{{ formatTime(message.timestamp) }}</span>
            </div>
            
            <!-- Message bubble -->
            <div class="rounded-lg px-4 py-3" :class="message.sender === 'bot' ? 'bg-gray-50 border border-gray-200' : 'bg-blue-600 text-white'">
              <!-- Regular message text -->
              <div v-if="!message.isFormattedResume" class="whitespace-pre-wrap">{{ message.text }}</div>
              
              <!-- Formatted resume display -->
              <div v-if="message.isFormattedResume" class="space-y-3">
                <div class="flex items-center justify-between bg-white rounded-lg p-3 border">
                  <div class="flex items-center gap-2">
                    <span class="text-xl">📄</span>
                    <span class="font-medium text-gray-900">Your Complete Resume</span>
                  </div>
                  <span v-if="message.completionPercentage" class="text-sm bg-green-100 text-green-700 px-2 py-1 rounded-full">
                    {{ message.completionPercentage }}% Complete
                  </span>
                </div>
                <div class="bg-white rounded-lg p-4 border max-h-96 overflow-y-auto">
                  <pre class="text-sm text-gray-800 font-mono whitespace-pre-wrap">{{ message.text }}</pre>
                </div>
                <div class="flex gap-2">
                  <button 
                    @click="copyResume(message.text)"
                    class="flex items-center gap-1 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    📋 Copy
                  </button>
                  <button 
                    @click="downloadResume(message.text)"
                    class="flex items-center gap-1 bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-lg text-sm hover:bg-gray-50 transition-colors"
                  >
                    💾 Download
                  </button>
                </div>
              </div>
            </div>
            
            <!-- AI Enhanced badge -->
            <div v-if="message.generatedContent" class="mt-2" :class="{ 'text-right': message.sender === 'user' }">
              <span class="inline-flex items-center gap-1 text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                ✨ AI Enhanced
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Typing indicator -->
      <div v-if="isTyping" class="flex gap-3">
        <div class="flex-shrink-0">
          <div class="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-lg">🤖</div>
        </div>
        <div class="flex-1">
          <div class="text-sm font-medium text-gray-900 mb-1">Resume Assistant</div>
          <div class="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 flex items-center gap-2">
            <div class="flex gap-1">
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.1s"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
            </div>
            <span class="text-sm text-gray-600">typing...</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, nextTick, watch, computed } from 'vue'
import { formatDateTime } from '../utils/dateUtils'

interface Message {
  id: string
  sender: 'user' | 'bot' | 'ai'
  text: string
  timestamp: Date
  generatedContent?: string  // AI-enhanced content
  section?: string          // Which resume section this relates to
  isFormattedResume?: boolean // Indicates this is a complete formatted resume
  completionPercentage?: number // Resume completion percentage
}

// Props from parent component
const props = defineProps<{
  chatMessages?: Message[]
  isLoading?: boolean
}>()

// Local state
const messagesContainer = ref<HTMLElement>()
const isTyping = ref(false)

// Computed messages - use props if available, otherwise local state
const messages = computed(() => {
  if (props.chatMessages && props.chatMessages.length > 0) {
    return props.chatMessages.map(msg => ({
      ...msg,
      sender: msg.sender === 'ai' ? 'bot' : msg.sender // Normalize AI to bot for display
    }))
  }
  return []
})

// Watch for typing state from props
watch(() => props.isLoading, (newValue) => {
  isTyping.value = !!newValue
})

// Auto-scroll to bottom when new messages are added or typing state changes
watch([messages, isTyping], async () => {
  await nextTick()
  scrollToBottom()
}, { deep: true })

const scrollToBottom = () => {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

// Use simple date and time formatting everywhere
const formatTime = formatDateTime

// Copy resume to clipboard
const copyResume = async (resumeText: string) => {
  try {
    await navigator.clipboard.writeText(resumeText)
    // You could add a toast notification here
    console.log('Resume copied to clipboard!')
  } catch (error) {
    console.error('Failed to copy resume:', error)
  }
}

// Download resume as text file
const downloadResume = (resumeText: string) => {
  const blob = new Blob([resumeText], { type: 'text/plain' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'resume.txt'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

// Function to add new message locally (fallback if not using props)
const addMessage = (text: string, sender: 'user' | 'bot', additionalData?: Partial<Message>) => {
  const newMessage: Message = {
    id: Date.now().toString(),
    sender,
    text,
    timestamp: new Date(),
    ...additionalData
  }
  
  // If using local state (not props), add to local messages
  if (!props.chatMessages) {
    // This would require local messages ref, but we're using computed now
    console.log('Adding message locally:', newMessage)
  }
}

// Function to show/hide typing indicator
const setTyping = (typing: boolean) => {
  isTyping.value = typing
}

// Function to clear all messages
const clearMessages = () => {
  // Only works if parent component handles this
  console.log('Clear messages requested')
}

// Function to get the last message
const getLastMessage = () => {
  return messages.value[messages.value.length - 1] || null
}

// Function to get messages by sender
const getMessagesBySender = (sender: 'user' | 'bot') => {
  return messages.value.filter(msg => msg.sender === sender)
}

// Expose functions to parent component
defineExpose({
  addMessage,
  setTyping,
  clearMessages,
  scrollToBottom,
  getLastMessage,
  getMessagesBySender
})
</script>
