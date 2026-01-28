# SmartAssign

An automated assignment management and evaluation system using Large Language Models to generate reference answers and provide preliminary grading for student submissions.

## Problem Statement
Educational institutions face a scalability challenge in providing timely, detailed feedback on assignments. Faculty often spend significant time generating marking schemes and performing repetitive grading for objective or semi-structured questions. This manual process leads to delayed feedback loops, which hinders the learning progression of students.

## AI / ML Approach
The system leverages Retrieval-Augmented Generation (RAG) principles to bridge the gap between static assignment documents and active evaluation.

- **Model Choice**: The platform uses Llama-3-70b via the Groq inference engine. This was chosen for its high reasoning capabilities in educational contexts and the extremely low latency required for interactive faculty workflows.
- **Technique**: Zero-shot and few-shot prompting via LangChain is used for two primary tasks:
    1. **Reference Generation**: Extracting core questions from instructor-provided PDFs and generating comprehensive "ideal" answers.
    2. **Semantic Grading**: Comparing student submission text against the generated reference data to provide a similarity-based score and qualitative feedback.
- **Data Inputs**: The system processes unstructured text data extracted from PDF documents. It does not rely on pre-labeled datasets but instead uses the instructor's source material as the ground truth for each specific session.

## Key Engineering Decisions
- **LangChain Abstraction**: LangChain was implemented to decouple the application logic from the specific LLM provider. This allows the system to switch between Groq, OpenAI, or local Ollama instances by changing a single configuration, ensuring future-proofing against API pricing or model capability shifts.
- **Stateless PDF Processing**: Instead of storing large binary PDF blobs in the database, the system parses text during upload. Metadata and text extracts are stored in MongoDB, while original files are handled via a local file-system middleware. This reduces database overhead and speeds up the inference calls by only sending relevant text chunks to the LLM.
- **Asynchronous Interaction**: Given the non-deterministic latency of AI inference, the backend uses an asynchronous flow to ensure the UI remains responsive during the 2-5 second generation window.

## Evaluation & Reliability
- **Human-in-the-Loop**: The system is designed as a collaborative tool, not a fully autonomous grader. All AI-generated scores and feedback are presented as "Drafts." Faculty must review, edit, and manually approve these results before they are released to students.
- **Non-Deterministic Outputs**: LLM outputs are inherently probabilistic. To mitigate hallucinations, the system uses temperature settings of 0.1-0.2 to prioritize factual consistency over creativity.
- **Validation**: Accuracy is not explicitly claimed as a percentage. Reliability is instead verified by comparing the AI's "Ideal Answer" against the instructor's intent during the creation phase, allowing the instructor to regenerate or modify results before students submit.

## Tech Stack
- **Backend**: Node.js, Express.js
- **Frontend**: React.js
- **Database**: MongoDB (Mongoose ODM)
- **AI/ML**: LangChain, Groq SDK, Llama-3
- **Document Processing**: pdf-parse, pdf2json
- **Communication**: Nodemailer (SMTP)

## High-Level Architecture
```text
[PDF Upload] -> [Text Extraction (pdf-parse)] -> [Clean Text]
                                                       |
[Instructor Key] --------------------------------> [Context Window]
                                                       |
                                                (Llama-3 Inference)
                                                       |
                                                [Structured JSON]
                                                       |
[Student View] <----(MongoDB)---- [Draft Grade] <---- [Review]
```

## Setup & Run
### Prerequisites
- Node.js v18+
- MongoDB instance
- Groq API Key

### Installation
1. Clone the repository.
2. In the `server` directory, create a `.env` file:
   ```env
   MONGODB_URI=your_uri
   JWT_SECRET=your_secret
   GROQ_API_KEY=your_key
   EMAIL_USER=your_email
   EMAIL_APP_PASSWORD=your_password
   ```
3. Run `npm install` in both the root and `client` directories.
4. Start the backend: `cd server && npm run dev`.
5. Start the frontend: `cd client && npm start`.

## What I Learned
- **Prompt Engineering**: Developed skills in designing robust prompts that enforce specific JSON output formats from LLMs to ensure backend compatibility.
- **System Orchestration**: Gained experience in managing the lifecycle of data as it moves from unstructured PDF files to structured database records and finally into prompt contexts.
- **Error Middleware**: Implemented comprehensive error handling for third-party API failures, ensuring the application gracefully handles rate limits or service outages from the AI provider.

## Limitations
- **OCR**: The current implementation uses text-based PDF parsing. It cannot process handwritten submissions or assignments provided as images without further integration of OCR (Optical Character Recognition).
- **Context Window**: Extremely long assignments (50+ pages) may exceed the token limits of the current LLM context window.
- **Deterministic Logic**: The system may struggle with highly subjective or creative writing assignments where "correctness" is loosely defined.

## Future Improvements
- **Advanced Vector Search**: Moving from simple text comparison to vector-based semantic search using Pinecone or Weaviate for more nuanced grading of larger texts.
- **On-Device Inference**: Exploring the use of WebGPU and smaller models (e.g., Phi-3) to perform light evaluation locally in the browser.

## Author Information
- **Name**: Harsh Lad
- **Role**: Software Engineer / AI Implementation
- **Contact**: [GitHub Profile](https://github.com/ladHarsh) / [Email](mailto:harshlad.dev@gmail.com)
