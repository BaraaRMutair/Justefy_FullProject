"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Send, 
  Bot, 
  User, 
  Sparkles,
  ArrowLeft,
  Zap
} from "lucide-react";
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

export default function ChatBotPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: "أهلاً وسهلاً! \n\nأنا **مساعد Justefy الذكي**، جاهز أساعدك في:\n\n• اختيار الخدمة المناسبة لعملك\n• تقدير ميزانية حملتك الإعلانية\n• الإجابة على استفساراتك الفنية\n• حجز موعد مع فريقنا\n\n**كيف يمكنني مساعدتك اليوم؟**",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text: string = input) => {
    if (!text.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: text.trim(),
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
     const response = await fetch(
  `${process.env.NEXT_PUBLIC_API_URL}/api/chat`,
  {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
  userId: crypto.randomUUID(),
  message: userMessage.content
}),
      });

      const data = await response.json();

      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
       content: data.aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "عذراً، لا يمكنني الاتصال بالخادم الآن. حاول مرة أخرى لاحقاً أو تواصل معنا مباشرة على واتساب.",
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
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-justefy-600">مساعد ذكي متصل</span>
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
              {/* Avatar */}
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

              {/* Content */}
              <div className={`max-w-[80%] ${message.role === "user" ? "text-left" : ""}`}>
                <div className={`inline-block rounded-2xl px-5 py-3 text-sm leading-relaxed ${
                  message.role === "assistant"
                    ? "bg-white shadow-lg shadow-justefy-100/50 text-justefy-800 rounded-tl-none"
                    : "bg-justefy-500 text-white rounded-tr-none"
                }`}>
                  <div className="whitespace-pre-line">{message.content}</div>
                </div>
                <div className={`text-xs mt-1.5 text-justefy-400 ${
                  message.role === "user" ? "text-left" : ""
                }`}>
                  {message.timestamp.toLocaleTimeString("ar-SA", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Loading */}
          {isLoading && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex gap-4"
            >
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
      {messages.length < 3 && (
        <div className="max-w-4xl mx-auto px-4 pb-4">
          <div className="flex flex-wrap gap-2">
            {quickReplies.map((reply) => (
              <button
                key={reply.text}
                onClick={() => sendMessage(reply.text)}
                className="px-4 py-2 bg-white hover:bg-justefy-50 text-justefy-700 text-sm rounded-full transition-all border border-justefy-200 hover:border-justefy-300 hover:shadow-md"
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
            placeholder="اكتب رسالتك هنا..."
            className="flex-1 px-5 py-3 bg-justefy-50 rounded-2xl border border-justefy-200 focus:border-justefy-500 focus:ring-2 focus:ring-justefy-200 outline-none transition-all text-justefy-800 placeholder:text-justefy-400"
          />
          <button
            onClick={() => sendMessage()}
            disabled={!input.trim() || isLoading}
            className="w-12 h-12 bg-justefy-500 text-white rounded-2xl flex items-center justify-center hover:bg-justefy-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-justefy-500/30 btn-lift"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}