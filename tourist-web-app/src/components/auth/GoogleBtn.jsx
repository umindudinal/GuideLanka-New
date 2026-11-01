import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../../services/api";

export default function GoogleBtn({ onClose }) {
  const handleGoogleLogin = async () => {
    console.log("බොත්තම ක්ලික් කළා!");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("ලොගින් සාර්ථකයි:", result.user);
      if (onClose) onClose();
    } catch (error) {
      console.error("ලොගින් Error:", error);
    }
  };

  return (
    <button
      type="button"
      onClick={handleGoogleLogin}
      className="w-full flex items-center justify-center space-x-3 bg-white border border-gray-300 text-gray-700 py-3.5 rounded-xl font-bold hover:bg-gray-50 transition shadow-sm"
    >
      <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
      <span>Continue with Google</span>
    </button>
  );
}
