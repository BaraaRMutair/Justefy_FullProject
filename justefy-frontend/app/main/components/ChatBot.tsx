"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageCircle,
  X,
  Send,
  Bot,
  Sparkles,
  Minimize2,
  Maximize2,
} from "lucide-react";

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState("");

  // ✅ يمنع hydration mismatch
  useEffect(() => {
    setMounted(true);

    let id = localStorage.getItem("chat_user_id");

    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("chat_user_id", id);
    }

    setUserId(id);

    const saved = localStorage.getItem("chat_messages");

    if (saved) {
      setMessages(JSON.parse(saved));
    } else {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          content: "مرحباً 👋 كيف يمكن لـ Justefy مساعدتك اليوم؟",
        },
      ]);
    }
  }, []);

  // حفظ الرسائل
  useEffect(() => {
    if (!mounted) return;

    localStorage.setItem(
      "chat_messages",
      JSON.stringify(messages.slice(-10))
    );

    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, mounted]);

  // منع أي render قبل mount
  if (!mounted) return null;

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMsg = {
      id: crypto.randomUUID(),
      role: "user",
      content: text,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/chat`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId, message: text }),
        }
      );

      const data = await res.json();

      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: data.aiResponse || "لا يوجد رد",
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          role: "assistant",
          content: "عذراً، تعذر الاتصال حالياً.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-full bg-justefy-500 text-white shadow-xl flex items-center justify-center"
          >
            <MessageCircle className="w-7 h-7" />
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              height: isMinimized ? "64px" : "500px",
            }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="w-96 bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-4 bg-justefy-500 text-white flex justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5" />
                <span className="font-bold text-sm">Justefy AI</span>
              </div>

              <div className="flex gap-2">
                <button onClick={() => setIsMinimized(!isMinimized)}>
                  {isMinimized ? (
                    <Maximize2 className="w-4 h-4" />
                  ) : (
                    <Minimize2 className="w-4 h-4" />
                  )}
                </button>
                <button onClick={() => setIsOpen(false)}>
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {!isMinimized && (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex ${
                        m.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      <div
                        className={`p-3 rounded-2xl text-sm max-w-[80%] ${
                          m.role === "user"
                            ? "bg-justefy-500 text-white"
                            : "bg-white text-black shadow"
                        }`}
                      >
                        {m.role === "assistant" && (
                          <Sparkles className="w-3 h-3 inline mr-1 text-justefy-400" />
                        )}
                        {m.content}
                      </div>
                    </div>
                  ))}

                  {isLoading && (
                    <div className="text-xs text-gray-400">
                      جاري التفكير...
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* Input */}
                <div className="p-4 border-t flex gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && sendMessage()
                    }
                    className="flex-1 bg-gray-100 px-3 py-2 rounded-xl text-sm"
                    placeholder="اسأل Justefy..."
                  />

                  <button
                    onClick={sendMessage}
                    className="bg-justefy-500 text-white px-3 rounded-xl"
                  >
                    <Send className="w-4 h-4" />
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