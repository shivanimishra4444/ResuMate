const OpenAI = require('openai');

class OpenAIService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.model = process.env.OPENAI_MODEL ;
  }

  /**
   * Generate resume section content based on user input
   * @param {string} section - The resume section (summary, skills, experience, etc.)
   * @param {string} userInput - The user's raw input
   * @param {Object} context - Additional context (name, title, etc.)
   * @returns {string} - Polished content for the resume section
   */
  async generateResumeContent(section, userInput, context = {}) {
    try {
      const prompt = this.buildPrompt(section, userInput, context);
      
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional resume writer. Create polished, professional content that enhances the user\'s input while keeping it truthful and relevant.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7
      });

      return completion.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenAI API Error:', error);
      throw new Error('Failed to generate content with AI');
    }
  }

  /**
   * Process user message and generate appropriate response
   * @param {string} userMessage - The user's message
   * @param {Object} resumeData - Current resume data
   * @param {Array} chatHistory - Previous conversation messages
   * @returns {Object} - Response with bot message and any generated content
   */
  async processUserMessage(userMessage, resumeData, chatHistory = []) {
    try {
      const currentStep = this.determineCurrentStep(resumeData, chatHistory);
      
      // Check if user is requesting to see their complete resume
      if (currentStep.section === 'complete' && this.isRequestingResumeView(userMessage)) {
        return {
          botMessage: "Perfect! I'll show you your complete formatted resume now. You can use this to apply for jobs or save it for future use. 📄✨",
          generatedContent: null,
          updatedSection: null,
          currentStep: currentStep,
          showCompleteResume: true // Special flag to indicate resume should be displayed
        };
      }
      
      // Process the user's input and generate content if applicable
      let generatedContent = null;
      let updatedSection = null;
      
      if (currentStep.expectingInput && userMessage.trim()) {
        generatedContent = await this.generateResumeContent(
          currentStep.section, 
          userMessage, 
          this.getResumeContext(resumeData)
        );
        updatedSection = currentStep.section;
      }
      
      // Generate the next question/response
      const nextStep = this.getNextStep(currentStep, userMessage, resumeData);
      const botResponse = await this.generateBotResponse(nextStep, userMessage, resumeData);
      
      return {
        botMessage: botResponse,
        generatedContent,
        updatedSection,
        currentStep: nextStep
      };
    } catch (error) {
      console.error('OpenAI API Error:', error);
      return {
        botMessage: this.getDefaultResponse(resumeData),
        generatedContent: null,
        updatedSection: null,
        currentStep: this.determineCurrentStep(resumeData, chatHistory)
      };
    }
  }

  /**
   * Generate bot response based on current step
   */
  async generateBotResponse(step, userMessage, resumeData) {
    const prompt = this.buildBotResponsePrompt(step, userMessage, resumeData);
    
    try {
      const completion = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: 'You are a professional resume-building assistant. Guide users step-by-step through creating their resume. Be encouraging, professional, and ask one clear question at a time.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 150,
        temperature: 0.7
      });

      return completion.choices[0].message.content.trim();
    } catch (error) {
      return this.getDefaultQuestion(step.section);
    }
  }

  /**
   * Build prompt for content generation
   */
  buildPrompt(section, userInput, context) {
    const { name, title } = context;
    
    switch (section) {
      case 'summary':
        return `Create a professional summary for ${name || 'a candidate'} who is a ${title || 'professional'}. Based on this input: "${userInput}". Make it 2-3 sentences, professional, and compelling.`;
      
      case 'skills':
        return `Format these skills professionally for a resume: "${userInput}". Group related skills together and present them in a clean, readable format.`;
      
      case 'experience':
        return `Create a professional work experience entry based on: "${userInput}". Include role, company (if mentioned), and 2-3 bullet points highlighting achievements and responsibilities.`;
      
      case 'projects':
        return `Create a professional project description based on: "${userInput}". Include project name, brief description, and key technologies/achievements.`;
      
      case 'education':
        return `Format this educational background professionally: "${userInput}". Include degree, institution, and any relevant details.`;
      
      default:
        return `Polish and format this resume content professionally: "${userInput}". Make it concise, professional, and impactful.`;
    }
  }

  /**
   * Determine current conversation step
   */
  determineCurrentStep(resumeData, chatHistory) {
    const sections = resumeData.sections || {};
    
    // Always start with name if not provided
    if (!sections.name?.content) {
      return {
        section: 'name',
        expectingInput: true,
        isFirstMessage: chatHistory.length === 0
      };
    }
    
    if (!sections.title?.content) {
      return {
        section: 'title',
        expectingInput: true,
        isFirstMessage: false
      };
    }
    
    if (!sections.summary?.content) {
      return {
        section: 'summary',
        expectingInput: true,
        isFirstMessage: false
      };
    }
    
    if (!sections.skills?.content) {
      return {
        section: 'skills',
        expectingInput: true,
        isFirstMessage: false
      };
    }
    
    if (!sections.experience?.content) {
      return {
        section: 'experience',
        expectingInput: true,
        isFirstMessage: false
      };
    }
    
    if (!sections.projects?.content) {
      return {
        section: 'projects',
        expectingInput: true,
        isFirstMessage: false
      };
    }
    
    if (!sections.education?.content) {
      return {
        section: 'education',
        expectingInput: true,
        isFirstMessage: false
      };
    }
    
    return {
      section: 'complete',
      expectingInput: false,
      isFirstMessage: false
    };
  }

  /**
   * Get next step after processing current input
   */
  getNextStep(currentStep, userMessage, resumeData) {
    // If we just processed the user's input, move to next section
    if (currentStep.expectingInput && userMessage.trim()) {
      // Simulate updating the resume data with the new section
      const updatedResumeData = { ...resumeData };
      if (!updatedResumeData.sections) updatedResumeData.sections = {};
      updatedResumeData.sections[currentStep.section] = { content: userMessage };
      
      return this.determineCurrentStep(updatedResumeData, []);
    }
    
    return currentStep;
  }

  /**
   * Build prompt for bot response generation
   */
  buildBotResponsePrompt(step, userMessage, resumeData) {
    const userName = resumeData.sections?.name?.content || '';
    
    if (step.isFirstMessage) {
      return "Generate a warm greeting and ask for the user's full name to start building their resume.";
    }
    
    // If we just received input, acknowledge it and ask next question
    if (userMessage.trim()) {
      switch (step.section) {
        case 'title':
          return `The user just provided their name: "${userMessage}". Acknowledge it positively and ask for their professional title or job position they're seeking.`;
        
        case 'summary':
          return `The user just provided their title: "${userMessage}". Acknowledge it and ask them to describe their professional background in a few sentences.`;
        
        case 'skills':
          return `The user just provided their background. Acknowledge it and ask for their top technical skills or core competencies.`;
        
        case 'experience':
          return `The user just provided their skills. Acknowledge them and ask about their most recent or most relevant work experience.`;
        
        case 'projects':
          return `The user just provided their work experience. Acknowledge it and ask about a significant project they've worked on.`;
        
        case 'education':
          return `The user just provided project information: "${userMessage}". Acknowledge it and ask about their educational background.`;
        
        case 'complete':
          // Check if we just completed education section (meaning user just provided education info)
          if (step.section === 'complete' && userMessage.trim()) {
            return `Perfect! Thank you for providing your educational background: "${userMessage}". 🎉 Congratulations! You have successfully completed all sections of your resume including: Name, Professional Title, Summary, Skills, Experience, Projects, and Education. Your resume is now ready! Would you like to see your complete formatted resume?`;
          }
          return `🎉 Congratulations! You have successfully completed all sections of your resume including: Name, Professional Title, Summary, Skills, Experience, Projects, and Education. Your resume is now ready! Would you like to see your complete formatted resume?`;
        
        default:
          return `Continue the conversation by asking about the ${step.section} section of their resume.`;
      }
    }
    
    // Fallback for continuing conversation
    return this.getDefaultQuestionPrompt(step.section);
  }

  /**
   * Check if user wants to see their complete resume
   */
  isRequestingResumeView(message) {
    const lowerMessage = message.toLowerCase().trim();
    const positiveResponses = ['yes', 'yeah', 'sure', 'ok', 'okay', 'show me', 'view', 'see', 'display', 'final resume'];
    return positiveResponses.some(response => lowerMessage.includes(response));
  }

  /**
   * Get resume context for AI content generation
   */
  getResumeContext(resumeData) {
    const sections = resumeData.sections || {};
    return {
      name: sections.name?.content || '',
      title: sections.title?.content || '',
      summary: sections.summary?.content || ''
    };
  }

  /**
   * Get default question prompts
   */
  getDefaultQuestionPrompt(section) {
    switch (section) {
      case 'name':
        return "Ask for the user's full name to start building their resume.";
      case 'title':
        return "Ask for their professional title or desired job position.";
      case 'summary':
        return "Ask them to describe their professional background briefly.";
      case 'skills':
        return "Ask for their top technical skills or core competencies.";
      case 'experience':
        return "Ask about their most recent work experience.";
      case 'projects':
        return "Ask about a significant project they've worked on.";
      case 'education':
        return "Ask about their educational background.";
      default:
        return "Continue helping them build their resume.";
    }
  }

  /**
   * Get default response when AI fails
   */
  getDefaultResponse(resumeData) {
    const step = this.determineCurrentStep(resumeData, []);
    
    if (step.isFirstMessage) {
      return "Hello! I'm here to help you create a professional resume. Let's start with the basics - what's your full name?";
    }
    
    return this.getDefaultQuestion(step.section);
  }

  /**
   * Fallback questions if AI fails
   */
  getDefaultQuestion(section) {
    const defaultQuestions = {
      name: "What is your full name?",
      title: "What is your professional title or the position you're seeking?",
      summary: "Can you tell me about your professional background in a few sentences?",
      skills: "What are your top technical skills or areas of expertise?",
      experience: "Can you describe your most recent work experience?",
      projects: "Tell me about a significant project you've worked on.",
      education: "What is your educational background?"
    };
    
    return defaultQuestions[section] || "Can you provide more information about this section?";
  }
}

module.exports = new OpenAIService();
