import React, { useState } from "react";
import { Check, Copy } from "lucide-react";

const CopyableText = ({ text, className = "" }) => {
    const [isCopied, setIsCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(text);
            setIsCopied(true);
            setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
        } catch (err) {
            console.error("Failed to copy text: ", err);
        }
    };

    return (
        <span
            className={`cursor-pointer inline-flex items-center gap-1 ${className}`}
            onClick={handleCopy}
        >
            {text}
            {isCopied ? (
                <Check size={12} className="text-green-500" />
            ) : (
                <Copy size={12} className="text-gray-500" />
            )}
        </span>
    );
};

export default CopyableText;
