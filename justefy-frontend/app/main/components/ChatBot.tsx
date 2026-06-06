"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Minimize2, Maximize2, Zap, Sparkles } from "lucide-react";

type Message = {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
};

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [userId, setUserId] = useState("");
  const [isClosed, setIsClosed] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    let id = localStorage.getItem("chat_user_id");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("chat_user_id", id);
    }
    setUserId(id);

    const saved = localStorage.getItem("chat_messages");
    const closedTime = localStorage.getItem("chat_closed_at");

    if (closedTime) {
      const timePast = Date.now() - new Date(closedTime).getTime();
      
      if (timePast > 3600000) { 
        localStorage.removeItem("chat_messages");
        localStorage.removeItem("chat_closed_at");
        localStorage.removeItem("chat_user_id");
        
        const newId = crypto.randomUUID();
        localStorage.setItem("chat_user_id", newId);
        setUserId(newId);
        
        setMessages([{ id: "welcome", role: "assistant", content: "مرحباً، كيف يمكننا مساعدتك اليوم؟", timestamp: new Date() }]);
        setIsClosed(false);
        return;
      } else {
        setIsClosed(true);
      }
    }

    if (saved) {
      try { 
        const parsed = JSON.parse(saved).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(parsed); 
      } catch { 
        setMessages([{ id: "welcome", role: "assistant", content: "مرحباً، كيف يمكننا مساعدتك اليوم؟", timestamp: new Date() }]);
      }
    } else {
      setMessages([{ id: "welcome", role: "assistant", content: "مرحباً، كيف يمكننا مساعدتك اليوم؟", timestamp: new Date() }]);
    }
  }, []);

  useEffect(() => {
    if (!mounted || messages.length === 0) return;
    localStorage.setItem("chat_messages", JSON.stringify(messages.slice(-25)));
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, mounted]);

  if (!mounted) return null;

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading || isClosed) return;

    const userMsg: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, message: text }),
      });

      const data = await res.json();

      if (data.status === "closed") {
        const botMsg: Message = {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.aiResponse || "تم إنهاء المحادثة وتحويل طلبكم للفريق.",
          timestamp: new Date()
        };
        
        setMessages((prev) => [...prev, botMsg]);
        setIsLoading(false);
        setIsClosed(true);
        localStorage.setItem("chat_closed_at", new Date().toISOString());
        return; 
      }

      const botMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.aiResponse || "لا يوجد رد حالياً.",
        timestamp: new Date()
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "عذراً، تعذر الاتصال حالياً.",
          timestamp: new Date()
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 sm:bottom-6 sm:left-6 z-50">
      {/* زر الفتح */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setIsOpen(true)}
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-justefy-500 text-white shadow-xl flex items-center justify-center hover:bg-justefy-600 transition-colors"
          >
            <MessageCircle className="w-5 h-5 sm:w-6 sm:h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* نافذة الشات */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: isMinimized ? "56px" : "400px",
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="w-[calc(100vw-2rem)] max-w-sm sm:w-96 bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col"
            style={{ maxHeight: "80vh" }}
          >
            {/* Header */}
            <div className="p-3 sm:p-4 bg-justefy-500 text-white flex justify-between items-center flex-shrink-0">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="font-bold text-sm">Justefy AI</span>
              </div>
              <div className="flex gap-1.5 sm:gap-2">
                <button 
                  onClick={() => setIsMinimized(!isMinimized)} 
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  {isMinimized ? <Maximize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> : <Minimize2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
                </button>
                <button 
                  onClick={() => setIsOpen(false)} 
                  className="p-1.5 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2.5 sm:space-y-3 bg-gray-50 min-h-0">
                  {messages.map((m) => (
                    <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div className={`p-2.5 sm:p-3 rounded-2xl text-xs sm:text-sm max-w-[85%] sm:max-w-[80%] leading-relaxed ${m.role === "user" ? "bg-justefy-500 text-white" : "bg-white text-gray-800 shadow-sm"}`}>
                        {m.role === "assistant" && <Sparkles className="w-3 h-3 inline mr-1 text-justefy-400" />}
                        {m.content}
                      </div>
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex items-center gap-2 text-xs text-gray-400 animate-pulse">
                      <div className="w-4 h-4 border-2 border-justefy-300 border-t-justefy-500 rounded-full animate-spin" />
                      جاري التفكير...
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-3 sm:p-4 border-t flex gap-2 flex-shrink-0 bg-white">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && !isClosed && !isLoading && sendMessage()}
                    className="flex-1 bg-gray-100 px-3 py-2 rounded-xl text-xs sm:text-sm disabled:opacity-50 outline-none focus:ring-2 focus:ring-justefy-200 transition-all placeholder:text-gray-400"
                    placeholder={isClosed ? "المحادثة مغلقة..." : "اكتب رسالتك..."}
                    disabled={isClosed || isLoading}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isClosed || isLoading || !input.trim()}
                    className="bg-justefy-500 text-white px-3 py-2 rounded-xl disabled:bg-gray-300 transition-colors hover:bg-justefy-600 flex items-center justify-center"
                  >
                    <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}