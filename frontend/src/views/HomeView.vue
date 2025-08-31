<script setup lang="ts">
import { ref } from 'vue'
import LeftHandNavigation from '../components/LeftHandNavigation.vue'
import ChatContainer from './ChatContainer.vue'

// State for current chat/resume
const currentResumeId = ref<string>('')

// Handle chat selection
const handleChatSelected = (chatId: string) => {
  currentResumeId.value = chatId
}

// Handle new chat creation
const handleNewChatCreated = () => {
  currentResumeId.value = ''
}
</script>

<template>
  <div class="h-screen flex overflow-hidden bg-gray-100">
    <LeftHandNavigation 
      @chat-selected="handleChatSelected"
      @new-chat-created="handleNewChatCreated"
    />
    <ChatContainer :selected-resume-id="currentResumeId" />
  </div>
</template>
