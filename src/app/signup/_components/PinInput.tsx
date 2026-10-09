"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface PinInputProps {
    length?: number;
    onComplete: (pin: string) => void;
    disabled?: boolean;
}

export function PinInput({ length = 6, onComplete, disabled = false }: PinInputProps) {
    const [pin, setPin] = useState<string[]>(Array(length).fill(""));
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (value: string, index: number) => {
        if (disabled) return;

        // Only allow numbers
        if (value && !/^\d+$/.test(value)) return;

        const newPin = [...pin];
        // Take only the last character if multiple are entered (handled by mobile/auto-refill)
        newPin[index] = value.substring(value.length - 1);
        setPin(newPin);

        // If we have a value and there's a next input, focus it
        if (value && index < length - 1) {
            inputRefs.current[index + 1]?.focus();
        }

        // If filled all, call onComplete
        if (newPin.every(v => v !== "") && newPin.join("").length === length) {
            onComplete(newPin.join(""));
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
        if (disabled) return;

        // Handle backspace
        if (e.key === "Backspace" && !pin[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent) => {
        if (disabled) return;

        e.preventDefault();
        const pastedData = e.clipboardData.getData("text/plain").slice(0, length);
        if (!/^\d+$/.test(pastedData)) return;

        const newPin = [...pin];
        pastedData.split("").forEach((char, i) => {
            if (i < length) newPin[i] = char;
        });
        setPin(newPin);

        // Focus last or next empty
        const lastIndex = Math.min(pastedData.length, length - 1);
        inputRefs.current[lastIndex]?.focus();

        if (newPin.every(v => v !== "") && newPin.join("").length === length) {
            onComplete(newPin.join(""));
        }
    };

    return (
        <div className="flex gap-3 justify-center" onPaste={handlePaste}>
            {pin.map((digit, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                >
                    <input
                        ref={(el) => { inputRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        disabled={disabled}
                        onChange={(e) => handleChange(e.target.value, i)}
                        onKeyDown={(e) => handleKeyDown(e, i)}
                        className={`w-12 h-16 md:w-14 md:h-20 text-center text-2xl font-semibold bg-ui-bg border rounded-control transition-all focus:outline-none ${digit
                                ? "border-ui-primary text-ui-ink"
                                : "border-ui-line text-ui-muted focus:border-ui-primary focus:bg-primary/5 focus:shadow-primary/10"
                            } ${disabled ? "opacity-30 cursor-not-allowed scale-95" : "hover:border-ui-input"} focus:scale-105`}
                    />
                </motion.div>
            ))}
        </div>
    );
}
