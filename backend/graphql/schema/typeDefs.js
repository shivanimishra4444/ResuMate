const { gql } = require('apollo-server-express');

const typeDefs = gql`
  type Resume {
    id: ID!
    title: String!
    sections: [ResumeSection!]!
    createdAt: String!
    updatedAt: String!
  }

  type ResumeSection {
    id: ID!
    type: SectionType!
    content: String!
    modifiedByAI: Boolean!
  }

  type Chat {
    id: ID!
    resumeId: ID!
    messages: [ChatMessage!]!
    createdAt: String!
  }

  type ChatMessage {
    id: ID!
    sender: MessageSender!
    content: String!
    timestamp: String!
  }

  enum SectionType {
    name
    title
    summary
    skills
    experience
    projects
    education
  }

  enum MessageSender {
    AI
    USER
  }

  type Query {
    _empty: String
    getAllResumes: [Resume!]!
    getCompleteResume(id: ID!): CompleteResumeResponse!
  }

  type Mutation {
    createResume(title: String!): Resume!
    updateResume(id: ID!, title: String, sections: [ResumeSectionInput!]): Resume!

    # AI-powered mutations
    processUserMessage(resumeId: ID!, message: String!): ChatResponse!
  }



  type ChatResponse {
    success: Boolean!
    userMessage: ChatMessage
    botMessage: ChatMessage
    updatedResume: Resume
    generatedContent: String
    updatedSection: String
    currentStep: ConversationStep
    showCompleteResume: Boolean
    completeResumeData: CompleteResumeResponse
    error: String
  }

  type ConversationStep {
    section: String!
    expectingInput: Boolean!
    isFirstMessage: Boolean!
  }

  input ResumeSectionInput {
    type: SectionType!
    content: String!
    modifiedByAI: Boolean!
  }

  type CompleteResumeResponse {
    success: Boolean!
    resume: Resume
    isComplete: Boolean!
    completionPercentage: Float!
    missingSections: [SectionType!]!
    formattedResume: String
    error: String
  }
`;

module.exports = typeDefs;
