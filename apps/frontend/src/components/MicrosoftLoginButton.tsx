import { loginWithMicrosoft } from "../utils/microsoftAuth";

interface MicrosoftLoginButtonProps {
	className?: string;
}

/**
 * Microsoft Login Button component
 * Renders a button that initiates the Microsoft OAuth login flow
 */
export default function MicrosoftLoginButton({
	className = "",
}: MicrosoftLoginButtonProps) {
	return (
		<button
			type="button"
			onClick={loginWithMicrosoft}
			className={`flex items-center justify-center gap-2 rounded px-4 py-2 text-white bg-[#2f2f2f] hover:bg-[#242424] transition-colors ${className}`}
		>
			<svg
				width="20"
				height="20"
				viewBox="0 0 21 21"
				xmlns="http://www.w3.org/2000/svg"
				aria-labelledby="microsoftLogoTitle"
				role="img"
			>
				<title id="microsoftLogoTitle">Microsoft Logo</title>
				<rect x="1" y="1" width="9" height="9" fill="#f25022" />
				<rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
				<rect x="11" y="1" width="9" height="9" fill="#7fba00" />
				<rect x="11" y="11" width="9" height="9" fill="#ffb900" />
			</svg>
			<span>Sign in with Microsoft</span>
		</button>
	);
}
