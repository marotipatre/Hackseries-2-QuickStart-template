import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar, closeSnackbar } from 'notistack'
import { useMemo, useState } from 'react'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'
import { ipfsHttpUrl, pinFileToIPFS, pinJSONToIPFS } from '../utils/pinata'
import templatesData from '../assets/nft-templates/templates.json'
import cyberPunkImg from '../assets/cyber-punk.png'
import algoGemImg from '../assets/algo-gem.png'
import spaceExplorerImg from '../assets/space-explorer.png'
import digitalArtImg from '../assets/digital-art.png'

interface MintNFTProps {
  openModal: boolean
  closeModal: () => void
}

const MintNFT = ({ openModal, closeModal }: MintNFTProps) => {
  const { activeAddress, transactionSigner } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const [currentStep, setCurrentStep] = useState(1)
  const [name, setName] = useState('AlgoNFT')
  const [description, setDescription] = useState('My first NFT!')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [aiPrompt, setAiPrompt] = useState('')
  const [generatingImage, setGeneratingImage] = useState(false)
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null)
  const [selectedStyle, setSelectedStyle] = useState('realistic')
  const [imageSource, setImageSource] = useState<'template' | 'ai' | 'upload' | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)

  const templateImages: { [key: string]: string } = {
    'cyber-punk': cyberPunkImg,
    'algo-gem': algoGemImg,
    'space-explorer': spaceExplorerImg,
    'digital-art': digitalArtImg
  }

  const artStyles = [
    { id: 'realistic', name: 'Realistic', prompt: 'photorealistic, high quality, detailed' },
    { id: 'digital-art', name: 'Digital Art', prompt: 'digital art, vibrant colors, modern' },
    { id: 'cyberpunk', name: 'Cyberpunk', prompt: 'cyberpunk style, neon lights, futuristic' },
    { id: 'fantasy', name: 'Fantasy', prompt: 'fantasy art, magical, mystical, ethereal' },
    { id: 'anime', name: 'Anime', prompt: 'anime style, manga, colorful' },
    { id: 'abstract', name: 'Abstract', prompt: 'abstract art, geometric, colorful patterns' }
  ]

  const promptSuggestions = [
    'a majestic dragon breathing fire',
    'futuristic robot with glowing eyes',
    'magical crystal in enchanted forest',
    'cyberpunk city with neon lights',
    'cute alien creature on colorful planet',
    'abstract geometric art with rainbow colors'
  ]

  const algorand = useMemo(() => {
    const algodConfig = getAlgodConfigFromViteEnvironment()
    const client = AlgorandClient.fromConfig({ algodConfig })
    client.setDefaultSigner(transactionSigner)
    return client
  }, [transactionSigner])

  async function sha256Hex(data: Uint8Array): Promise<string> {
    const digest = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(digest))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  }

  const generateAIImage = async () => {
    if (!aiPrompt.trim()) {
      enqueueSnackbar('Please enter a prompt for AI image generation', { variant: 'error' })
      return
    }

    setGeneratingImage(true)
    try {
      const selectedStyleData = artStyles.find(s => s.id === selectedStyle)
      const fullPrompt = `${aiPrompt}, ${selectedStyleData?.prompt || 'high quality'}`
      
      const response = await fetch('https://api-inference.huggingface.co/models/black-forest-labs/FLUX.1-schnell', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: fullPrompt,
          parameters: {
            num_inference_steps: 4,
            guidance_scale: 0.0,
            width: 512,
            height: 512
          }
        })
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const blob = await response.blob()
      if (blob.size < 1000) {
        throw new Error('Generated image is too small')
      }

      const imageUrl = URL.createObjectURL(blob)
      setGeneratedImageUrl(imageUrl)
      
      const file = new File([blob], `ai-generated-${Date.now()}.png`, { type: 'image/png' })
      setFile(file)
      setImageSource('ai')
      setSelectedTemplateId(null)
      
      enqueueSnackbar('🎨 AI image generated successfully!', { variant: 'success' })
    } catch (error) {
      console.error('Error generating AI image:', error)
      enqueueSnackbar('Failed to generate AI image. Please try again.', { variant: 'error' })
    } finally {
      setGeneratingImage(false)
    }
  }

  const useTemplate = async (template: any) => {
    setName(template.name)
    setDescription(template.description)
    setImageSource('template')
    setSelectedTemplateId(template.id)
    
    try {
      const imageUrl = templateImages[template.id]
      if (imageUrl) {
        const response = await fetch(imageUrl)
        const blob = await response.blob()
        const file = new File([blob], `${template.id}.png`, { type: 'image/png' })
        setFile(file)
        setGeneratedImageUrl(imageUrl)
        return
      }
    } catch (error) {
      console.log('Template image not found, creating placeholder')
    }
    
    // Fallback to canvas placeholder
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    const ctx = canvas.getContext('2d')!
    
    const gradients = [
      ['#667eea', '#764ba2'],
      ['#f093fb', '#f5576c'],
      ['#4facfe', '#00f2fe'],
      ['#43e97b', '#38f9d7']
    ]
    const colors = gradients[Math.floor(Math.random() * gradients.length)]
    
    const gradient = ctx.createLinearGradient(0, 0, 512, 512)
    gradient.addColorStop(0, colors[0])
    gradient.addColorStop(1, colors[1])
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 512, 512)
    
    ctx.fillStyle = 'white'
    ctx.font = 'bold 28px Arial'
    ctx.textAlign = 'center'
    ctx.fillText(template.name, 256, 256)
    
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `${template.id}.png`, { type: 'image/png' })
        setFile(file)
        setGeneratedImageUrl(URL.createObjectURL(blob))
      }
    })
  }

  const handleUpload = (selectedFile: File) => {
    setFile(selectedFile)
    setGeneratedImageUrl(URL.createObjectURL(selectedFile))
    setImageSource('upload')
    setSelectedTemplateId(null)
  }

  const nextStep = () => {
    if (currentStep === 1 && !file) {
      enqueueSnackbar('Please select an image first', { variant: 'error' })
      return
    }
    setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const onMint = async () => {
    if (!activeAddress) return enqueueSnackbar('Connect a wallet first', { variant: 'error' })
    if (!file) return enqueueSnackbar('No image selected', { variant: 'error' })

    setLoading(true)
    try {
      const filePin = await pinFileToIPFS(file)
      const imageUrl = ipfsHttpUrl(filePin.IpfsHash)

      const metadata = {
        name,
        description,
        image: imageUrl,
        image_mimetype: file.type || 'image/png',
        external_url: imageUrl,
        properties: {
          simple_property: 'Dashing Item',
        },
      }

      const jsonPin = await pinJSONToIPFS(metadata)
      const metadataUrl = `${ipfsHttpUrl(jsonPin.IpfsHash)}#arc3`

      const metaBytes = new TextEncoder().encode(JSON.stringify(metadata))
      const metaHex = await sha256Hex(metaBytes)
      const metadataHash = new Uint8Array(metaHex.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)))

      const result = await algorand.send.assetCreate({
        sender: activeAddress,
        total: 1n,
        decimals: 0,
        unitName: name.slice(0, 8).replace(/\s+/g, ''),
        assetName: name,
        manager: activeAddress,
        reserve: activeAddress,
        freeze: activeAddress,
        clawback: activeAddress,
        url: metadataUrl,
        metadataHash,
        defaultFrozen: false,
      })

      const explorerUrl = `https://lora.algokit.io/testnet/asset/${result.assetId}`
      
      enqueueSnackbar(
        <div>
          <div className="font-bold">🎉 NFT Minted Successfully!</div>
          <div className="text-sm mt-1">ASA ID: {result.assetId}</div>
          <button 
            onClick={() => window.open(explorerUrl, '_blank')}
            className="btn btn-xs btn-primary mt-2"
          >
            View on Explorer
          </button>
        </div>,
        { 
          variant: 'success', 
          autoHideDuration: 20000,
          action: (key) => (
            <button onClick={() => closeSnackbar(key)} className="btn btn-xs btn-ghost text-white">
              ✕
            </button>
          )
        }
      )
      
      closeModal()
      setCurrentStep(1)
      setFile(null)
      setGeneratedImageUrl(null)
      setImageSource(null)
    } catch (e) {
      enqueueSnackbar((e as Error).message, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const resetModal = () => {
    setCurrentStep(1)
    setFile(null)
    setGeneratedImageUrl(null)
    setImageSource(null)
    setSelectedTemplateId(null)
    setName('AlgoNFT')
    setDescription('My first NFT!')
    setAiPrompt('')
    closeModal()
  }

  return (
    <dialog id="mint_nft_modal" className={`modal ${openModal ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-5xl bg-gradient-to-br from-purple-900/95 via-blue-900/95 to-pink-900/95 backdrop-blur-xl border border-purple-500/30">
        <button 
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-white hover:bg-white/10" 
          onClick={resetModal}
        >
          ✕
        </button>
        
        <div className="text-center mb-8">
          <h3 className="font-bold text-4xl mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-cyan-400 bg-clip-text text-transparent">
            🎨 NFT Creation Studio
          </h3>
          
          {/* Progress Steps */}
          <div className="flex justify-center items-center space-x-4 mb-6">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-purple-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-purple-500' : 'bg-gray-600'} text-white font-bold`}>
                1
              </div>
              <span className="ml-2 font-medium">Choose Image</span>
            </div>
            <div className={`w-8 h-1 ${currentStep >= 2 ? 'bg-purple-500' : 'bg-gray-600'} rounded`}></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-purple-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-purple-500' : 'bg-gray-600'} text-white font-bold`}>
                2
              </div>
              <span className="ml-2 font-medium">Customize</span>
            </div>
            <div className={`w-8 h-1 ${currentStep >= 3 ? 'bg-purple-500' : 'bg-gray-600'} rounded`}></div>
            <div className={`flex items-center ${currentStep >= 3 ? 'text-purple-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-purple-500' : 'bg-gray-600'} text-white font-bold`}>
                3
              </div>
              <span className="ml-2 font-medium">Mint NFT</span>
            </div>
          </div>
        </div>

        {/* Step 1: Choose Image */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h4 className="text-2xl font-bold text-white text-center mb-6">Choose Your Image Source</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Templates */}
              <div className="card bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 p-6">
                <h5 className="text-xl font-bold text-white mb-4 text-center">🎭 Pre-made Templates</h5>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {templatesData.map((template) => (
                    <div 
                      key={template.id} 
                      className={`card bg-gradient-to-br from-purple-600/20 to-pink-600/20 border cursor-pointer hover:scale-105 transition-all duration-300 ${
                        imageSource === 'template' && file ? 'border-green-400 ring-2 ring-green-400/50' : 'border-purple-500/30'
                      }`}
                      onClick={() => useTemplate(template)}
                    >
                      <div className="card-body p-3 text-center">
                        <div className="w-16 h-16 mx-auto mb-2 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                          <img 
                            src={template.image.replace('/src', '')}
                            alt={template.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = 'none'
                              target.nextElementSibling!.classList.remove('hidden')
                            }}
                          />
                          <div className="text-2xl text-white hidden">🎨</div>
                        </div>
                        <h6 className="font-bold text-xs text-white">{template.name}</h6>
                        <p className="text-xs text-gray-300">{template.category}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-300 text-center">Click any template to use it as your NFT</p>
              </div>

              {/* AI Generation */}
              <div className="card bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 p-6">
                <h5 className="text-xl font-bold text-white mb-4 text-center">🤖 AI Generation</h5>
                
                <div className="space-y-4">
                  <div>
                    <label className="label">
                      <span className="label-text text-white font-medium">Art Style</span>
                    </label>
                    <select 
                      className="select select-sm select-bordered w-full bg-white/10 border-blue-500/30 text-white"
                      value={selectedStyle}
                      onChange={(e) => setSelectedStyle(e.target.value)}
                    >
                      {artStyles.map((style) => (
                        <option key={style.id} value={style.id}>{style.name}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="label">
                      <span className="label-text text-white font-medium">Describe Your NFT</span>
                    </label>
                    <textarea
                      className="textarea textarea-sm textarea-bordered w-full h-20 bg-white/10 border-blue-500/30 text-white placeholder-gray-300"
                      placeholder="Describe your NFT..."
                      value={aiPrompt}
                      onChange={(e) => setAiPrompt(e.target.value)}
                    />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {promptSuggestions.slice(0, 3).map((suggestion, index) => (
                      <button
                        key={index}
                        className="btn btn-xs bg-gradient-to-r from-cyan-500/20 to-blue-500/20 border-cyan-400/30 text-cyan-300"
                        onClick={() => setAiPrompt(suggestion)}
                      >
                        {suggestion.split(' ').slice(0, 2).join(' ')}...
                      </button>
                    ))}
                  </div>

                  <button 
                    className={`btn btn-sm w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white border-none ${generatingImage ? 'loading' : ''}`}
                    onClick={generateAIImage} 
                    disabled={generatingImage || !aiPrompt.trim()}
                  >
                    {generatingImage ? 'Generating...' : '✨ Generate'}
                  </button>
                </div>
              </div>

              {/* Upload */}
              <div className="card bg-gradient-to-br from-orange-600/20 to-red-600/20 border border-orange-500/30 p-6">
                <h5 className="text-xl font-bold text-white mb-4 text-center">📁 Upload Image</h5>
                
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-6xl mb-4">📸</div>
                    <p className="text-gray-300 mb-4">Upload your own image</p>
                  </div>
                  
                  <input 
                    className="file-input file-input-sm file-input-bordered w-full bg-white/10 border-orange-500/30 text-white" 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const selectedFile = e.target.files?.[0]
                      if (selectedFile) {
                        handleUpload(selectedFile)
                      }
                    }} 
                  />
                  
                  <p className="text-xs text-gray-400 text-center">
                    Supports: JPG, PNG, GIF<br/>
                    Max size: 10MB
                  </p>
                </div>
              </div>
            </div>

            {/* Image Preview */}
            {(generatedImageUrl || file) && (
              <div className="card bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 p-6">
                <h5 className="text-xl font-bold text-white mb-4 text-center">🖼️ Selected Image</h5>
                <div className="flex justify-center">
                  <img 
                    src={generatedImageUrl || (file ? URL.createObjectURL(file) : '')} 
                    alt="Selected" 
                    className="max-w-xs max-h-48 object-contain rounded-lg border border-white/20 shadow-2xl"
                  />
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Customize */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h4 className="text-2xl font-bold text-white text-center mb-6">Customize Your NFT</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Image Preview */}
              <div className="card bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 p-6">
                <h5 className="text-xl font-bold text-white mb-4 text-center">🖼️ Preview</h5>
                <div className="flex justify-center">
                  <img 
                    src={generatedImageUrl || (file ? URL.createObjectURL(file) : '')} 
                    alt="NFT Preview" 
                    className="max-w-full max-h-64 object-contain rounded-lg border border-white/20 shadow-2xl"
                  />
                </div>
              </div>

              {/* Customization Form */}
              <div className="space-y-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold text-white text-lg">NFT Name</span>
                  </label>
                  <input 
                    className="input input-bordered bg-white/10 border-purple-500/30 text-white placeholder-gray-300 text-lg" 
                    placeholder="Enter NFT name" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold text-white text-lg">Description</span>
                  </label>
                  <textarea 
                    className="textarea textarea-bordered h-32 bg-white/10 border-purple-500/30 text-white placeholder-gray-300" 
                    placeholder="Describe your NFT..." 
                    value={description} 
                    onChange={(e) => setDescription(e.target.value)} 
                  />
                </div>

                {/* NFT Details Preview */}
                <div className="card bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 p-4">
                  <h6 className="font-bold text-white mb-2">📋 NFT Details</h6>
                  <div className="space-y-2 text-sm">
                    <div><span className="text-gray-400">Name:</span> <span className="text-white">{name}</span></div>
                    <div><span className="text-gray-400">Type:</span> <span className="text-white">ARC-3 NFT</span></div>
                    <div><span className="text-gray-400">Supply:</span> <span className="text-white">1 (Unique)</span></div>
                    <div><span className="text-gray-400">Standard:</span> <span className="text-white">Algorand Standard Asset</span></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Mint NFT */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h4 className="text-2xl font-bold text-white text-center mb-6">Ready to Mint Your NFT</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Final Preview */}
              <div className="card bg-gradient-to-br from-purple-600/20 to-pink-600/20 border border-purple-500/30 p-6">
                <h5 className="text-xl font-bold text-white mb-4 text-center">🎨 Final Preview</h5>
                <div className="text-center space-y-4">
                  <img 
                    src={generatedImageUrl || (file ? URL.createObjectURL(file) : '')} 
                    alt="Final NFT" 
                    className="max-w-full max-h-48 object-contain rounded-lg border border-white/20 shadow-2xl mx-auto"
                  />
                  <div>
                    <h6 className="text-xl font-bold text-white">{name}</h6>
                    <p className="text-gray-300 text-sm mt-2">{description}</p>
                  </div>
                </div>
              </div>

              {/* Mint Summary */}
              <div className="space-y-6">
                <div className="card bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 p-6">
                  <h5 className="text-xl font-bold text-white mb-4">📊 Mint Summary</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">NFT Name:</span>
                      <span className="text-white font-medium">{name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Type:</span>
                      <span className="text-white font-medium">ARC-3 NFT</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Supply:</span>
                      <span className="text-white font-medium">1 (Unique)</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Network Fee:</span>
                      <span className="text-white font-medium">~0.001 ALGO</span>
                    </div>
                    <div className="divider my-2"></div>
                    <div className="flex justify-between text-lg">
                      <span className="text-white font-bold">Total Cost:</span>
                      <span className="text-green-400 font-bold">~0.001 ALGO</span>
                    </div>
                  </div>
                </div>

                <div className="alert bg-gradient-to-r from-blue-600/20 to-cyan-600/20 border border-blue-500/30">
                  <div className="flex items-start gap-3">
                    <div className="text-blue-400">ℹ️</div>
                    <div className="text-sm">
                      <p className="font-medium text-white">Ready to Mint</p>
                      <p className="text-gray-300">Your NFT will be created on the Algorand blockchain and stored on IPFS.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8 pt-6 border-t border-white/10">
          <div>
            {currentStep > 1 && (
              <button 
                className="btn bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white border-none"
                onClick={prevStep}
                disabled={loading}
              >
                ← Previous
              </button>
            )}
          </div>
          
          <div className="text-center">
            <span className="text-gray-400 text-sm">Step {currentStep} of 3</span>
          </div>
          
          <div>
            {currentStep < 3 ? (
              <button 
                className="btn bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none"
                onClick={nextStep}
                disabled={!file}
              >
                Next →
              </button>
            ) : (
              <button 
                className={`btn btn-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-none ${loading ? 'loading' : ''}`}
                onClick={onMint} 
                disabled={loading || !file}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="loading loading-spinner loading-sm"></span>
                    Minting NFT...
                  </span>
                ) : (
                  '🚀 Mint NFT'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </dialog>
  )
}

export default MintNFT