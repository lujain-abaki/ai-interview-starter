const express = require('express');
const router = express.Router();
const OpenAI = require('openai');
const marked = require('marked');

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

// Store interview sessions in memory (could be moved to a database in production)
const interviewSessions = new Map();

// Generate interview questions based on job description
router.post('/generate-questions', async (req, res) => {
    try {
        const { jobTitle, jobDescription, level, style } = req.body;
        
        // Create a session ID for this interview
        const sessionId = Date.now().toString();
        
        const systemPrompt = `You are an expert technical interviewer with extensive experience in hiring ${level || 'mid-level'} ${jobTitle} positions.
        Your goal is to conduct a professional interview that evaluates the candidate's skills and experience.`;
        
        const userPrompt = `Create 5 relevant ${style || 'mixed'} interview questions for a ${level || 'mid-level'} ${jobTitle} position.
        ${jobDescription ? `Consider this job description: ${jobDescription}\n` : ''}
        
        For each question:
        1. Include a clear, specific question
        2. Add context or scenario where appropriate
        3. Include what you're looking for in an answer
        4. Add follow-up questions if relevant
        
        Return the response in this JSON format:
        {
            "questions": [
                {
                    "main": "main question text",
                    "context": "background context",
                    "evaluation_criteria": "what to look for in the answer",
                    "follow_ups": ["follow up 1", "follow up 2"]
                }
            ]
        }`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7
        });

        try {
            const response = JSON.parse(completion.choices[0].message.content);
            
            // Store session data
            interviewSessions.set(sessionId, {
                jobTitle,
                level,
                style,
                questions: response.questions,
                currentQuestion: 0,
                answers: [],
                startTime: new Date(),
                lastActive: new Date()
            });

            // Store in user session
            if (!req.session.interviewHistory) {
                req.session.interviewHistory = [];
            }
            req.session.interviewHistory.push({
                sessionId,
                jobTitle,
                date: new Date()
            });

            res.json({
                sessionId,
                questions: response.questions
            });
        } catch (parseError) {
            console.error('Parse error:', parseError);
            res.status(500).json({ error: 'Failed to parse questions' });
        }
    } catch (error) {
        console.error('Error generating questions:', error);
        res.status(500).json({ error: 'Failed to generate questions' });
    }
});

// Evaluate answer and provide feedback
router.post('/evaluate-answer', async (req, res) => {
    try {
        const { sessionId, questionIndex, answer } = req.body;
        
        // Get session data
        const session = interviewSessions.get(sessionId);
        if (!session) {
            return res.status(404).json({ error: 'Interview session not found' });
        }

        const question = session.questions[questionIndex];
        
        const systemPrompt = `You are an expert technical interviewer evaluating candidates for a ${session.level} ${session.jobTitle} position.
        Provide detailed, constructive feedback that helps the candidate improve.`;
        
        const userPrompt = `Evaluate this interview response:

Question: ${question.main}
Context: ${question.context}
Expected criteria: ${question.evaluation_criteria}
Candidate's Answer: ${answer}

Provide a detailed evaluation in this JSON format:
{
    "overall_rating": "1-5 score",
    "clarity": "feedback on communication clarity",
    "technical_accuracy": "feedback on technical correctness",
    "completeness": "feedback on answer completeness",
    "improvements": "specific suggestions for improvement",
    "follow_up_recommendation": "recommended follow-up question based on their answer",
    "highlights": ["key positive points"],
    "markdown_feedback": "detailed feedback in markdown format"
}`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
            ],
            temperature: 0.7
        });

        try {
            const feedback = JSON.parse(completion.choices[0].message.content);
            
            // Store the answer and feedback
            if (!session.answers[questionIndex]) {
                session.answers[questionIndex] = {
                    answer,
                    feedback,
                    timestamp: new Date()
                };
            }
            
            session.lastActive = new Date();
            interviewSessions.set(sessionId, session);

            // Convert markdown feedback to HTML
            feedback.markdown_feedback_html = marked.parse(feedback.markdown_feedback);
            
            res.json(feedback);
        } catch (parseError) {
            console.error('Parse error:', parseError);
            res.status(500).json({ error: 'Failed to parse feedback' });
        }
    } catch (error) {
        console.error('Error evaluating answer:', error);
        res.status(500).json({ error: 'Failed to evaluate answer' });
    }
});

// Get interview summary
router.get('/summary/:sessionId', async (req, res) => {
    const session = interviewSessions.get(req.params.sessionId);
    if (!session) {
        return res.status(404).json({ error: 'Interview session not found' });
    }

    try {
        const summaryPrompt = `Create a comprehensive interview summary based on these responses:
        Position: ${session.level} ${session.jobTitle}
        
        ${session.answers.map((a, i) => `
        Question ${i + 1}: ${session.questions[i].main}
        Answer: ${a.answer}
        Feedback: ${JSON.stringify(a.feedback)}
        `).join('\n')}
        
        Provide a summary in this JSON format:
        {
            "overall_performance": "general performance assessment",
            "strongest_areas": ["area1", "area2"],
            "areas_for_improvement": ["area1", "area2"],
            "recommendations": ["recommendation1", "recommendation2"],
            "interview_score": "1-5 score",
            "detailed_summary": "markdown formatted detailed summary"
        }`;

        const completion = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{ role: "user", content: summaryPrompt }],
            temperature: 0.7
        });

        const summary = JSON.parse(completion.choices[0].message.content);
        summary.detailed_summary_html = marked.parse(summary.detailed_summary);
        
        res.json(summary);
    } catch (error) {
        console.error('Error generating summary:', error);
        res.status(500).json({ error: 'Failed to generate interview summary' });
    }
});

module.exports = router; 