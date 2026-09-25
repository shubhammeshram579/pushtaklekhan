// const { GoogleGenerativeAI } = require('@google/generative-ai');

// const { InferenceClient } = require('@huggingface/inference');

// const hf = new InferenceClient(process.env.HF_TOKEN);

// const genAI = new GoogleGenerativeAI(
//   process.env.GEMINI_API_KEY
// );

// // const DEFAULT_MODEL = 'gemini-3.8-flash';
// // const DEFAULT_MODEL = 'gemini-3.1-flash-lite';

// const DEFAULT_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';

// const SYSTEM = `
// You are an expert AI writing assistant embedded in Inkwell, a professional book writing platform.
// Help authors improve their writing.
// Always preserve the author's unique voice and style.
// Never be preachy.
// Return only the requested output unless explicitly asked otherwise.
// `;

// const complete = async (
//   prompt,
//   system = SYSTEM,
//   maxTokens = 2000,
//   modelName = DEFAULT_MODEL
// ) => {
//   try {
//     const model = genAI.getGenerativeModel({
//       model: modelName,
//       systemInstruction: system,
//     });

//     const result = await model.generateContent({
//       contents: [
//         {
//           role: 'user',
//           parts: [{ text: prompt }],
//         },
//       ],
//       generationConfig: {
//         maxOutputTokens: maxTokens,
//         temperature: 0.7,
//       },
//     });

//     const response = result.response;
//     const usageData = response.usageMetadata || {};

//     return {
//       text: response.text() || '',
//       usage: {
//         output_tokens: usageData.candidatesTokenCount || 0,
//         input_tokens: usageData.promptTokenCount || 0,
//         total_tokens: usageData.totalTokenCount || 0,
//       },
//     };
//   } catch (error) {
//     console.error('Gemini Complete Error:', error);
//     throw error;
//   }
// };


// const streamComplete = async (
//   prompt,
//   onChunk,
//   opts = {}
// ) => {
//   try {
//     const model = genAI.getGenerativeModel({
//       model: opts.model || DEFAULT_MODEL,
//       systemInstruction: opts.system || SYSTEM,
//     });

//     const result = await model.generateContentStream({
//       contents: [
//         {
//           role: 'user',
//           parts: [
//             {
//               text: prompt,
//             },
//           ],
//         },
//       ],
//       generationConfig: {
//         maxOutputTokens: opts.maxTokens || 1500,
//         temperature: 0.7,
//       },
//     });

//     for await (const chunk of result.stream) {
//       const text = chunk.text();

//       if (text) {
//         onChunk(text);
//       }
//     }

//     return true;
//   } catch (error) {
//     console.error('Gemini Stream Error:', error);
//     throw error;
//   }
// };





// // Map common aspect ratios to dimensions compatible with FLUX.1
// const ASPECT_RATIO_DIMENSIONS = {
//   "1:1":  { width: 1024, height: 1024 },
//   "16:9": { width: 1024, height: 576 },
//   "9:16": { width: 576,  height: 1024 }
// };

// /**
//  * Pure prompt-based image generation service
//  */
// const generateImageContent = async (prompt, aspectRatio = "1:1") => {
//   try {
//     const dimensions = ASPECT_RATIO_DIMENSIONS[aspectRatio] || ASPECT_RATIO_DIMENSIONS["1:1"];

//     const blob = await hf.textToImage({
//       model: 'black-forest-labs/FLUX.1-schnell',
//       inputs: prompt,
//       parameters: {
//         num_inference_steps: 4, // Fast & high quality
//         width: dimensions.width,
//         height: dimensions.height,
//       },
//     });

//     // Convert Blob to Buffer in Node.js
//     const arrayBuffer = await blob.arrayBuffer();
//     const buffer = Buffer.from(arrayBuffer);
//     const base64Image = buffer.toString('base64');

//     // Use actual blob MIME type (defaults to image/png if absent)
//     const mimeType = blob.type || 'image/png';

//     return `data:${mimeType};base64,${base64Image}`;
//   } catch (error) {
//     console.error('Hugging Face Image Error:', error.message || error);
//     return null;
//   }
// };





// module.exports = {
//   complete,
//   streamComplete,
//   generateImageContent
// };



const { GoogleGenerativeAI } = require('@google/generative-ai');
const { InferenceClient } = require('@huggingface/inference');

const hf = new InferenceClient(process.env.HF_TOKEN);
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Define primary and fallback models
const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-3.1-flash-lite';

const SYSTEM = `
You are an expert AI writing assistant embedded in Inkwell, a professional book writing platform.
Help authors improve their writing.
Always preserve the author's unique voice and style.
Never be preachy.
Return only the requested output unless explicitly asked otherwise.
`;

// Helper: Exponential delay for retries
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Execute Gemini API with Retry & Fallback Mechanism
 */
const callGeminiWithRetry = async (prompt, system, maxTokens, modelName) => {
  const modelsToTry = [modelName, FALLBACK_MODEL];

  for (const currentModel of modelsToTry) {
    let attempts = 0;
    const maxAttempts = 3;

    while (attempts < maxAttempts) {
      try {
        const model = genAI.getGenerativeModel({
          model: currentModel,
          systemInstruction: system,
        });

        const result = await model.generateContent({
          contents: [
            {
              role: 'user',
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            maxOutputTokens: maxTokens,
            temperature: 0.7,
          },
        });

        return result; // Success
      } catch (error) {
        attempts++;
        const isTransientError = error.status === 503 || error.status === 429;

        console.warn(
          `Gemini attempt ${attempts} failed for model [${currentModel}] with status ${error.status || 'unknown'}`
        );

        // If it's a 503/429 and we have retries left, wait and retry
        if (isTransientError && attempts < maxAttempts) {
          await delay(1000 * Math.pow(2, attempts)); // 2s, 4s backoff
          continue;
        }

        // If retries exhausted on primary model, break inner loop to try fallback model
        if (currentModel !== FALLBACK_MODEL) {
          console.warn(`Switching to fallback model: ${FALLBACK_MODEL}`);
          break;
        }

        // If fallback model also fails, throw final error
        throw error;
      }
    }
  }
};

const complete = async (
  prompt,
  system = SYSTEM,
  maxTokens = 2000,
  modelName = PRIMARY_MODEL
) => {
  try {
    const result = await callGeminiWithRetry(prompt, system, maxTokens, modelName);
    const response = result.response;
    const usageData = response.usageMetadata || {};

    return {
      text: response.text() || '',
      usage: {
        output_tokens: usageData.candidatesTokenCount || 0,
        input_tokens: usageData.promptTokenCount || 0,
        total_tokens: usageData.totalTokenCount || 0,
      },
    };
  } catch (error) {
    console.error('Gemini Complete Error:', error);
    throw error;
  }
};

const streamComplete = async (
  prompt,
  onChunk,
  opts = {}
) => {
  const modelToUse = opts.model || PRIMARY_MODEL;
  try {
    const model = genAI.getGenerativeModel({
      model: modelToUse,
      systemInstruction: opts.system || SYSTEM,
    });

    const result = await model.generateContentStream({
      contents: [
        {
          role: 'user',
          parts: [{ text: prompt }],
        },
      ],
      generationConfig: {
        maxOutputTokens: opts.maxTokens || 1500,
        temperature: 0.7,
      },
    });

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        onChunk(text);
      }
    }

    return true;
  } catch (error) {
    console.error('Gemini Stream Error:', error);
    throw error;
  }
};

const ASPECT_RATIO_DIMENSIONS = {
  "1:1":  { width: 1024, height: 1024 },
  "16:9": { width: 1024, height: 576 },
  "9:16": { width: 576,  height: 1024 }
};

const generateImageContent = async (prompt, aspectRatio = "1:1") => {
  try {
    const dimensions = ASPECT_RATIO_DIMENSIONS[aspectRatio] || ASPECT_RATIO_DIMENSIONS["1:1"];

    const blob = await hf.textToImage({
      model: 'black-forest-labs/FLUX.1-schnell',
      inputs: prompt,
      parameters: {
        num_inference_steps: 4,
        width: dimensions.width,
        height: dimensions.height,
      },
    });

    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString('base64');
    const mimeType = blob.type || 'image/png';

    return `data:${mimeType};base64,${base64Image}`;
  } catch (error) {
    console.error('Hugging Face Image Error:', error.message || error);
    return null;
  }
};

module.exports = {
  complete,
  streamComplete,
  generateImageContent
};


