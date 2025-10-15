// AI Image Generation using Gemini API
export interface AIImageRequest {
  prompt: string
  style?: 'realistic' | 'artistic' | 'cartoon' | 'abstract' | 'cyberpunk' | 'fantasy'
  aspectRatio?: '1:1' | '16:9' | '9:16' | '4:3'
}

export interface AIImageResponse {
  success: boolean
  imageUrl?: string
  imageBlob?: Blob
  error?: string
  fallback?: boolean
  originalError?: string
}

// Note: Gemini doesn't directly generate images, but we can use it to enhance prompts
// and then use a different service or create placeholder images
// Try Hugging Face first (more generous free tier), then Gemini, then fallback
export const generateImageWithAI = async (request: AIImageRequest): Promise<AIImageResponse> => {
  // Try Hugging Face Stable Diffusion first
  const hfResult = await tryHuggingFaceGeneration(request)
  if (hfResult.success) {
    return hfResult
  }
  
  // Try Gemini as backup
  const geminiResult = await tryGeminiGeneration(request)
  if (geminiResult.success) {
    return geminiResult
  }
  
  // Fallback to enhanced placeholder
  console.log('🎨 Both AI services failed, using enhanced placeholder')
  try {
    const placeholderImage = await createPlaceholderImage(request.prompt, request.style)
    return {
      success: true,
      imageBlob: placeholderImage,
      imageUrl: URL.createObjectURL(placeholderImage),
      fallback: true,
      originalError: 'AI services unavailable'
    }
  } catch (error) {
    return {
      success: false,
      error: 'All image generation methods failed'
    }
  }
}

// Hugging Face Stable Diffusion (Free tier: 1000 requests/month)
const tryHuggingFaceGeneration = async (request: AIImageRequest): Promise<AIImageResponse> => {
  const apiKey = import.meta.env.VITE_HUGGINGFACE_API_KEY
  
  if (!apiKey || apiKey === 'your_huggingface_token_here') {
    console.log('⚠️ Hugging Face API key not configured')
    return { success: false, error: 'No HF API key' }
  }

  try {
    console.log('🤗 Trying Hugging Face Stable Diffusion...')
    
    const enhancedPrompt = `${request.prompt}, ${request.style || 'artistic'} style, high quality, detailed, NFT artwork, digital art`
    
    // Try multiple models in order of preference (verified working endpoints)
    const models = [
      'runwayml/stable-diffusion-v1-5',
      'stabilityai/stable-diffusion-xl-base-1.0',
      'CompVis/stable-diffusion-v1-4',
      'prompthero/openjourney-v4'
    ]
    
    let lastError = null
    
    for (const model of models) {
      try {
        console.log(`🤗 Trying model: ${model}`)
        const response = await fetch(`https://api-inference.huggingface.co/models/${model}`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: enhancedPrompt,
            parameters: {
              negative_prompt: 'blurry, low quality, distorted, ugly, bad anatomy',
              num_inference_steps: model.includes('xl') ? 30 : 20,
              guidance_scale: 7.5,
              width: 512,
              height: 512
            },
            options: {
              wait_for_model: true,
              use_cache: false
            }
          })
        })

        if (!response.ok) {
          const errorText = await response.text()
          console.warn(`Model ${model} failed:`, response.status, errorText)
          
          // Handle specific error cases
          if (response.status === 503) {
            console.log(`Model ${model} is loading, trying next...`)
            lastError = `${model}: loading`
          } else if (response.status === 404) {
            console.log(`Model ${model} not found, trying next...`)
            lastError = `${model}: not found`
          } else {
            lastError = `${model}: ${response.status} - ${errorText}`
          }
          continue
        }

        const imageBlob = await response.blob()
        
        if (imageBlob.size === 0) {
          console.warn(`Model ${model} returned empty image`)
          lastError = `${model}: empty image`
          continue
        }

        console.log(`✅ Hugging Face generation successful with ${model}!`)
        return {
          success: true,
          imageBlob,
          imageUrl: URL.createObjectURL(imageBlob)
        }
      } catch (modelError) {
        console.warn(`Model ${model} error:`, modelError)
        lastError = `${model}: ${modelError}`
        continue
      }
    }
    
    return { success: false, error: `All HF models failed. Last: ${lastError}` }
  } catch (error) {
    console.error('Hugging Face generation error:', error)
    return { success: false, error: error instanceof Error ? error.message : 'HF failed' }
  }
}

// Gemini fallback (limited free tier)
const tryGeminiGeneration = async (request: AIImageRequest): Promise<AIImageResponse> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY
  
  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return { success: false, error: 'No Gemini API key' }
  }

  try {
    console.log('🤖 Trying Gemini as backup...')
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-image:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: `Create a ${request.style || 'artistic'} style image: ${request.prompt}. Make it suitable for an NFT with high quality and unique artistic elements.`
          }]
        }],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"]
        }
      })
    })

    if (!response.ok) {
      return { success: false, error: `Gemini API error: ${response.status}` }
    }

    const data = await response.json()
    const candidate = data.candidates?.[0]
    if (!candidate) {
      return { success: false, error: 'No Gemini candidate' }
    }

    let imageData = null
    for (const part of candidate.content?.parts || []) {
      if (part.inlineData && part.inlineData.mimeType?.startsWith('image/')) {
        imageData = part.inlineData.data
        break
      }
    }

    if (!imageData) {
      return { success: false, error: 'No Gemini image data' }
    }

    const binaryString = atob(imageData)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    const imageBlob = new Blob([bytes], { type: 'image/png' })
    
    console.log('✅ Gemini generation successful!')
    return {
      success: true,
      imageBlob,
      imageUrl: URL.createObjectURL(imageBlob)
    }
  } catch (error) {
    console.error('Gemini Image Generation Error:', error)
    
    // Handle specific error types
    let errorMessage = 'Failed to generate image'
    if (error instanceof Error) {
      if (error.message.includes('429')) {
        errorMessage = 'Gemini API quota exceeded. Using enhanced placeholder instead.'
      } else if (error.message.includes('404')) {
        errorMessage = 'Gemini image model not available. Using enhanced placeholder instead.'
      } else {
        errorMessage = error.message
      }
    }
    
    console.log('🎨 Falling back to enhanced placeholder generation')
    
    // Always fallback to enhanced placeholder
    try {
      const placeholderImage = await createPlaceholderImage(request.prompt, request.style)
      return {
        success: true,
        imageBlob: placeholderImage,
        imageUrl: URL.createObjectURL(placeholderImage),
        fallback: true,
        originalError: errorMessage
      }
    } catch (fallbackError) {
      return {
        success: false,
        error: `${errorMessage}. Fallback also failed: ${fallbackError}`
      }
    }
  }
}

// Helper function to convert base64 to blob
const base64ToBlob = (base64: string, mimeType: string): Blob => {
  const binaryString = atob(base64)
  const bytes = new Uint8Array(binaryString.length)
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i)
  }
  return new Blob([bytes], { type: mimeType })
}

const createPlaceholderImage = async (prompt: string, style?: string): Promise<Blob> => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')!
  
  canvas.width = 512
  canvas.height = 512
  
  // Enhanced gradients based on style
  const styleConfigs = {
    realistic: { colors: ['#4A5568', '#2D3748'], shapes: 'organic' },
    artistic: { colors: ['#F56565', '#ED8936'], shapes: 'abstract' },
    cartoon: { colors: ['#48BB78', '#38B2AC'], shapes: 'playful' },
    abstract: { colors: ['#ED64A6', '#9F7AEA'], shapes: 'geometric' },
    cyberpunk: { colors: ['#00FF88', '#0080FF'], shapes: 'tech' },
    fantasy: { colors: ['#B794F6', '#F687B3'], shapes: 'mystical' }
  }
  
  const config = styleConfigs[style as keyof typeof styleConfigs] || styleConfigs.artistic
  
  // Create radial gradient for more depth
  const gradient = ctx.createRadialGradient(256, 256, 0, 256, 256, 400)
  gradient.addColorStop(0, config.colors[0])
  gradient.addColorStop(1, config.colors[1])
  
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 512, 512)
  
  // Add style-specific patterns
  ctx.globalAlpha = 0.3
  for (let i = 0; i < 8; i++) {
    const x = Math.random() * 512
    const y = Math.random() * 512
    const size = Math.random() * 80 + 20
    
    ctx.fillStyle = `hsl(${Math.random() * 360}, 70%, 60%)`
    
    if (config.shapes === 'geometric') {
      ctx.fillRect(x - size/2, y - size/2, size, size)
    } else {
      ctx.beginPath()
      ctx.arc(x, y, size, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  
  ctx.globalAlpha = 1
  
  // Add "AI Generated" watermark
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)'
  ctx.font = 'bold 16px Arial'
  ctx.textAlign = 'right'
  ctx.fillText('🤖 AI Generated', 500, 30)
  
  // Add main prompt text with better styling
  ctx.fillStyle = 'rgba(255, 255, 255, 0.95)'
  ctx.font = 'bold 28px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  
  // Add text shadow for better readability
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)'
  ctx.shadowBlur = 4
  ctx.shadowOffsetX = 2
  ctx.shadowOffsetY = 2
  
  // Wrap text with better formatting
  const words = prompt.split(' ')
  const lines = []
  let currentLine = ''
  
  for (const word of words) {
    const testLine = currentLine + word + ' '
    const metrics = ctx.measureText(testLine)
    if (metrics.width > 400 && currentLine !== '') {
      lines.push(currentLine.trim())
      currentLine = word + ' '
    } else {
      currentLine = testLine
    }
  }
  lines.push(currentLine.trim())
  
  const lineHeight = 35
  const startY = 256 - (lines.length * lineHeight) / 2
  
  lines.forEach((line, index) => {
    ctx.fillText(line, 256, startY + index * lineHeight)
  })
  
  // Add style label
  ctx.shadowColor = 'transparent'
  ctx.font = '14px Arial'
  ctx.fillStyle = 'rgba(255, 255, 255, 0.7)'
  ctx.fillText(`Style: ${style || 'artistic'}`, 256, 480)
  
  return new Promise((resolve) => {
    canvas.toBlob((blob) => {
      resolve(blob!)
    }, 'image/png')
  })
}

// Predefined AI prompts for quick generation
export const aiPromptTemplates = [
  {
    category: 'Fantasy',
    prompts: [
      'Mystical dragon with glowing crystals',
      'Enchanted forest with magical creatures',
      'Ancient wizard casting spells',
      'Floating castle in the clouds'
    ]
  },
  {
    category: 'Cyberpunk',
    prompts: [
      'Neon-lit futuristic cityscape',
      'Cybernetic warrior with glowing eyes',
      'Holographic data streams',
      'Robot samurai in digital rain'
    ]
  },
  {
    category: 'Abstract',
    prompts: [
      'Geometric patterns with vibrant colors',
      'Fluid dynamics in space',
      'Crystalline structures',
      'Energy waves and particles'
    ]
  },
  {
    category: 'Nature',
    prompts: [
      'Bioluminescent underwater scene',
      'Aurora borealis over mountains',
      'Exotic alien plants',
      'Cosmic tree with star fruits'
    ]
  }
]