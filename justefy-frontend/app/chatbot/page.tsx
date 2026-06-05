"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { Send, User, Sparkles, Zap } from "lucide-react";
import Link from "next/link";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

const quickReplies = [
  { icon: "📢", text: "إعلانات السوشيال ميديا" },
  { icon: "🔍", text: "إعلانات جوجل" },
  { icon: "💬", text: "واتساب ماركتينج" },
  { icon: "📈", text: "تحسين SEO" },
  { icon: "🎨", text: "تصميم الهوية" },
  { icon: "💻", text: "تطوير المواقع" },
];

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: "أهلاً وسهلاً! \n\nأنا **مساعد Justefy الذكي**، جاهز أساعدك في:\n\n• اختيار الخدمة المناسبة لعملك\n• تقدير ميزانية حملتك الإعلانية\n• الإجابة على استفساراتك الفنية\n• حجز موعد مع فريقنا\n\n**كيف يمكنني مساعدتك اليوم؟**",
  timestamp: new Date(),
};

export default function ChatBotPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [userId, setUserId] = useState("");
  const [isClosed, setIsClosed] = useState(false);
  const [mounted, setMounted] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

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
        setMessages([WELCOME_MESSAGE]);
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
        setMessages([WELCOME_MESSAGE]); 
      }
    } else {
      setMessages([WELCOME_MESSAGE]);
    }
  }, []);

  useEffect(() => {
    if (!mounted || messages.length === 0) return;
    localStorage.setItem("chat_messages", JSON.stringify(messages.slice(-25)));
    scrollToBottom();
  }, [messages, mounted]);

  if (!mounted) return null;

  const sendMessage = async (text: string = input) => {
    if (!text.trim() || isLoading || isClosed) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          message: userMessage.content
        }),
      });

      const data = await response.json();

      if (data.status === "closed") {
        setIsClosed(true);
        localStorage.setItem("chat_closed_at", new Date().toISOString());
      }

      const botMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: data.aiResponse || "لا يوجد رد حالياً.",
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "عذراً، لا يمكنني الاتصال بالخادم الآن. حاول مرة أخرى لاحقاً.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-hero-gradient flex flex-col">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-xl border-b border-justefy-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-justefy-400 to-justefy-600 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-justefy-800">Justefy</span>
          </Link>
          
          <div className="flex items-center gap-3">
            <div className={`w-2 h-2 rounded-full ${isClosed ? "bg-red-500" : "bg-green-500 animate-pulse"}`} />
            <span className="text-sm text-justefy-600">
              {isClosed ? "المحادثة مغلقة مؤقتاً" : "مساعد ذكي متصل"}
            </span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index === 0 ? 0 : 0.1 }}
              className={`flex gap-4 ${message.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                message.role === "assistant"
                  ? "bg-gradient-to-br from-justefy-400 to-justefy-600 shadow-lg shadow-justefy-500/20"
                  : "bg-justefy-100"
              }`}>
                {message.role === "assistant" ? (
                  <Sparkles className="w-5 h-5 text-white" />
                ) : (
                  <User className="w-5 h-5 text-justefy-600" />
                )}
              </div>

              <div className={`max-w-[80%] ${message.role === "user" ? "text-left" : ""}`}>
                <div className={`inline-block rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                  message.role === "assistant"
                    ? "bg-white shadow-lg shadow-justefy-100/50 text-justefy-800 rounded-tl-none"
                    : "bg-justefy-500 text-white rounded-tr-none"
                }`}>
                  <div className="whitespace-pre-line">{message.content}</div>
                </div>
                <div className={`text-xs mt-1.5 text-justefy-400 ${message.role === "user" ? "text-left" : ""}`}>
                  {message.timestamp ? message.timestamp.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" }) : ""}
                </div>
              </div>
            </motion.div>
          ))}

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-4">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-justefy-400 to-justefy-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white animate-spin" />
              </div>
              <div className="bg-white shadow-lg rounded-2xl rounded-tl-none px-5 py-3">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-justefy-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-justefy-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-justefy-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Replies */}
      {messages.length < 3 && !isClosed && (
        <div className="max-w-4xl mx-auto px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply) => (
              <button
                key={reply.text}
                onClick={() => sendMessage(reply.text)}
                disabled={isLoading}
                className="px-4 py-2 bg-white hover:bg-justefy-50 text-justefy-700 text-sm rounded-full transition-all border border-justefy-200 hover:border-justefy-300 hover:shadow-md disabled:opacity-50"
              >
                <span className="ml-1">{reply.icon}</span>
                {reply.text}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="bg-white/80 backdrop-blur-xl border-t border-justefy-100 p-4">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={isClosed || isLoading}
            placeholder={isClosed ? "تم تحويل استفسارك لخدمة العملاء بنجاح..." : "اكتب رسالتك هنا..."}
            className="flex-1 px-5 py-3 bg-justefy-50 rounded-2xl border border-justefy-200 focus:border-justefy-500 focus:ring-2 focus:ring-justefy-200 outline-none transition-all text-justefy-800 placeholder:text-justefy-400 disabled:opacity-60"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading || isClosed}
            className="w-12 h-12 bg-justefy-500 text-white rounded-2xl flex items-center justify-center hover:bg-justefy-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-justefy-500/30"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}