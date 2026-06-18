import { getPasswordStrength } from "../../services/passwordPolicyService.js";
import { cn } from "../../utils/cn.js";

const TONE_STYLES = {
  medium: "bg-amiste-yellow text-amiste-black",
  neutral: "bg-zinc-200 text-amiste-gray",
  strong: "bg-amiste-green text-white",
  weak: "bg-amiste-red text-white",
};

export default function PasswordStrengthMeter({ password }) {
  const strength = getPasswordStrength(password);
  const activeBars = Math.min(Math.max(strength.score, password ? 1 : 0), 5);

  return (
    <div className="mt-2 space-y-2">
      <div className="grid grid-cols-5 gap-1">
        {Array.from({ length: 5 }).map((_, index) => (
          <span
            className={cn(
              "h-1.5 rounded-full transition",
              index < activeBars ? TONE_STYLES[strength.tone].split(" ")[0] : "bg-zinc-200"
            )}
            key={`password-strength-${index + 1}`}
          />
        ))}
      </div>
      <span className={cn("inline-flex rounded-lg px-2 py-1 text-[10px] font-black uppercase", TONE_STYLES[strength.tone])}>
        {strength.label}
      </span>
    </div>
  );
}
