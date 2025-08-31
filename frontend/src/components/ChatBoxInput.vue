<template>
  <div class="border-t border-gray-200 bg-white p-4">
    <div class="flex gap-3 items-end">
      <input 
        v-model="userInput"
        type="text" 
        placeholder="Type your message here..."
        @keyup.enter="sendMessage"
        class="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
      />
      <button 
        @click="sendMessage"
        :disabled="!userInput.trim()"
        class="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
      >
        Send
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
  'send-message': [message: string]
}>()

const userInput = ref('')

const sendMessage = () => {
  if (userInput.value.trim()) {
    // Emit message to parent component
    emit('send-message', userInput.value.trim())
    userInput.value = ''
  }
}
</script>


