"use client"

import { useState, useEffect } from "react"
import { MessageSquare, RefreshCw, Loader2, Sparkles, ArrowRight } from "lucide-react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { toast } from "@/components/ui/use-toast"
import { useWallet } from "@/hooks/use-wallet"

interface Message {
  id: number
  title: string
  description: string
  time: string
  read: boolean
  network: string
  messageHash?: string
}

// Hyperlane API client (enhanced)
const HyperlaneClient = {
  async getMessages(address: string, ensName: string | null): Promise<Message[]> {
    try {
      // In a real implementation, this would be an actual API call to Hyperlane
      // For now, we'll simulate the API response

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Generate random message hashes
      const generateHash = () => {
        return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
      }

      const displayName = ensName || address.substring(0, 6) + "..." + address.substring(address.length - 4)

      return [
        {
          id: 1,
          title: "Verified swap completed",
          description: `Your verified Identifi swap from ETH to USDC has been completed for ${displayName}`,
          time: "Just now",
          read: false,
          network: "Ethereum",
          messageHash: generateHash(),
        },
        {
          id: 2,
          title: "Cross-chain transfer complete",
          description: "Your transfer from Polygon to Rootstock has been completed",
          time: "2 minutes ago",
          read: false,
          network: "Polygon → Rootstock",
          messageHash: generateHash(),
        },
        {
          id: 3,
          title: "New token available",
          description: "You can now swap for RIF token on Rootstock",
          time: "1 hour ago",
          read: true,
          network: "Rootstock",
          messageHash: generateHash(),
        },
        {
          id: 4,
          title: "Verification reminder",
          description: "Complete your Identifi verification to unlock all features",
          time: "5 hours ago",
          read: true,
          network: "Ethereum",
          messageHash: generateHash(),
        },
        {
          id: 5,
          title: "Cross-chain message received",
          description: "You've received a new message from a dApp on Rootstock",
          time: "1 day ago",
          read: true,
          network: "Rootstock → Ethereum",
          messageHash: generateHash(),
        },
      ]
    } catch (error) {
      console.error("Error fetching messages:", error)
      throw error
    }
  },

  async markAsRead(messageId: number): Promise<boolean> {
    try {
      // In a real implementation, this would be an actual API call to Hyperlane

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 500))

      return true
    } catch (error) {
      console.error("Error marking message as read:", error)
      throw error
    }
  },

  async sendMessage(fromChain: string, toChain: string, message: string): Promise<string> {
    try {
      // In a real implementation, this would be an actual API call to Hyperlane
      // For now, we'll simulate the API response

      // Simulate network delay
      await new Promise((resolve) => setTimeout(resolve, 1500))

      // Generate random message hash
      return "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("")
    } catch (error) {
      console.error("Error sending message:", error)
      throw error
    }
  },
}

export function CrossChainMessages() {
  const { address, isConnected, ensName } = useWallet()

  const [isLoading, setIsLoading] = useState(true)
  const [messages, setMessages] = useState<Message[]>([])
  const [isMarkingAsRead, setIsMarkingAsRead] = useState<number | null>(null)

  // Fetch messages from Hyperlane API
  useEffect(() => {
    const fetchMessages = async () => {
      if (!address) return

      setIsLoading(true)

      try {
        const messageData = await HyperlaneClient.getMessages(address, ensName)
        setMessages(messageData)
      } catch (error) {
        console.error("Error fetching messages:", error)
        toast({
          title: "Error fetching messages",
          description: "Could not load your messages. Please try again later.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    if (isConnected) {
      fetchMessages()
    }
  }, [address, isConnected, ensName])

  const markAsRead = async (id: number) => {
    setIsMarkingAsRead(id)

    try {
      const success = await HyperlaneClient.markAsRead(id)

      if (success) {
        setMessages(messages.map((message) => (message.id === id ? { ...message, read: true } : message)))
      }
    } catch (error) {
      console.error("Error marking message as read:", error)
      toast({
        title: "Error",
        description: "Could not mark message as read",
        variant: "destructive",
      })
    } finally {
      setIsMarkingAsRead(null)
    }
  }

  const refreshMessages = async () => {
    if (!address) return

    setIsLoading(true)

    try {
      const messageData = await HyperlaneClient.getMessages(address, ensName)
      setMessages(messageData)
    } catch (error) {
      console.error("Error refreshing messages:", error)
      toast({
        title: "Error refreshing messages",
        description: "Could not refresh your messages. Please try again later.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="border-none shadow-xl overflow-hidden bg-white/80 dark:bg-black/40 backdrop-blur-md relative">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute bottom-0 right-0 w-1/3 h-1/3 bg-gradient-to-br from-purple-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
        <div className="absolute top-0 left-0 w-1/4 h-1/4 bg-gradient-to-tr from-purple-500/10 to-cyan-500/10 rounded-full blur-3xl"></div>
      </div>

      <CardHeader className="bg-gradient-to-r from-purple-100/80 to-cyan-100/80 dark:from-purple-950/50 dark:to-cyan-950/50 relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <span className="relative text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-cyan-600 font-bold">
                Identifi Messages
                <span className="absolute -top-1 -right-6">
                  <Sparkles className="h-4 w-4 text-amber-500 animate-pulse" />
                </span>
              </span>
            </CardTitle>
            <CardDescription className="text-muted-foreground/80">Powered by Hyperlane</CardDescription>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={refreshMessages}
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
        <div className="flex flex-col gap-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="p-3 rounded-xl border border-purple-100/50 dark:border-purple-900/20 bg-white/50 dark:bg-black/20"
              >
                <div className="flex justify-between items-start">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-5 w-10" />
                </div>
                <Skeleton className="h-3 w-full mt-2" />
                <Skeleton className="h-3 w-20 mt-2" />
              </div>
            ))
          ) : messages.length > 0 ? (
            messages.map((message, index) => (
              <div
                key={message.id}
                className={`p-4 rounded-xl transition-all duration-300 cursor-pointer hover:shadow-md hover:shadow-purple-500/10 relative overflow-hidden group transform hover:scale-[1.01] ${
                  message.read
                    ? "bg-white/50 dark:bg-black/20 border border-transparent hover:border-purple-200/50 dark:hover:border-purple-800/20"
                    : "bg-gradient-to-r from-blue-50/80 to-cyan-50/80 dark:from-blue-950/30 dark:to-cyan-950/30 border border-blue-100/50 dark:border-blue-900/30"
                }`}
                onClick={() => !message.read && markAsRead(message.id)}
                style={{
                  animationDelay: `${index * 100}ms`,
                  animation: "fadeInUp 0.5s ease-out forwards",
                }}
              >
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-500/5 to-cyan-500/5 group-hover:opacity-100 opacity-0 transition-opacity duration-300"></div>
                <div className="flex justify-between items-start">
                  <h4 className="font-medium text-base">{message.title}</h4>
                  {!message.read ? (
                    isMarkingAsRead === message.id ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Badge
                        variant="secondary"
                        className="text-xs bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 text-blue-700 dark:text-blue-300 border-none"
                      >
                        New
                      </Badge>
                    )
                  ) : null}
                </div>
                <p className="text-sm text-muted-foreground mt-1">{message.description}</p>
                <div className="flex justify-between mt-2">
                  <div className="text-xs text-muted-foreground">{message.time}</div>
                  <Badge
                    variant="outline"
                    className="text-xs bg-gradient-to-r from-purple-50/50 to-cyan-50/50 dark:from-purple-900/20 dark:to-cyan-900/20 border-purple-100/50 dark:border-purple-900/20"
                  >
                    {message.network}
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <MessageSquare className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p>No messages to display</p>
            </div>
          )}
        </div>
      </CardContent>
      <CardFooter className="p-4 bg-gradient-to-r from-purple-50/80 to-cyan-50/80 dark:from-purple-950/30 dark:to-cyan-950/30 relative z-10">
        <Button
          variant="outline"
          className="w-full relative overflow-hidden group rounded-lg bg-white/50 dark:bg-black/20 border border-purple-100/50 dark:border-purple-900/20 hover:bg-gradient-to-r hover:from-purple-50 hover:to-cyan-50 dark:hover:from-purple-900/10 dark:hover:to-cyan-900/10 transition-all duration-300 hover:shadow-md hover:shadow-purple-500/10"
          size="sm"
        >
          <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-500/5 to-cyan-500/5 group-hover:opacity-100 opacity-0 transition-opacity duration-300"></div>
          <MessageSquare className="h-4 w-4 mr-2" />
          <span>View All Messages</span>
          <ArrowRight className="h-3 w-3 ml-2 opacity-70 group-hover:translate-x-1 transition-transform duration-300" />
        </Button>
      </CardFooter>
    </Card>
  )
}

