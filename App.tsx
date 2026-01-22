
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingBag, 
  User as UserIcon, 
  Search, 
  Menu, 
  X, 
  ChevronRight,
  Star, 
  Trash2,
  Plus,
  Minus,
  CheckCircle2,
  LayoutDashboard,
  LogOut,
  ArrowLeft,
  Filter,
  Ticket,
  Check,
  AlertCircle,
  Lock,
  ShieldCheck,
  CreditCard,
  Package,
  Truck,
  Clock,
  MapPin,
  Loader2,
  Shield,
  Eye,
  EyeOff,
  Mail,
  Bell,
  ExternalLink,
  ChevronDown,
  Zap,
  TrendingUp,
  Activity,
  Calendar,
  Layers,
  Store,
  UserCheck,
  Box,
  Monitor,
  Tag,
  Archive,
  BarChart3,
  Receipt,
  Scan,
  RefreshCw,
  Settings2,
  MessageSquare,
  Send,
  ThumbsUp,
  Wallet,
  Coins,
  History,
  Printer,
  Users
} from 'lucide-react';
import { Product, CartItem, User, Order, View, Category, Notification, Coupon, ProductVariant, Review, PaymentMethod, Shift } from './types';
import { MOCK_PRODUCTS, CATEGORIES, FEATURES } from './constants';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { GoogleGenAI, Type } from "@google/genai";

// --- Gemini Email Service ---

const generateEmailContent = async (order: Order, type: 'confirmation' | 'shipping' | 'delivery', userEmail: string) => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const itemsList = order.items.map(i => `${i.name} (x${i.quantity})`).join(', ');
    const prompt = `Generate a highly professional e-commerce email ${type === 'confirmation' ? 'order confirmation' : type === 'shipping' ? 'shipping update' : 'delivery confirmation'} for a brand called NOVA.
    Order ID: ${order.id}
    Total: $${order.total}
    Items: ${itemsList}
    User Email: ${userEmail}
    Keep the tone premium, modern, and reassuring. The output should be a JSON object with "subject" and "body" (plain text with nice spacing).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            subject: { type: Type.STRING },
            body: { type: Type.STRING },
          },
          required: ["subject", "body"],
        }
      }
    });

    const result = JSON.parse(response.text || '{}');
    return {
      subject: result.subject || `NOVA: Update for Order ${order.id}`,
      body: result.body || `Your order ${order.id} has been updated to ${order.status}.`
    };
  } catch (error) {
    console.error("Failed to generate email content", error);
    return {
      subject: `NOVA: Order Update ${order.id}`,
      body: `Hello, your order ${order.id} is currently ${order.status}. Thank you for shopping with NOVA.`
    };
  }
};

// --- Helper Components ---

const Stars: React.FC<{ rating: number, size?: string }> = ({ rating, size = "w-4 h-4" }) => {
  return (
    <div className="flex items-center gap-0.5 text-amber-400">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star 
          key={star} 
          className={`${size} ${star <= Math.round(rating) ? 'fill-current' : 'text-slate-200'}`} 
        />
      ))}
    </div>
  );
};

const OrderTracker: React.FC<{ status: Order['status'] }> = ({ status }) => {
  const steps = [
    { key: 'pending', label: 'Placed', icon: <ShoppingBag className="w-4 h-4" /> },
    { key: 'processing', label: 'Processing', icon: <Box className="w-4 h-4" /> },
    { key: 'shipped', label: 'Shipped', icon: <Truck className="w-4 h-4" /> },
    { key: 'delivered', label: 'Delivered', icon: <CheckCircle2 className="w-4 h-4" /> },
  ];

  const currentStepIndex = steps.findIndex(s => s.key === status);
  const activeStepIndex = status === 'cancelled' ? -1 : (currentStepIndex === -1 ? 0 : currentStepIndex);

  return (
    <div className="w-full py-4">
      {status === 'cancelled' ? (
        <div className="flex items-center gap-3 text-red-600 bg-red-50 p-4 rounded-2xl border border-red-100">
          <AlertCircle className="w-5 h-5" />
          <p className="text-sm font-bold">This order has been cancelled.</p>
        </div>
      ) : (
        <div className="relative flex justify-between">
          <div className="absolute top-5 left-0 w-full h-0.5 bg-slate-100 -z-0" />
          <div 
            className="absolute top-5 left-0 h-0.5 bg-indigo-600 transition-all duration-700 -z-0" 
            style={{ width: `${(activeStepIndex / (steps.length - 1)) * 100}%` }}
          />
          {steps.map((step, index) => {
            const isCompleted = index <= activeStepIndex;
            const isCurrent = index === activeStepIndex;
            
            return (
              <div key={step.key} className="relative z-10 flex flex-col items-center group">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-4 ${
                  isCompleted 
                    ? 'bg-indigo-600 border-indigo-100 text-white' 
                    : 'bg-white border-slate-50 text-slate-300'
                } ${isCurrent ? 'ring-4 ring-indigo-50 shadow-lg scale-110' : ''}`}>
                  {isCompleted && index < activeStepIndex ? <Check className="w-5 h-5" /> : step.icon}
                </div>
                <span className={`mt-3 text-[10px] font-black uppercase tracking-widest transition-colors ${
                  isCompleted ? 'text-indigo-600' : 'text-slate-400'
                }`}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// --- POS Components ---

const ReceiptModal: React.FC<{ order: Order, onClose: () => void }> = ({ order, onClose }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
    <div className="bg-white w-full max-w-sm rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
      <div className="p-8 text-center border-b-2 border-dashed border-slate-100">
        <span className="text-3xl font-black tracking-tighter text-indigo-600">NOVA</span>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2">Store #082 • Los Angeles, CA</p>
      </div>
      <div className="p-8 space-y-6">
        <div className="flex justify-between text-[10px] font-black uppercase text-slate-400">
          <span>{order.id}</span>
          <span>{order.date}</span>
        </div>
        <div className="space-y-3">
          {order.items.map((item, i) => (
            <div key={i} className="flex justify-between text-xs font-bold text-slate-700">
              <span>{item.name} x{item.quantity}</span>
              <span>${(item.price * item.quantity).toLocaleString()}</span>
            </div>
          ))}
        </div>
        <div className="pt-4 border-t border-slate-100 space-y-2">
          <div className="flex justify-between text-xs text-slate-500"><span>Tax (8%)</span><span>${order.tax.toLocaleString()}</span></div>
          <div className="flex justify-between text-lg font-black text-slate-900"><span>Total</span><span>${order.total.toLocaleString()}</span></div>
        </div>
        <div className="bg-slate-50 p-4 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
            <CreditCard className="w-3 h-3" /> {order.paymentMethod?.replace('_', ' ')}
          </div>
          <div className="text-[10px] font-black text-indigo-600">AUTH: APPROVED</div>
        </div>
      </div>
      <div className="p-4 bg-slate-50 flex gap-2">
        <button onClick={onClose} className="flex-1 py-3 bg-white border border-slate-200 rounded-xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-100 transition-all">Close</button>
        <button className="flex-1 py-3 bg-indigo-600 rounded-xl text-xs font-black uppercase tracking-widest text-white shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center gap-2"><Printer className="w-4 h-4" /> Print</button>
      </div>
    </div>
  </div>
);

const POSTerminal: React.FC<{ 
  products: Product[], 
  user: User,
  onCheckout: (items: CartItem[], method: PaymentMethod) => void 
}> = ({ products, user, onCheckout }) => {
  const [query, setQuery] = useState('');
  const [posCart, setPosCart] = useState<CartItem[]>([]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);

  const filtered = products.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
  const subtotal = posCart.reduce((s, i) => s + (i.price * i.quantity), 0);
  const tax = Math.round(subtotal * 0.08);
  const total = subtotal + tax;

  const addItem = (p: Product) => {
    setPosCart(prev => {
      const exists = prev.find(i => i.id === p.id);
      if (exists) return prev.map(i => i.id === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { ...p, quantity: 1 }];
    });
  };

  const handleScan = () => {
    const random = products[Math.floor(Math.random() * products.length)];
    addItem(random);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[750px] animate-in fade-in duration-500">
      <div className="flex-1 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
        <div className="p-6 border-b border-slate-50 bg-slate-50/30 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input 
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search products..."
              className="w-full pl-12 pr-4 py-4 bg-white rounded-2xl border border-slate-100 focus:ring-2 focus:ring-indigo-500 font-medium"
            />
          </div>
          <button onClick={handleScan} className="px-6 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-600 transition-all"><Scan className="w-4 h-4" /> Scan</button>
        </div>
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(p => (
            <button 
              key={p.id}
              onClick={() => addItem(p)}
              className="flex flex-col text-left group border border-slate-100 p-3 rounded-2xl hover:border-indigo-600 hover:shadow-lg transition-all"
            >
              <div className="aspect-square bg-slate-50 rounded-xl overflow-hidden mb-3 relative">
                <img src={p.image} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                {p.stock < 10 && <span className="absolute bottom-2 right-2 bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded">LOW STOCK</span>}
              </div>
              <p className="font-bold text-slate-900 text-[10px] line-clamp-1">{p.name}</p>
              <p className="text-indigo-600 font-black text-xs">${p.price}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-[400px] bg-slate-900 rounded-[2.5rem] shadow-xl flex flex-col overflow-hidden text-white relative">
        <div className="p-8 border-b border-white/10 flex justify-between items-center">
          <div>
            <h4 className="font-black text-lg tracking-tight">Active Ticket</h4>
            <p className="text-[8px] font-black text-white/40 uppercase tracking-[0.2em] mt-1">Terminal #{user.id.slice(0,4)} • Staff: {user.name}</p>
          </div>
          <Receipt className="w-5 h-5 text-indigo-400" />
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 space-y-4">
          {posCart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/20">
              <ShoppingBag className="w-12 h-12 mb-4" />
              <p className="text-xs font-black uppercase tracking-[0.2em]">Bag is Empty</p>
            </div>
          ) : (
            posCart.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center gap-4 bg-white/5 p-4 rounded-2xl animate-in slide-in-from-right-4 duration-300">
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-xs truncate">{item.name}</p>
                  <p className="text-[10px] text-white/40 font-black">{item.quantity} x ${item.price}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-black text-indigo-400 text-xs">${item.price * item.quantity}</span>
                  <button onClick={() => setPosCart(prev => prev.filter((_, i) => i !== idx))} className="text-white/20 hover:text-rose-400 transition-colors"><X className="w-4 h-4" /></button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-8 bg-white/5 border-t border-white/10 space-y-6">
          <div className="space-y-2">
            <div className="flex justify-between text-[10px] font-black uppercase text-white/40"><span>Subtotal</span><span>${subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-[10px] font-black uppercase text-white/40"><span>Tax (8%)</span><span>${tax.toLocaleString()}</span></div>
            <div className="flex justify-between text-2xl font-black text-white pt-2 border-t border-white/5"><span>Total</span><span className="text-indigo-400">${total.toLocaleString()}</span></div>
          </div>
          
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'cash', icon: <Coins className="w-4 h-4" />, label: 'Cash' },
              { id: 'card', icon: <CreditCard className="w-4 h-4" />, label: 'Card' },
              { id: 'mobile_wallet', icon: <Wallet className="w-4 h-4" />, label: 'Wallet' }
            ].map(method => (
              <button 
                key={method.id}
                onClick={() => setPaymentMethod(method.id as PaymentMethod)}
                className={`py-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                  paymentMethod === method.id 
                    ? 'bg-indigo-600 border-indigo-600 text-white' 
                    : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'
                }`}
              >
                {method.icon}
                <span className="text-[8px] font-black uppercase">{method.label}</span>
              </button>
            ))}
          </div>

          <button 
            disabled={posCart.length === 0 || !paymentMethod}
            onClick={() => { onCheckout(posCart, paymentMethod!); setPosCart([]); setPaymentMethod(null); }}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-20 disabled:cursor-not-allowed rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all active:scale-[0.98] shadow-2xl shadow-indigo-600/40 flex items-center justify-center gap-3"
          >
            <ShieldCheck className="w-5 h-5" />
            Complete Transaction
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Staff View: Shift Management ---

const ShiftTracker: React.FC<{ user: User, shifts: Shift[], onOpen: () => void, onClose: (id: string) => void }> = ({ user, shifts, onOpen, onClose }) => {
  const activeShift = shifts.find(s => s.staffId === user.id && s.status === 'active');

  return (
    <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8">
        <div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Clock className="w-6 h-6 text-indigo-600" />
            Session Management
          </h2>
          <p className="text-slate-500 text-sm mt-2 font-medium">Track your presence and verify register balances.</p>
        </div>
        {activeShift ? (
          <div className="flex items-center gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Session Profit</p>
              <p className="text-xl font-black text-emerald-600">${activeShift.totalSales.toLocaleString()}</p>
            </div>
            <div className="w-px h-10 bg-slate-200" />
            <button 
              onClick={() => onClose(activeShift.id)}
              className="px-8 py-3 bg-rose-500 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-rose-600 transition-all shadow-lg shadow-rose-100"
            >
              End Shift
            </button>
          </div>
        ) : (
          <button 
            onClick={onOpen}
            className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-sm font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center gap-3"
          >
            <Zap className="w-5 h-5" />
            Start Session
          </button>
        )}
      </div>

      <div className="mt-12 space-y-4 pt-12 border-t border-slate-50">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><History className="w-3 h-3" /> Recent Session Logs</h4>
        {shifts.length === 0 ? <p className="text-slate-300 text-xs italic font-medium">No previous shifts found.</p> : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {shifts.map(shift => (
              <div key={shift.id} className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                <div className="flex justify-between items-center mb-4">
                  <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${shift.status === 'active' ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>{shift.status}</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase">{shift.startTime.split(',')[0]}</span>
                </div>
                <div className="flex justify-between text-xs font-black text-slate-900">
                  <span className="text-slate-500 uppercase tracking-widest text-[10px]">Collected</span>
                  <span>${shift.totalSales.toLocaleString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Dashboard View: Analytics & Reports ---

const AnalyticsReports: React.FC<{ orders: Order[] }> = ({ orders }) => {
  const data = useMemo(() => {
    const pos = orders.filter(o => o.type === 'pos').reduce((s, o) => s + o.total, 0);
    const online = orders.filter(o => o.type === 'online').reduce((s, o) => s + o.total, 0);
    return [
      { name: 'POS Sales', value: pos, color: '#6366f1' },
      { name: 'Online Sales', value: online, color: '#10b981' }
    ];
  }, [orders]);

  const totalRev = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
      <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h4 className="text-lg font-black text-slate-900 mb-10 flex items-center gap-2"><BarChart3 className="w-5 h-5 text-indigo-600" /> Channel Revenue Performance</h4>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={[{d:'Mon',s:2400},{d:'Tue',s:3200},{d:'Wed',s:2800},{d:'Thu',s:4500},{d:'Fri',s:5800},{d:'Sat',s:7200},{d:'Sun',s:8100}]}>
              <defs><linearGradient id="p-col" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/><stop offset="95%" stopColor="#6366f1" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="d" axisLine={false} tickLine={false} tick={{fontSize:10,fill:'#94a3b8',fontWeight:700}} />
              <YAxis axisLine={false} tickLine={false} tick={{fontSize:10,fill:'#94a3b8',fontWeight:700}} />
              <RechartsTooltip />
              <Area type="monotone" dataKey="s" stroke="#6366f1" strokeWidth={4} fill="url(#p-col)" dot={{r:4,fill:'#fff',stroke:'#6366f1',strokeWidth:2}} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h4 className="text-lg font-black text-slate-900 mb-10">Revenue Split</h4>
        <div className="h-64 flex items-center justify-center relative">
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</p>
            <p className="text-2xl font-black text-slate-900">${totalRev.toLocaleString()}</p>
          </div>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={data} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-4 mt-8">
          {data.map(d => (
            <div key={d.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{backgroundColor:d.color}} />
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">{d.name}</span>
              </div>
              <span className="text-xs font-black text-slate-900">${d.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- Staff View: Customer & Loyalty Management ---

const CustomerManagement: React.FC<{ users: User[] }> = ({ users }) => (
  <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm animate-in fade-in duration-500">
    <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
      <h4 className="text-lg font-black text-slate-900 flex items-center gap-2"><Users className="w-5 h-5 text-indigo-600" /> Loyalty Member Ledger</h4>
      <button className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-600 transition-all"><Plus className="w-3 h-3" /> New Customer</button>
    </div>
    <table className="w-full text-left">
      <thead>
        <tr className="border-b border-slate-50"><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Client Identity</th><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Email</th><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Points</th><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Status</th></tr>
      </thead>
      <tbody className="divide-y divide-slate-50">
        {users.map(u => (
          <tr key={u.id} className="group hover:bg-slate-50/50 transition-colors">
            <td className="px-8 py-6 flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs">{u.name.charAt(0)}</div>
              <span className="font-bold text-slate-900 text-sm">{u.name}</span>
            </td>
            <td className="px-8 py-6 text-slate-500 text-sm font-medium">{u.email}</td>
            <td className="px-8 py-6">
              <div className="flex items-center gap-2">
                <Coins className="w-4 h-4 text-amber-500" />
                <span className="font-black text-slate-900 text-sm">{u.loyaltyPoints || 0}</span>
              </div>
            </td>
            <td className="px-8 py-6 text-right"><span className="text-[8px] font-black uppercase tracking-widest px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg">Active</span></td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// --- Intelligence Hub (Admin Dashboard) ---

const AdminDashboard: React.FC<{ 
  user: User, 
  orders: Order[], 
  onUpdateStatus: (id: string, s: Order['status']) => void, 
  onNavigate: (v: View) => void,
  coupons: Coupon[],
  setCoupons: (c: Coupon[]) => void,
  onPOSCheckout: (items: CartItem[], method: PaymentMethod) => void,
  shifts: Shift[],
  onOpenShift: () => void,
  onCloseShift: (id: string) => void,
  allUsers: User[]
}> = ({ user, orders, onUpdateStatus, onNavigate, coupons, setCoupons, onPOSCheckout, shifts, onOpenShift, onCloseShift, allUsers }) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'pos' | 'marketing' | 'inventory' | 'customers' | 'shifts' | 'reports'>(user.role === 'cashier' ? 'pos' : 'overview');
  
  const stats = useMemo(() => {
    const rev = orders.reduce((s, o) => s + o.total, 0);
    const act = orders.filter(o => o.status !== 'delivered' && o.status !== 'cancelled').length;
    return { rev: rev.toLocaleString(), act, new: "142", perf: "99.4%" };
  }, [orders]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            {user.role === 'manager' ? <Shield className="w-8 h-8 text-indigo-600" /> : <Monitor className="w-8 h-8 text-emerald-600" />}
            {user.role === 'manager' ? 'Intelligence Hub' : 'POS Terminal v2.0'}
          </h1>
          <p className="text-slate-500 mt-2 font-medium tracking-tight">Active session as {user.name} • <span className="uppercase text-[10px] font-black bg-slate-100 px-2 py-0.5 rounded text-slate-400">{user.role}</span></p>
        </div>
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-100 shadow-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
          {user.role === 'manager' && (
            <>
              <button onClick={() => setActiveTab('overview')} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'overview' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>Reports</button>
              <button onClick={() => setActiveTab('inventory')} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'inventory' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>Inventory</button>
              <button onClick={() => setActiveTab('customers')} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'customers' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>Customers</button>
            </>
          )}
          <button onClick={() => setActiveTab('pos')} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'pos' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'text-slate-400 hover:bg-slate-50'}`}>Register</button>
          <button onClick={() => setActiveTab('orders')} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>Logistics</button>
          <button onClick={() => setActiveTab('shifts')} className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'shifts' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-400 hover:bg-slate-50'}`}>Shifts</button>
          <div className="w-px h-6 bg-slate-100 mx-2" />
          <button onClick={() => onNavigate('profile')} className="p-2.5 text-slate-300 hover:text-indigo-600 transition-colors"><ArrowLeft className="w-5 h-5" /></button>
        </div>
      </div>

      {activeTab === 'overview' && <div className="space-y-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { label: 'Total Revenue', val: `$${stats.rev}`, icon: <BarChart3 />, color: 'bg-indigo-50 text-indigo-600' },
            { label: 'Active Orders', val: stats.act, icon: <Package />, color: 'bg-emerald-50 text-emerald-600' },
            { label: 'Members', val: allUsers.length, icon: <Users />, color: 'bg-amber-50 text-amber-600' },
            { label: 'System Health', val: stats.perf, icon: <Activity />, color: 'bg-rose-50 text-rose-600' }
          ].map((s, i) => (
            <div key={i} className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 animate-in slide-in-from-bottom-4 duration-500" style={{animationDelay: `${i*100}ms`}}>
              <div className={`p-4 rounded-2xl ${s.color}`}>{s.icon}</div>
              <div><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.label}</p><h3 className="text-2xl font-black text-slate-900">{s.val}</h3></div>
            </div>
          ))}
        </div>
        <AnalyticsReports orders={orders} />
      </div>}

      {activeTab === 'pos' && <POSTerminal products={MOCK_PRODUCTS} user={user} onCheckout={onPOSCheckout} />}

      {activeTab === 'shifts' && <ShiftTracker user={user} shifts={shifts} onOpen={onOpenShift} onClose={onCloseShift} />}

      {activeTab === 'customers' && <CustomerManagement users={allUsers} />}

      {activeTab === 'inventory' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm animate-in fade-in duration-500">
          <div className="p-8 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
            <h4 className="text-lg font-black text-slate-900 flex items-center gap-2"><Archive className="w-5 h-5 text-indigo-600" /> Inventory Pipeline</h4>
            <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-white px-4 py-2 rounded-xl shadow-sm border border-indigo-50"><RefreshCw className="w-3 h-3" /> Sync Digital Stores</button>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50"><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU Detail</th><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">On Hand</th><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Unit Price</th><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Channel Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {MOCK_PRODUCTS.map(p => (
                <tr key={p.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-4">
                      <img src={p.image} className="w-10 h-10 rounded-lg object-cover" />
                      <div><p className="font-bold text-slate-900 text-sm">{p.name}</p><p className="text-[10px] font-black text-slate-400 uppercase">CAT: {p.category}</p></div>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <span className={`px-4 py-1.5 rounded-xl font-black text-xs ${p.stock < 10 ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-600'}`}>{p.stock} Units</span>
                  </td>
                  <td className="px-8 py-6 font-black text-slate-900 text-sm">${p.price}</td>
                  <td className="px-8 py-6 text-right"><span className={`text-[8px] font-black uppercase tracking-[0.2em] ${p.stock > 0 ? 'text-emerald-500' : 'text-rose-500'}`}>{p.stock > 0 ? 'Verified In-Store' : 'Replenish Required'}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'orders' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm animate-in fade-in duration-500">
          <div className="p-8 border-b border-slate-50 bg-slate-50/50">
            <h4 className="text-lg font-black text-slate-900 flex items-center gap-2"><Truck className="w-5 h-5 text-indigo-600" /> Order Fulfillment Pipeline</h4>
          </div>
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-50"><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Identifier</th><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Origin</th><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Total</th><th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Process Action</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {orders.map(o => (
                <tr key={o.id} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-6 font-black text-slate-900 text-sm">{o.id}</td>
                  <td className="px-8 py-6">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-lg ${o.type === 'pos' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>{o.type}</span>
                  </td>
                  <td className="px-8 py-6 font-black text-slate-900 text-sm">${o.total.toLocaleString()}</td>
                  <td className="px-8 py-6 text-right">
                    {o.status === 'processing' && <button onClick={() => onUpdateStatus(o.id, 'shipped')} className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-indigo-700 shadow-md">Dispatch Package</button>}
                    {o.status === 'shipped' && <button onClick={() => onUpdateStatus(o.id, 'delivered')} className="px-6 py-2 bg-emerald-600 text-white rounded-xl text-[8px] font-black uppercase tracking-widest hover:bg-emerald-700 shadow-md">Verify Handover</button>}
                    {o.status === 'delivered' && <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest flex items-center justify-end gap-1"><CheckCircle2 className="w-3 h-3" /> Processed</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// --- Product Detail View ---

const ProductDetailView: React.FC<{ 
  product: Product, 
  user: User | null,
  onAddToCart: (p: Product, variants?: Record<string, string>) => void,
  onBack: () => void,
  onAddReview: (productId: string, review: Omit<Review, 'id' | 'date'>) => void
}> = ({ product, user, onAddToCart, onBack, onAddReview }) => {
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [reviewName, setReviewName] = useState(user?.name || '');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    if (product.variants) {
      const defaults: Record<string, string> = {};
      product.variants.forEach(v => defaults[v.type] = v.options[0]);
      setSelectedVariants(defaults);
    }
  }, [product.variants]);

  const handleVariantChange = (type: string, value: string) => {
    setSelectedVariants(prev => ({ ...prev, [type]: value }));
  };

  const handleReviewSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewName || !reviewComment) return;
    setIsSubmittingReview(true);
    setTimeout(() => {
      onAddReview(product.id, {
        userName: reviewName,
        rating: reviewRating,
        comment: reviewComment
      });
      setReviewComment('');
      setIsSubmittingReview(false);
    }, 800);
  };

  const ratingSummary = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0];
    product.reviewsList?.forEach(r => counts[r.rating]++);
    return counts.slice(1).reverse();
  }, [product.reviewsList]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 animate-in fade-in duration-500">
      <button onClick={onBack} className="flex items-center gap-2 text-slate-400 mb-8 font-black text-xs uppercase hover:text-indigo-600 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Collection
      </button>

      <div className="bg-white rounded-[3rem] overflow-hidden border border-slate-100 shadow-sm mb-12">
        <div className="flex flex-col lg:flex-row">
          <div className="w-full lg:w-1/2 aspect-square overflow-hidden bg-slate-50">
            <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 p-12 lg:p-16 space-y-10">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">{product.category}</span>
                <div className="flex items-center gap-2">
                  <Stars rating={product.rating} />
                  <span className="text-slate-400 text-xs font-bold">({product.reviews} reviews)</span>
                </div>
              </div>
              <h1 className="text-4xl lg:text-5xl font-black text-slate-900 tracking-tighter">{product.name}</h1>
            </div>
            
            <p className="text-slate-500 leading-relaxed text-lg">{product.description}</p>
            
            {product.variants && (
              <div className="space-y-8">
                {product.variants.map(v => (
                  <div key={v.type} className="space-y-4">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{v.type}</p>
                    <div className="flex flex-wrap gap-3">
                      {v.options.map(opt => (
                        <button 
                          key={opt}
                          onClick={() => handleVariantChange(v.type, opt)}
                          className={`px-6 py-3 rounded-2xl text-xs font-bold border transition-all ${
                            selectedVariants[v.type] === opt 
                              ? 'bg-slate-900 text-white border-slate-900 shadow-lg' 
                              : 'bg-white text-slate-600 border-slate-100 hover:border-indigo-600'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="pt-10 border-t border-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-8">
              <div className="text-4xl font-black text-slate-900">${product.price.toLocaleString()}</div>
              <button 
                onClick={() => onAddToCart(product, selectedVariants)}
                className="flex-1 sm:max-w-[280px] py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                <ShoppingBag className="w-5 h-5" />
                Add to Bag
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-2 space-y-12">
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3 mb-8">
              <MessageSquare className="w-6 h-6 text-indigo-600" />
              Customer Reviews
            </h2>
            
            <div className="flex flex-col md:flex-row gap-12 mb-12 items-center">
              <div className="text-center md:text-left">
                <div className="text-6xl font-black text-slate-900 mb-2">{product.rating}</div>
                <Stars rating={product.rating} size="w-6 h-6" />
                <p className="text-slate-400 text-sm font-bold mt-4">Based on {product.reviews} reviews</p>
              </div>
              <div className="flex-1 space-y-3 w-full">
                {ratingSummary.map((count, i) => (
                  <div key={i} className="flex items-center gap-4">
                    <span className="text-xs font-black text-slate-400 w-4">{5 - i}</span>
                    <div className="flex-1 h-2 bg-slate-50 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-600 rounded-full" 
                        style={{ width: `${product.reviews > 0 ? (count / product.reviews) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-[10px] font-bold text-slate-400 w-8">{count}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6 pt-12 border-t border-slate-50">
              {!product.reviewsList || product.reviewsList.length === 0 ? (
                <div className="py-12 border border-dashed border-slate-200 rounded-[2rem] text-center">
                  <p className="text-slate-400 font-bold">No feedback received for this SKU.</p>
                </div>
              ) : (
                product.reviewsList.map(review => (
                  <div key={review.id} className="p-8 rounded-[2rem] bg-slate-50/50 flex gap-6 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-black text-lg shrink-0 shadow-lg shadow-indigo-100">
                      {review.userName.charAt(0)}
                    </div>
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <h4 className="font-black text-slate-900 uppercase text-xs tracking-widest">{review.userName}</h4>
                          <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[8px] font-black uppercase tracking-widest border border-emerald-100">Verified</span>
                        </div>
                        <span className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">{review.date}</span>
                      </div>
                      <Stars rating={review.rating} size="w-3 h-3" />
                      <p className="text-slate-600 leading-relaxed font-medium">{review.comment}</p>
                      <div className="pt-2 flex gap-4">
                        <button className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 hover:text-indigo-600 transition-colors">
                          <ThumbsUp className="w-3 h-3" /> Helpful (2)
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white shadow-2xl space-y-8 sticky top-24">
            <h3 className="text-xl font-black tracking-tight">Post Your Experience</h3>
            <form onSubmit={handleReviewSubmit} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Rate Product</label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star} 
                      type="button" 
                      onClick={() => setReviewRating(star)}
                      className={`p-2 transition-all hover:scale-125 ${reviewRating >= star ? 'text-amber-400' : 'text-white/10'}`}
                    >
                      <Star className={`w-6 h-6 ${reviewRating >= star ? 'fill-current' : ''}`} />
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Public Name</label>
                <input 
                  required
                  value={reviewName}
                  onChange={e => setReviewName(e.target.value)}
                  className="w-full bg-white/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 placeholder:text-white/10"
                  placeholder="e.g. Alex Johnson"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Detail Review</label>
                <textarea 
                  required
                  rows={4}
                  value={reviewComment}
                  onChange={e => setReviewComment(e.target.value)}
                  className="w-full bg-white/5 border-none rounded-2xl px-5 py-4 text-sm font-bold focus:ring-2 focus:ring-indigo-500 resize-none placeholder:text-white/10"
                  placeholder="How was the build quality and delivery?"
                />
              </div>
              <button 
                disabled={isSubmittingReview}
                className="w-full py-5 bg-indigo-600 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-lg hover:bg-indigo-500 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {isSubmittingReview ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> Publish Review</>}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Product Card ---

const ProductCard: React.FC<{ 
  product: Product; 
  onAddToCart: (p: Product, variants?: Record<string, string>) => void;
  onViewDetails: (p: Product) => void;
}> = ({ product, onAddToCart, onViewDetails }) => {
  const [isVariantSelectorOpen, setIsVariantSelectorOpen] = useState(false);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});

  useEffect(() => {
    if (product.variants) {
      const defaults: Record<string, string> = {};
      product.variants.forEach(v => defaults[v.type] = v.options[0]);
      setSelectedVariants(defaults);
    }
  }, [product.variants]);

  const handleVariantChange = (type: string, value: string) => {
    setSelectedVariants(prev => ({ ...prev, [type]: value }));
  };

  const handleAddToCartWithVariants = () => {
    onAddToCart(product, product.variants ? selectedVariants : undefined);
    setIsVariantSelectorOpen(false);
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden border border-slate-200 hover:shadow-xl transition-all duration-300 flex flex-col h-full relative">
      <div className="relative overflow-hidden cursor-pointer h-64" onClick={() => onViewDetails(product)}>
        <img src={product.image} alt={product.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        {product.discount && <span className="absolute top-4 left-4 bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded">-{product.discount}%</span>}
        {product.isNew && <span className="absolute top-4 left-4 bg-indigo-600 text-white text-[10px] font-black px-2 py-1 rounded uppercase">New</span>}
      </div>
      
      {isVariantSelectorOpen && (
        <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-20 p-6 flex flex-col animate-in fade-in zoom-in-95 duration-200">
          <div className="flex justify-between items-center mb-6">
            <h4 className="font-black text-slate-900 text-sm uppercase tracking-widest">Select Options</h4>
            <button onClick={() => setIsVariantSelectorOpen(false)} className="p-1 hover:bg-slate-100 rounded-full transition-colors"><X className="w-5 h-5" /></button>
          </div>
          <div className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-hide">
            {product.variants?.map(v => (
              <div key={v.type} className="space-y-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{v.type}</p>
                <div className="flex flex-wrap gap-2">
                  {v.options.map(opt => (
                    <button 
                      key={opt}
                      onClick={() => handleVariantChange(v.type, opt)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                        selectedVariants[v.type] === opt 
                          ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' 
                          : 'bg-white text-slate-600 border-slate-100 hover:border-indigo-200'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <button 
            onClick={handleAddToCartWithVariants}
            className="mt-6 w-full py-3.5 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
          >
            Confirm & Add to Bag
          </button>
        </div>
      )}

      <div className="p-5 flex-1 flex flex-col">
        <div className="flex justify-between items-start mb-2">
          <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">{product.category}</p>
          <div className="flex items-center text-amber-400"><Star className="w-3 h-3 fill-current" /><span className="text-[10px] text-slate-500 ml-1 font-bold">{product.rating}</span></div>
        </div>
        <h3 className="text-lg font-bold text-slate-800 mb-1 cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => onViewDetails(product)}>{product.name}</h3>
        <p className="text-slate-500 text-sm mb-4 line-clamp-2">{product.description}</p>
        
        <div className="mt-auto space-y-4">
          {product.variants && (
            <button 
              onClick={() => setIsVariantSelectorOpen(true)}
              className="w-full py-2.5 bg-slate-50 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] border border-slate-100 hover:border-indigo-200 hover:text-indigo-600 transition-all flex items-center justify-center gap-2"
            >
              <Settings2 className="w-3 h-3" />
              View Variants
            </button>
          )}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100">
            <span className="text-xl font-black text-slate-900">${product.price.toLocaleString()}</span>
            <button 
              onClick={(e) => { e.stopPropagation(); product.variants ? setIsVariantSelectorOpen(true) : handleAddToCartWithVariants(); }} 
              disabled={product.stock === 0} 
              className={`p-2 rounded-full transition-all ${product.stock === 0 ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-indigo-600 hover:shadow-lg active:scale-95'}`}
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

export default function App() {
  const [currentView, setCurrentView] = useState<View>('home');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<Product[]>(MOCK_PRODUCTS);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([
    { id: 'u1', name: 'John Member', email: 'john@example.com', role: 'customer', loyaltyPoints: 450 },
    { id: 'u2', name: 'Sarah Loyalty', email: 'sarah@example.com', role: 'customer', loyaltyPoints: 120 }
  ]);
  const [lastOrder, setLastOrder] = useState<Order | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([
    { code: 'NOVA20', discount: 20, isActive: true },
    { code: 'WELCOME', discount: 10, isActive: true }
  ]);

  useEffect(() => { window.scrollTo(0, 0); }, [currentView]);

  const handleAddToCart = (product: Product, selectedVariants?: Record<string, string>) => {
    setCart(prev => {
      const existing = prev.find(item => 
        item.id === product.id && 
        JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)
      );
      if (existing) return prev.map(item => 
        (item.id === product.id && JSON.stringify(item.selectedVariants) === JSON.stringify(selectedVariants)) 
          ? { ...item, quantity: item.quantity + 1 } 
          : item
      );
      return [...prev, { ...product, quantity: 1, selectedVariants }];
    });
  };

  const handleUpdateCartQuantity = (id: string, q: number, variants?: Record<string, string>) => {
    if (q < 1) { 
      setCart(prev => prev.filter(item => !(item.id === id && JSON.stringify(item.selectedVariants) === JSON.stringify(variants)))); 
      return; 
    }
    setCart(prev => prev.map(item => 
      (item.id === id && JSON.stringify(item.selectedVariants) === JSON.stringify(variants)) 
        ? { ...item, quantity: q } 
        : item
    ));
  };

  const handleAddReview = (productId: string, newReview: Omit<Review, 'id' | 'date'>) => {
    setProducts(prev => prev.map(p => {
      if (p.id === productId) {
        const fullReview: Review = {
          ...newReview,
          id: Math.random().toString(36).substr(2, 9),
          date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
        };
        const updatedReviewsList = [fullReview, ...(p.reviewsList || [])];
        const newAvgRating = (updatedReviewsList.reduce((s, r) => s + r.rating, 0)) / updatedReviewsList.length;
        
        return {
          ...p,
          reviewsList: updatedReviewsList,
          reviews: updatedReviewsList.length,
          rating: parseFloat(newAvgRating.toFixed(1))
        };
      }
      return p;
    }));
  };

  const handlePOSCheckout = async (items: CartItem[], method: PaymentMethod) => {
    const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax = Math.round(subtotal * 0.08);
    const finalTotal = subtotal + tax;

    const newOrder: Order = {
      id: `#POS-${Math.floor(1000 + Math.random() * 9000)}`,
      userId: 'in-store-guest',
      items: [...items],
      total: finalTotal,
      tax: tax,
      discount: 0,
      status: 'delivered',
      date: new Date().toLocaleString(),
      type: 'pos',
      paymentMethod: method,
      staffId: user?.id
    };
    
    setOrders(prev => [newOrder, ...prev]);
    setLastOrder(newOrder);

    // Update staff shift totals
    setShifts(prev => prev.map(s => (s.staffId === user?.id && s.status === 'active') 
      ? { ...s, totalSales: s.totalSales + finalTotal } 
      : s
    ));

    // Update Inventory
    setProducts(prev => prev.map(p => {
      const soldItem = items.find(i => i.id === p.id);
      if (soldItem) return { ...p, stock: Math.max(0, p.stock - soldItem.quantity) };
      return p;
    }));
  };

  const handlePlaceOrder = async (finalTotal: number) => {
    const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    const tax = Math.round(subtotal * 0.08);

    const newOrder: Order = {
      id: `#NV${Math.floor(1000 + Math.random() * 9000)}`,
      userId: user?.id || 'guest',
      items: [...cart],
      total: finalTotal,
      tax: tax,
      discount: subtotal - finalTotal + tax,
      status: 'pending',
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      type: 'online'
    };
    
    setOrders(prev => [newOrder, ...prev]);
    setCart([]);
    
    if (user) {
      const emailData = await generateEmailContent(newOrder, 'confirmation', user.email);
      const newNotification: Notification = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        subject: emailData.subject,
        body: emailData.body,
        type: 'order_confirmation',
        timestamp: new Date().toLocaleString(),
        read: false
      };
      setNotifications(prev => [newNotification, ...prev]);
      setCurrentView('profile');
    }
  };

  const handleOpenShift = () => {
    const newShift: Shift = {
      id: `SHT-${Date.now()}`,
      staffId: user!.id,
      startTime: new Date().toLocaleString(),
      totalSales: 0,
      status: 'active'
    };
    setShifts(prev => [newShift, ...prev]);
  };

  const handleCloseShift = (id: string) => {
    setShifts(prev => prev.map(s => s.id === id ? { ...s, status: 'closed', endTime: new Date().toLocaleString() } : s));
  };

  const renderView = () => {
    switch (currentView) {
      case 'home': return <HomeView products={products} onNavigate={setCurrentView} onAddToCart={handleAddToCart} onViewProduct={(p) => { setSelectedProduct(p); setCurrentView('product'); }} />;
      case 'shop': return <ShopView products={products} searchQuery={searchQuery} onAddToCart={handleAddToCart} onViewProduct={(p) => { setSelectedProduct(p); setCurrentView('product'); }} />;
      case 'product': return selectedProduct ? <ProductDetailView product={selectedProduct} user={user} onAddToCart={handleAddToCart} onBack={() => setCurrentView('shop')} onAddReview={handleAddReview} /> : null;
      case 'cart': return <CartView cart={cart} onUpdateQuantity={handleUpdateCartQuantity} onRemove={(id, variants) => setCart(prev => prev.filter(i => !(i.id === id && JSON.stringify(i.selectedVariants) === JSON.stringify(variants))))} onNavigate={setCurrentView} />;
      case 'checkout': return <CheckoutView cart={cart} coupons={coupons} onComplete={handlePlaceOrder} />;
      case 'admin': return (user?.role === 'manager' || user?.role === 'cashier') ? <AdminDashboard user={user} orders={orders} onUpdateStatus={(id, s) => setOrders(prev => prev.map(o => o.id === id ? { ...o, status: s } : o))} onNavigate={setCurrentView} coupons={coupons} setCoupons={setCoupons} onPOSCheckout={handlePOSCheckout} shifts={shifts} onOpenShift={handleOpenShift} onCloseShift={handleCloseShift} allUsers={allUsers} /> : null;
      case 'profile': return user ? <ProfileView user={user} orders={orders} notifications={notifications} onSignOut={() => { setUser(null); setCurrentView('home'); }} onNavigate={setCurrentView} onMarkRead={(id) => setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))} /> : <AuthView onLogin={(u) => { setUser(u); setCurrentView('home'); }} onNavigate={setCurrentView} />;
      case 'auth': return <AuthView onLogin={(u) => { setUser(u); setCurrentView('home'); }} onNavigate={setCurrentView} />;
      default: return <HomeView products={products} onNavigate={setCurrentView} onAddToCart={handleAddToCart} onViewProduct={(p) => { setSelectedProduct(p); setCurrentView('product'); }} />;
    }
  };

  return (
    <div className="min-h-screen flex flex-col font-sans overflow-x-hidden">
      <Navbar cartCount={cart.reduce((s, i) => s + i.quantity, 0)} user={user} currentView={currentView} unreadNotifications={notifications.filter(n => !n.read).length} onNavigate={setCurrentView} onSearch={setSearchQuery} />
      <main className="flex-1 bg-slate-50/50">{renderView()}</main>
      <Footer />
      {lastOrder && lastOrder.type === 'pos' && <ReceiptModal order={lastOrder} onClose={() => setLastOrder(null)} />}
    </div>
  );
}

// --- Digital Storefront Components ---

const Navbar: React.FC<{
  cartCount: number;
  user: User | null;
  currentView: View;
  unreadNotifications: number;
  onNavigate: (view: View) => void;
  onSearch: (q: string) => void;
}> = ({ cartCount, user, currentView, unreadNotifications, onNavigate, onSearch }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchQuery);
    onNavigate('shop');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center cursor-pointer" onClick={() => onNavigate('home')}>
            <span className="text-2xl font-black bg-gradient-to-r from-indigo-600 to-violet-600 bg-clip-text text-transparent tracking-tighter">NOVA</span>
          </div>
          <div className="hidden md:flex flex-1 max-w-md mx-8">
            <form onSubmit={handleSearchSubmit} className="relative w-full">
              <input type="text" placeholder="Search products..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 transition-all text-sm font-medium" />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            </form>
          </div>
          <div className="flex items-center space-x-4">
            <button onClick={() => onNavigate('cart')} className="relative p-2 text-slate-600 hover:text-indigo-600 transition-colors">
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-indigo-600 rounded-full">{cartCount}</span>}
            </button>
            <button onClick={() => user ? onNavigate('profile') : onNavigate('auth')} className={`relative p-2 transition-colors ${currentView === 'profile' || currentView === 'auth' ? 'text-indigo-600' : 'text-slate-600 hover:text-indigo-600'}`}>
              <UserIcon className="w-6 h-6" />
              {unreadNotifications > 0 && <span className="absolute top-0 right-0 block h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />}
            </button>
            <button className="md:hidden p-2 text-slate-600" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>
      {isMobileMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-200 py-4 px-4 space-y-4 animate-in slide-in-from-top duration-300">
          <form onSubmit={handleSearchSubmit} className="relative w-full">
            <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full bg-slate-100 border-none rounded-full py-2 pl-10 pr-4 focus:ring-2 focus:ring-indigo-500 text-sm font-medium" />
          </form>
          <div className="flex flex-col space-y-3">
            <button onClick={() => { onNavigate(user ? 'profile' : 'auth'); setIsMobileMenuOpen(false); }} className="text-left font-bold text-slate-600 px-2 py-1">{user ? 'My Profile' : 'Sign In'}</button>
            <button onClick={() => { onNavigate('cart'); setIsMobileMenuOpen(false); }} className="text-left font-bold text-slate-600 px-2 py-1">Shopping Bag</button>
          </div>
        </div>
      )}
    </nav>
  );
};

const CartView: React.FC<{ cart: CartItem[], onUpdateQuantity: (id: string, q: number, v?: Record<string, string>) => void, onRemove: (id: string, v?: Record<string, string>) => void, onNavigate: (v: View) => void }> = ({ cart, onUpdateQuantity, onRemove, onNavigate }) => {
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  if (cart.length === 0) return <div className="max-w-7xl mx-auto px-4 py-32 text-center"><ShoppingBag className="w-20 h-20 text-slate-200 mx-auto mb-8" /><h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">Your bag is empty</h2><button onClick={() => onNavigate('shop')} className="bg-indigo-600 text-white px-8 py-4 rounded-full font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all">Start Shopping</button></div>;
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-black text-slate-900 mb-12 tracking-tight">Shopping Bag</h1>
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="flex-1 space-y-4">
          {cart.map((item, idx) => (
            <div key={idx} className="bg-white rounded-3xl p-6 border border-slate-100 flex items-center gap-6 group hover:shadow-lg transition-all">
              <img src={item.image} className="w-24 h-24 rounded-2xl object-cover" />
              <div className="flex-1">
                <h3 className="font-bold text-slate-900 text-lg">{item.name}</h3>
                {item.selectedVariants && (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {Object.entries(item.selectedVariants).map(([type, val]) => (
                      <span key={type} className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase border border-indigo-100">
                        {type}: {val}
                      </span>
                    ))}
                  </div>
                )}
                <div className="flex justify-between items-center mt-4">
                  <div className="flex items-center bg-slate-50 rounded-full px-4 py-1 border border-slate-100">
                    <button onClick={() => onUpdateQuantity(item.id, item.quantity - 1, item.selectedVariants)} className="text-slate-400 hover:text-indigo-600"><Minus className="w-4 h-4" /></button>
                    <span className="mx-6 font-black text-slate-900">{item.quantity}</span>
                    <button onClick={() => onUpdateQuantity(item.id, item.quantity + 1, item.selectedVariants)} className="text-slate-400 hover:text-indigo-600"><Plus className="w-4 h-4" /></button>
                  </div>
                  <span className="font-black text-lg text-slate-900">${(item.price * item.quantity).toLocaleString()}</span>
                </div>
              </div>
              <button onClick={() => onRemove(item.id, item.selectedVariants)} className="p-3 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all"><Trash2 className="w-6 h-6" /></button>
            </div>
          ))}
        </div>
        <div className="w-full lg:w-96 bg-white p-10 rounded-[2.5rem] border border-slate-100 h-fit shadow-sm space-y-8">
          <h2 className="text-xl font-black text-slate-900 tracking-tight">Order Summary</h2>
          <div className="space-y-4 border-b border-slate-50 pb-8">
            <div className="flex justify-between text-slate-500 text-sm font-medium"><span>Subtotal</span><span className="text-slate-900 font-black">${subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between text-slate-500 text-sm font-medium"><span>Shipping</span><span className="text-indigo-600 font-black">{subtotal > 500 ? 'FREE' : '$25'}</span></div>
          </div>
          <div className="flex justify-between text-2xl font-black text-slate-900"><span>Total</span><span>${(subtotal + (subtotal > 500 ? 0 : 25)).toLocaleString()}</span></div>
          <button onClick={() => onNavigate('checkout')} className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all active:scale-[0.98]">Proceed to Secure Checkout</button>
        </div>
      </div>
    </div>
  );
};

const ProfileView: React.FC<{ 
  user: User | null; 
  orders: Order[];
  notifications: Notification[];
  onSignOut: () => void;
  onNavigate: (v: View) => void;
  onMarkRead: (id: string) => void;
}> = ({ user, orders, notifications, onSignOut, onNavigate, onMarkRead }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'orders' | 'messages'>('info');
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);

  if (!user) return null;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="bg-white rounded-[3rem] p-1 shadow-sm border border-slate-100 overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-80 bg-slate-50 p-12 flex flex-col items-center border-r border-slate-100">
            <div className={`w-32 h-32 rounded-full flex items-center justify-center mb-6 shadow-inner ${user.role !== 'customer' ? 'bg-violet-100' : 'bg-indigo-100'}`}>
              <UserIcon className={`w-16 h-16 ${user.role !== 'customer' ? 'text-violet-600' : 'text-indigo-600'}`} />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 text-center">{user.name}</h2>
            <p className="text-slate-500 mb-8">{user.email}</p>
            <div className="w-full space-y-2">
              <button onClick={() => setActiveTab('info')} className={`w-full text-left px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'info' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}>Account Info</button>
              <button onClick={() => setActiveTab('orders')} className={`w-full text-left px-6 py-3 rounded-2xl font-bold transition-all ${activeTab === 'orders' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}>Order History</button>
              <button onClick={() => setActiveTab('messages')} className={`w-full text-left px-6 py-3 rounded-2xl font-bold transition-all flex items-center justify-between ${activeTab === 'messages' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-white'}`}>
                <span>Digital Inbox</span>
                {notifications.some(n => !n.read) && <span className="w-2 h-2 rounded-full bg-red-500" />}
              </button>
              {user.role !== 'customer' && <button onClick={() => onNavigate('admin')} className="w-full text-left px-6 py-3 rounded-2xl font-bold text-violet-600 hover:bg-violet-50 transition-all flex items-center mt-4 border border-dashed border-violet-200"><LayoutDashboard className="w-4 h-4 mr-2" /> Commerce Hub</button>}
              <button onClick={onSignOut} className="w-full text-left px-6 py-3 rounded-2xl font-bold text-red-500 hover:bg-red-50 mt-12 flex items-center"><LogOut className="w-4 h-4 mr-2" /> Sign Out</button>
            </div>
          </div>
          <div className="flex-1 p-8 md:p-16">
            {activeTab === 'info' && (
              <div className="space-y-12 animate-in slide-in-from-right-4 duration-300">
                <div><h3 className="text-3xl font-extrabold text-slate-900 mb-2">My Profile</h3><div className="flex items-center gap-2"><span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${user.role === 'manager' ? 'bg-violet-50 text-violet-700 border-violet-100' : user.role === 'cashier' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-indigo-50 text-indigo-700 border-indigo-100'}`}>{user.role} Account</span></div></div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {[{ label: 'Full Name', value: user.name }, { label: 'Email', value: user.email }, { label: 'Loyalty Points', value: user.loyaltyPoints || 0 }].map((field, i) => (<div key={i} className="space-y-1 p-6 bg-slate-50 rounded-2xl border border-slate-100"><label className="text-xs font-bold text-slate-400 uppercase tracking-widest">{field.label}</label><p className="font-bold text-slate-900">{field.value}</p></div>))}
                </div>
              </div>
            )}
            {activeTab === 'orders' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-8"><h3 className="text-3xl font-extrabold text-slate-900">Track Orders</h3><div className="text-xs font-bold text-slate-400 uppercase tracking-widest">{orders.length} Records</div></div>
                {orders.length === 0 ? <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200"><ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-4" /><p className="text-slate-400 font-medium">You haven't placed any orders yet.</p></div> : 
                  <div className="space-y-4">{orders.map(order => (
                    <div key={order.id} className={`bg-white rounded-[2rem] border transition-all overflow-hidden ${expandedOrder === order.id ? 'border-indigo-600 shadow-xl' : 'border-slate-100 hover:border-indigo-200 shadow-sm'}`}>
                      <div onClick={() => setExpandedOrder(expandedOrder === order.id ? null : order.id)} className="p-6 cursor-pointer flex justify-between items-center group"><div className="flex items-center gap-6"><div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors"><Package className="w-6 h-6" /></div><div><p className="font-bold text-slate-900">{order.id}</p><p className="text-xs text-slate-500 font-medium">{order.date} • {order.items.length} items</p></div></div><div className="flex items-center gap-6"><div className="text-right hidden sm:block"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Status</p><span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${order.status === 'delivered' ? 'bg-green-100 text-green-700' : order.status === 'shipped' ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>{order.status}</span></div><div className="text-right"><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Total</p><p className="font-black text-slate-900">${order.total.toLocaleString()}</p></div><ChevronDown className={`w-5 h-5 text-slate-300 transition-transform ${expandedOrder === order.id ? 'rotate-180' : ''}`} /></div></div>
                      {expandedOrder === order.id && <div className="p-8 border-t border-slate-50 bg-slate-50/30 animate-in slide-in-from-top-4 duration-300"><div className="mb-10"><h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-8 text-center">Live Order Tracking</h4><OrderTracker status={order.status} /></div><div className="space-y-4 pt-6 border-t border-slate-100"><h5 className="text-xs font-bold text-slate-900 uppercase tracking-widest mb-2">Package Details</h5>{order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm py-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-100">
                              <img src={item.image} alt="" className="w-full h-full object-cover" />
                            </div>
                            <div>
                              <span className="text-slate-600 font-medium">{item.name} <span className="text-slate-400 text-xs">x{item.quantity}</span></span>
                              {item.selectedVariants && (
                                <div className="flex gap-2">
                                  {Object.entries(item.selectedVariants).map(([t, v]) => <span key={t} className="text-[8px] text-indigo-400 font-bold uppercase">{t}: {v}</span>)}
                                </div>
                              )}
                            </div>
                          </div>
                          <span className="font-bold text-slate-900">${(item.price * item.quantity).toLocaleString()}</span>
                        </div>
                      ))}</div></div>}
                    </div>))}</div>}
              </div>
            )}
            {activeTab === 'messages' && (
              <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                <div className="flex items-center justify-between mb-8"><h3 className="text-3xl font-extrabold text-slate-900">Digital Inbox</h3><div className="bg-indigo-50 text-indigo-600 px-4 py-1.5 rounded-full text-xs font-bold border border-indigo-100">Simulated Notifications</div></div>
                {selectedNotification ? (<div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm animate-in fade-in duration-300"><div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50"><button onClick={() => setSelectedNotification(null)} className="p-2 hover:bg-white rounded-full transition-colors"><ArrowLeft className="w-5 h-5" /></button><div className="text-right"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Sent from</p><p className="text-sm font-bold text-indigo-600">NOVA Store Updates</p></div></div><div className="p-10 space-y-8"><div><h4 className="text-2xl font-extrabold text-slate-900 mb-2">{selectedNotification.subject}</h4><p className="text-xs text-slate-400">{selectedNotification.timestamp}</p></div><div className="text-slate-600 leading-relaxed whitespace-pre-wrap border-l-4 border-indigo-100 pl-6 py-2">{selectedNotification.body}</div><div className="pt-10 border-t border-slate-50 flex justify-center"><div className="bg-indigo-600 text-white px-8 py-3 rounded-full font-bold text-sm">Shop with NOVA</div></div></div></div>) : 
                (<div className="space-y-3">{notifications.length === 0 ? <div className="text-center py-20 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200"><Mail className="w-12 h-12 text-slate-200 mx-auto mb-4" /><p className="text-slate-400 font-medium">No messages yet.</p></div> : 
                  notifications.map(note => (<div key={note.id} onClick={() => { onMarkRead(note.id); setSelectedNotification(note); }} className={`p-6 rounded-2xl border transition-all cursor-pointer group ${note.read ? 'bg-white border-slate-100 opacity-60' : 'bg-white border-indigo-100 shadow-sm border-l-4 border-l-indigo-600'}`}><div className="flex items-start justify-between"><div className="flex gap-4 items-center"><div className={`p-3 rounded-xl ${note.read ? 'bg-slate-100' : 'bg-indigo-50 text-indigo-600'}`}><Mail className="w-5 h-5" /></div><div><h4 className={`text-sm font-bold ${note.read ? 'text-slate-600' : 'text-slate-900'}`}>{note.subject}</h4><p className="text-xs text-slate-500 mt-1 line-clamp-1">{note.body}</p></div></div><span className="text-[10px] font-bold text-slate-400">{note.timestamp.split(',')[0]}</span></div></div>)) }</div>)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const Footer = () => (
  <footer className="bg-slate-900 text-slate-300 pt-16 pb-8"><div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"><div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12"><div className="col-span-1 md:col-span-1"><span className="text-2xl font-black text-white mb-6 block tracking-tight">NOVA</span><p className="text-sm leading-relaxed mb-6">Redefining the digital shopping experience with cutting-edge tech and curated premium products.</p></div><div><h4 className="text-white font-bold mb-6">Shop</h4><ul className="space-y-4 text-sm"><li><a href="#" className="hover:text-indigo-400 transition-colors">New Arrivals</a></li><li><a href="#" className="hover:text-indigo-400 transition-colors">Best Sellers</a></li></ul></div><div><h4 className="text-white font-bold mb-6">Company</h4><ul className="space-y-4 text-sm"><li><a href="#" className="hover:text-indigo-400 transition-colors">About Us</a></li><li><a href="#" className="hover:text-indigo-400 transition-colors">Careers</a></li></ul></div><div><h4 className="text-white font-bold mb-6">Support</h4><ul className="space-y-4 text-sm"><li><a href="#" className="hover:text-indigo-400 transition-colors">Shipping Info</a></li><li><a href="#" className="hover:text-indigo-400 transition-colors">Returns</a></li></ul></div></div></div></footer>
);

const AuthView: React.FC<{ onLogin: (user: User) => void; onNavigate: (view: View) => void; }> = ({ onLogin, onNavigate }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<User['role']>('customer');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('user@example.com');
  useEffect(() => { if (role !== 'customer') setIsLogin(true); }, [role]);
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); setIsLoading(true); setTimeout(() => { onLogin({ id: Math.random().toString(36).substr(2, 9), name: role === 'manager' ? 'Store Manager' : role === 'cashier' ? 'Front-end Cashier' : 'Loyalty Member', email: email, role: role, loyaltyPoints: role === 'customer' ? 150 : 0 }); setIsLoading(false); }, 1500); };
  return (<div className="max-w-7xl mx-auto px-4 py-20 flex justify-center"><div className="w-full max-w-md bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-500"><div className="p-8 sm:p-12"><div className="text-center mb-10"><h2 className="text-3xl font-black text-slate-900 mb-2">{isLogin ? (role === 'customer' ? 'Welcome Back' : 'Staff Portal') : 'Create Account'}</h2><p className="text-slate-500 text-sm">{isLogin ? (role === 'customer' ? 'Access your NOVA account' : 'Authorized Personnel Only') : 'Join the NOVA shopping community'}</p></div><div className="bg-slate-100 p-1.5 rounded-2xl mb-8"><div className="flex justify-between gap-1"><button onClick={() => setRole('customer')} className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${role === 'customer' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}><UserIcon className="w-4 h-4 mb-1" />Customer</button><button onClick={() => setRole('manager')} className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${role === 'manager' ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}><Shield className="w-4 h-4 mb-1" />Manager</button><button onClick={() => setRole('cashier')} className={`flex-1 flex flex-col items-center justify-center py-2.5 rounded-xl text-[10px] font-black uppercase transition-all ${role === 'cashier' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-slate-700'}`}><Store className="w-4 h-4 mb-1" />Cashier</button></div></div><form onSubmit={handleSubmit} className="space-y-6"><div className="space-y-4"><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email</label><input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all font-bold" /></div><div className="space-y-1"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Password</label><div className="relative"><input type={showPassword ? "text" : "password"} required placeholder="••••••••" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-bold" /><button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-slate-400 hover:text-indigo-600">{showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}</button></div></div></div><button disabled={isLoading} className={`w-full py-4 rounded-2xl font-black text-white text-xs uppercase tracking-widest shadow-xl transition-all flex items-center justify-center active:scale-[0.98] ${role === 'manager' ? 'bg-violet-600 shadow-violet-100 hover:bg-violet-700' : role === 'cashier' ? 'bg-emerald-600 shadow-emerald-100 hover:bg-emerald-700' : 'bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700'}`}>{isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : (isLogin ? `Sign In` : 'Create Account')}</button></form><div className="mt-8 pt-8 border-t border-slate-100 text-center">{role === 'customer' ? <button onClick={() => setIsLogin(!isLogin)} className="text-xs font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-700">{isLogin ? "Join NOVA" : "Sign In"}</button> : <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Admin Access Only</p>}</div></div></div></div>);
};

const HomeView: React.FC<{ 
  products: Product[],
  onNavigate: (v: View) => void, 
  onAddToCart: (p: Product, variants?: Record<string, string>) => void, 
  onViewProduct: (p: Product) => void 
}> = ({ products, onNavigate, onAddToCart, onViewProduct }) => (
  <div className="space-y-20 pb-20">
    <section className="relative overflow-hidden bg-white rounded-b-[3rem]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 flex flex-col lg:flex-row items-center">
        <div className="lg:w-1/2 space-y-8 z-10 text-center lg:text-left">
          <span className="inline-block px-4 py-2 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-[0.2em] rounded-full">Spring Collection 2024</span>
          <h1 className="text-5xl lg:text-7xl font-black text-slate-900 leading-tight tracking-tighter">Innovation in <br /><span className="text-indigo-600">Every Detail.</span></h1>
          <p className="text-lg text-slate-600 max-w-lg leading-relaxed mx-auto lg:mx-0">Explore our curated selection of premium electronics and accessories designed to elevate your everyday lifestyle.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
            <button onClick={() => onNavigate('shop')} className="bg-indigo-600 text-white px-8 py-4 rounded-full font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all flex items-center justify-center group">Shop Now <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" /></button>
          </div>
        </div>
        <div className="lg:w-1/2 mt-16 lg:mt-0 relative">
          <div className="absolute inset-0 bg-indigo-100 rounded-full blur-3xl opacity-30 animate-pulse" />
          <img src="https://picsum.photos/seed/techhero/800/800" alt="Hero" className="relative z-10 w-full max-w-lg mx-auto rounded-3xl shadow-2xl rotate-3" />
        </div>
      </div>
    </section>
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {FEATURES.map((feature, i) => (
          <div key={i} className="flex flex-col items-center text-center p-8 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
            <div className="mb-4 text-indigo-600 bg-indigo-50 p-4 rounded-2xl">{feature.icon}</div>
            <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
            <p className="text-sm text-slate-500">{feature.description}</p>
          </div>
        ))}
      </div>
    </section>
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h2 className="text-3xl font-black text-slate-900 mb-4 tracking-tight">New Arrivals</h2>
          <p className="text-slate-500">The latest and greatest technology on the market.</p>
        </div>
        <button onClick={() => onNavigate('shop')} className="text-indigo-600 font-black text-xs uppercase tracking-widest flex items-center hover:underline">View Shop <ChevronRight className="w-4 h-4 ml-1" /></button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {products.slice(0, 4).map(product => <ProductCard key={product.id} product={product} onAddToCart={onAddToCart} onViewDetails={onViewProduct} />)}
      </div>
    </section>
  </div>
);

const ShopView: React.FC<{ products: Product[], searchQuery: string, onAddToCart: (p: Product, variants?: Record<string, string>) => void, onViewProduct: (p: Product) => void }> = ({ products, searchQuery, onAddToCart, onViewProduct }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const filtered = useMemo(() => products.filter(p => (searchQuery === '' || p.name.toLowerCase().includes(searchQuery.toLowerCase())) && (selectedCategory === 'all' || p.category === selectedCategory)), [products, searchQuery, selectedCategory]);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        <aside className="w-full md:w-64 space-y-8 shrink-0">
          <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center"><Filter className="w-4 h-4 mr-2" /> Categories</h3>
            <div className="space-y-2">
              <button onClick={() => setSelectedCategory('all')} className={`w-full text-left px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedCategory === 'all' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>All Products</button>
              {CATEGORIES.map(cat => (
                <button key={cat.id} onClick={() => setSelectedCategory(cat.slug)} className={`w-full text-left px-4 py-2 rounded-xl text-sm font-bold transition-all ${selectedCategory === cat.slug ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:bg-slate-100'}`}>{cat.name}</button>
              ))}
            </div>
          </div>
        </aside>
        <main className="flex-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {filtered.map(p => <ProductCard key={p.id} product={p} onAddToCart={onAddToCart} onViewDetails={onViewProduct} />)}
          </div>
        </main>
      </div>
    </div>
  );
};

const CheckoutView: React.FC<{ cart: CartItem[], coupons: Coupon[], onComplete: (total: number) => void }> = ({ cart, coupons, onComplete }) => {
  const [couponInput, setCouponInput] = useState('');
  const [activeCoupon, setActiveCoupon] = useState<Coupon | null>(null);
  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const tax = Math.round(subtotal * 0.08);
  const discountAmount = activeCoupon ? (subtotal * activeCoupon.discount / 100) : 0;
  const total = subtotal + tax - discountAmount + (subtotal > 500 ? 0 : 25);
  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-2xl font-black text-slate-900 tracking-tight">Order Details</h2>
            <div className="space-y-6">
              {cart.map((item, idx) => (
                <div key={idx} className="flex justify-between items-start text-sm">
                  <div>
                    <p className="font-bold text-slate-900">{item.name} x {item.quantity}</p>
                    {item.selectedVariants && <div className="flex flex-wrap gap-2 mt-1">{Object.entries(item.selectedVariants).map(([t, v]) => <span key={t} className="text-[10px] bg-slate-50 text-slate-500 px-2 py-0.5 rounded uppercase">{t}: {v}</span>)}</div>}
                  </div>
                  <span className="font-black text-slate-900">${(item.price * item.quantity).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
            <h2 className="text-lg font-black text-slate-900 tracking-tight">Promotional Code</h2>
            <div className="flex gap-2">
              <input value={couponInput} onChange={e => setCouponInput(e.target.value)} placeholder="Enter code..." className="flex-1 px-4 py-3 rounded-xl bg-slate-50 border-none font-bold focus:ring-2 focus:ring-indigo-500" />
              <button onClick={() => { const found = coupons.find(c => c.code === couponInput.toUpperCase() && c.isActive); if(found) setActiveCoupon(found); }} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-xs uppercase hover:bg-indigo-600 transition-all">Apply</button>
            </div>
            {activeCoupon && <p className="text-emerald-600 text-[10px] font-black uppercase tracking-widest">Coupon applied: {activeCoupon.discount}% OFF</p>}
          </div>
        </div>
        <div className="bg-slate-900 p-10 rounded-[2.5rem] text-white shadow-2xl h-fit sticky top-24">
          <h3 className="text-xl font-black mb-8 tracking-tight">Purchase Summary</h3>
          <div className="space-y-4 mb-10 text-white/60">
            <div className="flex justify-between"><span>Subtotal</span><span className="text-white font-bold">${subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span>Tax (8%)</span><span className="text-white font-bold">${tax.toLocaleString()}</span></div>
            {activeCoupon && <div className="flex justify-between text-indigo-400"><span>Discount</span><span className="font-bold">-${discountAmount.toLocaleString()}</span></div>}
            <div className="flex justify-between"><span>Shipping</span><span className="text-white font-bold">{subtotal > 500 ? 'FREE' : '$25'}</span></div>
            <div className="pt-6 border-t border-white/10 flex justify-between text-2xl font-black text-white"><span>Total</span><span className="text-indigo-400">${total.toLocaleString()}</span></div>
          </div>
          <button onClick={() => onComplete(total)} className="w-full py-5 bg-indigo-600 hover:bg-indigo-500 rounded-2xl font-black text-lg uppercase tracking-widest transition-all active:scale-[0.98] shadow-2xl shadow-indigo-600/20 flex items-center justify-center gap-3"><ShieldCheck className="w-6 h-6" /> Complete Purchase</button>
        </div>
      </div>
    </div>
  );
};
