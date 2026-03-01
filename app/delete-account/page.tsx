"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
import toast, { Toaster } from "react-hot-toast";
import gsap from "gsap";

// ==================== API CONFIGURATION ====================
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

// Configure axios defaults
axios.defaults.withCredentials = true;
axios.defaults.timeout = 30000;

export default function DeleteAccountPage() {
  const router = useRouter();
  const formRef = useRef<HTMLDivElement>(null);

  const [step, setStep] = useState<"otp" | "confirm">("otp");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  // Check authentication on mount
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/auth/me`, {
        withCredentials: true,
      });
      
      if (!res.data.user) {
        toast.error("Please login first");
        router.push("/login");
      }
    } catch (err: any) {
      console.error("Auth check failed:", err);
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        router.push("/login");
      }
    } finally {
      setChecking(false);
    }
  };

  // GSAP animation
  useEffect(() => {
    if (formRef.current) {
      gsap.fromTo(
        formRef.current,
        { opacity: 0, y: 30, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" }
      );
    }
  }, []);

  // Step 1: Send OTP
  const handleSendOtp = async () => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/delete-account/send-otp`,
        {},
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("OTP sent response:", res.data);
      toast.success(res.data.message || "OTP sent to your email ✅");
      setStep("confirm");
    } catch (err: any) {
      console.error("Send OTP error:", err.response?.data || err);
      
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        router.push("/login");
      } else if (err.response?.status === 404) {
        toast.error("User not found. Please login again.");
        router.push("/login");
      } else {
        toast.error(err?.response?.data?.message || "Failed to send OTP ❌");
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Delete Account
  const handleDeleteAccount = async () => {
    if (!otp) return toast.error("Enter OTP");

    setLoading(true);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/delete-account/confirm`,
        { otp },
        { 
          withCredentials: true,
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("Delete response:", res.data);
      toast.success(res.data.message || "Account deleted successfully 🗑️");

      // Clear any local storage
      localStorage.clear();
      
      // Redirect to register page
      setTimeout(() => router.push("/register"), 1500);
    } catch (err: any) {
      console.error("Delete error:", err.response?.data || err);
      
      if (err.response?.status === 401) {
        toast.error("Session expired. Please login again.");
        router.push("/login");
      } else if (err.response?.status === 400) {
        toast.error(err?.response?.data?.message || "Invalid OTP or expired");
      } else {
        toast.error(err?.response?.data?.message || "Delete failed ❌");
      }
    } finally {
      setLoading(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-100 to-gray-200">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <>
      <Toaster position="top-right" />
      <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-gray-100 to-gray-200 px-4">
        <div
          ref={formRef}
          className="w-full max-w-sm bg-white rounded-2xl shadow-xl p-6 space-y-5"
        >
          <h1 className="text-2xl font-bold text-center text-gray-900">
            Delete Account
          </h1>

          {/* Step 1: Send OTP */}
          {step === "otp" && (
            <>
              <p className="text-center text-gray-600">
                Click below to receive OTP on your registered email
              </p>

              <button
                disabled={loading}
                onClick={handleSendOtp}
                className="w-full py-2.5 rounded-xl bg-black text-white font-medium
                           hover:bg-gray-800 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Send OTP"}
              </button>

              <button
                onClick={() => router.push("/dashboard")}
                className="w-full py-2.5 rounded-xl bg-gray-200 text-gray-800 font-medium
                           hover:bg-gray-300 transition"
              >
                Cancel
              </button>
            </>
          )}

          {/* Step 2: Confirm Delete */}
          {step === "confirm" && (
            <>
              <p className="text-center text-gray-600">
                Enter the OTP sent to your email
              </p>

              <input
                type="text"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300
                           bg-gray-50 text-sm text-gray-900 text-center tracking-widest
                           focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition"
              />

              <p className="text-center text-red-600 font-medium">
                ⚠️ This action is permanent and cannot be undone
              </p>

              <button
                disabled={!otp || loading}
                onClick={handleDeleteAccount}
                className="w-full py-3 font-semibold rounded-xl bg-red-600 hover:bg-red-700 text-white transition disabled:opacity-50"
              >
                {loading ? "Deleting..." : "Delete Account"}
              </button>

              <button
                onClick={() => {
                  setStep("otp");
                  setOtp("");
                }}
                className="w-full py-2.5 rounded-xl bg-gray-200 text-gray-800 font-medium
                           hover:bg-gray-300 transition"
              >
                Back
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}