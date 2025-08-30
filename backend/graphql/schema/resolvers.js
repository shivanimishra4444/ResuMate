const { Resume, Chat } = require('../../database/models');

const resolvers = {
  Query: {
    // Get all resumes
    resumes: async () => {
      return await Resume.find().sort({ createdAt: -1 });
    },
    
    // Get specific resume
    resume: async (_, { id }) => {
      return await Resume.findById(id);
    },
    
    // Get chat for a resume
    chat: async (_, { resumeId }) => {
      return await Chat.findOne({ resumeId });
    }
  },

  Mutation: {
    // Create new resume
    createResume: async (_, { title }) => {
      const resume = new Resume({ title });
      return await resume.save();
    },
    
    // Update resume
    updateResume: async (_, { id, title, sections }) => {
      const resume = await Resume.findById(id);
      if (title) resume.title = title;
      if (sections) resume.sections = sections;
      resume.updatedAt = new Date();
      return await resume.save();
    },
    
    // Delete resume
    deleteResume: async (_, { id }) => {
      await Resume.findByIdAndDelete(id);
      await Chat.deleteMany({ resumeId: id });
      return true;
    },
    
    // Add message to chat
    addMessage: async (_, { chatId, content, sender }) => {
      let chat = await Chat.findById(chatId);
      if (!chat) {
        chat = new Chat({ resumeId: chatId, messages: [] });
      }
      
      const message = {
        sender: sender.toLowerCase(),
        content,
        timestamp: new Date()
      };
      
      chat.messages.push(message);
      await chat.save();
      return message;
    }
  }
};

module.exports = resolvers;
