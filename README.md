# AI Interview Coach 🤖

An AI-powered interview practice tool that provides real-time feedback on your interview responses using GPT-4.

## Features

- 📝 Enter job title or paste job description
- 🤖 Get relevant interview questions based on job details
- ✍️ Type your answers and receive instant feedback
- 🎛️ Customize interview style (Behavioral/Technical/Mixed)
- 📊 Detailed feedback on clarity, relevance, and areas for improvement

## Prerequisites

- Node.js (v14 or higher)
- OpenAI API key

## Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd ai-interview-coach
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory and add your OpenAI API key:
```
OPENAI_API_KEY=your_api_key_here
PORT=3000
```

4. Start the application:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Usage

1. Open your browser and navigate to `http://localhost:3000`
2. Enter the job title and optionally paste the job description
3. Select the role level (Junior/Mid/Senior) and interview style
4. Click "Start Interview" to begin
5. Answer each question and receive AI-powered feedback
6. Progress through all questions to complete the interview

## Technology Stack

- Backend: Node.js + Express
- Frontend: EJS templates
- AI: OpenAI GPT-4
- Styling: Custom CSS

## Future Enhancements (v2)

- Voice input support using Whisper API
- Session storage with MongoDB
- More detailed analytics and progress tracking
- Custom interview templates
- Mock interview recordings

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT 