<template>
  <div class="w-64 h-full bg-gray-50 border-r border-gray-200 p-4 flex flex-col">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-blue-600 font-bold text-xl">ResuMate</h2>
    </div>

    <!-- New Chat Button -->
    <div class="mb-6">
      <button 
        @click="createNewChat"
        class="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors font-medium"
      >
        New Resume Chat
      </button>
    </div>

    <!-- Chat History -->
    <div class="flex-1 overflow-y-auto">
      <div>
        <h3 class="text-gray-700 font-medium mb-3">Recent Chats</h3>
        
        <!-- Loading state -->
        <div v-if="loading" class="space-y-2">
          <div v-for="i in 3" :key="i" class="p-3 rounded-lg bg-gray-100 animate-pulse">
            <div class="h-4 bg-gray-200 rounded mb-2"></div>
            <div class="h-3 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>

        <!-- Error state -->
        <div v-else-if="error" class="text-center py-8">
          <div class="text-4xl mb-3">⚠️</div>
          <p class="text-red-600 font-medium">Failed to load resumes</p>
        </div>

        <!-- Chat List -->
        <div v-else-if="chatHistory.length > 0" class="space-y-2">
          <div 
            v-for="chat in chatHistory" 
            :key="chat.id"
            @click="selectChat(chat.id)"
            class="p-3 rounded-lg bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer group transition-colors"
            :class="{ 'bg-blue-50 border-blue-200': activeChatId === chat.id }"
          >
            <div class="flex justify-between items-start">
              <div class="flex-1">
                <div class="font-medium text-gray-900 text-sm">{{ chat.name }}</div>
                <div class="text-gray-500 text-xs mt-1">{{ formatDate(chat.lastUpdated) }}</div>
              </div>
              <button 
                @click.stop="deleteChat(chat.id)"
                class="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 text-xs px-2 py-1 transition-opacity"
              >
                Delete
              </button>
            </div>
          </div>
        </div>

        <!-- Empty state -->
        <div v-else class="text-center py-8">
          <div class="text-4xl mb-3">📄</div>
          <p class="text-gray-600 font-medium">No resume chats yet</p>
          <p class="text-gray-500 text-sm mt-1">Start your first resume!</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useQuery } from '@vue/apollo-composable'
import { GET_ALL_RESUMES } from '../graphql/queries'
import { toDate, formatDateTime } from '../utils/dateUtils'

// Props and emits
const emit = defineEmits<{
  'chat-selected': [chatId: string]
  'new-chat-created': []
}>()

// Fetch all resumes from database
const { result, loading, error } = useQuery(GET_ALL_RESUMES)

const activeChatId = ref<string>('')

// Convert resumes to chat format
const chatHistory = computed(() => {
  if (!result.value?.getAllResumes) return []
  
  return result.value.getAllResumes.map((resume: any) => ({
    id: resume.id,
    name: resume.title || 'Untitled Resume',
    lastUpdated: toDate(resume.updatedAt) || new Date() // Always convert to Date object
  }))
})

// Functions
const createNewChat = () => {
  emit('new-chat-created')
}

const selectChat = (chatId: string) => {
  activeChatId.value = chatId
  emit('chat-selected', chatId)
}

const deleteChat = (chatId: string) => {
  // TODO: Implement delete mutation
  console.log('Delete requested for chat:', chatId)
}

// Use simple date formatting everywhere
const formatDate = formatDateTime
</script>