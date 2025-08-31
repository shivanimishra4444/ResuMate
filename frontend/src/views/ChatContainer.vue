<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useMutation, useLazyQuery } from '@vue/apollo-composable'
import ChatBoxInput from '../components/ChatBoxInput.vue'
import ChatBoxDetails from '../components/ChatBoxDetails.vue'
import { CREATE_RESUME, PROCESS_USER_MESSAGE, GET_COMPLETE_RESUME } from '../graphql/queries'

interface Message {
  id: string
  sender: 'user' | 'bot'
  text: string
  timestamp: Date
  generatedContent?: string
  section?: string
  isFormattedResume?: boolean
  completionPercentage?: number
}




const resumeId = ref<string>('')
const chatId = ref<string>('')
const messages = ref<Message[]>([])
const isLoading = ref(false)

// GraphQL mutations and queries
const { mutate: createResumeMutation } = useMutation(CREATE_RESUME)
const { mutate: processMessageMutation } = useMutation(PROCESS_USER_MESSAGE)
const { load: loadCompleteResume, result: completeResumeResult } = useLazyQuery(GET_COMPLETE_RESUME)

// Initialize chat by starting conversation without creating resume yet
const initializeChat = async () => {
  try {
    // Start the conversation with a generic welcome message
    addMessageToChat('Hello! I\'m here to help you create a professional resume. Let\'s start with your full name.', 'bot')
  } catch (error) {
    console.error('Failed to initialize chat:', error)
    addMessageToChat('Sorry, I encountered an error. Please try again.', 'bot')
  }
}



// Handle message from input component
const handleSendMessage = async (message: string) => {
  addMessageToChat(message, 'user')

  if (isFirstMessage()) {
    await createResumeAndProcessMessage(message)
  } else {
    await processUserMessage(message)
  }
}

// Helper: Check if this is the first user message
const isFirstMessage = () => {
  return !resumeId.value && messages.value.filter(m => m.sender === 'user').length === 1
}

// Helper: Create resume and process the first message
const createResumeAndProcessMessage = async (message: string) => {
  try {
    isLoading.value = true
    
    const resume = await createNewResume(message)
    if (resume) {
      resumeId.value = resume.id
      chatId.value = resume.id
      await processUserMessage(message)
    } else {
      addMessageToChat('Sorry, I couldn\'t create your resume. Please try again.', 'bot')
    }
  } catch (error) {
    console.error('Failed to create resume:', error)
    addMessageToChat('Sorry, I encountered an error creating your resume.', 'bot')
  } finally {
    isLoading.value = false
  }
}

// Helper: Create a new resume
const createNewResume = async (message: string) => {
  const title = message.length > 50 ? `${message.substring(0, 50)}...` : message
  const result = await createResumeMutation({ title })
  return result?.data?.createResume || null
}

// Process user message using GraphQL API
const processUserMessage = async (message: string) => {
  if (!resumeId.value || !chatId.value) return

  try {
    isLoading.value = true
    const result = await processMessageMutation({
      resumeId: resumeId.value,
      message
    })

    if (result?.data?.processUserMessage?.success) {
      const response = result.data.processUserMessage

      // Add bot's response
      addMessageToChat(response.botMessage.content, 'bot', {
        generatedContent: response.generatedContent,
        section: response.updatedSection
      })

      // Check if user requested to see complete resume
      if (response.showCompleteResume) {
        // Fetch the latest complete resume data from the dedicated endpoint
        setTimeout(async () => {
          await fetchAndDisplayCompleteResume()
        }, 1000) // Small delay for better UX
      }
    } else {
      addMessageToChat('Sorry, I couldn\'t process your message. Please try again.', 'bot')
    }
  } catch (error) {
    console.error('Failed to process message:', error)
    addMessageToChat('Sorry, I encountered an error processing your message.', 'bot')
  } finally {
    isLoading.value = false
  }
}

// Fetch and display complete resume using dedicated endpoint
const fetchAndDisplayCompleteResume = async () => {
  if (!resumeId.value) return

  try {
    // Use lazy query to fetch fresh data
    await loadCompleteResume(undefined, { id: resumeId.value })
    
    // Wait for the result and handle it
    if (completeResumeResult.value?.getCompleteResume?.success && completeResumeResult.value.getCompleteResume.formattedResume) {
      const resumeData = completeResumeResult.value.getCompleteResume
      
      addMessageToChat(resumeData.formattedResume, 'bot', {
        isFormattedResume: true,
        completionPercentage: resumeData.completionPercentage
      })
    } else {
      addMessageToChat('Sorry, I couldn\'t retrieve your complete resume at this time.', 'bot')
    }
  } catch (error) {
    console.error('Failed to fetch complete resume:', error)
    addMessageToChat('Sorry, there was an error retrieving your complete resume.', 'bot')
  }
}

// Helper to add message to chat
const addMessageToChat = (text: string, sender: 'user' | 'bot', additionalData?: Partial<Message>) => {
  const message: Message = {
    id: Date.now().toString(),
    sender,
    text,
    timestamp: new Date(),
    ...additionalData
  }
  messages.value.push(message)
}

// Initialize on mount
onMounted(() => {
  initializeChat()
})
</script>

<template>
  <div class="flex-1 flex flex-col h-full bg-white">
    <ChatBoxDetails
      :chat-messages="messages"
      :is-loading="isLoading"
    />
    <ChatBoxInput @send-message="handleSendMessage" />
  </div>
</template>
