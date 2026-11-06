import { Scale, FileText, Calendar, ShieldAlert, AlertOctagon, HelpCircle } from 'lucide-react';
import heroBg from '../assets/background.jpg';

export default function TermsPage() {
  const lastUpdated = "July 16, 2026";

  const sections = [
    {
      icon: <Scale className="text-green-500" size={24} />,
      title: "1. Acceptance of Terms",
      content: [
        "By accessing or using GuideLanka, you agree to comply with and be bound by these Terms of Service.",
        "You agree to follow all national park rules set forth by the Department of Wildlife Conservation (DWC) Sri Lanka.",
        "If you do not agree to these terms, you may not access or use the application's services."
      ]
    },
    {
      icon: <Calendar className="text-green-500" size={24} />,
      title: "2. Booking and Payments",
      content: [
        "Driver Bookings: GuideLanka provides a booking platform to match tourists with registered, independent safari drivers. We do not operate safari jeeps directly.",
        "Fees and Rates: Booking fees, entry permits, and driver charges are displayed prior to confirmation. Tourists are responsible for paying these fees.",
        "Cancellations: Cancellations must be made at least 24 hours prior to the scheduled safari start time for a full refund."
      ]
    },
    {
      icon: <ShieldAlert className="text-green-500" size={24} />,
      title: "3. Sighting Gallery Guidelines",
      content: [
        "Accuracy of Reports: Users must submit authentic, real-time animal sighting reports. Falsifying locations or posting off-site media is strictly prohibited.",
        "Community Conduct: Sighting posts must not contain explicit material, offensive captions, spam, or harassment directed at drivers or other visitors.",
        "Content Rights: By posting to the Sighting Gallery, you grant GuideLanka a license to share, display, and analyze the report data."
      ]
    },
    {
      icon: <AlertOctagon className="text-green-500" size={24} />,
      title: "4. Wildlife Code of Conduct",
      content: [
        "Tourists must remain inside the safari jeeps at all times unless in designated park areas (e.g. Patanangala beach, park office).",
        "It is strictly illegal to feed, provoke, throw trash to, or disturb the animals in Yala National Park.",
        "Violation of wildlife protection laws may result in immediate cancellation of your safari without refund, and potential prosecution by park rangers."
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
            Terms of Service
          </h1>
          <p className="text-gray-200 text-xs sm:text-base md:text-lg max-w-xl font-medium leading-relaxed px-2">
            Read the terms, rules, and guidelines governing the use of the GuideLanka platform.
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
