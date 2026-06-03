import type * as React from "react";

interface ClaudeLogoProps extends React.SVGProps<SVGSVGElement> {
    size?: number;
    className?: string;
}

const ClaudeLogo = ({ size = 24, className = "", ...props }: ClaudeLogoProps) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="Anthropic Claude Logo"
            {...props}
        >
            <title>Anthropic Claude</title>
            <path
                fill="currentColor"
                d="M5.046 18.85h2.286l4.654-11.7h-2.286L5.046 18.85zm9.388 0h2.286l-4.654-11.7h-2.286l4.654 11.7zm-1.59-7.13l-1.6 4.04h3.2l-1.6-4.04z"
            />
        </svg>
    );
};

export default ClaudeLogo;
