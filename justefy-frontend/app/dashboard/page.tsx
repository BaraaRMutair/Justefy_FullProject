"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
    Users, CreditCard, Activity, TrendingUp, 
    RefreshCcw, AlertCircle, Calendar, ArrowUpRight 
} from "lucide-react";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, Cell 
} from 'recharts';

export default function DashboardPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    // 🌐 جلب رابط الباك إند بشكل ديناميكي (السحاب أو اللوكال)
    const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    const fetchData = async () => {
        setLoading(true);
        try {
            // ✅ تم التعديل ليقرأ من الرابط الديناميكي
            const res = await fetch(`${API_BASE_URL}/api/dashboard`, {
                cache: "no-store" 
            });

            if (!res.ok) throw new Error("Network response was not ok");

            const result = await res.json();
            console.log("البيانات المستلمة:", result); 

            if (result.success) {
                setData(result);
            }
        } catch (err) {
            console.error("Fetch error:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, []);

    const chartData = [
        { name: 'نشط', value: data?.stats?.totalActive || 0, color: '#f97316' },
        { name: 'قريب الانتهاء', value: data?.stats?.totalExpiring || 0, color: '#fb923c' },
        { name: 'منتهي', value: data?.stats?.totalExpired || 0, color: '#444' },
    ];

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}>
                <RefreshCcw className="w-12 h-12 text-justefy-500" />
            </motion.div>
            <p className="text-gray-400">جاري سحب بيانات Odoo 19...</p>
        </div>
    );

    return (
        <div className="space-y-10">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-black text-white tracking-tight">لوحة تحكم Justefy</h1>
                </div>
                <button
                    onClick={async () => {
                        setLoading(true);
                        try {
                            // ✅ تم التعديل ليقرأ من الرابط الديناميكي عند التحديث
                            await fetch(`${API_BASE_URL}/api/dashboard/refresh`, {
                                method: "POST",
                            });

                            await fetchData();
                        } catch (err) {
                            console.error("Refresh error:", err);
                        } finally {
                            setLoading(false);
                        }
                    }}
                    className="group flex items-center gap-2 bg-justefy-500 hover:bg-justefy-600 text-white px-6 py-3 rounded-2xl font-bold transition-all shadow-lg shadow-justefy-500/20"
                >
                    <RefreshCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                    تحديث البيانات
                </button>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard title="الاشتراكات النشطة" value={data?.stats?.totalActive} icon={<Activity />} trend="+12%" color="#f97316" />
                <StatCard title="إجمالي الإيرادات" value={`${data?.stats?.totalRevenue?.toLocaleString()} ₪`} icon={<CreditCard />} trend="مباشر" color="#34d399" />
                <StatCard title="قريب الانتهاء" value={data?.stats?.totalExpiring} icon={<Calendar />} trend="تنبيه" color="#fb923c" />
                <StatCard title="حالة النظام" value="مستقر" icon={<TrendingUp />} trend="100%" color="#8b5cf6" />
            </div>

            {/* Charts & Table */}
            <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-sm shadow-2xl">
                    <h3 className="text-xl font-bold mb-8 flex items-center gap-3">
                        <span className="w-1.5 h-6 bg-justefy-500 rounded-full"></span>
                        تحليل الاشتراكات (Odoo Data)
                    </h3>
                    <div className="h-[300px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData}>
                                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#666', fontSize: 12}} dy={10} />
                                <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} contentStyle={{backgroundColor: '#18181b', border: 'none', borderRadius: '15px'}} />
                                <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={50}>
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-8 shadow-2xl">
                    <h3 className="text-xl font-bold mb-6">آخر الاشتراكات</h3>
                    <div className="space-y-5">
                        {data?.subscriptions?.slice(0, 6).map((sub: any) => (
                            <div key={sub.id} className="flex items-center justify-between group p-3 hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/5">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-lg bg-justefy-500/10 flex items-center justify-center text-justefy-500 font-bold">
                                        {sub.client?.[0] || 'C'}
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-white">{sub.client}</p>
                                        <p className="text-[10px] text-gray-500 uppercase tracking-widest">{sub.expiry}</p>
                                    </div>
                                </div>
                                <div className={`w-2 h-2 rounded-full ${sub.status === 'ACTIVE' ? 'bg-green-500' : 'bg-red-500'} shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

function StatCard({ title, value, icon, trend, color }: any) {
    return (
        <motion.div whileHover={{ y: -5 }} className="bg-white/[0.03] border border-white/10 p-7 rounded-[2rem] relative overflow-hidden group shadow-xl">
            <div className="flex justify-between items-start mb-6">
                <div className="p-3 rounded-xl bg-white/5 text-white" style={{ color: color }}>
                    {icon}
                </div>
                <span className="text-[9px] font-bold px-2 py-1 bg-white/5 rounded-md text-justefy-400 uppercase">
                    {trend}
                </span>
            </div>
            <p className="text-gray-500 text-xs font-medium mb-1">{title}</p>
            <h2 className="text-2xl font-black text-white">{value || 0}</h2>
            <div className="absolute -top-10 -right-10 w-24 h-24 blur-[60px] opacity-20 pointer-events-none rounded-full" style={{ backgroundColor: color }} />
        </motion.div>
    );
}