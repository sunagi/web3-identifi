"use client"

import { useState } from "react"
import { Wallet, ChevronDown, LogOut, Copy, ExternalLink, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from "@/components/ui/use-toast"
import { Skeleton } from "@/components/ui/skeleton"
import { useWallet } from "@/hooks/use-wallet"

interface WalletConnectProps {
  variant?: "default" | "outline" | "secondary" | "ghost"
  size?: "default" | "sm" | "lg" | "icon"
}

export function WalletConnect({ variant = "outline", size = "sm" }: WalletConnectProps) {
  const { address, ensName, chainId, isConnected, balance, connect, disconnect } = useWallet()
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isConnecting, setIsConnecting] = useState<string | null>(null)

  // Truncate address for display
  const displayAddress = address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : ""

  // Use ENS name if available, otherwise use truncated address
  const displayName = ensName || displayAddress

  // Get chain name
  const getChainName = (chainId: number | null) => {
    if (!chainId) return "Unknown Network"

    switch (chainId) {
      case 1:
        return "Ethereum"
      case 137:
        return "Polygon"
      case 42220:
        return "Celo"
      case 30:
        return "Rootstock"
      default:
        return `Chain ID: ${chainId}`
    }
  }

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      toast({
        description: "Address copied to clipboard",
      })
    }
  }

  const openExplorer = () => {
    if (address && chainId) {
      let explorerUrl = "https://etherscan.io"

      switch (chainId) {
        case 1:
          explorerUrl = "https://etherscan.io"
          break
        case 137:
          explorerUrl = "https://polygonscan.com"
          break
        case 42220:
          explorerUrl = "https://explorer.celo.org"
          break
        case 30:
          explorerUrl = "https://explorer.rootstock.io"
          break
      }

      window.open(`${explorerUrl}/address/${address}`, "_blank")
    }
  }

  // Update the handleConnect function to better handle errors
  const handleConnect = async (type: "metamask" | "walletconnect" | "coinbase") => {
    setIsConnecting(type)
    try {
      await connect(type)
      setIsDialogOpen(false)
    } catch (error) {
      console.error(`Failed to connect with ${type}:`, error)
      toast({
        title: "Connection Failed",
        description: `Could not connect with ${type === "metamask" ? "MetaMask" : type === "walletconnect" ? "WalletConnect" : "Coinbase Wallet"}`,
        variant: "destructive",
      })
    } finally {
      setIsConnecting(null)
    }
  }

  if (isConnected) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant={variant} size={size} className="gap-2 relative overflow-hidden group">
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-500/10 to-cyan-500/10 group-hover:opacity-100 opacity-0 transition-opacity duration-300"></div>
            <Wallet className="h-4 w-4" />
            {displayName}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          <div className="flex flex-col space-y-1 p-2">
            <p className="text-xs font-medium text-muted-foreground">Connected to {getChainName(chainId)}</p>
            <p className="text-sm font-medium">{displayName}</p>
            {ensName && <p className="text-xs text-muted-foreground">{displayAddress}</p>}
            {balance ? (
              <p className="text-xs text-muted-foreground">{Number.parseFloat(balance).toFixed(4)} ETH</p>
            ) : (
              <Skeleton className="h-4 w-24 mt-1" />
            )}
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={copyAddress} className="cursor-pointer">
            <Copy className="mr-2 h-4 w-4" />
            <span>Copy Address</span>
          </DropdownMenuItem>
          <DropdownMenuItem onClick={openExplorer} className="cursor-pointer">
            <ExternalLink className="mr-2 h-4 w-4" />
            <span>View on Explorer</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => disconnect()} className="cursor-pointer">
            <LogOut className="mr-2 h-4 w-4" />
            <span>Disconnect</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger asChild>
          <Button variant={variant} size={size} className="gap-2 relative overflow-hidden group">
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-500/10 to-cyan-500/10 group-hover:opacity-100 opacity-0 transition-opacity duration-300"></div>
            <Wallet className="h-4 w-4" />
            Connect to Identifi
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Connect to Identifi</DialogTitle>
            <DialogDescription>Connect your wallet to access the Identifi dashboard</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4">
            <Button
              variant="outline"
              className="flex items-center justify-between w-full p-4 h-auto relative overflow-hidden group"
              onClick={() => handleConnect("metamask")}
              disabled={isConnecting !== null}
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-orange-500/5 to-amber-500/5 group-hover:opacity-100 opacity-0 transition-opacity duration-300"></div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-orange-400 to-amber-600 flex items-center justify-center">
                  <img src="/placeholder.svg?height=24&width=24" alt="MetaMask" className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <div className="font-medium">MetaMask</div>
                  <div className="text-xs text-muted-foreground">Connect using browser wallet</div>
                </div>
              </div>
              {isConnecting === "metamask" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronDown className="h-4 w-4 opacity-50" />
              )}
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-between w-full p-4 h-auto relative overflow-hidden group"
              onClick={() => handleConnect("walletconnect")}
              disabled={isConnecting !== null}
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500/5 to-blue-600/5 group-hover:opacity-100 opacity-0 transition-opacity duration-300"></div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-400 to-blue-600 flex items-center justify-center">
                  <img src="/placeholder.svg?height=24&width=24" alt="WalletConnect" className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <div className="font-medium">WalletConnect</div>
                  <div className="text-xs text-muted-foreground">Connect using WalletConnect</div>
                </div>
              </div>
              {isConnecting === "walletconnect" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronDown className="h-4 w-4 opacity-50" />
              )}
            </Button>

            <Button
              variant="outline"
              className="flex items-center justify-between w-full p-4 h-auto relative overflow-hidden group"
              onClick={() => handleConnect("coinbase")}
              disabled={isConnecting !== null}
            >
              <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-blue-500/5 to-blue-700/5 group-hover:opacity-100 opacity-0 transition-opacity duration-300"></div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-700 flex items-center justify-center">
                  <img src="/placeholder.svg?height=24&width=24" alt="Coinbase Wallet" className="h-6 w-6" />
                </div>
                <div className="text-left">
                  <div className="font-medium">Coinbase Wallet</div>
                  <div className="text-xs text-muted-foreground">Connect using Coinbase Wallet</div>
                </div>
              </div>
              {isConnecting === "coinbase" ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <ChevronDown className="h-4 w-4 opacity-50" />
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}

