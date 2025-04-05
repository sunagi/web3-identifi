"use client"

import { createContext, useContext, useEffect, useState, type ReactNode } from "react"
import * as ethers from "ethers"
import { toast } from "@/components/ui/use-toast"

// Add a type declaration for window.ethereum at the top of the file
declare global {
  interface Window {
    ethereum?: any
  }
}

interface WalletContextType {
  provider: any
  signer: ethers.Signer | null
  address: string | null
  ensName: string | null
  chainId: number | null
  isConnected: boolean
  balance: string | null
  connect: (providerType: "metamask" | "walletconnect" | "coinbase") => Promise<void>
  disconnect: () => void
  switchChain: (chainId: number) => Promise<void>
}

// Update the WalletContext default value
const WalletContext = createContext<WalletContextType>({
  provider: null,
  signer: null,
  address: null,
  ensName: null,
  chainId: null,
  isConnected: false,
  balance: null,
  connect: async () => {},
  disconnect: () => {},
  switchChain: async () => {},
})

export const useWallet = () => useContext(WalletContext)

interface WalletProviderProps {
  children: ReactNode
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
    // Manual fallback (1 ether = 10^18 wei)
    return (Number(value) / 1e18).toString()
  } catch (error) {
    console.error("Error formatting ether:", error)
    return "0"
  }
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  // Update the provider state type to any for flexibility
  const [provider, setProvider] = useState<any>(null)
  const [signer, setSigner] = useState<ethers.Signer | null>(null)
  const [address, setAddress] = useState<string | null>(null)
  const [ensName, setEnsName] = useState<string | null>(null)
  const [chainId, setChainId] = useState<number | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [balance, setBalance] = useState<string | null>(null)

  // Check if wallet was previously connected
  useEffect(() => {
    const checkConnection = async () => {
      const connectedWallet = localStorage.getItem("connectedWallet")
      if (connectedWallet) {
        try {
          await connect(connectedWallet as "metamask" | "walletconnect" | "coinbase")
        } catch (error) {
          console.error("Failed to reconnect wallet:", error)
          localStorage.removeItem("connectedWallet")
        }
      }
    }

    checkConnection()
  }, [])

  // Update balance when address or chainId changes
  useEffect(() => {
    const updateBalance = async () => {
      if (provider && address) {
        try {
          const balance = await provider.getBalance(address)
          setBalance(formatEther(balance))
        } catch (error) {
          console.error("Failed to fetch balance:", error)
        }
      }
    }

    updateBalance()
  }, [provider, address, chainId])

  // Resolve ENS name
  useEffect(() => {
    const resolveEns = async () => {
      if (provider && address) {
        try {
          const name = await provider.lookupAddress(address)
          setEnsName(name)
        } catch (error) {
          console.error("Failed to resolve ENS name:", error)
          setEnsName(null)
        }
      }
    }

    resolveEns()
  }, [provider, address])

  // Handle account and chain changes
  useEffect(() => {
    if (!window.ethereum || !isConnected) return

    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnect()
      } else if (accounts[0] !== address) {
        setAddress(accounts[0])

        // Update signer and balance
        if (provider) {
          try {
            const signer = provider.getSigner ? provider.getSigner() : null
            if (signer) setSigner(signer)

            // Update balance
            provider
              .getBalance(accounts[0])
              .then((balance: any) => {
                setBalance(formatEther(balance))
              })
              .catch((error: any) => {
                console.error("Failed to fetch balance:", error)
              })

            // Update ENS name
            provider
              .lookupAddress(accounts[0])
              .then((name: string | null) => {
                setEnsName(name)
              })
              .catch((error: any) => {
                console.error("Failed to resolve ENS name:", error)
                setEnsName(null)
              })
          } catch (error) {
            console.error("Failed to update signer after account change:", error)
          }
        }
      }
    }

    const handleChainChanged = (chainIdHex: string) => {
      const newChainId = Number.parseInt(chainIdHex, 16)
      setChainId(newChainId)

      // Refresh provider on chain change
      if (window.ethereum) {
        try {
          // Create a new provider
          createProvider(window.ethereum)
            .then((newProvider) => {
              if (newProvider) {
                setProvider(newProvider)

                // Update signer
                if (address && newProvider.getSigner) {
                  const signer = newProvider.getSigner()
                  setSigner(signer)

                  // Update balance
                  newProvider
                    .getBalance(address)
                    .then((balance: any) => {
                      setBalance(formatEther(balance))
                    })
                    .catch((error: any) => {
                      console.error("Failed to fetch balance:", error)
                    })
                }
              }
            })
            .catch((error) => {
              console.error("Failed to create provider after chain change:", error)
            })
        } catch (error) {
          console.error("Failed to update provider after chain change:", error)
        }
      }
    }

    const handleDisconnect = () => {
      disconnect()
    }

    window.ethereum.on("accountsChanged", handleAccountsChanged)
    window.ethereum.on("chainChanged", handleChainChanged)
    window.ethereum.on("disconnect", handleDisconnect)

    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener("accountsChanged", handleAccountsChanged)
        window.ethereum.removeListener("chainChanged", handleChainChanged)
        window.ethereum.removeListener("disconnect", handleDisconnect)
      }
    }
  }, [address, isConnected, provider])

  // Helper function to create a provider
  const createProvider = async (ethereum: any) => {
    try {
      // Try ethers v6 approach
      if (typeof ethers.BrowserProvider === "function") {
        return new ethers.BrowserProvider(ethereum)
      }

      // Try ethers v5 approach
      if (ethers.providers && typeof ethers.providers.Web3Provider === "function") {
        return new ethers.providers.Web3Provider(ethereum)
      }

      // Fallback to a basic provider
      return {
        getNetwork: async () => ({
          chainId: Number.parseInt(await ethereum.request({ method: "eth_chainId" }), 16),
        }),
        getBalance: async (address: string) =>
          ethereum.request({ method: "eth_getBalance", params: [address, "latest"] }),
        lookupAddress: async () => null,
        getSigner: () => ({
          getAddress: async () => {
            const accounts = await ethereum.request({ method: "eth_accounts" })
            return accounts[0]
          },
          signMessage: async (message: string) =>
            ethereum.request({
              method: "personal_sign",
              params: [message, await this.getAddress()],
            }),
        }),
      }
    } catch (error) {
      console.error("Failed to create provider:", error)
      return null
    }
  }

  // Update the connect function to properly handle provider initialization
  const connect = async (providerType: "metamask" | "walletconnect" | "coinbase") => {
    try {
      if (providerType === "metamask") {
        // Check if MetaMask is installed
        if (!window.ethereum) {
          toast({
            title: "MetaMask not found",
            description: "Please install MetaMask extension",
            variant: "destructive",
          })
          return
        }

        try {
          // Request account access
          await window.ethereum.request({ method: "eth_requestAccounts" })

          // Create provider
          const newProvider = await createProvider(window.ethereum)

          if (!newProvider) {
            throw new Error("Failed to create provider")
          }

          setProvider(newProvider)

          // Get network information
          const network = await newProvider.getNetwork()
          setChainId(Number(network.chainId))

          // Get accounts
          const accounts = await window.ethereum.request({ method: "eth_accounts" })
          if (accounts.length === 0) {
            throw new Error("No accounts found")
          }

          setAddress(accounts[0])

          // Get signer if available
          if (newProvider.getSigner) {
            try {
              const signer = newProvider.getSigner()
              setSigner(signer)
            } catch (signerError) {
              console.error("Failed to get signer:", signerError)
            }
          }

          // Get balance
          try {
            const balance = await newProvider.getBalance(accounts[0])
            setBalance(formatEther(balance))
          } catch (balanceError) {
            console.error("Failed to get balance:", balanceError)
            setBalance("0")
          }

          // Try to resolve ENS name
          try {
            // Use a public provider for ENS resolution
            const mainnetProvider = ethers.getDefaultProvider
              ? ethers.getDefaultProvider("mainnet")
              : new ethers.JsonRpcProvider("https://eth-mainnet.g.alchemy.com/v2/demo")

            const name = await mainnetProvider.lookupAddress?.(accounts[0])
            setEnsName(name)
          } catch (ensError) {
            console.error("Failed to resolve ENS name:", ensError)
            setEnsName(null)
          }

          setIsConnected(true)
          localStorage.setItem("connectedWallet", providerType)

          toast({
            title: "Wallet Connected",
            description: "Successfully connected to MetaMask",
          })
        } catch (error) {
          console.error("MetaMask connection error:", error)

          // Try alternative approach with direct RPC calls
          try {
            console.log("Trying alternative approach with direct RPC calls...")

            // Get accounts
            const accounts = await window.ethereum.request({ method: "eth_accounts" })
            if (accounts.length === 0) {
              throw new Error("No accounts found")
            }

            // Get chain ID
            const chainIdHex = await window.ethereum.request({ method: "eth_chainId" })
            const chainId = Number.parseInt(chainIdHex, 16)
            setChainId(chainId)

            // Create a basic provider
            const basicProvider = {
              getNetwork: async () => ({ chainId }),
              getBalance: async (address: string) =>
                window.ethereum.request({ method: "eth_getBalance", params: [address, "latest"] }),
              lookupAddress: async () => null,
              getSigner: () => ({
                getAddress: async () => accounts[0],
                signMessage: async (message: string) =>
                  window.ethereum.request({
                    method: "personal_sign",
                    params: [message, accounts[0]],
                  }),
              }),
            }

            setProvider(basicProvider)
            setSigner(basicProvider.getSigner())
            setAddress(accounts[0])

            // Get balance
            const balanceHex = await window.ethereum.request({
              method: "eth_getBalance",
              params: [accounts[0], "latest"],
            })

            // Convert hex balance to decimal
            const balanceWei = Number.parseInt(balanceHex, 16).toString()
            const balance = formatEther(balanceWei)
            setBalance(balance)

            setIsConnected(true)
            localStorage.setItem("connectedWallet", providerType)

            toast({
              title: "Wallet Connected",
              description: "Successfully connected to MetaMask using alternative method",
            })
          } catch (altError) {
            console.error("Alternative connection method failed:", altError)
            throw new Error("Failed to connect to MetaMask")
          }
        }
      } else if (providerType === "walletconnect") {
        // For WalletConnect, we need to use their provider
        try {
          const WalletConnectProvider = (await import("@walletconnect/web3-provider")).default

          const wcProvider = new WalletConnectProvider({
            infuraId: "27e484dcd9e3efcfd25a83a78777cdf1", // Public Infura ID
            qrcode: true,
          })

          // Enable session (triggers QR Code modal)
          await wcProvider.enable()

          // Try to create provider directly
          try {
            // Create a basic provider wrapper
            const provider = {
              _provider: wcProvider,
              getNetwork: async () => ({ chainId: wcProvider.chainId }),
              getBalance: async (address: string) => {
                const balance = await wcProvider.request({
                  method: "eth_getBalance",
                  params: [address, "latest"],
                })
                return balance
              },
              lookupAddress: async () => null,
              getSigner: () => ({
                getAddress: async () => wcProvider.accounts[0],
                signMessage: async (message: string) =>
                  wcProvider.request({
                    method: "personal_sign",
                    params: [message, wcProvider.accounts[0]],
                  }),
              }),
            }

            setProvider(provider)
            setSigner(provider.getSigner())
            setAddress(wcProvider.accounts[0])
            setChainId(wcProvider.chainId)

            // Get balance
            const balanceHex = await wcProvider.request({
              method: "eth_getBalance",
              params: [wcProvider.accounts[0], "latest"],
            })

            // Convert hex balance to decimal
            const balanceWei = Number.parseInt(balanceHex, 16).toString()
            const balance = formatEther(balanceWei)
            setBalance(balance)

            setIsConnected(true)
            localStorage.setItem("connectedWallet", providerType)

            // Subscribe to events
            wcProvider.on("disconnect", () => {
              disconnect()
            })

            toast({
              title: "Wallet Connected",
              description: "Successfully connected with WalletConnect",
            })
          } catch (error) {
            console.error("Failed to create WalletConnect provider:", error)
            throw new Error("Could not initialize WalletConnect provider")
          }
        } catch (error) {
          console.error("WalletConnect error:", error)
          throw new Error("Failed to connect with WalletConnect")
        }
      } else if (providerType === "coinbase") {
        // For Coinbase Wallet, we would need to use their SDK
        toast({
          title: "Not Implemented",
          description: "Coinbase Wallet connection is not implemented yet",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Failed to connect wallet:", error)
      toast({
        title: "Connection Failed",
        description: "Failed to connect wallet. Please try again.",
        variant: "destructive",
      })
      throw error
    }
  }

  const disconnect = () => {
    setProvider(null)
    setSigner(null)
    setAddress(null)
    setEnsName(null)
    setChainId(null)
    setIsConnected(false)
    setBalance(null)
    localStorage.removeItem("connectedWallet")

    toast({
      title: "Wallet Disconnected",
      description: "Your wallet has been disconnected",
    })
  }

  const switchChain = async (chainId: number) => {
    if (!window.ethereum) {
      toast({
        title: "Provider Not Found",
        description: "No Ethereum provider found",
        variant: "destructive",
      })
      return
    }

    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: `0x${chainId.toString(16)}` }],
      })
    } catch (error: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        try {
          const chainData = getChainData(chainId)
          if (!chainData) throw new Error("Unknown chain")

          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [chainData],
          })
        } catch (addError) {
          console.error("Failed to add chain:", addError)
          toast({
            title: "Failed to Add Chain",
            description: "Could not add the requested chain to your wallet",
            variant: "destructive",
          })
        }
      } else {
        console.error("Failed to switch chain:", error)
        toast({
          title: "Failed to Switch Chain",
          description: "Could not switch to the requested chain",
          variant: "destructive",
        })
      }
    }
  }

  // Helper function to get chain data for adding new chains
  const getChainData = (chainId: number) => {
    switch (chainId) {
      case 1: // Ethereum Mainnet
        return {
          chainId: "0x1",
          chainName: "Ethereum Mainnet",
          nativeCurrency: {
            name: "Ether",
            symbol: "ETH",
            decimals: 18,
          },
          rpcUrls: ["https://mainnet.infura.io/v3/YOUR_INFURA_ID"],
          blockExplorerUrls: ["https://etherscan.io"],
        }
      case 137: // Polygon Mainnet
        return {
          chainId: "0x89",
          chainName: "Polygon Mainnet",
          nativeCurrency: {
            name: "MATIC",
            symbol: "MATIC",
            decimals: 18,
          },
          rpcUrls: ["https://polygon-rpc.com/"],
          blockExplorerUrls: ["https://polygonscan.com/"],
        }
      case 42220: // Celo Mainnet
        return {
          chainId: "0xA4EC",
          chainName: "Celo Mainnet",
          nativeCurrency: {
            name: "CELO",
            symbol: "CELO",
            decimals: 18,
          },
          rpcUrls: ["https://forno.celo.org"],
          blockExplorerUrls: ["https://explorer.celo.org"],
        }
      default:
        return null
    }
  }

  return (
    <WalletContext.Provider
      value={{
        provider,
        signer,
        address,
        ensName,
        chainId,
        isConnected,
        balance,
        connect,
        disconnect,
        switchChain,
      }}
    >
      {children}
    </WalletContext.Provider>
  )
}

