"use client"

import { useEffect, useState } from "react"
import { Check, Globe, Lock, Shield, Wallet, Sparkles } from "lucide-react"
import { SelfID } from "@self.id/web"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/components/ui/use-toast"
import { Toaster } from "@/components/ui/toaster"
import { useWallet } from "@/hooks/use-wallet"
import { WalletConnect } from "@/components/wallet-connect"
import { AssetList } from "@/components/asset-list"
import { TokenSwap } from "@/components/token-swap"
import { CrossChainMessages } from "@/components/cross-chain-messages"

export default function Dashboard() {
  // Add a state to check if MetaMask is installed
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(true)

  // Check if MetaMask is installed
  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsMetaMaskInstalled(!!window.ethereum)
    }
  }, [])

  const { address, isConnected, chainId, ensName } = useWallet()

  const [isVerifiedSelf, setIsVerifiedSelf] = useState(false)
  const [isVerifiedWorldID, setIsVerifiedWorldID] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const isVerified = isVerifiedSelf || isVerifiedWorldID

  // Handle Self Protocol verification
  const handleSelfVerify = async () => {
    setIsLoading(true)
    try {
      // Actual Self Protocol integration
      const selfConnection = await SelfID.connect({
        authProvider: "metamask",
        ceramic: "testnet-clay",
        connectNetwork: "testnet-clay",
        address: address,
      })

      if (selfConnection) {
        const selfID = await selfConnection.get("basicProfile")

        // Store the DID for future use
        localStorage.setItem("selfDID", selfConnection.did.id)

        setIsVerifiedSelf(true)
        toast({
          title: "Verification Successful",
          description: "You've been verified with Self Protocol",
          variant: "success",
        })
      }
    } catch (error) {
      console.error("Self Protocol verification error:", error)
      toast({
        title: "Verification Failed",
        description: "There was an error verifying with Self Protocol",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Handle World ID verification (mock)
  const handleWorldIDVerify = () => {
    setIsLoading(true)

    // Simulate verification process
    setTimeout(() => {
      setIsVerifiedWorldID(true)
      setIsLoading(false)
      toast({
        title: "Verification Successful",
        description: "You've been verified with World ID",
        variant: "success",
      })
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-purple-50/30 to-cyan-50/30 dark:from-black dark:via-purple-950/5 dark:to-cyan-950/5">
      {/* Decorative elements */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-1/3 h-1/3 bg-gradient-to-tr from-purple-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-gradient-to-r from-purple-500/5 to-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      <Toaster />
      <div className="container mx-auto py-6 max-w-6xl relative z-10">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/80 dark:bg-black/40 backdrop-blur-md p-4 rounded-xl shadow-md border border-purple-100/50 dark:border-purple-900/20">
            <div>
              <h1 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-cyan-600 flex items-center gap-2">
                Identifi
                <Sparkles className="h-6 w-6 text-amber-500 animate-pulse" />
              </h1>
              <p className="text-muted-foreground">Secure identity verification and token swaps</p>
            </div>
            <div className="flex items-center gap-2">
              {isVerified && (
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200 flex items-center gap-1 px-3 py-1.5 dark:from-green-950/20 dark:to-emerald-950/20 dark:text-green-400 dark:border-green-900/30"
                  >
                    <Check className="h-3 w-3" />
                    Verified
                  </Badge>
                  <Badge
                    variant="outline"
                    className="bg-gradient-to-r from-blue-50 to-cyan-50 text-blue-700 border-blue-200 flex items-center gap-1 px-3 py-1.5 dark:from-blue-950/20 dark:to-cyan-950/20 dark:text-blue-400 dark:border-blue-900/30"
                  >
                    <Shield className="h-3 w-3" />
                    Trustworthy
                  </Badge>
                </div>
              )}

              <WalletConnect />
            </div>
          </div>

          {isConnected && !isVerified && (
            <Card className="overflow-hidden border-none shadow-xl bg-gradient-to-r from-purple-50/80 to-cyan-50/80 dark:from-purple-950/30 dark:to-cyan-950/30 backdrop-blur-md">
              <CardHeader className="pb-2">
                <CardTitle className="text-xl text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-cyan-600">
                  Verify Your Identity with Identifi
                </CardTitle>
                <CardDescription>
                  Verification is required to perform token swaps and access all features
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-2 border-dashed bg-white/80 dark:bg-black/40 backdrop-blur-sm hover:border-purple-300 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 dark:hover:border-purple-800/50 group">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="p-2 rounded-full bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900/30 dark:to-indigo-900/30 group-hover:from-purple-200 group-hover:to-indigo-200 dark:group-hover:from-purple-900/50 dark:group-hover:to-indigo-900/50 transition-colors duration-300">
                          <Lock className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        Self Protocol
                      </CardTitle>
                      <CardDescription>Verify with zkPassport</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Securely verify your identity without revealing personal information using zero-knowledge
                        proofs.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 hover:shadow-md hover:shadow-purple-500/20 transition-all duration-300"
                        onClick={handleSelfVerify}
                        disabled={isLoading}
                      >
                        {isLoading ? "Verifying..." : "Verify with zkPassport"}
                      </Button>
                    </CardFooter>
                  </Card>

                  <Card className="border-2 border-dashed bg-white/80 dark:bg-black/40 backdrop-blur-sm hover:border-cyan-300 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/20 dark:hover:border-cyan-800/50 group">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <div className="p-2 rounded-full bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/30 dark:to-blue-900/30 group-hover:from-cyan-200 group-hover:to-blue-200 dark:group-hover:from-cyan-900/50 dark:group-hover:to-blue-900/50 transition-colors duration-300">
                          <Globe className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        World ID
                      </CardTitle>
                      <CardDescription>Verify with Worldcoin</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-4">
                        Prove your humanity and uniqueness with World ID, powered by Worldcoin.
                      </p>
                    </CardContent>
                    <CardFooter>
                      <Button
                        className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 hover:shadow-md hover:shadow-cyan-500/20 transition-all duration-300"
                        onClick={handleWorldIDVerify}
                        disabled={isLoading}
                      >
                        {isLoading ? "Verifying..." : "Verify with World ID"}
                      </Button>
                    </CardFooter>
                  </Card>
                </div>
              </CardContent>
            </Card>
          )}

          {isConnected && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <TokenSwap isVerified={isVerified} className="lg:col-span-2" />

              <CrossChainMessages />
            </div>
          )}

          {isConnected && <AssetList isVerified={isVerified} />}

          {!isConnected && (
            <div className="flex flex-col items-center justify-center py-20 text-center bg-white/80 dark:bg-black/40 backdrop-blur-md rounded-xl shadow-xl border border-purple-100/50 dark:border-purple-900/20 mt-10">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 flex items-center justify-center mb-6 shadow-lg shadow-purple-500/20 relative">
                <div className="absolute inset-0 w-full h-full rounded-full bg-gradient-to-r from-purple-600 to-cyan-600 animate-pulse blur-md opacity-50"></div>
                <Wallet className="h-12 w-12 text-white relative z-10" />
              </div>
              <h2 className="text-3xl font-bold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-cyan-600">
                Connect Your Wallet to Identifi
              </h2>
              <p className="text-muted-foreground max-w-md mb-8">
                Connect your wallet to access the Identifi dashboard and manage your cross-chain assets.
              </p>
              <WalletConnect variant="default" size="lg" />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

