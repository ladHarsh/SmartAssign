# SmartAssign

![License](https://img.shields.io/badge/license-MIT-green)
![Node.js](https://img.shields.io/badge/Node.js-18.x-brightgreen)
![Express](https://img.shields.io/badge/Express.js-Backend-lightgrey)
![MongoDB](https://img.shields.io/badge/MongoDB-Database-green)
![React](https://img.shields.io/badge/React-Frontend-blue)
![LangChain](https://img.shields.io/badge/LangChain-LLM%20Framework-orange)
![Llama-3](https://img.shields.io/badge/LLM-Llama--3--70B-purple)
![Groq](https://img.shields.io/badge/Inference-Groq-red)

An AI-assisted assignment evaluation system that uses Large Language Models and retrieval-based reasoning to help educators generate reference answers and provide structured, draft feedback on student submissions.

Designed as a decision-support system, not a fully autonomous grader.

---

## TL;DR
SmartAssign is a **production-ready applied AI system** designed to reduce assignment feedback latency at scale. It uses LLMs and retrieval-based reasoning to assist educators in grading and feedback workflows while keeping **humans in the loop** to ensure reliability, transparency, and academic integrity.

---

## Links
- Video Demo: https://youtu.be/cqtb4iDCn2M
- Live Application: https://smartassign.onrender.com
- Portfolio: https://harshlad.vercel.app

---

## Problem Statement
Educational institutions struggle to provide timely and consistent feedback as class sizes increase. Faculty members spend significant time creating marking schemes and manually evaluating submissions, leading to delayed feedback cycles and inconsistent grading standards.

Fully automated grading systems are risky in academic environments due to hallucinations, subjectivity, and misalignment with instructor intent.

---

## Solution Overview
SmartAssign acts as a **decision-support system** for educators rather than an autonomous grader.

The platform:
- Generates draft reference answers from instructor-provided material
- Assists with semantic comparison of student submissions
- Produces structured feedback drafts for faculty review
- Preserves full human authority over final grading decisions

The system is intentionally conservative, favoring reliability and instructor control over full automation.

---

## Key Engineering Decisions

### Human-in-the-Loop by Design
All AI-generated answers and grades are explicitly marked as drafts. Faculty must review, edit, and approve outputs before they are released to students.

### Provider-Agnostic AI Layer
LangChain abstracts the LLM interface, allowing the system to switch between Groq, OpenAI, or local models by changing configuration only—protecting the system from vendor lock-in.

### Stateless Document Handling
PDFs are parsed during upload and converted into clean text. Only extracted text and metadata are stored in MongoDB, reducing database load and minimizing unnecessary token usage during inference.

### Asynchronous AI Workflows
LLM inference latency is non-deterministic. The backend is designed with asynchronous request handling to keep the UI responsive during the generation process.

---

## AI System Design

### Model & Inference
- **Model**: Llama-3-70B
- **Inference Engine**: Groq (LPUs for low-latency reasoning)
- **Temperature**: 0.1–0.2 to prioritize factual consistency over creativity

### Core AI Tasks

#### 1. Reference Answer Generation
- Extracts key questions from instructor-provided PDFs
- Generates structured "ideal answers" using context-aware prompting

#### 2. Semantic Evaluation
- Compares student submissions against generated reference answers
- Produces similarity-based scores and qualitative feedback drafts

### Data Inputs
- Unstructured text extracted from PDFs
- No pre-labeled datasets
- Instructor-provided material acts as session-specific ground truth

---

## Evaluation & Reliability
SmartAssign avoids traditional accuracy claims, as grading quality is context-dependent and often subjective.

Instead, the system is evaluated using:
- Consistency of reference answers across regenerations
- Alignment of AI-generated output with instructor intent
- Reduction in average grading time per assignment
- Stability of outputs under low-temperature inference

All AI outputs remain editable drafts, ensuring that academic decisions remain under human control.

This design choice prioritizes trust and transparency over raw automation.

---

## High-Level Architecture

```text
[PDF Upload]
      |
[Text Extraction]
      |
[Clean Context Window]
      |
[LLM Inference (Llama-3)]
      |
[Structured JSON Output]
      |
[Instructor Review]
      |
[Approved Feedback]
```

---

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose ODM)

### Frontend
- React.js

### AI / ML
- LangChain
- Groq SDK
- Llama-3-70B

### Document Processing
- pdf-parse
- pdf2json

### Communication
- Nodemailer (SMTP)

---

## Setup & Run

### Prerequisites
- Node.js v18+
- MongoDB instance
- Groq API key

### Installation

1. Clone the repository

2. Create a `.env` file inside the `server` directory:
   ```env
   MONGODB_URI=your_mongodb_uri
   JWT_SECRET=your_jwt_secret
   GROQ_API_KEY=your_groq_api_key
   EMAIL_USER=your_email
   EMAIL_APP_PASSWORD=your_email_password
   ```

3. Install dependencies:
   ```bash
   npm install
   cd client && npm install
   ```

4. Start the backend:
   ```bash
   cd server
   npm run dev
   ```

5. Start the frontend:
   ```bash
   cd client
   npm start
   ```

---

## Engineering Learnings
- Designing prompts that enforce strict JSON output formats
- Managing unstructured data from PDFs through structured inference pipelines
- Handling third-party AI failures with robust error middleware
- Balancing AI capability with human oversight in sensitive domains

---

## Limitations
- No support for handwritten or image-based submissions without OCR
- Very long documents may exceed LLM context window limits
- Subjective or creative assignments remain challenging to evaluate consistently

---

## Future Improvements
- Vector-based semantic grading using embedding stores
- OCR integration for scanned submissions
- Lightweight on-device inference for preliminary evaluations

---

## Author
**Harsh Lad**  
Applied AI Engineer  
📧 harshlad.dev@gmail.com  
🔗 https://github.com/ladHarsh
