"use client"

import { useState, useEffect } from "react"
import { Wallet, ArrowUpRight, ArrowDownRight, RefreshCw, Loader2, Sparkles } from "lucide-react"
import { ethers } from "ethers"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { useWallet } from "@/hooks/use-wallet"
import { Badge } from "@/components/ui/badge"

interface AssetListProps {
  isVerified: boolean
}

interface Asset {
  symbol: string
  name: string
  balance: string
  value: string
  change24h: number
  logo: string
  address: string
  decimals: number
}

interface NetworkAssets {
  network: string
  chainId: number
  assets: Asset[]
  totalValue: string
}

// ERC20 ABI for token balances
const ERC20_ABI = [
  "function balanceOf(address) view returns (uint)",
  "function decimals() view returns (uint8)",
  "function symbol() view returns (string)",
  "function name() view returns (string)",
]

// Helper function to format units safely
const formatUnits = (value: any, decimals: number): string => {
  try {
    return ethers.formatUnits(value, decimals)
  } catch (error) {
    console.error("Error formatting units:", error)
    return "0"
  }
}

// Helper function to format ether safely
const formatEther = (value: any): string => {
  try {
    return ethers.formatEther(value)
  } catch (error) {
    console.error("Error formatting ether:", error)
    return "0"
  }
}

// Simulated price data to avoid API calls
const SIMULATED_PRICES = {
  ethereum: {
    usd: 1850,
    usd_24h_change: 2.5,
  },
  "matic-network": {
    usd: 0.65,
    usd_24h_change: 1.2,
  },
  celo: {
    usd: 0.48,
    usd_24h_change: -0.8,
  },
  "usd-coin": {
    usd: 1.0,
    usd_24h_change: 0.01,
  },
  chainlink: {
    usd: 12.75,
    usd_24h_change: 3.2,
  },
  bitcoin: {
    usd: 52000,
    usd_24h_change: 1.5,
  },
  rootstock: {
    usd: 52000,
    usd_24h_change: 1.5,
  },
  "rif-token": {
    usd: 0.12,
    usd_24h_change: -1.2,
  },
}

// Nodit API client with simulated data
const NoditClient = {
  async getAssets(address: string, provider: any, ensName: string | null): Promise<NetworkAssets[]> {
    try {
      // Initialize networks structure
      const networks: NetworkAssets[] = [
        {
          network: "Ethereum",
          chainId: 1,
          totalValue: "0.00",
          assets: [],
        },
        {
          network: "Polygon",
          chainId: 137,
          totalValue: "0.00",
          assets: [],
        },
        {
          network: "Celo",
          chainId: 42220,
          totalValue: "0.00",
          assets: [],
        },
        {
          network: "Rootstock",
          chainId: 30,
          totalValue: "0.00",
          assets: [],
        },
      ]

      console.log("Using simulated asset data")

      // Try to fetch on-chain data for Ethereum if provider is available
      try {
        if (provider && address) {
          await fetchEthereumAssetsOnChain(networks, provider, address)
        }
      } catch (ethError) {
        console.error("Error fetching Ethereum assets:", ethError)
        // Fall back to simulated Ethereum assets
        await fetchSimulatedEthereumAssets(networks)
      }

      // Use simulated data for other chains
      await fetchPolygonAssetsOnChain(networks, SIMULATED_PRICES)
      await fetchCeloAssetsOnChain(networks, SIMULATED_PRICES)
      await fetchRootstockAssetsOnChain(networks, SIMULATED_PRICES)

      // Ensure each network has at least some assets
      ensureNetworkAssets(networks)

      return networks
    } catch (error) {
      console.error("Error generating asset data:", error)

      // Return fallback data
      return getFallbackNetworks()
    }
  },
}

// Helper function to fetch simulated Ethereum assets
async function fetchSimulatedEthereumAssets(networks: NetworkAssets[]) {
  try {
    // Simulate ETH balance
    const ethBalanceFormatted = (Math.random() * 2).toFixed(6)
    const ethPrice = SIMULATED_PRICES["ethereum"]?.usd || 1800
    let ethValue = Number(Number.parseFloat(ethBalanceFormatted) * ethPrice)

    // Add ETH to assets
    networks[0].assets = [
      {
        symbol: "ETH",
        name: "Ethereum",
        balance: ethBalanceFormatted,
        value: ethValue.toFixed(2),
        change24h: SIMULATED_PRICES["ethereum"]?.usd_24h_change || 0,
        logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=025",
        address: "0x0000000000000000000000000000000000000000",
        decimals: 18,
      },
    ]

    // Add USDC
    const usdcBalanceFormatted = (Math.random() * 1000).toFixed(2)
    const usdcValue = Number.parseFloat(usdcBalanceFormatted)

    networks[0].assets.push({
      symbol: "USDC",
      name: "USD Coin",
      balance: usdcBalanceFormatted,
      value: usdcValue.toFixed(2),
      change24h: SIMULATED_PRICES["usd-coin"]?.usd_24h_change || 0,
      logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=025",
      address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
      decimals: 6,
    })

    ethValue += usdcValue

    // Add LINK
    const linkBalanceFormatted = (Math.random() * 50).toFixed(6)
    const linkPrice = SIMULATED_PRICES["chainlink"]?.usd || 10
    const linkValue = Number(Number.parseFloat(linkBalanceFormatted) * linkPrice)

    networks[0].assets.push({
      symbol: "LINK",
      name: "Chainlink",
      balance: linkBalanceFormatted,
      value: linkValue.toFixed(2),
      change24h: SIMULATED_PRICES["chainlink"]?.usd_24h_change || 0,
      logo: "https://cryptologos.cc/logos/chainlink-link-logo.png?v=025",
      address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
      decimals: 18,
    })

    ethValue += linkValue
    networks[0].totalValue = ethValue.toFixed(2)
  } catch (error) {
    console.error("Error generating simulated Ethereum assets:", error)
  }
}

// Helper function to fetch Ethereum assets on-chain
async function fetchEthereumAssetsOnChain(networks: NetworkAssets[], provider: any, address: string) {
  try {
    // Fetch ETH balance
    const ethBalance = await provider.getBalance(address)
    const ethBalanceFormatted = formatEther(ethBalance)

    // Use simulated price data instead of fetching
    const ethPrice = SIMULATED_PRICES["ethereum"]?.usd || 1800
    let ethValue = Number(Number.parseFloat(ethBalanceFormatted) * ethPrice)

    // Add ETH to assets
    networks[0].assets = [
      {
        symbol: "ETH",
        name: "Ethereum",
        balance: Number.parseFloat(ethBalanceFormatted).toFixed(6),
        value: ethValue.toFixed(2),
        change24h: SIMULATED_PRICES["ethereum"]?.usd_24h_change || 0,
        logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=025",
        address: "0x0000000000000000000000000000000000000000",
        decimals: 18,
      },
    ]

    // Try to fetch USDC balance
    try {
      const usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
      const usdcContract = new ethers.Contract(usdcAddress, ERC20_ABI, provider)

      const usdcBalance = await usdcContract.balanceOf(address)
      const usdcBalanceFormatted = formatUnits(usdcBalance, 6)
      const usdcValue = Number.parseFloat(usdcBalanceFormatted)

      networks[0].assets.push({
        symbol: "USDC",
        name: "USD Coin",
        balance: Number.parseFloat(usdcBalanceFormatted).toFixed(2),
        value: usdcValue.toFixed(2),
        change24h: SIMULATED_PRICES["usd-coin"]?.usd_24h_change || 0,
        logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=025",
        address: usdcAddress,
        decimals: 6,
      })

      ethValue += usdcValue
    } catch (error) {
      console.error("Error fetching USDC balance:", error)

      // Add simulated USDC if fetch fails
      const usdcBalanceFormatted = (Math.random() * 1000).toFixed(2)
      const usdcValue = Number.parseFloat(usdcBalanceFormatted)

      networks[0].assets.push({
        symbol: "USDC",
        name: "USD Coin",
        balance: usdcBalanceFormatted,
        value: usdcValue.toFixed(2),
        change24h: SIMULATED_PRICES["usd-coin"]?.usd_24h_change || 0,
        logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=025",
        address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        decimals: 6,
      })

      ethValue += usdcValue
    }

    // Try to fetch LINK balance
    try {
      const linkAddress = "0x514910771AF9Ca656af840dff83E8264EcF986CA"
      const linkContract = new ethers.Contract(linkAddress, ERC20_ABI, provider)

      const linkBalance = await linkContract.balanceOf(address)
      const linkBalanceFormatted = formatUnits(linkBalance, 18)
      const linkPrice = SIMULATED_PRICES["chainlink"]?.usd || 10
      const linkValue = Number(Number.parseFloat(linkBalanceFormatted) * linkPrice)

      networks[0].assets.push({
        symbol: "LINK",
        name: "Chainlink",
        balance: Number.parseFloat(linkBalanceFormatted).toFixed(6),
        value: linkValue.toFixed(2),
        change24h: SIMULATED_PRICES["chainlink"]?.usd_24h_change || 0,
        logo: "https://cryptologos.cc/logos/chainlink-link-logo.png?v=025",
        address: linkAddress,
        decimals: 18,
      })

      ethValue += linkValue
    } catch (error) {
      console.error("Error fetching LINK balance:", error)

      // Add simulated LINK if fetch fails
      const linkBalanceFormatted = (Math.random() * 50).toFixed(6)
      const linkPrice = SIMULATED_PRICES["chainlink"]?.usd || 10
      const linkValue = Number(Number.parseFloat(linkBalanceFormatted) * linkPrice)

      networks[0].assets.push({
        symbol: "LINK",
        name: "Chainlink",
        balance: linkBalanceFormatted,
        value: linkValue.toFixed(2),
        change24h: SIMULATED_PRICES["chainlink"]?.usd_24h_change || 0,
        logo: "https://cryptologos.cc/logos/chainlink-link-logo.png?v=025",
        address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
        decimals: 18,
      })

      ethValue += linkValue
    }

    networks[0].totalValue = ethValue.toFixed(2)
  } catch (error) {
    console.error("Error fetching Ethereum assets on-chain:", error)
    // Fall back to simulated data
    await fetchSimulatedEthereumAssets(networks)
  }
}

// Helper function to fetch Polygon assets
async function fetchPolygonAssetsOnChain(networks: NetworkAssets[], prices?: any) {
  try {
    if (!prices) {
      prices = SIMULATED_PRICES
    }

    // Simulate Polygon balances with realistic values
    const maticBalance = (Math.random() * 100).toFixed(6)
    const maticPrice = prices["matic-network"]?.usd || 0.65
    const maticValue = Number(maticBalance) * maticPrice

    networks[1].assets = [
      {
        symbol: "MATIC",
        name: "Polygon",
        balance: maticBalance,
        value: maticValue.toFixed(2),
        change24h: prices["matic-network"]?.usd_24h_change || 0,
        logo: "https://cryptologos.cc/logos/polygon-matic-logo.png?v=025",
        address: "0x0000000000000000000000000000000000000000",
        decimals: 18,
      },
      {
        symbol: "USDC",
        name: "USD Coin",
        balance: (Math.random() * 50).toFixed(2),
        value: (Math.random() * 50).toFixed(2),
        change24h: prices["usd-coin"]?.usd_24h_change || 0,
        logo: "https://cryptologos.cc/logos/usd-coin-usdc-logo.png?v=025",
        address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174",
        decimals: 6,
      },
    ]

    const totalValue = maticValue + Number(networks[1].assets[1].value)
    networks[1].totalValue = totalValue.toFixed(2)
  } catch (error) {
    console.error("Error fetching Polygon assets:", error)
  }
}

// Helper function to fetch Celo assets
async function fetchCeloAssetsOnChain(networks: NetworkAssets[], prices?: any) {
  try {
    if (!prices) {
      prices = SIMULATED_PRICES
    }

    // Simulate Celo balances with realistic values
    const celoBalance = (Math.random() * 20).toFixed(6)
    const celoPrice = prices["celo"]?.usd || 0.48
    const celoValue = Number(celoBalance) * celoPrice

    networks[2].assets = [
      {
        symbol: "CELO",
        name: "Celo",
        balance: celoBalance,
        value: celoValue.toFixed(2),
        change24h: prices["celo"]?.usd_24h_change || 0,
        logo: "https://cryptologos.cc/logos/celo-celo-logo.png?v=025",
        address: "0x0000000000000000000000000000000000000000",
        decimals: 18,
      },
      {
        symbol: "cUSD",
        name: "Celo Dollar",
        balance: (Math.random() * 30).toFixed(2),
        value: (Math.random() * 30).toFixed(2),
        change24h: 0.01, // Stablecoin
        logo: "https://cryptologos.cc/logos/celo-dollar-cusd-logo.png?v=025",
        address: "0x765DE816845861e75A25fCA122bb6898B8B1282a",
        decimals: 18,
      },
    ]

    const totalValue = celoValue + Number(networks[2].assets[1].value)
    networks[2].totalValue = totalValue.toFixed(2)
  } catch (error) {
    console.error("Error fetching Celo assets:", error)
  }
}

// Helper function to fetch Rootstock assets
async function fetchRootstockAssetsOnChain(networks: NetworkAssets[], prices?: any) {
  try {
    if (!prices) {
      prices = SIMULATED_PRICES
    }

    // Simulate Rootstock balances with realistic values
    const rbtcBalance = (Math.random() * 0.05).toFixed(6)
    const btcPrice = prices["bitcoin"]?.usd || 52000
    const rbtcValue = Number(rbtcBalance) * btcPrice

    const rifBalance = (Math.random() * 100).toFixed(6)
    const rifPrice = prices["rif-token"]?.usd || 0.12
    const rifValue = Number(rifBalance) * rifPrice

    networks[3].assets = [
      {
        symbol: "RBTC",
        name: "Rootstock Bitcoin",
        balance: rbtcBalance,
        value: rbtcValue.toFixed(2),
        change24h: prices["bitcoin"]?.usd_24h_change || 0,
        logo: "https://cryptologos.cc/logos/rootstock-rsk-logo.png?v=025",
        address: "0x0000000000000000000000000000000000000000",
        decimals: 18,
      },
      {
        symbol: "RIF",
        name: "RSK Infrastructure Framework",
        balance: rifBalance,
        value: rifValue.toFixed(2),
        change24h: prices["rif-token"]?.usd_24h_change || 0,
        logo: "https://cryptologos.cc/logos/rif-token-rif-logo.png?v=025",
        address: "0x2acc95758f8b5f583470ba265eb685a8f45fc9d5",
        decimals: 18,
      },
    ]

    networks[3].totalValue = (rbtcValue + rifValue).toFixed(2)
  } catch (error) {
    console.error("Error fetching Rootstock assets:", error)
  }
}

// Helper function to ensure each network has at least some assets
function ensureNetworkAssets(networks: NetworkAssets[]) {
  networks.forEach((network, index) => {
    if (!network.assets || network.assets.length === 0) {
      switch (index) {
        case 0: // Ethereum
          network.assets = [
            {
              symbol: "ETH",
              name: "Ethereum",
              balance: "0.00",
              value: "0.00",
              change24h: 0,
              logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=025",
              address: "0x0000000000000000000000000000000000000000",
              decimals: 18,
            },
          ]
          break
        case 1: // Polygon
          network.assets = [
            {
              symbol: "MATIC",
              name: "Polygon",
              balance: "0.00",
              value: "0.00",
              change24h: 0,
              logo: "https://cryptologos.cc/logos/polygon-matic-logo.png?v=025",
              address: "0x0000000000000000000000000000000000000000",
              decimals: 18,
            },
          ]
          break
        case 2: // Celo
          network.assets = [
            {
              symbol: "CELO",
              name: "Celo",
              balance: "0.00",
              value: "0.00",
              change24h: 0,
              logo: "https://cryptologos.cc/logos/celo-celo-logo.png?v=025",
              address: "0x0000000000000000000000000000000000000000",
              decimals: 18,
            },
          ]
          break
        case 3: // Rootstock
          network.assets = [
            {
              symbol: "RBTC",
              name: "Rootstock Bitcoin",
              balance: "0.00",
              value: "0.00",
              change24h: 0,
              logo: "https://cryptologos.cc/logos/rootstock-rsk-logo.png?v=025",
              address: "0x0000000000000000000000000000000000000000",
              decimals: 18,
            },
          ]
          break
      }
    }
  })
}

// Helper function to get fallback networks data
function getFallbackNetworks(): NetworkAssets[] {
  return [
    {
      network: "Ethereum",
      chainId: 1,
      totalValue: "0.00",
      assets: [
        {
          symbol: "ETH",
          name: "Ethereum",
          balance: "0.00",
          value: "0.00",
          change24h: 0,
          logo: "https://cryptologos.cc/logos/ethereum-eth-logo.png?v=025",
          address: "0x0000000000000000000000000000000000000000",
          decimals: 18,
        },
      ],
    },
    {
      network: "Polygon",
      chainId: 137,
      totalValue: "0.00",
      assets: [
        {
          symbol: "MATIC",
          name: "Polygon",
          balance: "0.00",
          value: "0.00",
          change24h: 0,
          logo: "https://cryptologos.cc/logos/polygon-matic-logo.png?v=025",
          address: "0x0000000000000000000000000000000000000000",
          decimals: 18,
        },
      ],
    },
    {
      network: "Celo",
      chainId: 42220,
      totalValue: "0.00",
      assets: [
        {
          symbol: "CELO",
          name: "Celo",
          balance: "0.00",
          value: "0.00",
          change24h: 0,
          logo: "https://cryptologos.cc/logos/celo-celo-logo.png?v=025",
          address: "0x0000000000000000000000000000000000000000",
          decimals: 18,
        },
      ],
    },
    {
      network: "Rootstock",
      chainId: 30,
      totalValue: "0.00",
      assets: [
        {
          symbol: "RBTC",
          name: "Rootstock Bitcoin",
          balance: "0.00",
          value: "0.00",
          change24h: 0,
          logo: "https://cryptologos.cc/logos/rootstock-rsk-logo.png?v=025",
          address: "0x0000000000000000000000000000000000000000",
          decimals: 18,
        },
      ],
    },
  ]
}

export function AssetList({ isVerified }: AssetListProps) {
  const { address, provider, isConnected, ensName } = useWallet()

  const [isLoading, setIsLoading] = useState(true)
  const [assets, setAssets] = useState<NetworkAssets[]>([])
  const [totalValue, setTotalValue] = useState("0.00")
  const [activeTab, setActiveTab] = useState<string | null>(null)

  // Fetch assets from Nodit API
  useEffect(() => {
    const fetchAssets = async () => {
      if (!address) return

      setIsLoading(true)

      try {
        // Get assets with simulated data
        const assetData = await NoditClient.getAssets(address, provider, ensName)
        setAssets(assetData)

        // Set active tab to the first network
        if (assetData.length > 0 && !activeTab) {
          setActiveTab(assetData[0].network.toLowerCase())
        }

        // Calculate total value across all networks
        const totalValueSum = assetData.reduce((sum, network) => {
          return sum + Number.parseFloat(network.totalValue)
        }, 0)

        setTotalValue(totalValueSum.toFixed(2))
      } catch (error) {
        console.error("Error fetching assets:", error)
        toast({
          title: "Using simulated data",
          description: "Displaying demo asset data for this preview",
          variant: "default",
        })

        // Set fallback data
        const fallbackData = getFallbackNetworks()
        setAssets(fallbackData)

        if (fallbackData.length > 0 && !activeTab) {
          setActiveTab(fallbackData[0].network.toLowerCase())
        }
      } finally {
        setIsLoading(false)
      }
    }

    if (isConnected) {
      fetchAssets()
    }
  }, [address, provider, isConnected, ensName, activeTab])

  const refreshAssets = async () => {
    if (!address) return

    setIsLoading(true)

    try {
      // Re-fetch assets with simulated data
      const assetData = await NoditClient.getAssets(address, provider, ensName)
      setAssets(assetData)

      // Calculate total value across all networks
      const totalValueSum = assetData.reduce((sum, network) => {
        return sum + Number.parseFloat(network.totalValue)
      }, 0)

      setTotalValue(totalValueSum.toFixed(2))

      toast({
        title: "Assets Refreshed",
        description: "Your asset data has been updated",
      })
    } catch (error) {
      console.error("Error refreshing assets:", error)
      toast({
        title: "Error refreshing assets",
        description: "Using simulated data for demonstration",
        variant: "default",
      })
    } finally {
      setIsLoading(false)
    }
  }

  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <Card className="border-none shadow-xl overflow-hidden bg-white/80 dark:bg-black/40 backdrop-blur-md relative">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-1/4 h-1/4 bg-gradient-to-tr from-purple-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <CardHeader className="bg-gradient-to-r from-purple-100/80 to-cyan-100/80 dark:from-purple-950/50 dark:to-cyan-950/50 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-cyan-600 font-bold">
                Identifi Cross-Chain Wallet
                <span className="absolute -top-1 -right-6">
                  <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                </span>
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <CardDescription className="text-muted-foreground/80">Simulated Data</CardDescription>
              <Badge
                variant="outline"
                className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30"
              >
                Demo Mode
              </Badge>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshAssets}
            disabled={isLoading}
            className="relative overflow-hidden group rounded-full hover:bg-gradient-to-r hover:from-purple-100 hover:to-cyan-100 dark:hover:from-purple-900/30 dark:hover:to-cyan-900/30 transition-all duration-300"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-500/5 to-cyan-500/5 group-hover:opacity-100 opacity-0 transition-opacity duration-300"></div>
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6 relative z-10">
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div>
                      <Skeleton className="h-4 w-20" />
                      <Skeleton className="h-3 w-16 mt-1" />
                    </div>
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-3 w-12 mt-1" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <Tabs defaultValue={activeTab || assets[0]?.network.toLowerCase()} onValueChange={setActiveTab}>
            <TabsList className="mb-4 w-full justify-start overflow-auto bg-background/50 dark:bg-background/20 p-1 rounded-xl">
              {assets.map((network) => (
                <TabsTrigger
                  key={network.network}
                  value={network.network.toLowerCase()}
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500/10 data-[state=active]:to-cyan-500/10 data-[state=active]:text-purple-700 dark:data-[state=active]:text-purple-300 rounded-lg transition-all duration-300"
                >
                  {network.network}
                </TabsTrigger>
              ))}
            </TabsList>

            {assets.map((network) => (
              <TabsContent key={network.network} value={network.network.toLowerCase()}>
                <div className="space-y-4">
                  {network.assets.map((asset, index) => (
                    <div
                      key={asset.symbol}
                      className="flex items-center justify-between p-4 rounded-xl hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-cyan-50/50 dark:hover:from-purple-900/10 dark:hover:to-cyan-900/10 transition-colors duration-300 transform hover:scale-[1.01] hover:shadow-md border border-transparent hover:border-purple-200/50 dark:hover:border-purple-800/20"
                      style={{
                        animationDelay: `${index * 100}ms`,
                        animation: "fadeInUp 0.5s ease-out forwards",
                      }}
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-100 to-cyan-100 dark:from-purple-900/30 dark:to-cyan-900/30 flex items-center justify-center overflow-hidden p-0.5">
                          <img
                            src={asset.logo || "/placeholder.svg?height=40&width=40"}
                            alt={asset.name}
                            className="h-full w-full object-cover rounded-full"
                          />
                        </div>
                        <div>
                          <div className="font-medium flex items-center gap-2 text-lg">
                            {asset.symbol}
                            <span className="text-sm font-normal text-muted-foreground">{asset.name}</span>
                          </div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            {asset.change24h > 0 ? (
                              <>
                                <ArrowUpRight className="h-3 w-3 text-green-500" />
                                <span className="text-green-500">{asset.change24h.toFixed(2)}%</span>
                              </>
                            ) : (
                              <>
                                <ArrowDownRight className="h-3 w-3 text-red-500" />
                                <span className="text-red-500">{Math.abs(asset.change24h).toFixed(2)}%</span>
                              </>
                            )}
                            <span>24h</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-lg">{asset.balance}</div>
                        <div className="text-sm text-muted-foreground">${asset.value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
      <CardFooter className="flex justify-between p-6 bg-gradient-to-r from-purple-50/80 to-cyan-50/80 dark:from-purple-950/30 dark:to-cyan-950/30 relative z-10">
        <div className="bg-white/50 dark:bg-black/20 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-purple-100/50 dark:border-purple-900/20 w-full">
          <div className="text-sm font-medium text-muted-foreground">Total Balance</div>
          <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-cyan-600">
            ${totalValue}
          </div>
        </div>
      </CardFooter>
    </Card>
  )
}

