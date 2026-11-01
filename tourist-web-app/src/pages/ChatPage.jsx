import { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import { Send, PhoneCall, Info, X, Calendar, Clock, AlertTriangle, MoreVertical } from 'lucide-react';
import { supabase } from '../services/supabase';
import { AuthContext } from '../context/AuthContext';
import { API_BASE_URL } from '../services/apiConfig';

export default function ChatPage() {
  const { bookingId } = useParams();
  const location = useLocation();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [driverName, setDriverName] = useState(location.state?.driverName || "Safari Driver");
  const [driverId, setDriverId] = useState(location.state?.driverId || null);
  const [touristId, setTouristId] = useState(location.state?.touristId || null);
  const myId = touristId;

  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [bookingDetails, setBookingDetails] = useState(null);
  const [avatarError, setAvatarError] = useState(false);
  const [isCancelConfirmOpen, setIsCancelConfirmOpen] = useState(false);
  const [selectedMessageForAction, setSelectedMessageForAction] = useState(null);
  const [deletedMsgIds, setDeletedMsgIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`deleted_msgs_${bookingId}`);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    let isMounted = true;

    const fetchBookingAndDriverDetails = async () => {
      try {
        const { data: booking, error: bookingError } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();

        if (bookingError) throw bookingError;

        if (booking && isMounted) {
          setTouristId(booking.tourist_id);
          setDriverId(booking.driver_id);
          setBookingDetails(booking);

          const { data: driver, error: driverError } = await supabase
            .from('users')
            .select('full_name')
            .eq('id', booking.driver_id)
            .single();

          if (driverError) throw driverError;
          if (driver && driver.full_name && isMounted) {
            setDriverName(driver.full_name);
          }
        }
      } catch (err) {
        console.error("Error fetching booking/driver details:", err);
      }
    };

    fetchBookingAndDriverDetails();

    return () => {
      isMounted = false;
    };
  }, [bookingId]);

  useEffect(() => {
    scrollToBottom();
  }, [chatMessages]);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (!error && data) {
        setChatMessages(prev => {
          if (JSON.stringify(prev) !== JSON.stringify(data)) {
            return data;
          }
          return prev;
        });
      }
    };

    fetchMessages();

    const channel = supabase
      .channel(`chat_${bookingId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        if (payload.eventType === 'INSERT') {
          if (payload.new.booking_id === bookingId) {
            setChatMessages(currentMessages => {
              if (currentMessages.some(m => m.id === payload.new.id)) {
                return currentMessages;
              }
              return [...currentMessages, payload.new];
            });
          }
        } else if (payload.eventType === 'DELETE') {
          setChatMessages(currentMessages => currentMessages.filter(m => m.id !== payload.old.id));
        }
      })
      .subscribe();

    const interval = setInterval(fetchMessages, 3000);

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [bookingId]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim() || !touristId || !user) return;

    const tempMessage = message;
    setMessage("");

    try {
      const response = await fetch(`${API_BASE_URL}/api/chat/sendMessage`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${user.token}`
        },
        body: JSON.stringify({
          booking_id: bookingId,
          text: tempMessage,
          driverId: driverId,
          sender_id: touristId
        })
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        console.error("Backend Error:", data.error);
        setMessage(tempMessage);
      } else if (data.data) {
        setChatMessages(currentMessages => {
          if (currentMessages.some(m => m.id === data.data.id)) {
            return currentMessages;
          }
          return [...currentMessages, data.data];
        });
      }
    } catch (error) {
      console.error("Network Error:", error);
      setMessage(tempMessage);
    }
  };

  const handleCallClick = async () => {
    if (!driverId) {
      alert("දුරකථන අංකය සොයාගැනීමට නොහැක.");
      return;
    }

    try {
      const { data } = await supabase
        .from('users')
        .select('phone_number')
        .eq('id', driverId)
        .single();

      if (data && data.phone_number) {
        window.location.href = `tel:${data.phone_number}`;
      } else {
        alert("මෙම රියදුරාගේ දුරකථන අංකය පද්ධතියේ සඳහන් කර නැත.");
      }
    } catch (error) {
      console.error("Error fetching phone number:", error);
    }
  };

  const handleInfoClick = async () => {
    if (!bookingDetails) {
      const { data } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (data) setBookingDetails(data);
    }
    setIsInfoOpen(true);
  };

  const handleCancelBooking = () => {
    setIsCancelConfirmOpen(true);
  };

  const confirmCancelBooking = async () => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'CANCELLED' })
        .eq('id', bookingId);

      if (error) throw error;

      alert("Booking cancelled successfully!");
      setBookingDetails(prev => ({ ...prev, status: 'CANCELLED' }));
      setIsInfoOpen(false);
      setIsCancelConfirmOpen(false);

      navigate('/profile');
    } catch (error) {
      console.error("Error cancelling booking:", error.message);
      alert("Failed to cancel booking: " + error.message);
      setIsCancelConfirmOpen(false);
    }
  };

  const handleDeleteForMe = (msgId) => {
    const updated = [...deletedMsgIds, msgId];
    setDeletedMsgIds(updated);
    localStorage.setItem(`deleted_msgs_${bookingId}`, JSON.stringify(updated));
    setSelectedMessageForAction(null);
  };

  const handleDeleteForEveryone = async (msgId) => {
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', msgId);

      if (error) throw error;

      setChatMessages(prev => prev.filter(m => m.id !== msgId));
      setSelectedMessageForAction(null);
    } catch (error) {
      console.error("Error deleting message for everyone:", error.message);
      alert("Failed to delete message: " + error.message);
    }
  };

  const avatarUrl = location.state?.driverAvatar || `${API_BASE_URL}/uploads/avatars/${driverId}.jpg`;

  return (
    <div className="pt-20 sm:pt-24 pb-4 sm:pb-8 min-h-screen bg-gray-50/50 flex flex-col items-center justify-center p-2 sm:p-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden flex flex-col h-[calc(100dvh-100px)] sm:h-[80vh] min-h-115 border border-gray-100 relative">

        <div className="bg-linear-to-r from-green-800 to-green-700 text-white px-3.5 sm:px-6 py-3 sm:py-4 flex justify-between items-center shadow-md z-10 shrink-0">
          <div className="flex items-center space-x-2.5 sm:space-x-3.5 min-w-0">
            <div className="w-9 h-9 sm:w-11 sm:h-11 bg-white text-green-800 rounded-full flex items-center justify-center font-black text-sm sm:text-lg shadow-inner overflow-hidden relative shrink-0">
              {!avatarError && driverId ? (
                <img
                  src={avatarUrl}
                  alt={driverName}
                  onError={() => setAvatarError(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                driverName.charAt(0)
              )}
            </div>
            <div className="min-w-0">
              <h2 className="font-extrabold text-sm sm:text-base md:text-lg tracking-tight leading-tight truncate">{driverName}</h2>
              <p className="text-green-300 text-[10px] sm:text-xs flex items-center mt-0.5">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-1.5 animate-pulse shrink-0"></span> Online
              </p>
            </div>
          </div>
          <div className="flex space-x-1.5 sm:space-x-2 md:space-x-3 shrink-0">
            <button
              onClick={handleCallClick}
              className="p-2 sm:p-2.5 bg-green-700/60 hover:bg-green-600/80 rounded-xl transition border border-green-600/20"
              title="Call Driver"
              aria-label="Call Driver"
            >
              <PhoneCall size={16} className="sm:w-4.5 sm:h-4.5" />
            </button>
            <button
              onClick={handleInfoClick}
              className="p-2 sm:p-2.5 bg-green-700/60 hover:bg-green-600/80 rounded-xl transition border border-green-600/20"
              title="Booking Info"
              aria-label="Booking Info"
            >
              <Info size={16} className="sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        </div>

        <div className="flex-1 p-3 sm:p-5 md:p-6 overflow-y-auto bg-gray-50/50 space-y-3 sm:space-y-4">
          <div className="text-center text-[10px] text-gray-400 uppercase tracking-wider my-1 sm:my-2">Chat Secured via SSL</div>

          {chatMessages.filter(msg => !deletedMsgIds.includes(msg.id)).map((msg) => {
            const isMe = msg.sender_id === myId;
            const timeStr = msg.created_at
              ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
              : '';

            return (
              <div key={msg.id} className={`flex items-center gap-1 group ${isMe ? 'justify-end' : 'justify-start'}`}>
                {isMe && (
                  <button
                    onClick={() => setSelectedMessageForAction(msg)}
                    className="opacity-70 sm:opacity-0 sm:group-hover:opacity-75 focus:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition cursor-pointer rounded-lg hover:bg-gray-100 shrink-0"
                    title="Message Options"
                  >
                    <MoreVertical size={14} />
                  </button>
                )}

                <div className={`p-3 sm:p-3.5 max-w-[88%] sm:max-w-[78%] md:max-w-[70%] rounded-2xl shadow-xs text-xs sm:text-sm ${
                  isMe
                    ? 'bg-linear-to-tr from-[#024C25] to-[#01381b] text-white rounded-tr-none'
                    : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'
                }`}>
                  <p className="leading-relaxed font-medium wrap-break-word">{msg.text}</p>
                  <div className={`text-[9px] mt-1 text-right font-bold ${isMe ? 'text-green-200/80' : 'text-gray-400'}`}>
                    {timeStr}
                  </div>
                </div>

                {!isMe && (
                  <button
                    onClick={() => setSelectedMessageForAction(msg)}
                    className="opacity-70 sm:opacity-0 sm:group-hover:opacity-75 focus:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition cursor-pointer rounded-lg hover:bg-gray-100 shrink-0"
                    title="Message Options"
                  >
                    <MoreVertical size={14} />
                  </button>
                )}
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-2.5 sm:p-4 bg-white border-t border-gray-100 shrink-0">
          {user ? (
            <form onSubmit={handleSendMessage} className="flex space-x-2 sm:space-x-3">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="flex-1 bg-gray-50 border border-gray-200 px-3.5 sm:px-5 py-2.5 sm:py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-green-600 focus:bg-white text-xs sm:text-sm font-medium text-gray-800 transition"
              />
              <button
                type="submit"
                className="bg-[#024C25] hover:bg-[#01381b] text-white p-2.5 sm:p-3 rounded-2xl transition shadow-md flex justify-center items-center h-10 w-10 sm:h-12 sm:w-12 shrink-0 cursor-pointer"
                aria-label="Send Message"
              >
                <Send size={16} className="sm:w-4.5 sm:h-4.5 ml-0.5" />
              </button>
            </form>
          ) : (
            <div className="bg-red-50 text-red-600 p-2.5 sm:p-3 text-center rounded-2xl font-bold border border-red-100 text-xs sm:text-sm">
              You must be logged in to send messages.
            </div>
          )}
        </div>

        {isInfoOpen && (
          <div className="absolute inset-0 bg-black/45 flex justify-center items-center z-50 backdrop-blur-sm transition-all">
            <div className="bg-white p-6 rounded-3xl max-w-sm w-full mx-4 shadow-2xl relative animate-in fade-in zoom-in duration-200 border border-gray-50">
              <button
                onClick={() => setIsInfoOpen(false)}
                className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
              >
                <X size={22} />
              </button>

              <h3 className="text-lg font-black text-gray-800 mb-6 border-b pb-3 border-gray-100">Booking Details</h3>

              {bookingDetails ? (
                <div className="space-y-4">
                  <div className="flex items-center text-gray-700">
                    <div className="p-2.5 bg-green-50 text-green-700 rounded-xl mr-3">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Date</p>
                      <p className="font-bold text-sm text-gray-700 mt-0.5">{bookingDetails.booking_date}</p>
                    </div>
                  </div>

                  <div className="flex items-center text-gray-700">
                    <div className="p-2.5 bg-green-50 text-green-700 rounded-xl mr-3">
                      <Clock size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Time Slot</p>
                      <p className="font-bold text-sm text-gray-700 capitalize mt-0.5">{bookingDetails.time_slot}</p>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-gray-100 text-center">
                    <span className={`px-4 py-2 rounded-full text-xs font-black border uppercase tracking-wider ${
                      bookingDetails.status === 'PENDING'
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : bookingDetails.status === 'CANCELLED'
                          ? 'bg-rose-50 text-rose-700 border-rose-100'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-100'
                    }`}>
                      {bookingDetails.status}
                    </span>
                  </div>

                  {(bookingDetails.status === 'PENDING' || bookingDetails.status === 'CONFIRMED' || bookingDetails.status === 'APPROVED') && (
                    <div className="mt-4">
                      <button
                        onClick={handleCancelBooking}
                        className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold py-2.5 px-4 rounded-xl text-xs border border-rose-250 hover:border-rose-300 transition active:scale-95 cursor-pointer"
                      >
                        Cancel Booking
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-6">Loading details...</div>
              )}
            </div>
          </div>
        )}

      </div>

      {isCancelConfirmOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setIsCancelConfirmOpen(false)}
          ></div>

          <div className="relative bg-white rounded-3xl w-full max-w-sm shadow-2xl z-10 overflow-hidden transform transition-all duration-300 border border-gray-100 flex flex-col p-6 text-center animate-in scale-in-95">

            <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center text-rose-600 mx-auto mb-4 border border-rose-100">
              <AlertTriangle size={26} />
            </div>

            <h3 className="text-xl font-black text-gray-900 mb-2">Cancel Reservation?</h3>
            <p className="text-gray-500 text-sm leading-relaxed mb-6">
              Are you sure you want to cancel this booking? This action cannot be undone and your allocated safari guide will be released.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setIsCancelConfirmOpen(false)}
                className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-4 rounded-xl transition duration-150 active:scale-95 text-xs cursor-pointer"
              >
                Keep Booking
              </button>
              <button
                onClick={confirmCancelBooking}
                className="flex-1 bg-rose-600 hover:bg-rose-700 text-white font-bold py-3 px-4 rounded-xl transition duration-150 active:scale-95 text-xs shadow-md shadow-rose-700/10 cursor-pointer"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedMessageForAction && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setSelectedMessageForAction(null)}
          ></div>
          <div className="relative bg-white rounded-3xl w-full max-w-xs shadow-2xl z-10 p-5 flex flex-col border border-gray-100 animate-in scale-in-95 duration-150 text-center">
            <h3 className="text-sm font-black text-gray-800 mb-4">Message Options</h3>

            <div className="space-y-2">
              <button
                onClick={() => handleDeleteForMe(selectedMessageForAction.id)}
                className="w-full flex items-center justify-between text-left text-xs font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 px-4 py-3 rounded-xl transition cursor-pointer"
              >
                <span>Delete for me</span>
                <span className="text-gray-400 font-semibold text-[10px]">Only hides for you</span>
              </button>

              {selectedMessageForAction.sender_id === myId && (
                <button
                  onClick={() => handleDeleteForEveryone(selectedMessageForAction.id)}
                  className="w-full flex items-center justify-between text-left text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100/70 px-4 py-3 rounded-xl transition cursor-pointer border border-rose-100"
                >
                  <span>Delete for everyone</span>
                  <span className="text-rose-400 font-semibold text-[10px]">Deletes for both</span>
                </button>
              )}
            </div>

            <button
              onClick={() => setSelectedMessageForAction(null)}
              className="mt-4 w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-2.5 px-4 rounded-xl transition text-xs cursor-pointer text-center"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
