import Groq from "groq-sdk";

// All three API keys loaded from your .env.local file
const API_KEYS = [
  process.env.GROQ_API_KEY_1,
  process.env.GROQ_API_KEY_2,
  process.env.GROQ_API_KEY_3,
];

export async function POST(request) {
  // Read the syllabus, hours, and exam type the user sent from the front-end
  const { syllabus, hours, examType } = await request.json();

  // Safety check: make sure the user actually typed something
  if (!syllabus || syllabus.trim() === "") {
    return Response.json(
      { error: "Please paste your syllabus before generating questions." },
      { status: 400 }
    );
  }

  // Basic gibberish check — must have at least 3 real words of 3+ characters
  const realWords = syllabus.trim().match(/\b[a-zA-Z]{3,}\b/g);
  if (!realWords || realWords.length < 3) {
    return Response.json(
      {
        error:
          "⚠️ Please enter a valid syllabus with real topics. We couldn't detect any recognizable subject matter.",
      },
      { status: 400 }
    );
  }

  // Decide how many questions based on hours left
  const questionCount =
    hours === "1" ? 10 :
    hours === "8" ? 30 :
    20;

  // Format instructions based on the exam type the user selected
  const formatInstructions = {
    "Mixed": "Generate a mix of question types: MCQs, short answer, and descriptive questions.",
    "MCQs only": `Generate ALL ${questionCount} as MCQs. Each must have 4 options labeled A, B, C, D. In the answer field, write which option is correct and why briefly. Example answer: 'B) Because...'`,
    "Coding questions only": `Generate ALL ${questionCount} as coding problems. Each question should describe a problem to solve with expected input/output examples. In the answer field, provide a clean solution with a one-line explanation.`,
    "Short answer": `Generate ALL ${questionCount} as short answer questions. Each answer must be 2-3 lines maximum.`,
    "Subjective": `Generate ALL ${questionCount} as subjective questions requiring detailed explanations. Answers should be thorough, covering key concepts, examples, and implications.`,
    "Numericals only": `Generate ALL ${questionCount} as numerical problems with real numbers and calculations. Every question must require the student to calculate, solve, or derive something. Show clear step-by-step working in the answer with the final answer clearly stated.`,
  };

  // Build the prompt we send to Groq
  const prompt = `
You are an expert exam question predictor for college students.

IMPORTANT: First check if the syllabus provided contains real academic topics or subjects. If it is random gibberish, nonsense, or contains no recognizable academic content, respond with only: INVALID_SYLLABUS and absolutely nothing else. No JSON, no explanation.

A student has ${hours} hour(s) left before their exam. You MUST generate EXACTLY ${questionCount} questions — no more, no less. Count them before responding. Exam type: ${examType}. ${formatInstructions[examType]}

First, silently analyze the syllabus below and decide which category it falls into:

If MATHEMATICS (pure maths, numerical methods, statistics):
- All ${questionCount} questions must be numerical problems requiring calculation, derivation, or equation solving.
- No definitions or conceptual questions at all.
- Every answer must show step-by-step working with the final answer clearly stated.
- If the exam type is "Numericals only", strictly override everything and generate only numerical calculation problems regardless of subject.

If MIXED NUMERICAL + THEORY (Physics, Chemistry, Electronics, Engineering subjects):
- Analyze the syllabus topics individually. Some topics will be numerical, some will be conceptual.
- For numerical topics (formulas, laws with calculations, circuit problems, reactions with quantities): generate calculation-based problems with step-by-step answers.
- For theory topics (definitions, principles, mechanisms, explanations): generate conceptual questions with clear descriptive answers.
- Split the ${questionCount} questions proportionally — if the syllabus is 60% numerical topics, roughly 60% questions should be numerical. Match the balance to the syllabus content.
- Do NOT force every question to be numerical just because the subject has some maths in it.

If PURE THEORY (History, Biology concepts, Law, Literature, Management):
- All ${questionCount} questions should be conceptual, descriptive, or application-based.
- Answers should explain clearly in 2-4 sentences matching the exam type format.
- No numerical problems.

Syllabus:
${syllabus}

Return ONLY a valid JSON array. No explanation, no markdown, no backticks, no extra text. Format exactly like this:
[
  {
    "question": "Write the question here?",
    "answer": "Write the answer here with steps if numerical."
  }
]

IMPORTANT: Count your questions before finalizing. The JSON array MUST contain exactly ${questionCount} objects. Not 18. Not 19. Exactly ${questionCount}.

Generate all ${questionCount} questions now.
`;

  // Try each API key one by one until one works
  let lastError = null;

  for (let i = 0; i < API_KEYS.length; i++) {
    const apiKey = API_KEYS[i];

    // Skip this slot if the key is missing from .env.local
    if (!apiKey) {
      console.warn(`GROQ_API_KEY_${i + 1} is not set — skipping.`);
      continue;
    }

    try {
      console.log(`Trying GROQ_API_KEY_${i + 1}...`);

      const groq = new Groq({ apiKey });

      const completion = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.85,
        max_tokens: 4000,
      });

      // Extract the text Groq replied with
      let rawText = completion.choices[0].message.content;

      // Strip markdown code fences if the model added them
      rawText = rawText.replace(/```json/g, "").replace(/```/g, "").trim();

      // Check if Groq detected the syllabus as invalid
      if (rawText.includes("INVALID_SYLLABUS")) {
        return Response.json(
          {
            error:
              "⚠️ Please enter a valid syllabus with real topics. We couldn't detect any recognizable subject matter.",
          },
          { status: 400 }
        );
      }

      // Find the first [ and last ] to extract only the JSON array
      const start = rawText.indexOf("[");
      const end = rawText.lastIndexOf("]");

      if (start === -1 || end === -1) {
        return Response.json(
          { error: "AI returned an unexpected format. Please try again." },
          { status: 500 }
        );
      }

      const cleanJson = rawText.slice(start, end + 1);

      // Fix bad escape characters from LaTeX or code backslashes
      const sanitized = cleanJson.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");

      // Parse the JSON into a JavaScript array
      const questions = JSON.parse(sanitized);

      // If too many, trim and return
      if (questions.length >= questionCount) {
        const trimmed = questions.slice(0, questionCount);
        console.log(`Success with GROQ_API_KEY_${i + 1}`);
        return Response.json({ questions: trimmed });
      }

      // If too few, retry same key up to 2 more times
      console.warn(`Got ${questions.length} questions, expected ${questionCount}. Retrying...`);

      let retryQuestions = questions;
      for (let retry = 0; retry < 2; retry++) {
        const retryCompletion = await groq.chat.completions.create({
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.9,
          max_tokens: 4000,
        });

        let retryRaw = retryCompletion.choices[0].message.content;
        retryRaw = retryRaw.replace(/```json/g, "").replace(/```/g, "").trim();

        const s = retryRaw.indexOf("[");
        const e = retryRaw.lastIndexOf("]");

        if (s !== -1 && e !== -1) {
          const retryJson = retryRaw.slice(s, e + 1).replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
          const retryParsed = JSON.parse(retryJson);
          if (retryParsed.length >= questionCount) {
            console.log(`Retry ${retry + 1} succeeded.`);
            return Response.json({ questions: retryParsed.slice(0, questionCount) });
          }
          retryQuestions = retryParsed;
        }
      }

      // Return best attempt even if count is slightly off
      console.warn(`Returning best attempt: ${retryQuestions.length} questions.`);
      return Response.json({ questions: retryQuestions });

    } catch (error) {
      // Log full error structure to Vercel logs
      console.error(`Key ${i + 1} error:`, JSON.stringify(error));

      const isRateLimit =
        error?.status === 429 ||
        error?.status === "429" ||
        error?.message?.includes("429") ||
        error?.message?.toLowerCase().includes("rate limit") ||
        error?.error?.message?.toLowerCase().includes("rate limit") ||
        JSON.stringify(error).toLowerCase().includes("rate limit");

      if (isRateLimit) {
        console.warn(`GROQ_API_KEY_${i + 1} hit rate limit. Trying next key...`);
        lastError = error;
        continue;
      }

      // Any other error — stop immediately
      console.error(`GROQ_API_KEY_${i + 1} failed:`, error.message);
      return Response.json(
        { error: "Something went wrong. Please try again." },
        { status: 500 }
      );
    }
  }

  // If every key was rate limited
  console.error("All Groq API keys are rate limited.");
  return Response.json(
    {
      error: "⚡ Too many requests right now — try again in a few minutes!",
    },
    { status: 429 }
  );
}