import { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle, 
  MessageSquare, 
  MessageCircle, 
  ShieldAlert, 
  HelpCircle,
  Loader2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import heroBg from '../assets/background.jpg';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: 'general',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate sending message
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: 'general',
        message: ''
      });
    }, 800);
  };

  return (
    <div className="pt-24 pb-20 min-h-screen bg-gray-50/50 font-sans">

      {/* Signature Full-width Hero Banner */}
      <div 
        className="relative w-full h-70 sm:h-85 md:h-100 overflow-hidden bg-cover bg-center mb-8 sm:mb-12 shadow-md"
        style={{ backgroundImage: `url(${heroBg})` }}
      >
        <div className="absolute inset-0 bg-linear-to-t from-gray-950 via-gray-900/50 to-black/30 flex flex-col items-center justify-center p-4 sm:p-6 text-center z-10">
          <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-white mb-2 sm:mb-4 tracking-tight leading-tight">
            Contact GuideLanka
          </h1>
          <p className="text-gray-200 text-xs sm:text-base md:text-lg max-w-xl font-medium leading-relaxed px-2">
            Have questions about Yala safaris, park permits, or verified guides? Our dedicated team is here to assist you anytime.
          </p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-16 sm:h-24 bg-linear-to-t from-gray-50/50 to-transparent"></div>
      </div>

      <div className="container mx-auto px-4 max-w-6xl">

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-10">

          {/* Left Column: Contact Inquiry Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-3xl p-6 sm:p-8 md:p-10 border border-gray-200/80 shadow-md">
              {isSubmitted ? (
                <div className="text-center py-12 sm:py-16 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto shadow-sm">
                    <CheckCircle size={36} />
                  </div>
                  <h3 className="text-2xl font-black text-gray-900">Thank You for Reaching Out!</h3>
                  <p className="text-sm text-gray-500 max-w-md mx-auto leading-relaxed">
                    Your inquiry has been received by our GuideLanka support desk. We will review your message and reply via email within 2-4 hours.
                  </p>
                  <button
                    type="button"
                    onClick={() => setIsSubmitted(false)}
                    className="inline-flex items-center gap-2 bg-[#024C25] hover:bg-[#01381b] text-white font-bold text-xs sm:text-sm px-6 py-3 rounded-xl transition shadow-md active:scale-95 cursor-pointer"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">

                  <div>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Send an Inquiry</h2>
                    <p className="text-xs sm:text-sm text-gray-500 mt-1">
                      Fill out the form below and our team will get back to you promptly.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Your Full Name
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. John Doe"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full px-4 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white text-sm font-medium text-gray-700 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Email Address
                      </label>
                      <input
                        type="email"
                        required
                        placeholder="e.g. john@example.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white text-sm font-medium text-gray-700 transition"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        placeholder="e.g. +94 77 123 4567"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white text-sm font-medium text-gray-700 transition"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                        Topic of Inquiry
                      </label>
                      <div className="relative">
                        <select
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          className="w-full px-4 py-3 sm:py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white text-sm font-medium text-gray-700 transition appearance-none cursor-pointer"
                        >
                          <option value="general">General Safari Questions</option>
                          <option value="booking">Booking & Guide Assistance</option>
                          <option value="permits">Park Permits & Entrance Fees</option>
                          <option value="feedback">Feedback & Suggestions</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-400">
                          <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">
                      Your Message
                    </label>
                    <textarea
                      rows="5"
                      required
                      placeholder="Please describe how we can assist your safari journey..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:bg-white text-sm font-medium text-gray-700 transition"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-[#024C25] hover:bg-[#01381b] text-white font-bold py-3.5 sm:py-4 rounded-2xl text-base transition shadow-md hover:shadow-lg transform active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:bg-gray-400"
                  >
                    {isSubmitting ? (
                      <><Loader2 className="animate-spin" size={18} /> Sending Your Inquiry...</>
                    ) : (
                      <><Send size={18} /> Submit Inquiry</>
                    )}
                  </button>

                  <div className="flex items-center justify-center gap-1.5 text-xs text-gray-400 pt-1">
                    <HelpCircle size={14} />
                    <span>Need immediate answers? Check our <Link to="/faq" className="text-green-700 font-bold hover:underline">FAQ Help Center</Link></span>
                  </div>

                </form>
              )}

            </div>

          </div>

          {/* Right Column: Direct Contact Information */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200/80 shadow-sm space-y-6">
              <div>
                <h2 className="text-2xl font-black text-gray-900 mt-2">We Are Here to Help</h2>
                <p className="text-xs sm:text-sm text-gray-500 mt-1 leading-relaxed">
                  Reach out through any of our official channels or send us an inquiry directly.
                </p>
              </div>

              <div className="space-y-5 pt-2">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-green-50 text-green-700 border border-green-100 flex items-center justify-center shrink-0 shadow-3xs">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-800">Field Desk & Information</h3>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      Department of Wildlife Conservation Desk,<br />
                      Palatupana & Galge Entrances, Yala National Park, Sri Lanka
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-green-50 text-green-700 border border-green-100 flex items-center justify-center shrink-0 shadow-3xs">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-800">Phone Support</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      General: <a href="tel:+94771234567" className="font-bold text-gray-700 hover:text-green-700">+94 77 123 4567</a><br />
                      Hotline: <span className="font-bold text-gray-700">+94 47 223 9000</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-green-50 text-green-700 border border-green-100 flex items-center justify-center shrink-0 shadow-3xs">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-800">Official Email</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <a href="mailto:support@guidelanka.com" className="font-bold text-gray-700 hover:text-green-700">support@guidelanka.com</a><br />
                      <a href="mailto:info@guidelanka.com" className="text-gray-500 hover:text-green-700">info@guidelanka.com</a>
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-green-50 text-green-700 border border-green-100 flex items-center justify-center shrink-0 shadow-3xs">
                    <Clock size={20} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-gray-800">Operational Hours</h3>
                    <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">
                      Daily: <strong>05:30 AM – 06:30 PM</strong> (Safari Operating Hours)<br />
                      Digital Support: <strong>24/7 Available</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* WhatsApp Quick Action */}
              <div className="pt-2 border-t border-gray-100">
                <a
                  href="https://wa.me/94771234567"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20ba59] text-white font-extrabold text-xs sm:text-sm py-3.5 px-4 rounded-2xl shadow-md transition transform active:scale-95 cursor-pointer"
                >
                  <MessageCircle size={18} />
                  <span>Chat on WhatsApp (+94 77 123 4567)</span>
                </a>
              </div>
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}

