---
name: image-prompts
description: Use when a site built on Tingsvad Website needs images – write image prompts for ChatGPT (or Gemini) in a consistent style, and put the finished images in as responsive webp files.
---

# Image prompts for ChatGPT and putting the images on the site

tingsvad.dk's paintings were made with ChatGPT from prompts written by Claude. ChatGPT gives the best results right now; Gemini can be used as an alternative. Answer in the user's language, but image prompts may be written in the language the user prefers to paste.

## 1. Make a style block, and reuse it
Agree on a fixed style with the user before the first image, and put it at the start of every prompt, so the images belong together. tingsvad.dk's style was:

> Oil/digital painting in a Nordic romantic style with realistic textures: warm dusk or morning light, moss, carved oak, granite and parchment, muted colours (charcoal, sage grey, ochre). The Viking Age blended discreetly with technology. Quiet, warm humour. No cartoon style, no horned helmets, no logos, no watermarks. No words, letters, pseudo-writing or numbers in the image; all text is set in HTML.

Make a similar block for the user's subject (for example a brewery: copper kettles, malt, warm light).

## 2. Structure of a prompt
1. The style block.
2. **Format and composition**, for example:
   - Hero at the top of a page: *2048 × 768 px (8:3), landscape. Left third calmer and darker, because the title stands there in white. Main subject in the middle to the right.*
   - Card or illustration: *square 1:1* or *portrait 2:3*.
   - Free-standing figure or border above the footer: *transparent background (PNG), subject fully visible, no floor or shadow beneath*.
3. **The subject** in 3–6 sentences: who, what, where, light and mood. One concrete, funny detail brings it to life.
4. **Ending:** *Deliver the image as PNG at [size]. Name the file "[Name]".*

When the user needs several images, write several prompts in one block, so they can be copied together.

## 3. When the image is in the folder
1. Find the new PNG (sorted by date).
2. Look at it (make a small preview), and check that the subject fits the text.
3. Convert with Pillow to webp in the sizes the site uses. For heroes: 900, 1400 and 2048 px, quality around 78, in `assets/pak/undersider/hero-<name>-<width>.webp`. For free-standing images: crop the transparent margin first.
4. Put the image in with `srcset`, `sizes`, `width`/`height` and an **alt text** that describes the subject in the page's language (both languages if the site is bilingual).
5. Do not put the original PNG in git (`.gitignore` excludes `*.png` outside `assets/`).
6. Check the page on desktop and mobile: is the title readable, and is the subject visible on a narrow screen?

## 4. Rules
- No real people, no trademarks or well-known characters in the images.
- AI-generated paintings are credited as AI-generated in the footer or the colophon.
