// const { complete ,generateImageContent} = require("../services/ai.service");
// const Analytics = require('../models/Analytics');
// const Character = require('../models/Character');
// const cloudinary = require('../utils/cloudinary');
// const UploadLog = require('../models/UploadLog');




// const BASE_SYSTEM = `You are an expert AI writing assistant embedded in Inkwell, a professional book writing platform.
// Help authors improve their writing. Always preserve the author's unique voice and style.
// Never be preachy. Return only the requested output — no meta-commentary or explanations unless asked.`;

// // Build context-aware system prompt
// const buildSystemPrompt = (opts = {}) => {
//   let system = BASE_SYSTEM;
//   if (opts.genre)      system += `\nBook genre: ${opts.genre}.`;
//   if (opts.bookTitle)  system += `\nBook title: "${opts.bookTitle}".`;
//   if (opts.characters?.length) {
//     const charSummary = opts.characters.map(c => `${c.name} (${c.role}): ${c.personality || 'no notes'}`).join('; ');
//     system += `\nKey characters: ${charSummary}.`;
//   }
//   if (opts.tone)       system += `\nMaintain a ${opts.tone} tone.`;
//   if (opts.style)      system += `\nWriting style: ${opts.style}.`;
//   return system;
// };

// const trackAI = async (userId, bookId) => {
//   if (!bookId) return;
//   const date = new Date().toISOString().slice(0, 10);
//   await Analytics.findOneAndUpdate(
//     { authorId: userId, bookId, date },
//     { $inc: { aiUsageCount: 1 } },
//     { upsert: true }
//   ).catch(() => {});
// };


// // const finalize = async (req, res, payload) => {
// //   // 1. Safely accesses payload.usage?.output_tokens
// //   const remaining = await req.deductCredits({ tokensUsed: payload.usage?.output_tokens });
  
// //   // 2. Sends the final HTTP JSON response
// //   res.json({
// //     success: true,
// //     result: payload.text,
// //     usage: payload.usage,
// //     credits: { remaining, cost: req.aiCreditCost },
// //   });
// // };

// const finalize = async (req, res, payload) => {
//   // Extract token count if it exists (for Gemini text), or fallback to standard metadata
//   const tokensUsed = payload.usage?.output_tokens || payload.tokensUsed || null;

//   // Deduct credits attached by the requireCredits middleware
//   const remaining = await req.deductCredits({ 
//     tokensUsed, 
//     type: payload.type || 'text' 
//   });

//   // Prepare response payload based on whether it's image or text
//   const responseData = payload.data 
//     ? { data: payload.data } 
//     : { result: payload.text, usage: payload.usage };

//     console.log("responseData",responseData)

//   return res.status(200).json({
//     success: true,
//     ...responseData,
//     credits: { remaining, cost: req.aiCreditCost },
//   });
// };

// // POST /api/ai/fix-grammar
// exports.fixGrammar = async (req, res, next) => {
//   try {
//     const { text, tone, bookId, genre, bookTitle } = req.body;
//     console.log("req.body",req.body)
//     console.log("req.user._id",req.user._id)
//     if (!text?.trim()) return res.status(400).json({ success: false, message: 'Text is required' });
//     const system = buildSystemPrompt({ genre, bookTitle, tone });
//     const { text: result, usage } = await complete(
//       `Fix grammar, punctuation, sentence structure, and clarity. Preserve the author's voice. Return ONLY the corrected text:\n\n${text}`,
//       system
//     );
//     await trackAI(req.user._id, bookId);
//     // Call finalize with the structured payload (finalize handles res.json)
//     await finalize(req, res, { text: result, usage });

//     // res.json({ success: true, result, usage });

//   } catch (err) { next(err); }
// };

// // POST /api/ai/rewrite
// exports.rewrite = async (req, res, next) => {
//   try {
//     const { text, style, tone, bookId, genre, bookTitle } = req.body;
//     if (!text?.trim()) return res.status(400).json({ success: false, message: 'Text is required' });
//     const system = buildSystemPrompt({ genre, bookTitle, tone, style });
//     const { text: result, usage } = await complete(
//       `Rewrite with improved flow, vivid language, and stronger impact. Keep the same meaning. Return ONLY the rewritten text:\n\n${text}`,
//       system
//     );
//     await trackAI(req.user._id, bookId);
//     await finalize(req, res, { text: result, usage });
//     // res.json({ success: true, result, usage });
//   } catch (err) { next(err); }
// };

// // POST /api/ai/continue-writing
// exports.continueWriting = async (req, res, next) => {
//   try {
//     const { text, paragraphs = 2, bookId, genre, bookTitle, characters } = req.body;
//     if (!text?.trim()) return res.status(400).json({ success: false, message: 'Text is required' });

//     let charData = characters;
//     if (!charData && bookId) {
//       charData = await Character.find({ bookId, authorId: req.user._id }).select('name role personality').limit(8);
//     }

//     const system = buildSystemPrompt({ genre, bookTitle, characters: charData });
//     const { text: result, usage } = await complete(
//       `Continue this passage naturally for ${paragraphs} paragraph(s). Match the established tone, style, and narrative voice exactly. Do not summarize — just continue seamlessly. Return ONLY the continuation:\n\n${text}`,
//       system, 1500
//     );
//     await trackAI(req.user._id, bookId);
//     await finalize(req, res, { text: result, usage });
//     // res.json({ success: true, result, usage });
//   } catch (err) { next(err); }
// };

// // POST /api/ai/summarize
// exports.summarize = async (req, res, next) => {
//   try {
//     const { text, type = 'chapter', bookId } = req.body;
//     if (!text?.trim()) return res.status(400).json({ success: false, message: 'Text is required' });
//     const { text: result, usage } = await complete(
//       `Write a concise ${type} summary (2-4 sentences) covering key events, character actions, emotional beats, and narrative significance. Return ONLY the summary:\n\n${text}`,
//       BASE_SYSTEM, 500
//     );
//     await trackAI(req.user._id, bookId);
//     await finalize(req, res, { text: result, usage });
//     // res.json({ success: true, result, usage });
//   } catch (err) { next(err); }
// };

// // POST /api/ai/expand
// exports.expand = async (req, res, next) => {
//   try {
//     const { text, bookId, genre, bookTitle } = req.body;
//     if (!text?.trim()) return res.status(400).json({ success: false, message: 'Text is required' });
//     const system = buildSystemPrompt({ genre, bookTitle });
//     const { text: result, usage } = await complete(
//       `Expand this outline/brief into richly detailed, engaging prose. Add sensory details, character emotions, dialogue where appropriate, and narrative depth. Return ONLY the expanded text:\n\n${text}`,
//       system
//     );
//     await trackAI(req.user._id, bookId);
//     await finalize(req, res, { text: result, usage });
//     // res.json({ success: true, result, usage });
//   } catch (err) { next(err); }
// };

// // POST /api/ai/simplify
// exports.simplify = async (req, res, next) => {
//   try {
//     const { text, readingLevel, bookId } = req.body;
//     if (!text?.trim()) return res.status(400).json({ success: false, message: 'Text is required' });
//     const { text: result, usage } = await complete(
//       `Simplify to a ${readingLevel || 'general'} reading level. Use clearer language and shorter sentences. Preserve all meaning. Return ONLY the simplified text:\n\n${text}`,
//       BASE_SYSTEM
//     );
//     await trackAI(req.user._id, bookId);
//     await finalize(req, res, { text: result, usage });
//     // res.json({ success: true, result, usage });
//   } catch (err) { next(err); }
// };

// // POST /api/ai/tone — adjust tone
// exports.adjustTone = async (req, res, next) => {
//   try {
//     const { text, tone, bookId } = req.body;
//     if (!text?.trim() || !tone) return res.status(400).json({ success: false, message: 'Text and tone are required' });
//     const tones = { professional: 'formal and professional', casual: 'conversational and casual', emotional: 'deeply emotional and expressive', academic: 'academic and scholarly', storytelling: 'narrative and storytelling' };
//     const { text: result, usage } = await complete(
//       `Rewrite this text in a ${tones[tone] || tone} tone. Keep the same content and meaning. Return ONLY the rewritten text:\n\n${text}`,
//       BASE_SYSTEM
//     );
//     await trackAI(req.user._id, bookId);
//     await finalize(req, res, { text: result, usage });
//     // res.json({ success: true, result, usage });
//   } catch (err) { next(err); }
// };

// // POST /api/ai/writers-block — beat writer's block
// exports.writersBlock = async (req, res, next) => {
//   try {
//     const { context, type = 'continuation', bookId, genre, bookTitle, characters } = req.body;

//     let charData = characters;
//     if (!charData && bookId) {
//       charData = await Character.find({ bookId, authorId: req.user._id }).select('name role personality').limit(5);
//     }

//     const system = buildSystemPrompt({ genre, bookTitle, characters: charData });
//     const prompts = {
//       continuation: `Based on this story context, suggest 3 compelling ways to continue the narrative. Be specific with plot ideas:\n\n${context || 'No context provided'}`,
//       plot: `Generate 3 interesting plot twist or development ideas that could fit this story:\n\n${context || 'No context provided'}`,
//       character: `Suggest 3 character interaction or development ideas for this story:\n\n${context || 'No context provided'}`,
//       scene: `Suggest 3 vivid scene ideas with setting, mood, and action that would fit this narrative:\n\n${context || 'No context provided'}`,
//     };
//     const { text: result, usage } = await complete(prompts[type] || prompts.continuation, system, 800);
//     await trackAI(req.user._id, bookId);
//     await finalize(req, res, { text: result, usage });
//     // res.json({ success: true, result, usage });
//   } catch (err) { next(err); }
// };

// // POST /api/ai/custom
// exports.customPrompt = async (req, res, next) => {
//   try {
//     const { prompt, context, bookId, genre, bookTitle, characters } = req.body;
//     if (!prompt?.trim()) return res.status(400).json({ success: false, message: 'Prompt is required' });

//     let charData = characters;
//     if (!charData && bookId) {
//       charData = await Character.find({ bookId, authorId: req.user._id }).select('name role personality').limit(5);
//     }

//     const system = buildSystemPrompt({ genre, bookTitle, characters: charData });
//     const fullPrompt = [
//       context ? `Current page context:\n${context.slice(0, 1000)}` : '',
//       `Author's request: ${prompt}`,
//     ].filter(Boolean).join('\n\n');

//     const { text: result, usage } = await complete(fullPrompt, system);
//     await trackAI(req.user._id, bookId);
//     await finalize(req, res, { text: result, usage });
//     // res.json({ success: true, result, usage });
//   } catch (err) { next(err); }
// };


// // Hugging Face Image Generation & Cloudinary Persistence
// exports.generateImage = async (req, res, next) => {
//   try {
//     const { prompt, bookId, aspectRatio = "1:1" } = req.body;

//     // 1. Validation
//     if (!prompt?.trim()) {
//       return res.status(400).json({ 
//         success: false, 
//         message: 'Prompt is required.' 
//       });
//     }

//     // 2. Validate Aspect Ratio
//     const validRatios = ["1:1", "16:9", "9:16"];
//     const targetAspectRatio = validRatios.includes(aspectRatio) ? aspectRatio : "1:1";

//     // 3. Generate Image Data URI directly from prompt using Hugging Face
//     const base64ImageString = await generateImageContent(prompt.trim(), targetAspectRatio);

//     if (!base64ImageString) {
//       return res.status(500).json({ 
//         success: false, 
//         message: 'Failed to generate image. Please try again.' 
//       });
//     }

//     // 4. Upload Base64 Image to Cloudinary (Matches uploadImage controller)
//     const folderPath = req.user?._id ? `inkwell/${req.user._id}` : 'inkwell/ai_generated';
    
//     const result = await cloudinary.uploader.upload(base64ImageString, {
//       folder: folderPath,
//       resource_type: 'image',
//       transformation: [{ quality: 'auto', fetch_format: 'auto' }],
//     });

//     // 5. Log storage usage for Admin Panel (Matches UploadLog schema)
//     if (req.user?._id) {
//       await UploadLog.create({
//         userId: req.user._id,
//         publicId: result.public_id,
//         bytes: result.bytes,
//         format: result.format,
//         width: result.width,
//         height: result.height,
//       });
//     }

//     // 6. Track AI Usage
//     if (req.user?._id) {
//       await trackAI(req.user._id, bookId || null);
//     }

//     // 7. Finalize response and deduct credits
//     await finalize(req, res, {
//       type: 'image',
//       data: {
//         url: result.secure_url,
//         publicId: result.public_id,
//         aspectRatio: targetAspectRatio,
//       }
//     });

//     // 8. Return Hosted Cloudinary URL to Frontend
//     return res.status(200).json({
//       success: true,
//       data: {
//         url: result.secure_url,
//         publicId: result.public_id,
//         width: result.width,
//         height: result.height,
//         aspectRatio: targetAspectRatio,
//       }
//     });

//   } catch (err) {
//     next(err);
//   }
// };


const { complete, generateImageContent } = require("../services/ai.service");
const Analytics = require('../models/Analytics');
const Character = require('../models/Character');
const cloudinary = require('../utils/cloudinary');
const UploadLog = require('../models/UploadLog');

const BASE_SYSTEM = `You are an expert AI writing assistant embedded in Inkwell, a professional book writing platform.
Help authors improve their writing. Always preserve the author's unique voice and style.
Never be preachy. Return only the requested output — no meta-commentary or explanations unless asked.`;

// Build context-aware system prompt
const buildSystemPrompt = (opts = {}) => {
  let system = BASE_SYSTEM;
  if (opts.genre)       system += `\nBook genre: ${opts.genre}.`;
  if (opts.bookTitle)   system += `\nBook title: "${opts.bookTitle}".`;
  if (opts.characters?.length) {
    const charSummary = opts.characters.map(c => `${c.name} (${c.role}): ${c.personality || 'no notes'}`).join('; ');
    system += `\nKey characters: ${charSummary}.`;
  }
  if (opts.tone)        system += `\nMaintain a ${opts.tone} tone.`;
  if (opts.style)       system += `\nWriting style: ${opts.style}.`;
  return system;
};

const trackAI = async (userId, bookId) => {
  if (!bookId || !userId) return;
  const date = new Date().toISOString().slice(0, 10);
  await Analytics.findOneAndUpdate(
    { authorId: userId, bookId, date },
    { $inc: { aiUsageCount: 1 } },
    { upsert: true }
  ).catch((err) => console.error("Analytics tracking error:", err.message));
};

const finalize = async (req, res, payload) => {
  // Extract token count if it exists (for Gemini text), or fallback to standard metadata
  const tokensUsed = payload.usage?.output_tokens || payload.tokensUsed || null;

  // Deduct credits attached by the requireCredits middleware
  let remaining = null;
  if (typeof req.deductCredits === 'function') {
    remaining = await req.deductCredits({ 
      tokensUsed, 
      type: payload.type || 'text' 
    });
  }

  // Prepare response payload based on whether it's image or text
  const responseData = payload.data 
    ? { data: payload.data } 
    : { result: payload.text, usage: payload.usage };

  return res.status(200).json({
    success: true,
    ...responseData,
    credits: { remaining, cost: req.aiCreditCost || 0 },
  });
};

// POST /api/ai/fix-grammar
exports.fixGrammar = async (req, res, next) => {
  try {
    const { text, tone, bookId, genre, bookTitle } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Text is required' });

    const system = buildSystemPrompt({ genre, bookTitle, tone });
    const { text: result, usage } = await complete(
      `Fix grammar, punctuation, sentence structure, and clarity. Preserve the author's voice. Return ONLY the corrected text:\n\n${text}`,
      system
    );

    await trackAI(req.user?._id, bookId);
    return await finalize(req, res, { text: result, usage });
  } catch (err) { next(err); }
};

// POST /api/ai/rewrite
exports.rewrite = async (req, res, next) => {
  try {
    const { text, style, tone, bookId, genre, bookTitle } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Text is required' });

    const system = buildSystemPrompt({ genre, bookTitle, tone, style });
    const { text: result, usage } = await complete(
      `Rewrite with improved flow, vivid language, and stronger impact. Keep the same meaning. Return ONLY the rewritten text:\n\n${text}`,
      system
    );

    await trackAI(req.user?._id, bookId);
    return await finalize(req, res, { text: result, usage });
  } catch (err) { next(err); }
};

// POST /api/ai/continue-writing
exports.continueWriting = async (req, res, next) => {
  try {
    const { text, paragraphs = 2, bookId, genre, bookTitle, characters } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Text is required' });

    let charData = characters;
    if (!charData && bookId && req.user?._id) {
      charData = await Character.find({ bookId, authorId: req.user._id }).select('name role personality').limit(8);
    }

    const system = buildSystemPrompt({ genre, bookTitle, characters: charData });
    const { text: result, usage } = await complete(
      `Continue this passage naturally for ${paragraphs} paragraph(s). Match the established tone, style, and narrative voice exactly. Do not summarize — just continue seamlessly. Return ONLY the continuation:\n\n${text}`,
      system,
      1500
    );

    await trackAI(req.user?._id, bookId);
    return await finalize(req, res, { text: result, usage });
  } catch (err) { next(err); }
};

// POST /api/ai/summarize
exports.summarize = async (req, res, next) => {
  try {
    const { text, type = 'chapter', bookId } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Text is required' });

    const { text: result, usage } = await complete(
      `Write a concise ${type} summary (2-4 sentences) covering key events, character actions, emotional beats, and narrative significance. Return ONLY the summary:\n\n${text}`,
      BASE_SYSTEM,
      500
    );

    await trackAI(req.user?._id, bookId);
    return await finalize(req, res, { text: result, usage });
  } catch (err) { next(err); }
};

// POST /api/ai/expand
exports.expand = async (req, res, next) => {
  try {
    const { text, bookId, genre, bookTitle } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Text is required' });

    const system = buildSystemPrompt({ genre, bookTitle });
    const { text: result, usage } = await complete(
      `Expand this outline/brief into richly detailed, engaging prose. Add sensory details, character emotions, dialogue where appropriate, and narrative depth. Return ONLY the expanded text:\n\n${text}`,
      system
    );

    await trackAI(req.user?._id, bookId);
    return await finalize(req, res, { text: result, usage });
  } catch (err) { next(err); }
};

// POST /api/ai/simplify
exports.simplify = async (req, res, next) => {
  try {
    const { text, readingLevel, bookId } = req.body;
    if (!text?.trim()) return res.status(400).json({ success: false, message: 'Text is required' });

    const { text: result, usage } = await complete(
      `Simplify to a ${readingLevel || 'general'} reading level. Use clearer language and shorter sentences. Preserve all meaning. Return ONLY the simplified text:\n\n${text}`,
      BASE_SYSTEM
    );

    await trackAI(req.user?._id, bookId);
    return await finalize(req, res, { text: result, usage });
  } catch (err) { next(err); }
};

// POST /api/ai/tone
exports.adjustTone = async (req, res, next) => {
  try {
    const { text, tone, bookId } = req.body;
    if (!text?.trim() || !tone) return res.status(400).json({ success: false, message: 'Text and tone are required' });

    const tones = {
      professional: 'formal and professional',
      casual: 'conversational and casual',
      emotional: 'deeply emotional and expressive',
      academic: 'academic and scholarly',
      storytelling: 'narrative and storytelling'
    };

    const { text: result, usage } = await complete(
      `Rewrite this text in a ${tones[tone] || tone} tone. Keep the same content and meaning. Return ONLY the rewritten text:\n\n${text}`,
      BASE_SYSTEM
    );

    await trackAI(req.user?._id, bookId);
    return await finalize(req, res, { text: result, usage });
  } catch (err) { next(err); }
};

// POST /api/ai/writers-block
exports.writersBlock = async (req, res, next) => {
  try {
    const { context, type = 'continuation', bookId, genre, bookTitle, characters } = req.body;

    let charData = characters;
    if (!charData && bookId && req.user?._id) {
      charData = await Character.find({ bookId, authorId: req.user._id }).select('name role personality').limit(5);
    }

    const system = buildSystemPrompt({ genre, bookTitle, characters: charData });
    const prompts = {
      continuation: `Based on this story context, suggest 3 compelling ways to continue the narrative. Be specific with plot ideas:\n\n${context || 'No context provided'}`,
      plot: `Generate 3 interesting plot twist or development ideas that could fit this story:\n\n${context || 'No context provided'}`,
      character: `Suggest 3 character interaction or development ideas for this story:\n\n${context || 'No context provided'}`,
      scene: `Suggest 3 vivid scene ideas with setting, mood, and action that would fit this narrative:\n\n${context || 'No context provided'}`,
    };

    const { text: result, usage } = await complete(prompts[type] || prompts.continuation, system, 800);

    await trackAI(req.user?._id, bookId);
    return await finalize(req, res, { text: result, usage });
  } catch (err) { next(err); }
};

// POST /api/ai/custom
exports.customPrompt = async (req, res, next) => {
  try {
    const { prompt, context, bookId, genre, bookTitle, characters } = req.body;
    if (!prompt?.trim()) return res.status(400).json({ success: false, message: 'Prompt is required' });

    let charData = characters;
    if (!charData && bookId && req.user?._id) {
      charData = await Character.find({ bookId, authorId: req.user._id }).select('name role personality').limit(5);
    }

    const system = buildSystemPrompt({ genre, bookTitle, characters: charData });
    const fullPrompt = [
      context ? `Current page context:\n${context.slice(0, 1000)}` : '',
      `Author's request: ${prompt}`,
    ].filter(Boolean).join('\n\n');

    const { text: result, usage } = await complete(fullPrompt, system);

    await trackAI(req.user?._id, bookId);
    return await finalize(req, res, { text: result, usage });
  } catch (err) { next(err); }
};

// POST /api/ai/generate-image
exports.generateImage = async (req, res, next) => {
  try {
    const { prompt, bookId, aspectRatio = "1:1" } = req.body;

    if (!prompt?.trim()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Prompt is required.' 
      });
    }

    const validRatios = ["1:1", "16:9", "9:16"];
    const targetAspectRatio = validRatios.includes(aspectRatio) ? aspectRatio : "1:1";

    const base64ImageString = await generateImageContent(prompt.trim(), targetAspectRatio);

    if (!base64ImageString) {
      return res.status(503).json({ 
        success: false, 
        message: 'Failed to generate image from AI provider. Please try again.' 
      });
    }

    const folderPath = req.user?._id ? `inkwell/${req.user._id}` : 'inkwell/ai_generated';
    
    const result = await cloudinary.uploader.upload(base64ImageString, {
      folder: folderPath,
      resource_type: 'image',
      transformation: [{ quality: 'auto', fetch_format: 'auto' }],
    });

    if (req.user?._id) {
      await UploadLog.create({
        userId: req.user._id,
        publicId: result.public_id,
        bytes: result.bytes,
        format: result.format,
        width: result.width,
        height: result.height,
      });
      await trackAI(req.user._id, bookId || null);
    }

    // Finalize response once (deducts credits and returns single response)
    return await finalize(req, res, {
      type: 'image',
      data: {
        url: result.secure_url,
        publicId: result.public_id,
        width: result.width,
        height: result.height,
        aspectRatio: targetAspectRatio,
      }
    });

  } catch (err) {
    next(err);
  }
};