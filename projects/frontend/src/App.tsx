import { SupportedWallet, WalletId, WalletManager, WalletProvider } from '@txnlab/use-wallet-react'
import { SnackbarProvider } from 'notistack'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './Home'
import Profile from './pages/Profile'
import PublicProfile from './pages/PublicProfile'
import CreateProject from './pages/CreateProject'
import ProjectDetail from './pages/ProjectDetail'
import Guide from './pages/Guide'
import TinymanGuide from './pages/TinymanGuide'
import { AuthProvider } from './contexts/AuthContext'
import AvatarSetupPrompt from './components/AvatarSetupPrompt'
import { getAlgodConfigFromViteEnvironment, getKmdConfigFromViteEnvironment } from './utils/network/getAlgoClientConfigs'

let supportedWallets: SupportedWallet[]
if (import.meta.env.VITE_ALGOD_NETWORK === 'localnet') {
  const kmdConfig = getKmdConfigFromViteEnvironment()
  supportedWallets = [
    {
      id: WalletId.KMD,
      options: {
        baseServer: kmdConfig.server,
        token: String(kmdConfig.token),
        port: String(kmdConfig.port),
      },
    },
  ]
} else {
  supportedWallets = [
    { id: WalletId.DEFLY },
    { id: WalletId.PERA },
    { id: WalletId.EXODUS },
    { id: WalletId.LUTE },
    // If you are interested in WalletConnect v2 provider
    // refer to https://github.com/TxnLab/use-wallet for detailed integration instructions
  ]
}

export default function App() {
  const algodConfig = getAlgodConfigFromViteEnvironment()

  const walletManager = new WalletManager({
    wallets: supportedWallets,
    defaultNetwork: algodConfig.network,
    networks: {
      [algodConfig.network]: {
        algod: {
          baseServer: algodConfig.server,
          port: algodConfig.port,
          token: String(algodConfig.token),
        },
      },
    },
    options: {
      resetNetwork: true,
    },
  })

  return (
    <SnackbarProvider maxSnack={3}>
      <WalletProvider manager={walletManager}>
        <AuthProvider>
          <BrowserRouter>
            <AvatarSetupPrompt />
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/profile/:walletAddress" element={<PublicProfile />} />
              <Route path="/create" element={<CreateProject />} />
              <Route path="/project/:appId" element={<ProjectDetail />} />
              <Route path="/guide" element={<Guide />} />
              <Route path="/tinyman-guide" element={<TinymanGuide />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </WalletProvider>
    </SnackbarProvider>
  )
}
