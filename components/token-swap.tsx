"use client"

import { useState, useEffect, useCallback } from "react"
import { ArrowLeftRight, ChevronDown, ExternalLink, AlertCircle, Loader2, Zap, Sparkles } from "lucide-react"
import * as ethers from "ethers"
import { debounce } from "lodash"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { toast } from "@/components/ui/use-toast"
import { useWallet } from "@/hooks/use-wallet"
import { sendHyperlaneMessage } from "@/lib/hyperlane"

interface TokenSwapProps {
  isVerified: boolean
  className?: string
}

interface Token {
  symbol: string
  name: string
  address: string
  decimals: number
  chainId: number
  logoURI: string
}

interface SwapQuote {
  fromTokenAmount: string
  toTokenAmount: string
  estimatedGas: string
  protocols: any[]
  route: any[]
}

// Local token list to use when API fails
const LOCAL_TOKENS: Token[] = [
  {
    symbol: "ETH",
    name: "Ethereum",
    address: "0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE",
    decimals: 18,
    chainId: 1,
    logoURI: "https://tokens.1inch.io/0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee.png",
  },
  {
    symbol: "USDC",
    name: "USD Coin",
    address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    decimals: 6,
    chainId: 1,
    logoURI: "https://tokens.1inch.io/0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48.png",
  },
  {
    symbol: "USDT",
    name: "Tether USD",
    address: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
    decimals: 6,
    chainId: 1,
    logoURI: "https://tokens.1inch.io/0xdac17f958d2ee523a2206206994597c13d831ec7.png",
  },
  {
    symbol: "DAI",
    name: "Dai Stablecoin",
    address: "0x6B175474E89094C44Da98b954EedeAC495271d0F",
    decimals: 18,
    chainId: 1,
    logoURI: "https://tokens.1inch.io/0x6b175474e89094c44da98b954eedeac495271d0f.png",
  },
  {
    symbol: "WBTC",
    name: "Wrapped BTC",
    address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599",
    decimals: 8,
    chainId: 1,
    logoURI: "https://tokens.1inch.io/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png",
  },
  {
    symbol: "LINK",
    name: "ChainLink Token",
    address: "0x514910771AF9Ca656af840dff83E8264EcF986CA",
    decimals: 18,
    chainId: 1,
    logoURI: "https://tokens.1inch.io/0x514910771af9ca656af840dff83e8264ecf986ca.png",
  },
  {
    symbol: "UNI",
    name: "Uniswap",
    address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    decimals: 18,
    chainId: 1,
    logoURI: "https://tokens.1inch.io/0x1f9840a85d5af5bf1d1762f925bdaddc4201f984.png",
  },
  {
    symbol: "AAVE",
    name: "Aave Token",
    address: "0x7Fc66500c84A76Ad7e9c93437bFc5Ac33E2DDaE9",
    decimals: 18,
    chainId: 1,
    logoURI: "https://tokens.1inch.io/0x7fc66500c84a76ad7e9c93437bfc5ac33e2ddae9.png",
  },
  {
    symbol: "MATIC",
    name: "Polygon",
    address: "0x7D1AfA7B718fb893dB30A3aBc0Cfc608AaCfeBB0",
    decimals: 18,
    chainId: 1,
    logoURI: "https://tokens.1inch.io/0x7d1afa7b718fb893db30a3abc0cfc608aacfebb0.png",
  },
  {
    symbol: "SHIB",
    name: "Shiba Inu",
    address: "0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE",
    decimals: 18,
    chainId: 1,
    logoURI: "https://tokens.1inch.io/0x95ad61b0a150d79219dcf64e1e6cc01f0b64c4ce.png",
  },
  {
    symbol: "RBTC",
    name: "Rootstock Bitcoin",
    address: "0x542fDA317318eBF1d3DEAf76E0b632741A7e677d", // RSK address
    decimals: 18,
    chainId: 30,
    logoURI: "https://tokens.1inch.io/0x2260fac5e5542a773aa44fbcfedf7c193bc2c599.png", // Using WBTC logo as placeholder
  },
  {
    symbol: "RIF",
    name: "RSK Infrastructure Framework",
    address: "0x2acc95758f8b5f583470ba265eb685a8f45fc9d5", // RSK address
    decimals: 18,
    chainId: 30,
    logoURI: "https://cryptologos.cc/logos/rif-token-rif-logo.png",
  },
]

// ERC20 ABI for token interactions
const ERC20_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function balanceOf(address) view returns (uint)",
  "function allowance(address owner, address spender) view returns (uint)",
  "function approve(address spender, uint amount) returns (bool)",
  "function transfer(address to, uint amount) returns (bool)",
]

// Helper function to format units safely
const formatUnits = (value: any, decimals: number): string => {
  try {
    // Try ethers v6 format
    if (typeof ethers.formatUnits === "function") {
      return ethers.formatUnits(value, decimals)
    }
    // Fall back to ethers v5 format
    if (ethers.utils && typeof ethers.utils.formatUnits === "function") {
      return ethers.utils.formatUnits(value, decimals)
    }
    // Manual fallback
    return (Number(value) / Math.pow(10, decimals)).toString()
  } catch (error) {
    console.error("Error formatting units:", error)
    return "0"
  }
}

// Helper function to format ether safely
const formatEther = (value: any): string => {
  try {
    // Try ethers v6 format
    if (typeof ethers.formatEther === "function") {
      return ethers.formatEther(value)
    }
    // Fall back to ethers v5 format
    if (ethers.utils && typeof ethers.utils.formatEther === "function") {
      return ethers.utils.formatEther(value)
    }
    // Manual fallback
    return (Number(value) / 1e18).toString()
  } catch (error) {
    console.error("Error formatting ether:", error)
    return "0"
  }
}

// Helper function to parse units safely
const parseUnits = (value: string, decimals: number): any => {
  try {
    // Try ethers v6 format
    if (typeof ethers.parseUnits === "function") {
      return ethers.parseUnits(value, decimals)
    }
    // Fall back to ethers v5 format
    if (ethers.utils && typeof ethers.utils.parseUnits === "function") {
      return ethers.utils.parseUnits(value, decimals)
    }
    // Manual fallback
    return (Number(value) * Math.pow(10, decimals)).toString()
  } catch (error) {
    console.error("Error parsing units:", error)
    return "0"
  }
}

// Helper function to parse ether safely
const parseEther = (value: string): any => {
  try {
    // Try ethers v6 format
    if (typeof ethers.parseEther === "function") {
      return ethers.parseEther(value)
    }
    // Fall back to ethers v5 format
    if (ethers.utils && typeof ethers.utils.parseEther === "function") {
      return ethers.utils.parseEther(value)
    }
    // Manual fallback
    return (Number(value) * 1e18).toString()
  } catch (error) {
    console.error("Error parsing ether:", error)
    return "0"
  }
}

export function TokenSwap({ isVerified, className }: TokenSwapProps) {
  const { address, provider, signer, chainId, ensName } = useWallet()

  const [isLoading, setIsLoading] = useState(false)
  const [tokens, setTokens] = useState<Token[]>([])
  const [fromAmount, setFromAmount] = useState("")
  const [toAmount, setToAmount] = useState("")
  const [selectedFromToken, setSelectedFromToken] = useState<Token | null>(null)
  const [selectedToToken, setSelectedToToken] = useState<Token | null>(null)
  const [rate, setRate] = useState<string | null>(null)
  const [fee, setFee] = useState<string | null>("0.1%")
  const [swapQuote, setSwapQuote] = useState<SwapQuote | null>(null)
  const [isSwapping, setIsSwapping] = useState(false)
  const [isApproving, setIsApproving] = useState(false)
  const [fromBalance, setFromBalance] = useState<string | null>(null)
  const [toBalance, setToBalance] = useState<string | null>(null)
  const [isLoadingFromBalance, setIsLoadingFromBalance] = useState(false)
  const [isLoadingToBalance, setIsLoadingToBalance] = useState(false)
  const [useFusionPlus, setUseFusionPlus] = useState(true) // Default to Fusion+
  const [retryCount, setRetryCount] = useState(0)
  const [isUsingLocalTokens, setIsUsingLocalTokens] = useState(true)

  // Initialize with local tokens immediately to avoid empty state
  useEffect(() => {
    // Set default tokens from local list immediately
    const defaultFromToken = LOCAL_TOKENS.find((token) => token.symbol === "ETH")
    const defaultToToken = LOCAL_TOKENS.find((token) => token.symbol === "USDC")

    setTokens(LOCAL_TOKENS)
    setIsUsingLocalTokens(true)

    if (defaultFromToken) setSelectedFromToken(defaultFromToken)
    if (defaultToToken) setSelectedToToken(defaultToToken)

    setIsLoading(false)
  }, [])

  // Fetch token balances from on-chain data
  useEffect(() => {
    const fetchBalances = async () => {
      if (!provider || !address || !selectedFromToken || !selectedToToken) return

      // Fetch "from" token balance
      setIsLoadingFromBalance(true)
      try {
        if (selectedFromToken.symbol === "ETH") {
          try {
            const balance = await provider.getBalance(address)
            setFromBalance(formatEther(balance))
          } catch (error) {
            console.error("Error fetching ETH balance:", error)
            setFromBalance("0")
          }
        } else {
          try {
            // Create contract instance
            const contract = new ethers.Contract(selectedFromToken.address, ERC20_ABI, provider)

            // Get token balance
            const balance = await contract.balanceOf(address)
            setFromBalance(formatUnits(balance, selectedFromToken.decimals))
          } catch (error) {
            console.error(`Error fetching ${selectedFromToken.symbol} balance:`, error)
            setFromBalance("0")
          }
        }
      } catch (error) {
        console.error("Error fetching from token balance:", error)
        setFromBalance("0")
      } finally {
        setIsLoadingFromBalance(false)
      }

      // Fetch "to" token balance
      setIsLoadingToBalance(true)
      try {
        if (selectedToToken.symbol === "ETH") {
          try {
            const balance = await provider.getBalance(address)
            setToBalance(formatEther(balance))
          } catch (error) {
            console.error("Error fetching ETH balance:", error)
            setToBalance("0")
          }
        } else {
          try {
            // Create contract instance
            const contract = new ethers.Contract(selectedToToken.address, ERC20_ABI, provider)

            // Get token balance
            const balance = await contract.balanceOf(address)
            setToBalance(formatUnits(balance, selectedToToken.decimals))
          } catch (error) {
            console.error(`Error fetching ${selectedToToken.symbol} balance:`, error)
            setToBalance("0")
          }
        }
      } catch (error) {
        console.error("Error fetching to token balance:", error)
        setToBalance("0")
      } finally {
        setIsLoadingToBalance(false)
      }
    }

    const isConnected = !!provider && !!signer && !!address
    if (isConnected) {
      fetchBalances()
    }
  }, [provider, address, selectedFromToken, selectedToToken, signer])

  // Simulate a swap quote with realistic rates from Nodit
  const simulateSwapQuote = (fromToken: Token, toToken: Token, amount: string): SwapQuote => {
    // Generate a realistic exchange rate based on token symbols
    let rate = 1

    if (fromToken.symbol === "ETH" && toToken.symbol === "USDC") {
      rate = 1800 + (Math.random() * 200 - 100) // ETH to USDC around $1800
    } else if (fromToken.symbol === "USDC" && toToken.symbol === "ETH") {
      rate = 1 / (1800 + (Math.random() * 200 - 100)) // USDC to ETH
    } else if (fromToken.symbol === "ETH" && toToken.symbol === "WBTC") {
      rate = 0.06 + (Math.random() * 0.01 - 0.005) // ETH to WBTC
    } else if (fromToken.symbol === "WBTC" && toToken.symbol === "ETH") {
      rate = 16 + (Math.random() * 2 - 1) // WBTC to ETH
    } else if (["USDC", "USDT", "DAI"].includes(fromToken.symbol) && ["USDC", "USDT", "DAI"].includes(toToken.symbol)) {
      rate = 0.98 + Math.random() * 0.04 // Stablecoin to stablecoin
    } else if (fromToken.symbol === "ETH" && toToken.symbol === "RBTC") {
      rate = 1.01 + (Math.random() * 0.02 - 0.01) // ETH to RBTC close to 1:1
    } else if (fromToken.symbol === "RBTC" && toToken.symbol === "ETH") {
      rate = 0.99 + (Math.random() * 0.02 - 0.01) // RBTC to ETH close to 1:1
    } else if (fromToken.symbol === "RBTC" && toToken.symbol === "RIF") {
      rate = 10000 + (Math.random() * 1000 - 500) // RBTC to RIF
    } else if (fromToken.symbol === "RIF" && toToken.symbol === "RBTC") {
      rate = 1 / (10000 + (Math.random() * 1000 - 500)) // RIF to RBTC
    } else {
      // Random rate for other pairs
      rate = 0.1 + Math.random() * 10
    }

    const fromAmount = Number.parseFloat(amount)
    const toAmount = fromAmount * rate

    return {
      fromTokenAmount: parseUnits(amount, fromToken.decimals).toString(),
      toTokenAmount: parseUnits(toAmount.toFixed(6), toToken.decimals).toString(),
      estimatedGas: (100000 + Math.floor(Math.random() * 50000)).toString(),
      protocols: [[[{ name: useFusionPlus ? "Fusion+" : "Uniswap V3" }]]],
      route: [],
    }
  }

  // Get quote when amounts or tokens change
  const getQuote = useCallback(async () => {
    if (!selectedFromToken || !selectedToToken || !fromAmount || Number.parseFloat(fromAmount) === 0) {
      setToAmount("")
      setRate(null)
      setSwapQuote(null)
      return
    }

    try {
      // Use the simulated quote directly
      const quote = simulateSwapQuote(selectedFromToken, selectedToToken, fromAmount)
      setSwapQuote(quote)

      // Calculate and display the estimated amount
      const estimatedAmount = formatUnits(quote.toTokenAmount, selectedToToken.decimals)
      setToAmount(Number.parseFloat(estimatedAmount).toFixed(6))

      // Calculate and display the rate
      const oneTokenQuote = simulateSwapQuote(selectedFromToken, selectedToToken, "1")
      const oneTokenRate = formatUnits(oneTokenQuote.toTokenAmount, selectedToToken.decimals)
      setRate(Number.parseFloat(oneTokenRate).toFixed(6))

      // Update fee based on whether Fusion+ is used
      setFee(useFusionPlus ? "0.05%" : "0.1%")
    } catch (error) {
      console.error("Error getting quote:", error)
      toast({
        title: "Using estimated values",
        description: "Using simulated values for demonstration",
        variant: "default",
      })
    }
  }, [selectedFromToken, selectedToToken, fromAmount, useFusionPlus])

  // Debounced quote fetching
  const debouncedGetQuote = useCallback(
    debounce(() => {
      if (isVerified) {
        getQuote()
      }
    }, 500),
    [getQuote, isVerified],
  )

  useEffect(() => {
    debouncedGetQuote()
    return () => debouncedGetQuote.cancel()
  }, [debouncedGetQuote])

  // Check token allowance
  const checkAllowance = async () => {
    if (!selectedFromToken || !selectedToToken || !address || !provider || selectedFromToken.symbol === "ETH") {
      return true // ETH doesn't need approval
    }

    try {
      // Create contract instance
      const contract = new ethers.Contract(selectedFromToken.address, ERC20_ABI, provider)

      // Check allowance
      const spender = "0x1111111254fb6c44bAC0beD2854e76F90643097d" // 1inch router
      const allowance = await contract.allowance(address, spender)
      const amount = parseUnits(fromAmount, selectedFromToken.decimals)

      return allowance.gte(amount)
    } catch (error) {
      console.error("Error checking allowance:", error)
      return false
    }
  }

  // Approve token
  const approveToken = async () => {
    if (!selectedFromToken || !signer) return false

    setIsApproving(true)

    try {
      // Create contract instance
      const contract = new ethers.Contract(selectedFromToken.address, ERC20_ABI, signer)

      // Approve 1inch router
      const spender = "0x1111111254fb6c44bAC0beD2854e76F90643097d" // 1inch router
      const amount =
        ethers.MaxUint256 || "115792089237316195423570985008687907853269984665640564039457584007913129639935"

      const tx = await contract.approve(spender, amount)
      await tx.wait()

      toast({
        title: "Approval Successful",
        description: `Successfully approved ${selectedFromToken.symbol}`,
        variant: "success",
      })
      return true
    } catch (error) {
      console.error("Approval error:", error)
      toast({
        title: "Approval Failed",
        description: "There was an error approving the token",
        variant: "destructive",
      })
      return false
    } finally {
      setIsApproving(false)
    }
  }

  // Handle token swap with 1inch Fusion+
  const handleSwap = async () => {
    if (!isVerified || !selectedFromToken || !selectedToToken || !fromAmount || !signer || !address) return

    setIsSwapping(true)

    try {
      // Check if token needs approval
      if (selectedFromToken.symbol !== "ETH") {
        const hasAllowance = await checkAllowance()

        if (!hasAllowance) {
          const approved = await approveToken()
          if (!approved) {
            throw new Error("Token approval failed")
          }
        }
      }

      // Simulate successful swap for demo purposes
      await new Promise((resolve) => setTimeout(resolve, 2000))

      // Send Hyperlane message about verified wallet swap
      if (isVerified) {
        try {
          await sendHyperlaneMessage({
            fromChain: chainId || 1,
            toChain: selectedToToken.chainId === 30 ? 30 : 137, // Send to Rootstock or Polygon
            message: {
              type: "VERIFIED_SWAP",
              fromToken: selectedFromToken.symbol,
              toToken: selectedToToken.symbol,
              amount: fromAmount,
              receivedAmount: toAmount,
              timestamp: Date.now(),
              address,
              ensName: ensName || undefined,
              service: "Identifi",
            },
          })

          console.log("Sent Hyperlane notification about verified Identifi swap")
        } catch (hyperlaneError) {
          console.error("Failed to send Hyperlane message:", hyperlaneError)
        }
      }

      toast({
        title: "Swap Successful",
        description: `Swapped ${fromAmount} ${selectedFromToken.symbol} for ${toAmount} ${selectedToToken.symbol}`,
        variant: "success",
      })

      // Reset form
      setFromAmount("")
      setToAmount("")
    } catch (error) {
      console.error("Swap error:", error)
      toast({
        title: "Swap Failed",
        description: "There was an error executing the swap",
        variant: "destructive",
      })
    } finally {
      setIsSwapping(false)
    }
  }

  // Handle token switch
  const handleSwitchTokens = () => {
    if (selectedFromToken && selectedToToken) {
      const tempToken = selectedFromToken
      setSelectedFromToken(selectedToToken)
      setSelectedToToken(tempToken)

      // Also switch amounts if they exist
      if (fromAmount && toAmount) {
        setFromAmount(toAmount)
        setToAmount(fromAmount)
      }
    }
  }

  return (
    <Card
      className={`border-none shadow-xl overflow-hidden bg-white/80 dark:bg-black/40 backdrop-blur-md relative ${className}`}
    >
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-1/3 h-1/3 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-1/4 h-1/4 bg-gradient-to-tr from-purple-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <CardHeader className="bg-gradient-to-r from-purple-100/80 to-cyan-100/80 dark:from-purple-950/50 dark:to-cyan-950/50 relative z-10">
        <CardTitle className="flex items-center gap-2">
          <ArrowLeftRight className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-cyan-600 font-bold">
            Identifi Token Swap
            <span className="absolute -top-1 -right-6">
              <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
            </span>
          </span>
        </CardTitle>
        <CardDescription className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground/80">Simulated Swap Demo</span>
            <Badge
              variant="outline"
              className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/20 dark:text-blue-400 dark:border-blue-900/30"
            >
              Demo Mode
            </Badge>
            {!isVerified && (
              <Badge
                variant="outline"
                className="ml-2 bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950/20 dark:text-yellow-400 dark:border-yellow-900/30"
              >
                Verification Required
              </Badge>
            )}
          </div>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 relative z-10">
        <div className="flex flex-col gap-6">
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm text-muted-foreground">Swap Mode</div>
            <Button
              variant={useFusionPlus ? "default" : "outline"}
              size="sm"
              className={`flex items-center gap-1 transition-all duration-300 ${useFusionPlus ? "bg-gradient-to-r from-purple-600 to-cyan-600 hover:shadow-md hover:shadow-purple-500/20" : "hover:bg-gradient-to-r hover:from-purple-100 hover:to-cyan-100 dark:hover:from-purple-900/30 dark:hover:to-cyan-900/30"}`}
              onClick={() => setUseFusionPlus(!useFusionPlus)}
            >
              {useFusionPlus && <Zap className="h-3.5 w-3.5 animate-pulse" />}
              Fusion+
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">From</label>
              <div className="flex items-center gap-2 p-4 border rounded-xl bg-background/50 dark:bg-background/10 hover:border-purple-200 dark:hover:border-purple-800/30 transition-colors duration-200 hover:shadow-md hover:shadow-purple-500/10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 relative overflow-hidden group rounded-lg"
                      disabled={!isVerified || isLoading}
                    >
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-500/5 to-cyan-500/5 group-hover:opacity-100 opacity-0 transition-opacity duration-300"></div>
                      {selectedFromToken ? (
                        <>
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-100 to-cyan-100 dark:from-purple-900/30 dark:to-cyan-900/30 flex items-center justify-center p-0.5">
                            <img
                              src={selectedFromToken.logoURI || "/placeholder.svg?height=20&width=20"}
                              alt={selectedFromToken.name}
                              className="h-full w-full rounded-full"
                            />
                          </div>
                          {selectedFromToken.symbol}
                        </>
                      ) : isLoading ? (
                        <Skeleton className="h-5 w-16" />
                      ) : (
                        "Select Token"
                      )}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="max-h-[300px] overflow-auto bg-white/80 dark:bg-black/80 backdrop-blur-md border border-purple-100/50 dark:border-purple-900/20">
                    {tokens.map((token) => (
                      <DropdownMenuItem
                        key={token.address}
                        onClick={() => setSelectedFromToken(token)}
                        className="flex items-center gap-2 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-cyan-50/50 dark:hover:from-purple-900/10 dark:hover:to-cyan-900/10"
                      >
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-100 to-cyan-100 dark:from-purple-900/30 dark:to-cyan-900/30 flex items-center justify-center p-0.5">
                          <img
                            src={token.logoURI || "/placeholder.svg?height=20&width=20"}
                            alt={token.name}
                            className="h-full w-full rounded-full"
                          />
                        </div>
                        <span>{token.symbol}</span>
                        <span className="text-xs text-muted-foreground ml-1">{token.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex-1">
                  <Input
                    type="text"
                    className="text-right border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-lg font-medium"
                    placeholder="0.0"
                    value={fromAmount}
                    onChange={(e) => setFromAmount(e.target.value)}
                    disabled={!isVerified || !selectedFromToken}
                  />
                  <div className="text-right text-sm text-muted-foreground">
                    {isLoadingFromBalance ? (
                      <Skeleton className="h-4 w-24 ml-auto" />
                    ) : (
                      fromBalance &&
                      selectedFromToken && (
                        <>
                          Balance: {Number.parseFloat(fromBalance).toFixed(6)} {selectedFromToken.symbol}
                        </>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium">To</label>
              <div className="flex items-center gap-2 p-4 border rounded-xl bg-background/50 dark:bg-background/10 hover:border-cyan-200 dark:hover:border-cyan-800/30 transition-colors duration-200 hover:shadow-md hover:shadow-cyan-500/10">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 relative overflow-hidden group rounded-lg"
                      disabled={!isVerified || isLoading}
                    >
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-500/5 to-cyan-500/5 group-hover:opacity-100 opacity-0 transition-opacity duration-300"></div>
                      {selectedToToken ? (
                        <>
                          <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-100 to-cyan-100 dark:from-purple-900/30 dark:to-cyan-900/30 flex items-center justify-center p-0.5">
                            <img
                              src={selectedToToken.logoURI || "/placeholder.svg?height=20&width=20"}
                              alt={selectedToToken.name}
                              className="h-full w-full rounded-full"
                            />
                          </div>
                          {selectedToToken.symbol}
                        </>
                      ) : isLoading ? (
                        <Skeleton className="h-5 w-16" />
                      ) : (
                        "Select Token"
                      )}
                      <ChevronDown className="h-4 w-4 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="max-h-[300px] overflow-auto bg-white/80 dark:bg-black/80 backdrop-blur-md border border-cyan-100/50 dark:border-cyan-900/20">
                    {tokens.map((token) => (
                      <DropdownMenuItem
                        key={token.address}
                        onClick={() => setSelectedToToken(token)}
                        className="flex items-center gap-2 hover:bg-gradient-to-r hover:from-purple-50/50 hover:to-cyan-50/50 dark:hover:from-purple-900/10 dark:hover:to-cyan-900/10"
                      >
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-purple-100 to-cyan-100 dark:from-purple-900/30 dark:to-cyan-900/30 flex items-center justify-center p-0.5">
                          <img
                            src={token.logoURI || "/placeholder.svg?height=20&width=20"}
                            alt={token.name}
                            className="h-full w-full rounded-full"
                          />
                        </div>
                        <span>{token.symbol}</span>
                        <span className="text-xs text-muted-foreground ml-1">{token.name}</span>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <div className="flex-1">
                  <Input
                    type="text"
                    className="text-right border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-lg font-medium"
                    placeholder="0.0"
                    value={toAmount}
                    readOnly
                    disabled={!isVerified || !selectedToToken}
                  />
                  <div className="text-right text-sm text-muted-foreground">
                    {isLoadingToBalance ? (
                      <Skeleton className="h-4 w-24 ml-auto" />
                    ) : (
                      toBalance &&
                      selectedToToken && (
                        <>
                          Balance: {Number.parseFloat(toBalance).toFixed(6)} {selectedToToken.symbol}
                        </>
                      )
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex justify-center">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full bg-gradient-to-r from-purple-100/50 to-cyan-100/50 dark:from-purple-900/20 dark:to-cyan-900/20 hover:shadow-md hover:shadow-purple-500/20 transition-all duration-300 hover:scale-110"
              onClick={handleSwitchTokens}
              disabled={!isVerified || !selectedFromToken || !selectedToToken}
            >
              <ArrowLeftRight className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </Button>
          </div>

          {isVerified && selectedFromToken && selectedToToken && (
            <div className="bg-gradient-to-r from-purple-50/50 to-cyan-50/50 dark:from-purple-900/10 dark:to-cyan-900/10 p-4 rounded-xl border border-purple-100/50 dark:border-purple-900/20 hover:shadow-md hover:shadow-purple-500/10 transition-all duration-300">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rate</span>
                <span className="font-medium">
                  {rate ? (
                    `1 ${selectedFromToken.symbol} = ${rate} ${selectedToToken.symbol}`
                  ) : (
                    <Skeleton className="h-4 w-24 inline-block" />
                  )}
                </span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted-foreground">Fee</span>
                <span className="font-medium">{fee || <Skeleton className="h-4 w-12 inline-block" />}</span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-muted-foreground">Route</span>
                <span className="flex items-center gap-1">
                  {swapQuote ? (
                    <>
                      {useFusionPlus ? (
                        <span className="text-xs bg-gradient-to-r from-purple-100 to-cyan-100 dark:from-purple-900/30 dark:to-cyan-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          Fusion+
                        </span>
                      ) : (
                        swapQuote.protocols &&
                        swapQuote.protocols[0] &&
                        swapQuote.protocols[0][0] &&
                        swapQuote.protocols[0][0].map((p: any, i: number) => (
                          <span
                            key={i}
                            className="text-xs bg-gradient-to-r from-purple-100 to-cyan-100 dark:from-purple-900/30 dark:to-cyan-900/30 text-purple-800 dark:text-purple-300 px-2 py-1 rounded-full"
                          >
                            {p.name}
                          </span>
                        ))
                      )}
                    </>
                  ) : (
                    <Skeleton className="h-4 w-16 inline-block" />
                  )}
                  <ExternalLink className="h-3 w-3 cursor-pointer ml-1 text-muted-foreground hover:text-foreground transition-colors" />
                </span>
              </div>
            </div>
          )}

          {!isVerified && (
            <Alert
              variant="warning"
              className="bg-gradient-to-r from-yellow-50 to-amber-50 text-yellow-800 border-yellow-200 dark:from-yellow-950/20 dark:to-amber-950/20 dark:text-yellow-400 dark:border-yellow-900/30 rounded-xl"
            >
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Verification Required</AlertTitle>
              <AlertDescription>
                Please verify your identity with Identifi to access token swap functionality.
              </AlertDescription>
            </Alert>
          )}

          <Button
            className="w-full bg-gradient-to-r from-purple-600 to-cyan-600 hover:from-purple-700 hover:to-cyan-700 transition-all duration-300 relative overflow-hidden group rounded-xl h-14 shadow-lg hover:shadow-xl hover:shadow-purple-500/20"
            size="lg"
            disabled={!isVerified || !selectedFromToken || !selectedToToken || !fromAmount || isSwapping || isApproving}
            onClick={handleSwap}
          >
            <div className="absolute inset-0 w-full h-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            {isApproving ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Approving {selectedFromToken?.symbol}...
              </>
            ) : isSwapping ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Swapping...
              </>
            ) : isVerified ? (
              useFusionPlus ? (
                <>
                  <Zap className="mr-2 h-5 w-5 animate-pulse" />
                  Swap with Fusion+
                </>
              ) : (
                "Swap Tokens"
              )
            ) : (
              "Verification Required"
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

