import { Shield, Eye, Lock, Share2, Server, HelpCircle } from 'lucide-react';

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

      <div className="relative w-full bg-gradient-to-br from-[#0c140f] to-[#14261b] py-16 mb-12 shadow-sm text-center">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20 mb-4">
            <Shield size={12} />
            <span>DATA PROTECTION</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight">Privacy Policy</h1>
          <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto font-medium">
            Learn how GuideLanka manages, protects, and handles your personal information and real-time location data.
          </p>
          <div className="mt-4 text-xs text-gray-500">
            Last Updated: {lastUpdated}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl">
        <div className="bg-white rounded-3xl border border-gray-100 p-8 md:p-10 shadow-sm space-y-10">

          <div className="border-b border-gray-100 pb-6">
            <p className="text-gray-600 text-sm md:text-base leading-relaxed">
              At GuideLanka, we value your privacy and trust above all. This Privacy Policy details how we collect, use, and secure your personal and location data when you use the GuideLanka application to book safaris and view real-time sightings.
            </p>
          </div>

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

          <div className="bg-green-500/5 border border-green-500/10 rounded-2xl p-6 mt-6 flex gap-4 items-start">
            <HelpCircle className="text-green-600 shrink-0 mt-0.5" size={20} />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-gray-900">Questions or concerns?</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                If you have questions about your data privacy or would like to request data deletion, contact us at{" "}
                <a href="mailto:support@guidelanka.com" className="text-green-600 font-semibold hover:underline">
                  support@guidelanka.com
                </a>
              </p>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
