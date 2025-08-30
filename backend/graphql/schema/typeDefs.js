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
    NAME
    TITLE
    SUMMARY
    SKILLS
    EXPERIENCE
    PROJECTS
    EDUCATION
  }

  enum MessageSender {
    AI
    USER
  }

  type Query {
    resumes: [Resume!]!
    resume(id: ID!): Resume
    chat(resumeId: ID!): Chat
  }

  type Mutation {
    createResume(title: String!): Resume!
    updateResume(id: ID!, title: String, sections: [ResumeSectionInput!]): Resume!
    deleteResume(id: ID!): Boolean!
    addMessage(chatId: ID!, content: String!, sender: MessageSender!): ChatMessage!
  }

  input ResumeSectionInput {
    type: SectionType!
    content: String!
    modifiedByAI: Boolean!
  }
`;

module.exports = typeDefs;
