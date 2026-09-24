const Book = require("../models/Book");
const Chapter = require("../models/Chapter");
const Page = require("../models/Page");

const { uploadToCloudinary } = require('../services/upload.service'); // Adjust path if needed
const UploadLog = require('../models/UploadLog');

const {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  TextRun,
  ImageRun,
  AlignmentType,
  TableOfContents,
  Header,
  Footer,
  PageNumber,
  NumberFormat,
  SectionType,
  convertInchesToTwip,
} = require("docx");

const PDFDocument = require("pdfkit");
const Epub = require("epub-gen");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { imageSize } = require("image-size");


// POST /api/books
exports.createBook = async (req, res, next) => {
  try {
    const { title, description, genre, tags, wordCountGoal } = req.body;
    const book = await Book.create({
      title,
      description,
      genre,
      tags: tags || [],
      wordCountGoal: wordCountGoal || 0,
      authorId: req.user._id,
    });
    res.status(201).json({ success: true, book });
  } catch (err) {
    next(err);
  }
};

// GET /api/books
exports.getBooks = async (req, res, next) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const query = { authorId: req.user._id };
    if (status) query.status = status;
    if (search) query.title = { $regex: search, $options: 'i' };

    const books = await Book.find(query)
      .sort({ updatedAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    const total = await Book.countDocuments(query);
    res.json({ success: true, books, total, page: Number(page), pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

// GET /api/books/:id
exports.getBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, authorId: req.user._id });
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    res.json({ success: true, book });
  } catch (err) {
    next(err);
  }
};

// PUT /api/books/:id
// exports.updateBook = async (req, res, next) => {
//   try {
//     const allowed = ['title', 'description', 'genre', 'tags', 'status', 'wordCountGoal', 'coverImage', 'isPublic'];
//     const updates = {};
//     allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

//     const book = await Book.findOneAndUpdate(
//       { _id: req.params.id, authorId: req.user._id },
//       updates,
//       { new: true, runValidators: true }
//     );
//     if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
//     res.json({ success: true, book });
//   } catch (err) {
//     next(err);
//   }
// };


exports.updateBook = async (req, res, next) => {
  try {
    const allowed = ['title', 'description', 'genre', 'tags', 'status', 'wordCountGoal', 'coverImage', 'isPublic'];
    const updates = {};
    allowed.forEach(f => { if (req.body[f] !== undefined) updates[f] = req.body[f]; });

    // Handle file upload if present
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer, req.file.mimetype, req.user._id);
      updates.coverImage = result.secure_url;

      // Log upload stats for admin panel
      await UploadLog.create({
        userId: req.user._id,
        publicId: result.public_id,
        bytes: result.bytes,
        format: result.format,
        width: result.width,
        height: result.height,
      });
    }

    const book = await Book.findOneAndUpdate(
      { _id: req.params.id, authorId: req.user._id },
      updates,
      { new: true, runValidators: true }
    );

    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });
    res.json({ success: true, book });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/books/:id
exports.deleteBook = async (req, res, next) => {
  try {
    const book = await Book.findOneAndDelete({ _id: req.params.id, authorId: req.user._id });
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

    // Cascade delete chapters and pages
    const chapters = await Chapter.find({ bookId: book._id });
    const chapterIds = chapters.map(c => c._id);
    await Page.deleteMany({ chapterId: { $in: chapterIds } });
    await Chapter.deleteMany({ bookId: book._id });

    res.json({ success: true, message: 'Book and all content deleted' });
  } catch (err) {
    next(err);
  }
};

// GET /api/books/:id/export — merge all chapters/pages into one document
exports.exportBook = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, authorId: req.user._id });
    if (!book) return res.status(404).json({ success: false, message: 'Book not found' });

    const chapters = await Chapter.find({ bookId: book._id }).sort({ order: 1 });
    const chaptersWithPages = await Promise.all(chapters.map(async (ch) => {
      const pages = await Page.find({ chapterId: ch._id }).sort({ pageNumber: 1 });
      return { ...ch.toObject(), pages };
    }));

    res.json({ success: true, book, chapters: chaptersWithPages });
  } catch (err) {
    next(err);
  }
};

/* -------------------------------------------------------------------------- */
/* Image helpers                                                               */
/* -------------------------------------------------------------------------- */

// Where uploaded images live on disk, and the public base URL of your API —
// used to resolve <img src="/uploads/xyz.png"> style paths saved by the editor.
// Adjust these two to match your project's actual storage setup.
const UPLOADS_DIR = path.join(__dirname, "..", "uploads");
const APP_BASE_URL = process.env.APP_BASE_URL || "http://localhost:5000";

function guessTypeFromContentType(ct) {
  if (!ct) return null;
  if (ct.includes("png")) return "png";
  if (ct.includes("jpeg") || ct.includes("jpg")) return "jpg";
  if (ct.includes("gif")) return "gif";
  if (ct.includes("bmp")) return "bmp";
  return null;
}

function guessTypeFromUrl(url) {
  const ext = path.extname(url.split("?")[0]).toLowerCase().replace(".", "");
  if (ext === "jpeg") return "jpg";
  if (["jpg", "png", "gif", "bmp"].includes(ext)) return ext;
  return "png";
}

/**
 * Resolves an <img> src from editor content into a buffer + image type.
 * Supports: base64 data URIs, absolute http(s) URLs, and relative paths
 * pointing at locally-stored uploads.
 * Returns null if the image can't be loaded (export continues without it).
 */
async function loadImageBuffer(src) {
  try {
    if (!src) return null;

    // 1. Inline base64 data URI (common for pasted images in rich text editors)
    if (src.startsWith("data:")) {
      const match = src.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
      if (!match) return null;
      const buffer = Buffer.from(match[2], "base64");
      const type = match[1].split("/")[1].split("+")[0];
      return { buffer, type: type === "jpeg" ? "jpg" : type };
    }

    // 2. Absolute URL (S3, CDN, etc.)
    if (/^https?:\/\//i.test(src)) {
      const resp = await fetch(src);
      if (!resp.ok) return null;
      const buffer = Buffer.from(await resp.arrayBuffer());
      const type = guessTypeFromContentType(resp.headers.get("content-type")) || guessTypeFromUrl(src);
      return { buffer, type };
    }

    // 3. Relative path stored on local disk, e.g. "/uploads/abc.png"
    const cleanedPath = src.replace(/^\/?(uploads\/)?/i, "");
    const localPath = path.join(UPLOADS_DIR, cleanedPath);
    if (fs.existsSync(localPath)) {
      const buffer = fs.readFileSync(localPath);
      return { buffer, type: guessTypeFromUrl(localPath) };
    }

    // 4. Fallback: resolve relative path against the app's own base URL
    const url = `${APP_BASE_URL}${src.startsWith("/") ? "" : "/"}${src}`;
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const buffer = Buffer.from(await resp.arrayBuffer());
    const type = guessTypeFromContentType(resp.headers.get("content-type")) || guessTypeFromUrl(src);
    return { buffer, type };
  } catch (err) {
    console.warn("Failed to load image:", src, err.message);
    return null;
  }
}

/** Reads natural pixel dimensions of an image buffer; returns null if unreadable. */
function safeImageSize(buffer) {
  try {
    const dims = imageSize(buffer);
    if (!dims.width || !dims.height) return null;
    return dims;
  } catch {
    return null;
  }
}

// Formats supported natively by pdfkit's doc.image(). Anything else
// (gif, bmp, svg, webp) is skipped in the PDF export with a text placeholder.
const PDF_SUPPORTED_IMAGE_TYPES = new Set(["png", "jpg"]);

// Formats supported by docx's ImageRun.
const DOCX_SUPPORTED_IMAGE_TYPES = new Set(["png", "jpg", "gif", "bmp"]);

/* -------------------------------------------------------------------------- */
/* Shared helpers                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Splits a block of editor-produced HTML into an ordered sequence of
 * { type: 'text', text } and { type: 'image', src, alt } blocks.
 * This preserves the position of images relative to surrounding paragraphs.
 */
function htmlToBlocks(html) {
  if (!html) return [];
  const blocks = [];

  // Split the HTML on <img> tags, keeping the tags themselves in the result.
  const parts = html.split(/(<img\b[^>]*>)/gi);

  for (const part of parts) {
    const imgMatch = part.match(/<img\b[^>]*\ssrc=(["'])((?:(?!\1).)*)\1[^>]*>/i);
    if (imgMatch) {
      const altMatch = part.match(/\salt=(["'])((?:(?!\1).)*)\1/i);
      const styleMatch = part.match(/\sstyle=(["'])((?:(?!\1).)*)\1/i);  
      blocks.push({ type: "image", src: imgMatch[2], alt: altMatch ? altMatch[2] : "",style: styleMatch ? styleMatch[2] : "" });
      continue;
    }

    const texts = part
      .split(/<\/p>|<\/div>|<br\s*\/?>/gi)
      .map((s) =>
        s
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/\s+/g, " ")
          .trim()
      )
      .filter(Boolean);

    texts.forEach((text) => blocks.push({ type: "text", text }));
  }

  return blocks;
}

function parseImageStyle(style) {
  let widthPercent = null;
  let align = "center";
  if (style) {
    const wMatch = style.match(/width\s*:\s*([\d.]+)\s*%/i);
    if (wMatch) widthPercent = parseFloat(wMatch[1]);
    if (/float\s*:\s*left/i.test(style)) align = "left";
    else if (/float\s*:\s*right/i.test(style)) align = "right";
  }
  return { widthPercent, align };
}

/**
 * Loads chapters + pages for a book and returns each chapter's content as an
 * ordered list of "blocks" (paragraphs and images). Image blocks are resolved
 * up front — their binary data and natural dimensions are fetched here so the
 * DOCX/PDF renderers can just place them.
 */
async function loadBookContent(bookId) {
  const chapters = await Chapter.find({ bookId }).sort({ order: 1 });

  const result = [];
  for (const chapter of chapters) {
    const pages = await Page.find({ chapterId: chapter._id }).sort({ pageNumber: 1 });

    const rawBlocks = [];
    for (const page of pages) {
      rawBlocks.push(...htmlToBlocks(page.content));
    }

    // Resolve all images for this chapter in parallel.
    const blocks = await Promise.all(
      rawBlocks.map(async (block) => {
        if (block.type !== "image") return block;

        const loaded = await loadImageBuffer(block.src);
        if (!loaded) {
          // Image couldn't be loaded — drop it but keep the alt text as a note.
          return block.alt
            ? { type: "text", text: `[Image: ${block.alt}]` }
            : null;
        }

        const dims = safeImageSize(loaded.buffer);
        if (!dims) return null;


        const { widthPercent, align } = parseImageStyle(block.style);   // ← add

        return {
          type: "image",
          buffer: loaded.buffer,
          imageType: loaded.type,
          alt: block.alt,
          width: dims.width,
          height: dims.height,
          widthPercent,   // ← add
          align,          // ← add
        };
      })
    );

    result.push({ title: chapter.title, blocks: blocks.filter(Boolean) });
  }
  return result;
}

/* -------------------------------------------------------------------------- */
/* DOCX export                                                                 */
/* -------------------------------------------------------------------------- */

// 6" x 9" trade trim size — the most common print-on-demand paperback size
// (matches the PDF export below so both outputs look the same when printed).
const DOCX_PAGE_WIDTH = convertInchesToTwip(6);
const DOCX_PAGE_HEIGHT = convertInchesToTwip(9);
const DOCX_MARGIN_TOP = convertInchesToTwip(0.9);
const DOCX_MARGIN_BOTTOM = convertInchesToTwip(0.9);
const DOCX_MARGIN_OUTER = convertInchesToTwip(0.7);
const DOCX_MARGIN_INNER = convertInchesToTwip(0.9); // extra room for binding/gutter

// Usable content width, used to scale embedded images so they never overflow
// the page. Converted to pixels at 96 DPI (the unit docx's ImageRun expects).
const DOCX_CONTENT_WIDTH_PX = Math.round((6 - 0.9 - 0.7) * 96);
const DOCX_MAX_IMAGE_HEIGHT_PX = 650; // cap tall images so one image can't fill multiple pages

/** Scales natural image dimensions to fit within the page, preserving aspect ratio. */
// function scaleImageForDocx(width, height) {
//   let w = width;
//   let h = height;
//   if (w > DOCX_CONTENT_WIDTH_PX) {
//     h = h * (DOCX_CONTENT_WIDTH_PX / w);
//     w = DOCX_CONTENT_WIDTH_PX;
//   }
//   if (h > DOCX_MAX_IMAGE_HEIGHT_PX) {
//     w = w * (DOCX_MAX_IMAGE_HEIGHT_PX / h);
//     h = DOCX_MAX_IMAGE_HEIGHT_PX;
//   }
//   return { width: Math.round(w), height: Math.round(h) };
// }
function scaleImageForDocx(width, height, widthPercent) {
  let w = widthPercent ? DOCX_CONTENT_WIDTH_PX * (widthPercent / 100) : width;
  let h = height * (w / width);

  if (w > DOCX_CONTENT_WIDTH_PX) {
    h = h * (DOCX_CONTENT_WIDTH_PX / w);
    w = DOCX_CONTENT_WIDTH_PX;
  }
  if (h > DOCX_MAX_IMAGE_HEIGHT_PX) {
    w = w * (DOCX_MAX_IMAGE_HEIGHT_PX / h);
    h = DOCX_MAX_IMAGE_HEIGHT_PX;
  }
  return { width: Math.round(w), height: Math.round(h) };
}

/** Converts a chapter's resolved blocks into docx Paragraphs (text + images). */
// function blocksToDocxParagraphs(blocks) {
//   const paragraphs = [];

//   blocks.forEach((block) => {
//     if (block.type === "text") {
//       paragraphs.push(
//         new Paragraph({
//           children: [new TextRun({ text: block.text })],
//           style: "BodyText",
//         })
//       );
//       return;
//     }

//     if (block.type === "image") {
//       if (!DOCX_SUPPORTED_IMAGE_TYPES.has(block.imageType)) {
//         paragraphs.push(
//           new Paragraph({
//             children: [new TextRun({ text: `[Image omitted: unsupported format ".${block.imageType}"]`, italics: true })],
//             alignment: AlignmentType.CENTER,
//           })
//         );
//         return;
//       }

//       const { width, height } = scaleImageForDocx(block.width, block.height);

//       paragraphs.push(
//         new Paragraph({
//           alignment: AlignmentType.CENTER,
//           spacing: { before: 200, after: block.alt ? 80 : 200 },
//           children: [
//             new ImageRun({
//               data: block.buffer,
//               type: block.imageType,
//               transformation: { width, height },
//             }),
//           ],
//         })
//       );

//       if (block.alt) {
//         paragraphs.push(
//           new Paragraph({
//             alignment: AlignmentType.CENTER,
//             spacing: { after: 200 },
//             children: [new TextRun({ text: block.alt, italics: true, size: 18 })],
//           })
//         );
//       }
//     }
//   });

//   return paragraphs;
// }

function blocksToDocxParagraphs(blocks) {
  const paragraphs = [];
  const alignMap = {
    left: AlignmentType.LEFT,
    right: AlignmentType.RIGHT,
    center: AlignmentType.CENTER,
  };

  blocks.forEach((block) => {
    if (block.type === "text") {
      paragraphs.push(new Paragraph({ children: [new TextRun({ text: block.text })], style: "BodyText" }));
      return;
    }

    if (block.type === "image") {
      if (!DOCX_SUPPORTED_IMAGE_TYPES.has(block.imageType)) {
        paragraphs.push(new Paragraph({
          children: [new TextRun({ text: `[Image omitted: unsupported format ".${block.imageType}"]`, italics: true })],
          alignment: AlignmentType.CENTER,
        }));
        return;
      }

      const { width, height } = scaleImageForDocx(block.width, block.height, block.widthPercent);   // ← pass widthPercent

      paragraphs.push(new Paragraph({
        alignment: alignMap[block.align] || AlignmentType.CENTER,   // ← use real alignment
        spacing: { before: 200, after: block.alt ? 80 : 200 },
        children: [new ImageRun({ data: block.buffer, type: block.imageType, transformation: { width, height } })],
      }));

      if (block.alt) {
        paragraphs.push(new Paragraph({
          alignment: alignMap[block.align] || AlignmentType.CENTER,
          spacing: { after: 200 },
          children: [new TextRun({ text: block.alt, italics: true, size: 18 })],
        }));
      }
    }
  });

  return paragraphs;
}

exports.exportBookDocx = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, authorId: req.user._id });

    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    const chapters = await loadBookContent(book._id);
    const authorName = req.user.name || "Author";
    const year = new Date().getFullYear();

    const sharedPageProps = {
      size: { width: DOCX_PAGE_WIDTH, height: DOCX_PAGE_HEIGHT },
      margin: {
        top: DOCX_MARGIN_TOP,
        bottom: DOCX_MARGIN_BOTTOM,
        left: DOCX_MARGIN_INNER,
        right: DOCX_MARGIN_OUTER,
      },
    };

    /* ---------------- Front matter (title + copyright page) ---------------- */
    // titlePage:true + empty header/footer => no running header/page number
    // on these pages, exactly like a real published book.
    const frontMatterSection = {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: sharedPageProps,
        titlePage: true,
      },
      headers: {
        default: new Header({ children: [new Paragraph("")] }),
        first: new Header({ children: [new Paragraph("")] }),
      },
      footers: {
        default: new Footer({ children: [new Paragraph("")] }),
        first: new Footer({ children: [new Paragraph("")] }),
      },
      children: [
        // --- Title page ---
        new Paragraph({ text: "", spacing: { before: 3000 } }),
        new Paragraph({
          text: book.title,
          heading: HeadingLevel.TITLE,
          alignment: AlignmentType.CENTER,
        }),
        new Paragraph({
          children: [new TextRun({ text: authorName, italics: true, size: 28 })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 400 },
        }),
        ...(book.description
          ? [
              new Paragraph({
                children: [new TextRun({ text: book.description, italics: true, size: 22 })],
                alignment: AlignmentType.CENTER,
                spacing: { before: 600 },
              }),
            ]
          : []),

        // --- Copyright page ---
        new Paragraph({ children: [], pageBreakBefore: true }),
        new Paragraph({
          children: [
            new TextRun({ text: book.title, size: 18 }),
            new TextRun({ text: `\n\nCopyright \u00A9 ${year} ${authorName}`, size: 18, break: 1 }),
            new TextRun({ text: "All rights reserved.", size: 18, break: 1 }),
            new TextRun({
              text: "No part of this publication may be reproduced, distributed, or transmitted in any form without the prior written permission of the publisher, except for brief quotations used in reviews.",
              size: 18,
              break: 2,
            }),
          ],
          spacing: { before: 6000 },
        }),
      ],
    };

    /* ---------------------------- Table of contents -------------------------- */
    // Word generates the actual page numbers for this when the reader opens
    // the file and accepts the "update field" prompt (or presses Ctrl+A, F9).
    const tocSection = {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          ...sharedPageProps,
          pageNumbers: { start: 1, formatType: NumberFormat.LOWER_ROMAN },
        },
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ children: [PageNumber.CURRENT] })],
            }),
          ],
        }),
      },
      children: [
        new Paragraph({
          text: "Contents",
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
        }),
        new TableOfContents("Contents", {
          hyperlink: true,
          headingStyleRange: "1-1",
        }),
      ],
    };

    /* --------------------------------- Body ---------------------------------- */
    const bodyChildren = [];

    chapters.forEach((chapter, idx) => {
      bodyChildren.push(
        new Paragraph({
          text: `Chapter ${idx + 1}`,
          alignment: AlignmentType.CENTER,
          pageBreakBefore: true,
          spacing: { before: 2000, after: 0 },
        })
      );
      bodyChildren.push(
        new Paragraph({
          text: chapter.title,
          heading: HeadingLevel.HEADING_1,
          alignment: AlignmentType.CENTER,
          spacing: { after: 600 },
        })
      );

      const chapterParagraphs = blocksToDocxParagraphs(chapter.blocks);
      bodyChildren.push(...chapterParagraphs);

      // Make sure an empty chapter still leaves a paragraph so Word doesn't
      // collapse the heading-only page oddly.
      if (chapterParagraphs.length === 0) {
        bodyChildren.push(new Paragraph({ style: "BodyText", children: [] }));
      }
    });

    const bodySection = {
      properties: {
        type: SectionType.NEXT_PAGE,
        page: {
          ...sharedPageProps,
          pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ text: book.title, size: 18, italics: true })],
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.CENTER,
              children: [new TextRun({ children: [PageNumber.CURRENT] })],
            }),
          ],
        }),
      },
      children: bodyChildren,
    };

    /* --------------------------------- Build ---------------------------------- */
    const doc = new Document({
      styles: {
        default: {
          document: {
            run: { font: "Georgia", size: 24 }, // 12pt body text
            paragraph: { spacing: { line: 360, lineRule: "auto" } },
          },
        },
        paragraphStyles: [
          {
            id: "BodyText",
            name: "Body Text",
            basedOn: "Normal",
            next: "BodyText",
            quickFormat: true,
            run: { font: "Georgia", size: 24 },
            paragraph: {
              alignment: AlignmentType.JUSTIFIED,
              indent: { firstLine: convertInchesToTwip(0.3) },
              spacing: { line: 360, lineRule: "auto", after: 0 },
            },
          },
        ],
      },
      sections: [frontMatterSection, tocSection, bodySection],
    });

    const buffer = await Packer.toBuffer(doc);

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${book.title}.docx"`);
    return res.send(buffer);
  } catch (err) {
    next(err);
  }
};

/* -------------------------------------------------------------------------- */
/* PDF export                                                                  */
/* -------------------------------------------------------------------------- */

// Same 6" x 9" trim size as the DOCX export, expressed in points (72pt = 1in).
const PDF_PAGE_WIDTH = 6 * 72;
const PDF_PAGE_HEIGHT = 9 * 72;
const PDF_MARGIN = 64;
const TOC_ENTRIES_PER_PAGE = 18; // rough fit for 11pt Times on a 6x9 page
const PDF_CONTENT_WIDTH = PDF_PAGE_WIDTH - PDF_MARGIN * 2;
const PDF_CONTENT_HEIGHT = PDF_PAGE_HEIGHT - PDF_MARGIN * 2;

/** Scales natural image dimensions to fit within the printable page area. */
// function scaleImageForPdf(width, height) {
//   let w = width;
//   let h = height;
//   if (w > PDF_CONTENT_WIDTH) {
//     h = h * (PDF_CONTENT_WIDTH / w);
//     w = PDF_CONTENT_WIDTH;
//   }
//   if (h > PDF_CONTENT_HEIGHT) {
//     w = w * (PDF_CONTENT_HEIGHT / h);
//     h = PDF_CONTENT_HEIGHT;
//   }
//   return { width: w, height: h };
// }


function scaleImageForPdf(width, height, widthPercent) {
  let w = widthPercent ? PDF_CONTENT_WIDTH * (widthPercent / 100) : width;
  let h = height * (w / width);

  if (w > PDF_CONTENT_WIDTH) {
    h = h * (PDF_CONTENT_WIDTH / w);
    w = PDF_CONTENT_WIDTH;
  }
  if (h > PDF_CONTENT_HEIGHT) {
    w = w * (PDF_CONTENT_HEIGHT / h);
    h = PDF_CONTENT_HEIGHT;
  }
  return { width: w, height: h };
}

exports.exportBookPdf = async (req, res) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, authorId: req.user._id });

    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    const chapters = await loadBookContent(book._id);
    const authorName = req.user.name || "Author";
    const year = new Date().getFullYear();

    const doc = new PDFDocument({
      size: [PDF_PAGE_WIDTH, PDF_PAGE_HEIGHT],
      margins: { top: PDF_MARGIN, bottom: PDF_MARGIN, left: PDF_MARGIN, right: PDF_MARGIN },
      bufferPages: true, // required so we can go back and add the TOC + page numbers
      info: { Title: book.title, Author: authorName },
    });

    res.setHeader("Content-Disposition", `attachment; filename="${book.title}.pdf"`);
    res.setHeader("Content-Type", "application/pdf");
    doc.pipe(res);

    /* ------------------------------- Title page -------------------------------- */
    doc.font("Times-Bold").fontSize(28);
    doc.text(book.title, PDF_MARGIN, PDF_PAGE_HEIGHT / 3, {
      width: PDF_PAGE_WIDTH - PDF_MARGIN * 2,
      align: "center",
    });
    doc.moveDown(1);
    doc.font("Times-Italic").fontSize(14);
    doc.text(authorName, { align: "center" });

    /* ------------------------------ Copyright page ------------------------------ */
    doc.addPage();
    doc.font("Times-Roman").fontSize(9);
    const copyrightText =
      `${book.title}\n\n` +
      `Copyright \u00A9 ${year} ${authorName}\n` +
      `All rights reserved.\n\n` +
      `No part of this publication may be reproduced, distributed, or transmitted in any ` +
      `form without the prior written permission of the publisher, except for brief ` +
      `quotations used in reviews.`;
    doc.text(copyrightText, PDF_MARGIN, PDF_PAGE_HEIGHT - PDF_MARGIN - 110, {
      width: PDF_PAGE_WIDTH - PDF_MARGIN * 2,
    });

    /* ----------------------- Reserve page(s) for the TOC ------------------------- */
    const tocPageCount = Math.max(1, Math.ceil(chapters.length / TOC_ENTRIES_PER_PAGE));
    const tocPageIndices = [];
    for (let i = 0; i < tocPageCount; i++) {
      doc.addPage();
      tocPageIndices.push(doc.bufferedPageRange().count - 1);
    }

    /* --------------------------------- Chapters ---------------------------------- */
    const tocEntries = [];

    chapters.forEach((chapter, idx) => {
      doc.addPage();
      const pageIndex = doc.bufferedPageRange().count - 1; // absolute, 0-based

      tocEntries.push({ title: `Chapter ${idx + 1}: ${chapter.title}`, pageIndex });

      doc.font("Times-Roman").fontSize(11).text(`Chapter ${idx + 1}`, { align: "center" });
      doc.moveDown(0.3);
      doc.font("Times-Bold").fontSize(20).text(chapter.title, { align: "center" });
      doc.moveDown(1.5);

      // pdfkit auto-paginates text when it overflows the bottom margin, so
      // text blocks can safely span multiple pages without manual tracking.
      // Images need a manual check since doc.image() does not auto-paginate.
      chapter.blocks.forEach((block) => {
        if (block.type === "text") {
          doc.font("Times-Roman").fontSize(11);
          doc.text(block.text, {
            align: "justify",
            indent: 18, // ~0.25in first-line indent, the standard book convention
            lineGap: 3,
          });
          doc.moveDown(0.4);
          return;
        }

        if (block.type === "image") {
          if (!PDF_SUPPORTED_IMAGE_TYPES.has(block.imageType)) {
            doc.font("Times-Italic").fontSize(10);
            doc.text(`[Image omitted: unsupported format ".${block.imageType}"]`, { align: "center" });
            doc.moveDown(0.4);
            return;
          }

          // const { width, height } = scaleImageForPdf(block.width, block.height);
           const { width, height } = scaleImageForPdf(block.width, block.height, block.widthPercent); 

          // Start a new page if the image won't fit in the remaining space.
          if (doc.y + height > PDF_PAGE_HEIGHT - PDF_MARGIN) {
            doc.addPage();
          }

          // const x = PDF_MARGIN + (PDF_CONTENT_WIDTH - width) / 2; // center horizontally
           let x;
          if (block.align === "left") x = PDF_MARGIN;
          else if (block.align === "right") x = PDF_MARGIN + (PDF_CONTENT_WIDTH - width);
          else x = PDF_MARGIN + (PDF_CONTENT_WIDTH - width) / 2; 
          doc.image(block.buffer, x, doc.y, { width, height });
          doc.y += height + 6;

          if (block.alt) {
            doc.font("Times-Italic").fontSize(9);
            doc.text(block.alt, { align: "center" });
          }
          doc.moveDown(0.4);
        }
      });
    });

    /* ------------------------- Fill in the reserved TOC pages --------------------- */
    const firstBodyPageIndex = tocPageIndices[tocPageIndices.length - 1] + 1;
    tocEntries.forEach((entry) => {
      entry.pageLabel = String(entry.pageIndex - firstBodyPageIndex + 1);
    });

    let tocPageCursor = 0;
    let y = PDF_MARGIN;
    doc.switchToPage(tocPageIndices[tocPageCursor]);
    doc
      .font("Times-Bold")
      .fontSize(18)
      .text("Contents", PDF_MARGIN, y, { width: PDF_PAGE_WIDTH - PDF_MARGIN * 2, align: "center" });
    y += 40;

    doc.font("Times-Roman").fontSize(11);
    const tocTitleWidth = PDF_PAGE_WIDTH - PDF_MARGIN * 2 - 40;

    tocEntries.forEach((entry) => {
      if (y > PDF_PAGE_HEIGHT - PDF_MARGIN - 20) {
        tocPageCursor += 1;
        if (tocPageCursor >= tocPageIndices.length) return; // ran out of reserved pages
        doc.switchToPage(tocPageIndices[tocPageCursor]);
        y = PDF_MARGIN;
      } else {
        doc.switchToPage(tocPageIndices[tocPageCursor]);
      }

      doc.text(entry.title, PDF_MARGIN, y, { width: tocTitleWidth });
      doc.text(entry.pageLabel, PDF_PAGE_WIDTH - PDF_MARGIN - 30, y, { width: 30, align: "right" });
      y += 20;
    });

    /* ---------------------------- Footer page numbers ----------------------------- */
    // Front matter (title + copyright) and the TOC page(s) are left unnumbered,
    // matching standard print conventions. Numbering restarts at 1 with chapter 1.
    const range = doc.bufferedPageRange();
    for (let i = firstBodyPageIndex; i < range.start + range.count; i++) {
      doc.switchToPage(i);

      // Temporarily zero the bottom margin so writing inside it doesn't
      // trigger pdfkit's automatic page-break logic.
      const originalBottomMargin = doc.page.margins.bottom;
      doc.page.margins.bottom = 0;

      const pageNum = i - firstBodyPageIndex + 1;
      doc
        .font("Times-Roman")
        .fontSize(9)
        .text(String(pageNum), 0, PDF_PAGE_HEIGHT - PDF_MARGIN + 20, {
          width: PDF_PAGE_WIDTH,
          align: "center",
          lineBreak: false,
        });

      doc.page.margins.bottom = originalBottomMargin;
    }

    doc.end();
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      return res.status(500).json({ success: false, message: error.message });
    }
  }
};

/* -------------------------------------------------------------------------- */
/* EPUB export                                                                 */
/* -------------------------------------------------------------------------- */

exports.exportBookEpub = async (req, res, next) => {
  try {
    const book = await Book.findOne({ _id: req.params.id, authorId: req.user._id });

    if (!book) {
      return res.status(404).json({ success: false, message: "Book not found" });
    }

    const chapters = await loadBookContent(book._id);
    const authorName = req.user.name || "Author";

    // epub-gen's image downloader expects each <img src="..."> to be either
    // an http(s) URL or an absolute filesystem path — data URIs are NOT
    // supported. So we write each resolved image buffer to a temp file and
    // reference it by absolute path; the temp dir is removed afterward.
    const epubTmpDir = fs.mkdtempSync(path.join(os.tmpdir(), `epub-${book._id}-`));

    try {
      let imageCounter = 0;
      const content = chapters.map((chapter, idx) => {
        const bodyHtml = chapter.blocks
          .map((block) => {
            if (block.type === "text") {
              return `<p class="book-paragraph">${block.text}</p>`;
            }
            if (block.type === "image") {
              const ext = block.imageType === "jpg" ? "jpg" : block.imageType;
              const imgPath = path.join(epubTmpDir, `${imageCounter++}.${ext}`);
              fs.writeFileSync(imgPath, block.buffer);

              const caption = block.alt ? `<p class="caption">${block.alt}</p>` : "";
              // return `<div class="book-image"><img src="${imgPath}" alt="${block.alt || ""}" />${caption}</div>`;
              const widthStyle = block.widthPercent ? `width:${block.widthPercent}%;` : "";
              const alignStyle =
                block.align === "left" ? "float:left;margin:0 1em 0.5em 0;" :
                block.align === "right" ? "float:right;margin:0 0 0.5em 1em;" :
                "display:block;margin:0 auto;";

              return `<div class="book-image" style="${block.align === "center" ? "text-align:center;" : ""}"><img src="${imgPath}" alt="${block.alt || ""}" style="${widthStyle}${alignStyle}max-width:100%;height:auto;" />${caption}</div>`;
            }
            return "";
          })
          .join("");

        return {
          title: chapter.title,
          data: `<h1>Chapter ${idx + 1}: ${chapter.title}</h1>${bodyHtml}`,
        };
      });

      const css = `
        body { font-family: Georgia, serif; line-height: 1.5; }
        h1 { text-align: center; page-break-before: always; }
        p.book-paragraph { text-indent: 1.5em; margin: 0 0 0.2em 0; text-align: justify; }
        p.book-paragraph:first-of-type { text-indent: 0; }
        .book-image { text-align: center; margin: 1em 0; }
        .book-image img { max-width: 100%; height: auto; }
        .book-image .caption { text-indent: 0; font-style: italic; font-size: 0.85em; text-align: center; }
      `;

      const outDir = path.join(__dirname, "..", "tmp");
      fs.mkdirSync(outDir, { recursive: true });
      const filePath = path.join(outDir, `${book._id}.epub`);

      await new Epub(
        {
          title: book.title,
          author: authorName,
          description: book.description || "",
          content,
          css,
          tocTitle: "Contents",
          appendChapterTitles: false, // we already render <h1> ourselves
        },
        filePath
      ).promise;

      return res.download(filePath, `${book.title}.epub`, (err) => {
        // Clean up the generated epub and the temp images regardless of outcome.
        fs.unlink(filePath, () => {});
        fs.rm(epubTmpDir, { recursive: true, force: true }, () => {});
        if (err) next(err);
      });
    } catch (err) {
      fs.rm(epubTmpDir, { recursive: true, force: true }, () => {});
      throw err;
    }
  } catch (err) {
    next(err);
  }
};