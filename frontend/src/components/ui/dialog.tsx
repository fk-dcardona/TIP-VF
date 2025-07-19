"use client"

import * as React from "react"
import { X } from "lucide-react"
import { cn } from "@/lib/utils"

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

interface DialogTriggerProps {
  asChild?: boolean
  children: React.ReactNode
}

interface DialogContentProps {
  className?: string
  children: React.ReactNode
}

interface DialogHeaderProps {
  className?: string
  children: React.ReactNode
}

interface DialogTitleProps {
  className?: string
  children: React.ReactNode
}

const DialogContext = React.createContext<{
  open: boolean
  setOpen: (open: boolean) => void
}>({
  open: false,
  setOpen: () => {},
})

const Dialog: React.FC<DialogProps> = ({ open = false, onOpenChange, children }) => {
  const [internalOpen, setInternalOpen] = React.useState(open)
  const isControlled = open !== undefined
  const currentOpen = isControlled ? open : internalOpen
  const setCurrentOpen = isControlled ? onOpenChange : setInternalOpen

  React.useEffect(() => {
    if (isControlled) {
      setInternalOpen(open)
    }
  }, [open, isControlled])

  return (
    <DialogContext.Provider value={{ open: currentOpen, setOpen: setCurrentOpen || (() => {}) }}>
      {children}
    </DialogContext.Provider>
  )
}

const DialogTrigger: React.FC<DialogTriggerProps> = ({ children }) => {
  const { setOpen } = React.useContext(DialogContext)
  
  return (
    <div onClick={() => setOpen(true)}>
      {children}
    </div>
  )
}

const DialogContent: React.FC<DialogContentProps> = ({ className, children }) => {
  const { open, setOpen } = React.useContext(DialogContext)
  
  if (!open) return null

  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className={cn(
        "fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg",
        className
      )}>
        {children}
      </div>
    </>
  )
}

const DialogHeader: React.FC<DialogHeaderProps> = ({ className, children }) => {
  return (
    <div className={cn("flex flex-col space-y-1.5 text-center sm:text-left", className)}>
      {children}
    </div>
  )
}

const DialogTitle: React.FC<DialogTitleProps> = ({ className, children }) => {
  return (
    <h2 className={cn("text-lg font-semibold leading-none tracking-tight", className)}>
      {children}
    </h2>
  )
}

export { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } 