import type * as React from "react";

interface GeminiLogoProps extends React.SVGProps<SVGSVGElement> {
    size?: number;
    className?: string;
}

const GeminiLogo = ({ size = 24, className = "", ...props }: GeminiLogoProps) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-label="Google Gemini Logo"
            {...props}
        >
            <title>Google Gemini</title>
            <path
                fill="currentColor"
                d="M12 2c.55 5.5 4 8.95 9.5 9.5-5.5.55-8.95 4-9.5 9.5-.55-5.5-4-8.95-9.5-9.5C8 10.95 11.45 7.5 12 2z"
            />
        </svg>
    );
};

export default GeminiLogo;
