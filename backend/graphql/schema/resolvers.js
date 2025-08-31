const { Resume, Chat } = require('../../database/models');
const openaiService = require('../../services/openaiService');

const resolvers = {
  Query: {
    _empty: () => null,

    // Get all resumes
    getAllResumes: async () => {
      try {
        const resumes = await Resume.find({}).sort({ updatedAt: -1 });
        return resumes;
      } catch (error) {
        console.error('Error fetching all resumes:', error);
        throw new Error('Failed to fetch resumes');
      }
    },

    // Get complete resume with completion status
    getCompleteResume: async (_, { id }) => {
      try {
        const resume = await Resume.findById(id);
        if (!resume) {
          return {
            success: false,
            error: 'Resume not found',
            isComplete: false,
            completionPercentage: 0,
            missingSections: [],
            formattedResume: null
          };
        }

        // Define required sections
        const requiredSections = ['name', 'title', 'summary', 'skills', 'experience', 'projects', 'education'];
        
        // Get existing sections
        const existingSections = resume.sections.map(section => section.type);
        
        // Find missing sections
        const missingSections = requiredSections.filter(section => 
          !existingSections.includes(section) || 
          !resume.sections.find(s => s.type === section)?.content?.trim()
        );

        // Calculate completion percentage
        const completionPercentage = ((requiredSections.length - missingSections.length) / requiredSections.length) * 100;
        const isComplete = missingSections.length === 0;

        // Generate formatted resume if complete
        let formattedResume = null;
        if (isComplete) {
          formattedResume = generateFormattedResume(resume);
        }

        return {
          success: true,
          resume,
          isComplete,
          completionPercentage,
          missingSections,
          formattedResume,
          error: null
        };
      } catch (error) {
        console.error('Get complete resume error:', error);
        return {
          success: false,
          error: error.message,
          resume: null,
          isComplete: false,
          completionPercentage: 0,
          missingSections: [],
          formattedResume: null
        };
      }
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

    processUserMessage: async (_, { resumeId, message }) => {
      try {
        // 1. Validate and get required data
        const { resume, chat } = await getResumeAndChat(resumeId);
        
        // 2. Process message with AI
        const aiResponse = await processMessageWithAI(message, resume, chat);
        
        // 3. Update chat history
        const { userMessage, botMessage } = await updateChatHistory(chat, message, aiResponse);
        
        // 4. Update resume sections
        await updateResumeSection(resume, message, aiResponse);
        
        // 5. Handle complete resume if requested
        const completeResumeData = await handleCompleteResumeRequest(resume, aiResponse);
        
        // 6. Save all changes
        await saveChanges(chat, resume);
        
        // 7. Build and return response
        return buildSuccessResponse(userMessage, botMessage, resume, aiResponse, completeResumeData);
        
      } catch (error) {
        console.error('Process message error:', error);
        return buildErrorResponse(error.message);
      }
    }
  }
};


/**
 * 1. DATA VALIDATION & RETRIEVAL
 * Gets resume and chat, creates chat if it doesn't exist
 */
async function getResumeAndChat(resumeId) {
  const resume = await Resume.findById(resumeId);
  if (!resume) {
    throw new Error('Resume not found');
  }

  let chat = await Chat.findOne({ resumeId });
  if (!chat) {
    chat = new Chat({
      resumeId,
      messages: []
    });
  }

  return { resume, chat };
}

/**
 * 2. AI PROCESSING
 * Handles AI service call with proper data formatting
 */
async function processMessageWithAI(message, resume, chat) {
  // Transform resume data for AI service
  const resumeData = {
    sections: {}
  };
  resume.sections.forEach(section => {
    resumeData.sections[section.type.toLowerCase()] = {
      content: section.content
    };
  });

  const chatHistory = chat.messages || [];
  
  return await openaiService.processUserMessage(message, resumeData, chatHistory);
}

/**
 * 3. CHAT MANAGEMENT
 * Updates chat history with user and bot messages
 */
async function updateChatHistory(chat, message, aiResponse) {
  const userMessage = {
    sender: 'USER',
    content: message,
    timestamp: new Date()
  };
  
  const botMessage = {
    sender: 'AI',
    content: aiResponse.botMessage,
    timestamp: new Date()
  };

  chat.messages.push(userMessage);
  chat.messages.push(botMessage);

  return { userMessage, botMessage };
}

/**
 * 4. RESUME UPDATES
 * Updates resume sections with user input and AI improvements
 */
async function updateResumeSection(resume, message, aiResponse) {
  if (!aiResponse.updatedSection) return;

  const sectionType = aiResponse.updatedSection.toLowerCase();
  const existingSection = resume.sections.find(s => s.type === sectionType);
  const content = aiResponse.generatedContent || message;
  const modifiedByAI = !!aiResponse.generatedContent;

  if (existingSection) {
    existingSection.content = content;
    existingSection.modifiedByAI = modifiedByAI;
  } else {
    resume.sections.push({
      type: sectionType,
      content,
      modifiedByAI
    });
  }
}

/**
 * 5. COMPLETE RESUME HANDLING
 * Generates complete resume data if requested
 */
async function handleCompleteResumeRequest(resume, aiResponse) {
  if (!aiResponse.showCompleteResume) return null;

  const requiredSections = ['name', 'title', 'summary', 'skills', 'experience', 'projects', 'education'];
  const existingSections = resume.sections.map(section => section.type);
  const missingSections = requiredSections.filter(section => 
    !existingSections.includes(section) || 
    !resume.sections.find(s => s.type === section)?.content?.trim()
  );
  
  const completionPercentage = ((requiredSections.length - missingSections.length) / requiredSections.length) * 100;
  const isComplete = missingSections.length === 0;
  
  return {
    success: true,
    resume,
    isComplete,
    completionPercentage,
    missingSections,
    formattedResume: isComplete ? generateFormattedResume(resume) : null,
    error: null
  };
}

/**
 * 6. DATA PERSISTENCE
 * Saves chat and resume changes to database
 */
async function saveChanges(chat, resume) {
  await Promise.all([
    chat.save(),
    resume.save()
  ]);
}

/**
 * 7. RESPONSE BUILDERS
 * Build standardized success and error responses
 */
function buildSuccessResponse(userMessage, botMessage, resume, aiResponse, completeResumeData) {
  return {
    success: true,
    userMessage,
    botMessage,
    updatedResume: resume,
    generatedContent: aiResponse.generatedContent,
    updatedSection: aiResponse.updatedSection,
    currentStep: aiResponse.currentStep,
    showCompleteResume: aiResponse.showCompleteResume || false,
    completeResumeData,
    error: null
  };
}

function buildErrorResponse(errorMessage) {
  return {
    success: false,
    error: errorMessage,
    userMessage: null,
    botMessage: null,
    updatedResume: null,
    showCompleteResume: false,
    completeResumeData: null
  };
}

// Helper function to generate formatted resume
function generateFormattedResume(resume) {
  const sections = {};
  resume.sections.forEach(section => {
    sections[section.type] = section.content;
  });

  return `
# ${sections.name || 'Name Not Provided'}
## ${sections.title || 'Professional Title'}

---

### PROFESSIONAL SUMMARY
${sections.summary || 'Summary not provided'}

---

### TECHNICAL SKILLS
${sections.skills || 'Skills not provided'}

---

### PROFESSIONAL EXPERIENCE
${sections.experience || 'Experience not provided'}

---

### KEY PROJECTS
${sections.projects || 'Projects not provided'}

---

### EDUCATION
${sections.education || 'Education not provided'}

---

*Resume generated by ResuMate on ${new Date().toLocaleDateString()}*
`.trim();
}

// Note: Section determination logic is now handled in openaiService.js

module.exports = resolvers;
