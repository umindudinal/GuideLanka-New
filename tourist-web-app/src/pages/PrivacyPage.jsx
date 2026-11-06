import { Shield, Eye, Lock, Share2, Server, HelpCircle } from 'lucide-react';
import heroBg from '../assets/background.jpg';

export default function PrivacyPage() {
  const lastUpdated = "July 16, 2026";

  const sections = [
    {
      icon: <Eye className="text-green-500" size={24} />,
      title: "1. Information We Collect",
      content: [
        "Personal Information: Name, email address, phone number, and profile picture (optional) provided during user registration.",
        "Real-Time Location: Precise GPS location coordinates when active on the Live Safari Map to display animal sightings and coordinate driver routes.",
        "Booking and Sighting Data: Details of bookings with registered drivers and sighting posts (including image, location, animal type, and description)."
      ]
    },
    {
      icon: <Server className="text-green-500" size={24} />,
      title: "2. How We Use Information",
      content: [
        "Live Tracker Map: Processing location data to power the interactive wildlife map and coordinates.",
        "Safari Coordination: Connecting tourists with registered, licensed drivers and offering in-app communication services.",
        "Service Improvement: Tracking analytics and user interactions to optimize the app performance and driver-matching algorithms."
      ]
    },
    {
      icon: <Share2 className="text-green-500" size={24} />,
      title: "3. Sharing and Disclosures",
      content: [
        "With Safari Drivers: Necessary details such as your name and location are shared with your booked driver for pickup coordination.",
        "Wildlife Authorities: Aggregated sighting data is shared with the Department of Wildlife Conservation (DWC) Sri Lanka for research and conservation monitoring.",
        "Legal Requirements: We may share data when required by Sri Lankan law or Yala National Park administration."
      ]
    },
    {
      icon: <Lock className="text-green-500" size={24} />,
      title: "4. Data Security & Storage",
      content: [
        "Your data is securely stored on encrypted servers with access controls limited to authorized administrators.",
        "Payment credentials are never processed or stored on our servers; they are handled via verified third-party gateways.",
        "Real-time tracking coordinates are cached temporarily and automatically purged after your safari session expires."
      ]
    }
  ];

  return (
    <div className="pt-24 pb-16 min-h-screen bg-gray-50/50">

      {/* Full-width Hero Banner matching the signature GuideLanka style */}
      <div 
        className="relative w-full h-70 sm:h-85 md:h-100 overflow-hidden bg-cover bg-center mb-8 sm:mb-12 shadow-md"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-linear-to-t from-gray-950 via-gray-900/50 to-black/30 flex flex-col items-center justify-center p-4 sm:p-6 text-center z-10">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-2 sm:mb-4 tracking-tight leading-tight">
            Privacy Policy
          </h1>
          <p className="text-gray-200 text-xs sm:text-base md:text-lg max-w-xl font-medium leading-relaxed px-2">
            Learn how GuideLanka manages, protects, and handles your personal information and real-time location data.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 bg-linear-to-t from-gray-50/50 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-3xl border border-gray-100 p-8 md:p-10 shadow-sm space-y-10">
          <div className="space-y-8">
            {sections.map((section, idx) => (
              <div key={idx} className="flex gap-4 items-start">
                <div className="p-3 bg-green-500/10 rounded-2xl shrink-0">
                  {section.icon}
                </div>
                <div className="space-y-2.5">
                  <h2 className="text-lg font-bold text-gray-900">{section.title}</h2>
                  <ul className="list-disc pl-5 space-y-1.5 text-gray-600 text-sm leading-relaxed">
                    {section.content.map((item, itemIdx) => (
                      <li key={itemIdx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
