import { Scale, FileText, Calendar, ShieldAlert, AlertOctagon, HelpCircle } from 'lucide-react';

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

      <div className="relative w-full bg-gradient-to-br from-[#0c140f] to-[#14261b] py-16 mb-12 shadow-sm text-center">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-400 border border-green-500/20 mb-4">
            <FileText size={12} />
            <span>COMMUNITY AGREEMENT</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white mb-3 tracking-tight">Terms of Service</h1>
          <p className="text-gray-300 text-sm md:text-base max-w-xl mx-auto font-medium">
            Read the terms, rules, and guidelines governing the use of the GuideLanka platform.
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
              These Terms of Service govern your access to and use of GuideLanka's website, mobile apps, and services. Please read them carefully before coordinating bookings or posting animal sightings.
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
              <h4 className="text-sm font-bold text-gray-900">Need help understanding our terms?</h4>
              <p className="text-xs text-gray-600 leading-relaxed">
                If you have questions about these Terms of Service or need assistance with your safari booking, contact our support desk at{" "}
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
