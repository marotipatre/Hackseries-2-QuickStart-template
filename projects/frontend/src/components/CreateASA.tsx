import { AlgorandClient } from '@algorandfoundation/algokit-utils'
import { useWallet } from '@txnlab/use-wallet-react'
import { useSnackbar, closeSnackbar } from 'notistack'
import { useMemo, useState } from 'react'
import { getAlgodConfigFromViteEnvironment } from '../utils/network/getAlgoClientConfigs'

interface CreateASAProps {
  openModal: boolean
  closeModal: () => void
}

const CreateASA = ({ openModal, closeModal }: CreateASAProps) => {
  const { activeAddress, transactionSigner } = useWallet()
  const { enqueueSnackbar } = useSnackbar()
  const [currentStep, setCurrentStep] = useState(1)
  const [name, setName] = useState('MyToken')
  const [unit, setUnit] = useState('MTK')
  const [decimals, setDecimals] = useState('6')
  const [total, setTotal] = useState('1000000')
  const [loading, setLoading] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null)

  const tokenTemplates = [
    {
      name: 'GameCoin',
      symbol: 'GAME',
      decimals: '2',
      supply: '10000000',
      icon: '🎮',
      gradient: 'from-purple-500 to-pink-500',
      description: 'Perfect for gaming platforms and in-game rewards'
    },
    {
      name: 'LoyaltyPoints',
      symbol: 'LOYAL',
      decimals: '0',
      supply: '1000000',
      icon: '🎁',
      gradient: 'from-green-500 to-emerald-500',
      description: 'Customer loyalty and rewards program'
    },
    {
      name: 'StableCoin',
      symbol: 'STABLE',
      decimals: '6',
      supply: '1000000',
      icon: '💰',
      gradient: 'from-blue-500 to-cyan-500',
      description: 'Price-stable digital currency'
    },
    {
      name: 'CommunityToken',
      symbol: 'COMM',
      decimals: '6',
      supply: '10000000',
      icon: '🤝',
      gradient: 'from-orange-500 to-red-500',
      description: 'Community governance and participation'
    }
  ]

  const algorand = useMemo(() => {
    const algodConfig = getAlgodConfigFromViteEnvironment()
    const client = AlgorandClient.fromConfig({ algodConfig })
    client.setDefaultSigner(transactionSigner)
    return client
  }, [transactionSigner])

  const calculateDisplaySupply = () => {
    const totalNum = Number(total)
    const decimalsNum = Number(decimals)
    if (isNaN(totalNum) || isNaN(decimalsNum)) return '0'
    return (totalNum / Math.pow(10, decimalsNum)).toLocaleString()
  }

  const useTemplate = (template: any) => {
    setSelectedTemplate(template)
    setName(template.name)
    setUnit(template.symbol)
    setDecimals(template.decimals)
    setTotal(template.supply)
  }

  const nextStep = () => {
    if (currentStep === 1 && !selectedTemplate && (name === 'MyToken' && unit === 'MTK')) {
      enqueueSnackbar('Please select a template or customize your token', { variant: 'error' })
      return
    }
    setCurrentStep(currentStep + 1)
  }

  const prevStep = () => {
    setCurrentStep(currentStep - 1)
  }

  const onCreate = async () => {
    if (!activeAddress) return enqueueSnackbar('Connect a wallet first', { variant: 'error' })
    setLoading(true)
    try {
      const result = await algorand.send.assetCreate({
        sender: activeAddress,
        total: BigInt(total),
        decimals: Number(decimals),
        unitName: unit,
        assetName: name,
        manager: activeAddress,
        reserve: activeAddress,
        freeze: activeAddress,
        clawback: activeAddress,
        defaultFrozen: false,
      })
      
      const explorerUrl = `https://lora.algokit.io/testnet/asset/${result.assetId}`
      
      enqueueSnackbar(
        <div>
          <div className="font-bold">🎉 Token Created Successfully!</div>
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
      setSelectedTemplate(null)
    } catch (e) {
      enqueueSnackbar((e as Error).message, { variant: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const resetModal = () => {
    setCurrentStep(1)
    setSelectedTemplate(null)
    setName('MyToken')
    setUnit('MTK')
    setDecimals('6')
    setTotal('1000000')
    closeModal()
  }

  return (
    <dialog id="create_asa_modal" className={`modal ${openModal ? 'modal-open' : ''}`}>
      <div className="modal-box max-w-4xl bg-gradient-to-br from-green-900/95 via-emerald-900/95 to-teal-900/95 backdrop-blur-xl border border-green-500/30">
        <button 
          className="btn btn-sm btn-circle btn-ghost absolute right-2 top-2 text-white hover:bg-white/10" 
          onClick={resetModal}
        >
          ✕
        </button>
        
        <div className="text-center mb-8">
          <h3 className="font-bold text-4xl mb-4 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
            🪙 Token Creation Studio
          </h3>
          
          {/* Progress Steps */}
          <div className="flex justify-center items-center space-x-4 mb-6">
            <div className={`flex items-center ${currentStep >= 1 ? 'text-green-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-green-500' : 'bg-gray-600'} text-white font-bold`}>
                1
              </div>
              <span className="ml-2 font-medium">Choose Type</span>
            </div>
            <div className={`w-8 h-1 ${currentStep >= 2 ? 'bg-green-500' : 'bg-gray-600'} rounded`}></div>
            <div className={`flex items-center ${currentStep >= 2 ? 'text-green-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-green-500' : 'bg-gray-600'} text-white font-bold`}>
                2
              </div>
              <span className="ml-2 font-medium">Customize</span>
            </div>
            <div className={`w-8 h-1 ${currentStep >= 3 ? 'bg-green-500' : 'bg-gray-600'} rounded`}></div>
            <div className={`flex items-center ${currentStep >= 3 ? 'text-green-400' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-green-500' : 'bg-gray-600'} text-white font-bold`}>
                3
              </div>
              <span className="ml-2 font-medium">Create Token</span>
            </div>
          </div>
        </div>

        {/* Step 1: Choose Template */}
        {currentStep === 1 && (
          <div className="space-y-6">
            <h4 className="text-2xl font-bold text-white text-center mb-6">Choose Token Type</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {tokenTemplates.map((template, index) => (
                <div
                  key={index}
                  className={`card bg-gradient-to-br ${template.gradient}/20 border cursor-pointer hover:scale-105 transition-all duration-300 p-6 ${
                    selectedTemplate?.name === template.name ? 'border-green-400 ring-2 ring-green-400/50' : 'border-white/20'
                  }`}
                  onClick={() => useTemplate(template)}
                >
                  <div className="text-center space-y-4">
                    <div className="text-6xl">{template.icon}</div>
                    <div>
                      <h5 className="text-2xl font-bold text-white">{template.name}</h5>
                      <p className="text-lg text-gray-300 font-medium">{template.symbol}</p>
                    </div>
                    <p className="text-gray-300 text-sm">{template.description}</p>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-400">Decimals:</span>
                        <span className="text-white ml-1">{template.decimals}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Supply:</span>
                        <span className="text-white ml-1">{Number(template.supply).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="text-center">
              <p className="text-gray-300 mb-4">Or create a custom token from scratch</p>
              <button 
                className="btn bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white border-none"
                onClick={() => {
                  setSelectedTemplate({ name: 'Custom', symbol: 'CUSTOM' })
                  setName('CustomToken')
                  setUnit('CUSTOM')
                }}
              >
                🛠️ Create Custom Token
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Customize */}
        {currentStep === 2 && (
          <div className="space-y-6">
            <h4 className="text-2xl font-bold text-white text-center mb-6">Customize Your Token</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Form */}
              <div className="space-y-6">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold text-white text-lg">Token Name</span>
                  </label>
                  <input 
                    className="input input-bordered bg-white/10 border-green-500/30 text-white placeholder-gray-300 text-lg" 
                    placeholder="e.g., MyAwesomeToken" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-bold text-white text-lg">Symbol</span>
                  </label>
                  <input 
                    className="input input-bordered bg-white/10 border-green-500/30 text-white placeholder-gray-300 text-lg" 
                    placeholder="e.g., MAT" 
                    value={unit} 
                    onChange={(e) => setUnit(e.target.value.toUpperCase())} 
                    maxLength={8}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold text-white">Decimals</span>
                    </label>
                    <input 
                      className="input input-bordered bg-white/10 border-green-500/30 text-white placeholder-gray-300" 
                      placeholder="6" 
                      value={decimals} 
                      onChange={(e) => setDecimals(e.target.value)} 
                      type="number"
                      min="0"
                      max="19"
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-bold text-white">Total Supply</span>
                    </label>
                    <input 
                      className="input input-bordered bg-white/10 border-green-500/30 text-white placeholder-gray-300" 
                      placeholder="1000000" 
                      value={total} 
                      onChange={(e) => setTotal(e.target.value)} 
                      type="number"
                      min="1"
                    />
                  </div>
                </div>
              </div>

              {/* Preview */}
              <div className="card bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-blue-500/30 p-6">
                <h5 className="text-xl font-bold text-white mb-4 text-center">📊 Token Preview</h5>
                <div className="text-center space-y-4">
                  <div className="text-6xl">{selectedTemplate?.icon || '🪙'}</div>
                  <div>
                    <h6 className="text-2xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">{name}</h6>
                    <p className="text-xl text-blue-400 font-medium">{unit}</p>
                  </div>
                  <div className="grid grid-cols-1 gap-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Decimals:</span>
                      <span className="text-white">{decimals}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Total Supply:</span>
                      <span className="text-white">{calculateDisplaySupply()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Base Units:</span>
                      <span className="text-white">{Number(total).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Step 3: Create Token */}
        {currentStep === 3 && (
          <div className="space-y-6">
            <h4 className="text-2xl font-bold text-white text-center mb-6">Ready to Create Your Token</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Final Preview */}
              <div className="card bg-gradient-to-br from-green-600/20 to-emerald-600/20 border border-green-500/30 p-6">
                <h5 className="text-xl font-bold text-white mb-4 text-center">🪙 Final Preview</h5>
                <div className="text-center space-y-4">
                  <div className="text-8xl">{selectedTemplate?.icon || '🪙'}</div>
                  <div>
                    <h6 className="text-3xl font-bold text-white">{name}</h6>
                    <p className="text-2xl text-green-400 font-medium">{unit}</p>
                  </div>
                  <div className="text-xl text-purple-400 font-bold">
                    {calculateDisplaySupply()} tokens
                  </div>
                </div>
              </div>

              {/* Creation Summary */}
              <div className="space-y-6">
                <div className="card bg-gradient-to-br from-blue-600/20 to-cyan-600/20 border border-blue-500/30 p-6">
                  <h5 className="text-xl font-bold text-white mb-4">📋 Creation Summary</h5>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-300">Token Name:</span>
                      <span className="text-white font-medium">{name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Symbol:</span>
                      <span className="text-white font-medium">{unit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Decimals:</span>
                      <span className="text-white font-medium">{decimals}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-300">Total Supply:</span>
                      <span className="text-white font-medium">{calculateDisplaySupply()}</span>
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

                <div className="alert bg-gradient-to-r from-green-600/20 to-emerald-600/20 border border-green-500/30">
                  <div className="flex items-start gap-3">
                    <div className="text-green-400">✅</div>
                    <div className="text-sm">
                      <p className="font-medium text-white">Ready to Create</p>
                      <p className="text-gray-300">Your token will be created as an Algorand Standard Asset (ASA).</p>
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
                className="btn bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-none"
                onClick={nextStep}
              >
                Next →
              </button>
            ) : (
              <button 
                className={`btn btn-lg bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white border-none ${loading ? 'loading' : ''}`}
                onClick={onCreate} 
                disabled={loading || !name || !unit}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <span className="loading loading-spinner loading-sm"></span>
                    Creating Token...
                  </span>
                ) : (
                  '🚀 Create Token'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </dialog>
  )
}

export default CreateASA