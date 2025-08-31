import { gql } from '@apollo/client/core'

// GraphQL Queries
export const GET_ALL_RESUMES = gql`
  query GetAllResumes {
    getAllResumes {
      id
      title
      createdAt
      updatedAt
    }
  }
`

export const GET_COMPLETE_RESUME = gql`
  query GetCompleteResume($id: ID!) {
    getCompleteResume(id: $id) {
      success
      resume {
        id
        title
        sections {
          type
          content
          modifiedByAI
        }
        createdAt
        updatedAt
      }
      isComplete
      completionPercentage
      missingSections
      formattedResume
      error
    }
  }
`

// GraphQL Mutations
export const CREATE_RESUME = gql`
  mutation CreateResume($title: String!) {
    createResume(title: $title) {
      id
      title
      sections {
        type
        content
        modifiedByAI
      }
      createdAt
      updatedAt
    }
  }
`



export const PROCESS_USER_MESSAGE = gql`
  mutation ProcessUserMessage($resumeId: ID!, $message: String!) {
    processUserMessage(resumeId: $resumeId, message: $message) {
      success
      userMessage {
        content
        sender
      }
      botMessage {
        content
        sender
      }
      generatedContent
      updatedSection
      currentStep {
        section
        expectingInput
      }
      showCompleteResume
      completeResumeData {
        success
        isComplete
        completionPercentage
        formattedResume
        missingSections
      }
      error
    }
  }
`
