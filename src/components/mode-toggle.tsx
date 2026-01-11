"use client"

import * as React from "react"
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"

export function ModeToggle() {
    const { theme, setTheme } = useTheme()

    // Avoid hydration mismatch
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => setMounted(true), [])

    if (!mounted) {
        return (
            <Button variant="ghost" size="icon" disabled>
                <Sun className="h-[1.2rem] w-[1.2rem]" />
            </Button>
        )
    }

    return (
        <Button
            variant="ghost"
            size="icon"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 border border-transparent dark:border-slate-700 border-slate-200"
            title="Alternar Tema"
        >
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Alternar tema</span>
        </Button>
    )
}

export function ModeToggleMobile() {
    const { theme, setTheme } = useTheme()
    const [mounted, setMounted] = React.useState(false)
    React.useEffect(() => setMounted(true), [])

    if (!mounted) return null;

    return (
        <Button
            variant="outline"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            className="w-full justify-start gap-2 border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
            {theme === "dark" ? (
                <>
                    <Moon className="h-4 w-4" />
                    <span>Modo Escuro</span>
                </>
            ) : (
                <>
                    <Sun className="h-4 w-4" />
                    <span>Modo Claro</span>
                </>
            )}
        </Button>
    )
}
