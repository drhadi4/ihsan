'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Building2, 
  LogIn, 
  LogOut, 
  Plus, 
  FileText, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Users, 
  BarChart3, 
  Eye,
  Send,
  AlertCircle,
  Shield,
  FileCheck,
  Upload,
  Download,
  CreditCard,
  Receipt,
  Award,
  UserPlus,
  ArrowLeft,
  ArrowRight,
  Printer,
  RefreshCw,
  Filter,
  Calendar,
  MapPin,
  Phone,
  Mail,
  User,
  Home as HomeIcon,
  Stethoscope,
  Microscope,
  Heart,
  Activity
} from 'lucide-react';

// Types
type Role = 'CLIENT' | 'BRANCH_MANAGER' | 'FACILITIES_MGR' | 'REVIEW_MGR' | 'GENERAL_MGR' | 'DEPUTY_MINISTER';
type RequestType = 'FURNISHING' | 'OPERATION' | 'RENEWAL';
type FacilityType = 'SPECIALIZED_HOSPITAL' | 'GENERAL_HOSPITAL' | 'SPECIALIZED_CENTER' | 'POLYCLINIC' | 'CLINIC' | 'LABORATORY' | 'DIAGNOSTIC_CENTER' | 'DENTAL_CLINIC';
type RequestStatus = 'PENDING_BRANCH' | 'PENDING_FACILITIES' | 'PENDING_REVIEW' | 'PENDING_DEPUTY' | 'PENDING_PAYMENT' | 'COMPLETED' | 'REJECTED';

interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  provinceId: string | null;
  isActive: boolean;
}

interface Province {
  id: string;
  name: string;
  code: string;
}

interface Attachment {
  id: string;
  documentType: string;
  documentName: string;
  fileName: string;
  filePath: string;
  isVerified: boolean;
  notes?: string;
}

interface Request {
  id: string;
  requestNumber: string;
  type: RequestType;
  facilityType: FacilityType;
  facilityName: string;
  ownerName: string;
  ownerPhone: string;
  ownerEmail: string | null;
  ownerAddress: string | null;
  facilityAddress: string;
  provinceId: string;
  province?: Province;
  userId: string;
  user?: User;
  status: RequestStatus;
  currentLevel: string;
  attachments: Attachment[];
  branchApproved: boolean;
  branchNotes: string | null;
  facilitiesApproved: boolean;
  facilitiesNotes: string | null;
  reviewApproved: boolean;
  reviewNotes: string | null;
  deputyApproved: boolean;
  deputyNotes: string | null;
  receiptNumber: string | null;
  receiptAmount: number | null;
  paymentReference: string | null;
  paymentVerified: boolean;
  licenseNumber: string | null;
  licenseIssuedAt: string | null;
  licenseExpiryDate: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ActionLog {
  id: string;
  action: string;
  description: string;
  userId: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    role: string;
  };
}

interface Stats {
  totalRequests: number;
  pendingRequests: number;
  completedRequests: number;
  rejectedRequests: number;
  pendingForUser: number;
  totalUsers: number;
  requestsByType: { type: string; count: number }[];
  requestsByProvince: { provinceId: string; provinceName: string; count: number }[];
  requestsByStatus: { status: string; count: number }[];
  monthlyData: { month: string; total: number; completed: number }[];
  usersByRole: { role: string; count: number }[];
}

// Constants
const REQUEST_TYPE_LABELS: Record<RequestType, string> = {
  FURNISHING: 'تأثيث',
  OPERATION: 'تشغيل',
  RENEWAL: 'تجديد',
};

const FACILITY_TYPE_LABELS: Record<FacilityType, string> = {
  SPECIALIZED_HOSPITAL: 'مستشفى تخصصي',
  GENERAL_HOSPITAL: 'مستشفى عام',
  SPECIALIZED_CENTER: 'مركز تخصصي',
  POLYCLINIC: 'مستوصف',
  CLINIC: 'عيادة',
  LABORATORY: 'مختبر',
  DIAGNOSTIC_CENTER: 'مركز تشخيصي',
  DENTAL_CLINIC: 'عيادة أسنان',
};

const STATUS_LABELS: Record<RequestStatus, string> = {
  PENDING_BRANCH: 'معلق لدى مدير الفرع',
  PENDING_FACILITIES: 'معلق لدى مدير المنشآت',
  PENDING_REVIEW: 'معلق لدى المراجعة',
  PENDING_DEPUTY: 'معلق لدى الوكيل',
  PENDING_PAYMENT: 'في انتظار السداد',
  COMPLETED: 'مكتمل',
  REJECTED: 'مرفوض',
};

const ROLE_LABELS: Record<Role, string> = {
  CLIENT: 'عميل',
  BRANCH_MANAGER: 'مدير فرع',
  FACILITIES_MGR: 'مدير المنشآت',
  REVIEW_MGR: 'مدير المراجعة',
  GENERAL_MGR: 'مدير الإدارة العامة',
  DEPUTY_MINISTER: 'وكيل الوزارة',
};

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  SKETCH: 'الكروكي الخاص بالمنشأة',
  OWNER_ID: 'هوية المالك',
  EQUIPMENT_COMPLIANCE: 'مطابقة التجهيزات للشروط',
  TAX_CARD: 'البطاقة الضريبية',
  ZAKAT_CARD: 'البطاقة الزكوية',
  STAFF_CONTRACTS: 'عقود الكادر',
  OWNERSHIP_CONTRACT: 'عقد ملكية المبنى أو الإيجار',
  INSPECTION_REPORT: 'تقرير لجنة المعاينة',
  COMMERCIAL_REG: 'السجل التجاري',
  HEALTH_CERT: 'الشهادة الصحية',
  OTHER: 'أخرى',
};

// Fee calculation
const FEE_STRUCTURE = {
  FURNISHING: {
    SPECIALIZED_HOSPITAL: 100000,
    GENERAL_HOSPITAL: 100000,
    SPECIALIZED_CENTER: 60000,
    POLYCLINIC: 60000,
    CLINIC: 60000,
    LABORATORY: 60000,
    DIAGNOSTIC_CENTER: 60000,
    DENTAL_CLINIC: 60000,
  },
  OPERATION: {
    SPECIALIZED_HOSPITAL: 2000000,
    GENERAL_HOSPITAL: 2000000,
    SPECIALIZED_CENTER: 50000,
    POLYCLINIC: 50000,
    CLINIC: 50000,
    LABORATORY: 50000,
    DIAGNOSTIC_CENTER: 100000,
    DENTAL_CLINIC: 50000,
  },
};

function calculateFee(type: RequestType, facilityType: FacilityType): number {
  if (type === 'RENEWAL') {
    const operationFee = FEE_STRUCTURE.OPERATION[facilityType] || 50000;
    return Math.round(operationFee * 1.3);
  }
  return FEE_STRUCTURE[type]?.[facilityType] || 50000;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('login');
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [registerForm, setRegisterForm] = useState({ 
    name: '', 
    email: '', 
    phone: '', 
    password: '', 
    confirmPassword: '',
    provinceId: '' 
  });
  const [authError, setAuthError] = useState('');
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [requests, setRequests] = useState<Request[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [selectedRequest, setSelectedRequest] = useState<Request | null>(null);
  const [showRequestDetails, setShowRequestDetails] = useState(false);
  const [showReceiptDialog, setShowReceiptDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showLicenseDialog, setShowLicenseDialog] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [receiptForm, setReceiptForm] = useState({ receiptNumber: '', receiptAmount: '' });
  const [paymentForm, setPaymentForm] = useState({ paymentReference: '' });
  const [licenseForm, setLicenseForm] = useState({ licenseNumber: '' });
  const [newRequestForm, setNewRequestForm] = useState({
    type: 'OPERATION' as RequestType,
    facilityType: 'CLINIC' as FacilityType,
    facilityName: '',
    ownerName: '',
    ownerPhone: '',
    ownerEmail: '',
    ownerAddress: '',
    facilityAddress: '',
    provinceId: '',
  });
  const [uploadedFiles, setUploadedFiles] = useState<{type: string; file: File | null}[]>([]);
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [reportFilters, setReportFilters] = useState({
    provinceId: '',
    status: '',
    type: '',
    facilityType: '',
  });

  // Fetch current user on mount
  useEffect(() => {
    fetchUser();
    fetchProvinces();
  }, []);

  // Fetch requests when user changes
  useEffect(() => {
    if (user) {
      fetchRequests();
      if (user.role === 'GENERAL_MGR') {
        fetchStats();
      }
    }
  }, [user]);

  const fetchUser = async () => {
    try {
      const res = await fetch('/api/auth/me');
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProvinces = async () => {
    try {
      const res = await fetch('/api/provinces');
      if (res.ok) {
        const data = await res.json();
        setProvinces(data.provinces);
      }
    } catch (error) {
      console.error('Failed to fetch provinces:', error);
    }
  };

  const fetchRequests = async () => {
    try {
      const res = await fetch('/api/requests');
      if (res.ok) {
        const data = await res.json();
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.stats);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setUser(data.user);
        setLoginForm({ email: '', password: '' });
      } else {
        setAuthError(data.error || 'حدث خطأ أثناء تسجيل الدخول');
      }
    } catch {
      setAuthError('حدث خطأ في الاتصال');
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    
    if (registerForm.password !== registerForm.confirmPassword) {
      setAuthError('كلمة المرور غير متطابقة');
      return;
    }
    
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: registerForm.name,
          email: registerForm.email,
          phone: registerForm.phone,
          password: registerForm.password,
          provinceId: registerForm.provinceId,
        }),
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setUser(data.user);
        setRegisterForm({ name: '', email: '', phone: '', password: '', confirmPassword: '', provinceId: '' });
      } else {
        setAuthError(data.error || 'حدث خطأ أثناء التسجيل');
      }
    } catch {
      setAuthError('حدث خطأ في الاتصال');
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setRequests([]);
      setStats(null);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleCreateRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const res = await fetch('/api/requests/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRequestForm),
      });
      
      if (res.ok) {
        setNewRequestForm({
          type: 'OPERATION',
          facilityType: 'CLINIC',
          facilityName: '',
          ownerName: '',
          ownerPhone: '',
          ownerEmail: '',
          ownerAddress: '',
          facilityAddress: '',
          provinceId: '',
        });
        fetchRequests();
      }
    } catch (error) {
      console.error('Failed to create request:', error);
    }
  };

  const handleApproveRequest = async (requestId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch(`/api/requests/${requestId}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, notes: approvalNotes }),
      });
      
      if (res.ok) {
        setApprovalNotes('');
        setShowRequestDetails(false);
        fetchRequests();
        if (user?.role === 'GENERAL_MGR') {
          fetchStats();
        }
      }
    } catch (error) {
      console.error('Failed to approve request:', error);
    }
  };

  const handleIssueReceipt = async () => {
    if (!selectedRequest) return;
    
    try {
      const res = await fetch(`/api/requests/${selectedRequest.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'issue_receipt', 
          receiptNumber: receiptForm.receiptNumber,
          receiptAmount: parseFloat(receiptForm.receiptAmount),
        }),
      });
      
      if (res.ok) {
        setShowReceiptDialog(false);
        setReceiptForm({ receiptNumber: '', receiptAmount: '' });
        fetchRequests();
      }
    } catch (error) {
      console.error('Failed to issue receipt:', error);
    }
  };

  const handleVerifyPayment = async () => {
    if (!selectedRequest) return;
    
    try {
      const res = await fetch(`/api/requests/${selectedRequest.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'verify_payment', 
          paymentReference: paymentForm.paymentReference,
        }),
      });
      
      if (res.ok) {
        setShowPaymentDialog(false);
        setPaymentForm({ paymentReference: '' });
        fetchRequests();
      }
    } catch (error) {
      console.error('Failed to verify payment:', error);
    }
  };

  const handleIssueLicense = async () => {
    if (!selectedRequest) return;
    
    try {
      const res = await fetch(`/api/requests/${selectedRequest.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'issue_license', 
          licenseNumber: licenseForm.licenseNumber,
        }),
      });
      
      if (res.ok) {
        setShowLicenseDialog(false);
        setLicenseForm({ licenseNumber: '' });
        fetchRequests();
      }
    } catch (error) {
      console.error('Failed to issue license:', error);
    }
  };

  const handleExportReport = async (format: 'csv' | 'json') => {
    const params = new URLSearchParams();
    params.append('format', format);
    if (reportFilters.provinceId) params.append('provinceId', reportFilters.provinceId);
    if (reportFilters.status) params.append('status', reportFilters.status);
    if (reportFilters.type) params.append('type', reportFilters.type);
    if (reportFilters.facilityType) params.append('facilityType', reportFilters.facilityType);

    window.open(`/api/reports/export?${params.toString()}`, '_blank');
  };

  const getStatusColor = (status: RequestStatus) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'PENDING_PAYMENT':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      default:
        return 'bg-amber-100 text-amber-800 border-amber-300';
    }
  };

  const getProgressPercentage = (request: Request) => {
    let progress = 0;
    if (request.branchApproved) progress += 25;
    if (request.facilitiesApproved) progress += 25;
    if (request.reviewApproved) progress += 25;
    if (request.deputyApproved) progress += 25;
    return progress;
  };

  const getPendingRequests = () => {
    if (!user) return [];
    switch (user.role) {
      case 'BRANCH_MANAGER':
        return requests.filter(r => r.status === 'PENDING_BRANCH');
      case 'FACILITIES_MGR':
        return requests.filter(r => r.status === 'PENDING_FACILITIES');
      case 'REVIEW_MGR':
        return requests.filter(r => r.status === 'PENDING_REVIEW');
      case 'DEPUTY_MINISTER':
        return requests.filter(r => r.status === 'PENDING_DEPUTY');
      default:
        return [];
    }
  };

  const getRequiredDocuments = (type: RequestType): string[] => {
    switch (type) {
      case 'FURNISHING':
        return ['SKETCH', 'OWNER_ID', 'COMMERCIAL_REG'];
      case 'OPERATION':
        return ['EQUIPMENT_COMPLIANCE', 'TAX_CARD', 'ZAKAT_CARD', 'STAFF_CONTRACTS', 'OWNERSHIP_CONTRACT', 'COMMERCIAL_REG', 'HEALTH_CERT'];
      case 'RENEWAL':
        return ['INSPECTION_REPORT', 'COMMERCIAL_REG', 'HEALTH_CERT'];
      default:
        return [];
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-blue-50">
        <div className="text-center">
          <div className="relative w-24 h-24 mx-auto mb-4">
            <Image
              src="/eagle-logo.png"
              alt="شعار الوزارة"
              fill
              className="object-contain animate-pulse"
            />
          </div>
          <p className="text-emerald-700 font-medium">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  // Auth Page (Login/Register)
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 flex flex-col">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-emerald-100">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-center gap-4">
              <div className="relative w-16 h-16">
                <Image
                  src="/eagle-logo.png"
                  alt="شعار وزارة الصحة والبيئة"
                  fill
                  className="object-contain"
                  priority
                />
              </div>
              <div className="text-center">
                <h1 className="text-2xl font-bold text-emerald-700">وزارة الصحة والبيئة</h1>
                <p className="text-sm text-emerald-600">نظام ترخيص المنشآت الصحية الخاصة</p>
                <p className="text-xs text-gray-500 mt-1">الإدارة العامة للمنشآت الصحية الخاصة</p>
              </div>
            </div>
          </div>
        </header>

        {/* Auth Form */}
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md shadow-xl border-emerald-100">
            <CardHeader className="text-center bg-gradient-to-l from-emerald-600 to-emerald-700 text-white rounded-t-lg">
              <CardTitle className="text-xl flex items-center justify-center gap-2">
                <Shield className="h-5 w-5" />
                نظام تراخيص المنشآت الصحية
              </CardTitle>
              <CardDescription className="text-emerald-100">
                نظام إلكتروني متكامل لإصدار تراخيص المنشآت الصحية الخاصة
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <Tabs value={authTab} onValueChange={(v) => setAuthTab(v as 'login' | 'register')}>
                <TabsList className="grid w-full grid-cols-2 mb-4">
                  <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
                  <TabsTrigger value="register">تسجيل جديد</TabsTrigger>
                </TabsList>

                {/* Login Form */}
                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    {authError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{authError}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="email">البريد الإلكتروني</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="example@ihsan.gov.ye"
                        value={loginForm.email}
                        onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                        required
                        className="text-right"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="password">كلمة المرور</Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="••••••"
                        value={loginForm.password}
                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                      <LogIn className="h-4 w-4 ml-2" />
                      دخول
                    </Button>
                  </form>
                  
                  <Separator className="my-4" />
                  
                  <div className="text-sm text-muted-foreground text-center">
                    <p className="mb-2 font-medium text-emerald-700">بيانات الدخول التجريبية:</p>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="font-medium">عميل</p>
                        <p>client@ihsan.gov.ye</p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="font-medium">مدير فرع</p>
                        <p>branch@ihsan.gov.ye</p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="font-medium">مدير المنشآت</p>
                        <p>facilities@ihsan.gov.ye</p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="font-medium">مدير المراجعة</p>
                        <p>review@ihsan.gov.ye</p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="font-medium">مدير الإدارة</p>
                        <p>general@ihsan.gov.ye</p>
                      </div>
                      <div className="p-2 bg-gray-50 rounded">
                        <p className="font-medium">وكيل الوزارة</p>
                        <p>deputy@ihsan.gov.ye</p>
                      </div>
                    </div>
                    <p className="mt-2 text-xs">كلمة المرور: 123456</p>
                  </div>
                </TabsContent>

                {/* Register Form */}
                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    {authError && (
                      <Alert variant="destructive">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>{authError}</AlertDescription>
                      </Alert>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="name">الاسم الكامل</Label>
                      <Input
                        id="name"
                        value={registerForm.name}
                        onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reg-email">البريد الإلكتروني</Label>
                      <Input
                        id="reg-email"
                        type="email"
                        value={registerForm.email}
                        onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="phone">رقم الهاتف</Label>
                      <Input
                        id="phone"
                        type="tel"
                        placeholder="967-xxx-xxx-xxx"
                        value={registerForm.phone}
                        onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="province">المحافظة</Label>
                      <Select
                        value={registerForm.provinceId}
                        onValueChange={(value) => setRegisterForm({ ...registerForm, provinceId: value })}>
                        <SelectTrigger>
                          <SelectValue placeholder="اختر المحافظة" />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces.map((province) => (
                            <SelectItem key={province.id} value={province.id}>
                              {province.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="reg-password">كلمة المرور</Label>
                      <Input
                        id="reg-password"
                        type="password"
                        value={registerForm.password}
                        onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        value={registerForm.confirmPassword}
                        onChange={(e) => setRegisterForm({ ...registerForm, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700">
                      <UserPlus className="h-4 w-4 ml-2" />
                      تسجيل كمستثمر جديد
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-emerald-100 py-4">
          <div className="container mx-auto px-4 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} وزارة الصحة والبيئة - الإدارة العامة للمنشآت الصحية الخاصة</p>
            <p className="text-xs mt-1">جميع الحقوق محفوظة</p>
          </div>
        </footer>
      </div>
    );
  }

  // Dashboard
  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-emerald-100 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative w-12 h-12">
                <Image
                  src="/eagle-logo.png"
                  alt="شعار الوزارة"
                  fill
                  className="object-contain"
                />
              </div>
              <div>
                <h1 className="text-lg font-bold text-emerald-700">الخدمات الطبية إحسان</h1>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs border-emerald-300 text-emerald-700">
                    {ROLE_LABELS[user.role]}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-left hidden sm:block">
                <p className="text-sm font-medium">{user.name}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout} className="border-red-200 text-red-600 hover:bg-red-50">
                <LogOut className="h-4 w-4 ml-2" />
                خروج
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        {/* Client Dashboard */}
        {user.role === 'CLIENT' && (
          <Tabs defaultValue="my-requests" className="space-y-4">
            <TabsList className="grid w-full grid-cols-2 bg-white border">
              <TabsTrigger value="my-requests" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                <FileText className="h-4 w-4 ml-2" />
                طلباتي
              </TabsTrigger>
              <TabsTrigger value="new-request" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                <Plus className="h-4 w-4 ml-2" />
                طلب جديد
              </TabsTrigger>
            </TabsList>

            <TabsContent value="my-requests" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-emerald-700">طلباتي</h2>
                <Badge variant="outline" className="border-emerald-300">{requests.length} طلب</Badge>
              </div>

              {requests.length === 0 ? (
                <Card className="border-emerald-100">
                  <CardContent className="text-center py-12">
                    <FileText className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-gray-500">لا توجد طلبات حتى الآن</p>
                    <p className="text-sm text-gray-400 mt-1">يمكنك إنشاء طلب جديد من تبويب "طلب جديد"</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {requests.map((request) => (
                    <Card 
                      key={request.id} 
                      className="cursor-pointer hover:shadow-lg transition-all border-emerald-100 hover:border-emerald-300"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowRequestDetails(true);
                      }}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <CardTitle className="text-lg text-emerald-700">{request.facilityName}</CardTitle>
                          <Badge className={getStatusColor(request.status)}>
                            {STATUS_LABELS[request.status]}
                          </Badge>
                        </div>
                        <CardDescription>{request.requestNumber}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">نوع الطلب:</span>
                            <span className="font-medium">{REQUEST_TYPE_LABELS[request.type]}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">نوع المنشأة:</span>
                            <span className="font-medium">{FACILITY_TYPE_LABELS[request.facilityType]}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">المحافظة:</span>
                            <span>{request.province?.name}</span>
                          </div>
                          <div className="pt-2">
                            <p className="text-gray-500 text-xs mb-1">تقدم الطلب</p>
                            <Progress value={getProgressPercentage(request)} className="h-2" />
                          </div>
                          {request.receiptNumber && (
                            <div className="mt-2 p-2 bg-blue-50 rounded-lg">
                              <p className="text-xs text-blue-700">رقم الحافظة: {request.receiptNumber}</p>
                              {request.receiptAmount && (
                                <p className="text-xs text-blue-700">المبلغ: {request.receiptAmount.toLocaleString()} ريال</p>
                              )}
                            </div>
                          )}
                          {request.licenseNumber && (
                            <div className="mt-2 p-2 bg-green-50 rounded-lg">
                              <p className="text-xs text-green-700 font-medium">رقم الترخيص: {request.licenseNumber}</p>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="new-request">
              <Card className="border-emerald-100">
                <CardHeader className="bg-gradient-to-l from-emerald-600 to-emerald-700 text-white rounded-t-lg">
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    إنشاء طلب جديد
                  </CardTitle>
                  <CardDescription className="text-emerald-100">
                    أدخل بيانات المنشأة الصحية المطلوب ترخيصها
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleCreateRequest} className="space-y-6">
                    {/* Request Type & Facility Type */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label className="text-emerald-700 font-medium">نوع الطلب</Label>
                        <Select
                          value={newRequestForm.type}
                          onValueChange={(value) => setNewRequestForm({ ...newRequestForm, type: value as RequestType })}>
                          <SelectTrigger className="border-emerald-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="FURNISHING">تأثيث</SelectItem>
                            <SelectItem value="OPERATION">تشغيل</SelectItem>
                            <SelectItem value="RENEWAL">تجديد</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-emerald-700 font-medium">نوع المنشأة</Label>
                        <Select
                          value={newRequestForm.facilityType}
                          onValueChange={(value) => setNewRequestForm({ ...newRequestForm, facilityType: value as FacilityType })}>
                          <SelectTrigger className="border-emerald-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(FACILITY_TYPE_LABELS).map(([key, label]) => (
                              <SelectItem key={key} value={key}>{label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {/* Fee Display */}
                    <Card className="bg-blue-50 border-blue-200">
                      <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                            <span className="font-medium text-blue-700">الرسوم المتوقعة:</span>
                          </div>
                          <span className="text-lg font-bold text-blue-700">
                            {calculateFee(newRequestForm.type, newRequestForm.facilityType).toLocaleString()} ريال
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Province */}
                    <div className="space-y-2">
                      <Label className="text-emerald-700 font-medium">المحافظة</Label>
                      <Select
                        value={newRequestForm.provinceId}
                        onValueChange={(value) => setNewRequestForm({ ...newRequestForm, provinceId: value })}>
                        <SelectTrigger className="border-emerald-200">
                          <SelectValue placeholder="اختر المحافظة" />
                        </SelectTrigger>
                        <SelectContent>
                          {provinces.map((province) => (
                            <SelectItem key={province.id} value={province.id}>
                              {province.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Facility Name */}
                    <div className="space-y-2">
                      <Label className="text-emerald-700 font-medium">اسم المنشأة</Label>
                      <Input
                        placeholder="مثال: مستشفى الشفاء التخصصي"
                        value={newRequestForm.facilityName}
                        onChange={(e) => setNewRequestForm({ ...newRequestForm, facilityName: e.target.value })}
                        required
                        className="border-emerald-200"
                      />
                    </div>

                    {/* Owner Info */}
                    <Card className="border-emerald-100">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-emerald-700 flex items-center gap-2">
                          <User className="h-4 w-4" />
                          بيانات المالك
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>اسم المالك</Label>
                            <Input
                              value={newRequestForm.ownerName}
                              onChange={(e) => setNewRequestForm({ ...newRequestForm, ownerName: e.target.value })}
                              required
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>هاتف المالك</Label>
                            <Input
                              type="tel"
                              placeholder="967-xxx-xxx-xxx"
                              value={newRequestForm.ownerPhone}
                              onChange={(e) => setNewRequestForm({ ...newRequestForm, ownerPhone: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div className="space-y-2">
                            <Label>البريد الإلكتروني (اختياري)</Label>
                            <Input
                              type="email"
                              value={newRequestForm.ownerEmail}
                              onChange={(e) => setNewRequestForm({ ...newRequestForm, ownerEmail: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>عنوان المالك (اختياري)</Label>
                            <Input
                              value={newRequestForm.ownerAddress}
                              onChange={(e) => setNewRequestForm({ ...newRequestForm, ownerAddress: e.target.value })}
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Facility Address */}
                    <div className="space-y-2">
                      <Label className="text-emerald-700 font-medium">عنوان المنشأة</Label>
                      <Textarea
                        placeholder="أدخل العنوان التفصيلي للمنشأة"
                        value={newRequestForm.facilityAddress}
                        onChange={(e) => setNewRequestForm({ ...newRequestForm, facilityAddress: e.target.value })}
                        required
                        className="border-emerald-200"
                      />
                    </div>

                    {/* Required Documents */}
                    <Card className="border-amber-200 bg-amber-50">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm text-amber-700 flex items-center gap-2">
                          <FileCheck className="h-4 w-4" />
                          المستندات المطلوبة
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2 text-sm">
                          {getRequiredDocuments(newRequestForm.type).map((docType) => (
                            <li key={docType} className="flex items-center gap-2 text-amber-700">
                              <CheckCircle className="h-4 w-4" />
                              {DOCUMENT_TYPE_LABELS[docType] || docType}
                            </li>
                          ))}
                        </ul>
                        <p className="text-xs text-amber-600 mt-3">
                          * سيتم طلب المستندات المطلوبة بعد استلام الطلب الأولي
                        </p>
                      </CardContent>
                    </Card>

                    <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg py-6">
                      <Send className="h-5 w-5 ml-2" />
                      إرسال الطلب
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {/* Manager Dashboards */}
        {user.role !== 'CLIENT' && (
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3 bg-white border">
              <TabsTrigger value="pending" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                <Clock className="h-4 w-4 ml-2" />
                الطلبات المعلقة
                {getPendingRequests().length > 0 && (
                  <Badge className="mr-2 bg-red-500 text-white">{getPendingRequests().length}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="all" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                <FileText className="h-4 w-4 ml-2" />
                جميع الطلبات
              </TabsTrigger>
              {(user.role === 'GENERAL_MGR' || user.role === 'DEPUTY_MINISTER') && (
                <TabsTrigger value="stats" className="data-[state=active]:bg-emerald-600 data-[state=active]:text-white">
                  <BarChart3 className="h-4 w-4 ml-2" />
                  الإحصائيات والتقارير
                </TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="pending" className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-emerald-700">
                  الطلبات بانتظار المراجعة
                </h2>
                <Badge variant="outline" className="border-emerald-300">
                  {getPendingRequests().length} طلب معلق
                </Badge>
              </div>

              {getPendingRequests().length === 0 ? (
                <Card className="border-emerald-100">
                  <CardContent className="text-center py-12">
                    <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                    <p className="text-gray-500">لا توجد طلبات معلقة حالياً</p>
                  </CardContent>
                </Card>
              ) : (
                <ScrollArea className="h-[calc(100vh-280px)]">
                  <div className="grid gap-4">
                    {getPendingRequests().map((request) => (
                      <Card 
                        key={request.id} 
                        className="cursor-pointer hover:shadow-lg transition-all border-emerald-100 hover:border-emerald-300"
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRequestDetails(true);
                        }}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-emerald-600" />
                                <h3 className="font-semibold text-emerald-700">{request.facilityName}</h3>
                              </div>
                              <p className="text-sm text-gray-500">
                                {request.requestNumber} • {REQUEST_TYPE_LABELS[request.type]} • {FACILITY_TYPE_LABELS[request.facilityType]}
                              </p>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span className="flex items-center gap-1">
                                  <User className="h-4 w-4" />
                                  {request.ownerName}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  {request.province?.name}
                                </span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge className={getStatusColor(request.status)}>
                                {STATUS_LABELS[request.status]}
                              </Badge>
                              <span className="text-xs text-gray-400">
                                {new Date(request.createdAt).toLocaleDateString('ar-SA')}
                              </span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="all" className="space-y-4">
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="grid gap-4">
                  {requests.map((request) => (
                    <Card 
                      key={request.id} 
                      className="cursor-pointer hover:shadow-lg transition-all border-emerald-100"
                      onClick={() => {
                        setSelectedRequest(request);
                        setShowRequestDetails(true);
                      }}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-5 w-5 text-emerald-600" />
                              <h3 className="font-semibold text-emerald-700">{request.facilityName}</h3>
                            </div>
                            <p className="text-sm text-gray-500">
                              {request.requestNumber} • {REQUEST_TYPE_LABELS[request.type]}
                            </p>
                          </div>
                          <Badge className={getStatusColor(request.status)}>
                            {STATUS_LABELS[request.status]}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {(user.role === 'GENERAL_MGR' || user.role === 'DEPUTY_MINISTER') && (
              <TabsContent value="stats" className="space-y-4">
                {stats && (
                  <>
                    {/* Stats Cards */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                      <Card className="border-emerald-100">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">إجمالي الطلبات</CardTitle>
                          <FileText className="h-4 w-4 text-emerald-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-emerald-700">{stats.totalRequests}</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-amber-100">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">الطلبات المعلقة</CardTitle>
                          <Clock className="h-4 w-4 text-amber-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-amber-600">{stats.pendingRequests}</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-green-100">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">الطلبات المكتملة</CardTitle>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-green-600">{stats.completedRequests}</div>
                        </CardContent>
                      </Card>
                      
                      <Card className="border-red-100">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">الطلبات المرفوضة</CardTitle>
                          <XCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold text-red-600">{stats.rejectedRequests}</div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Reports Section */}
                    <Card className="border-emerald-100">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-emerald-700">
                          <Download className="h-5 w-5" />
                          تصدير التقارير
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid gap-4 md:grid-cols-4">
                          <Select
                            value={reportFilters.provinceId}
                            onValueChange={(value) => setReportFilters({ ...reportFilters, provinceId: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="المحافظة" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">الكل</SelectItem>
                              {provinces.map((p) => (
                                <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Select
                            value={reportFilters.status}
                            onValueChange={(value) => setReportFilters({ ...reportFilters, status: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="الحالة" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">الكل</SelectItem>
                              {Object.entries(STATUS_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Select
                            value={reportFilters.type}
                            onValueChange={(value) => setReportFilters({ ...reportFilters, type: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="نوع الطلب" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">الكل</SelectItem>
                              {Object.entries(REQUEST_TYPE_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          <Select
                            value={reportFilters.facilityType}
                            onValueChange={(value) => setReportFilters({ ...reportFilters, facilityType: value })}>
                            <SelectTrigger>
                              <SelectValue placeholder="نوع المنشأة" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">الكل</SelectItem>
                              {Object.entries(FACILITY_TYPE_LABELS).map(([key, label]) => (
                                <SelectItem key={key} value={key}>{label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button onClick={() => handleExportReport('csv')} className="bg-emerald-600 hover:bg-emerald-700">
                            <Download className="h-4 w-4 ml-2" />
                            تصدير Excel (CSV)
                          </Button>
                          <Button onClick={() => handleExportReport('json')} variant="outline" className="border-emerald-300">
                            <FileText className="h-4 w-4 ml-2" />
                            تصدير JSON
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Charts */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <Card className="border-emerald-100">
                        <CardHeader>
                          <CardTitle className="text-emerald-700">الطلبات حسب النوع</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {stats.requestsByType.map((item) => (
                              <div key={item.type} className="flex items-center justify-between">
                                <span>{REQUEST_TYPE_LABELS[item.type as RequestType]}</span>
                                <div className="flex items-center gap-2">
                                  <Progress value={(item.count / stats.totalRequests) * 100} className="w-24 h-2" />
                                  <Badge variant="secondary">{item.count}</Badge>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card className="border-emerald-100">
                        <CardHeader>
                          <CardTitle className="text-emerald-700">الطلبات حسب الحالة</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {stats.requestsByStatus.map((item) => (
                              <div key={item.status} className="flex items-center justify-between">
                                <span>{STATUS_LABELS[item.status as RequestStatus]}</span>
                                <Badge variant="secondary">{item.count}</Badge>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    <Card className="border-emerald-100">
                      <CardHeader>
                        <CardTitle className="text-emerald-700">الطلبات حسب المحافظة</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-5">
                          {stats.requestsByProvince.map((item) => (
                            <div key={item.provinceId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm">{item.provinceName}</span>
                              <Badge variant="outline" className="border-emerald-300">{item.count}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-emerald-100">
                      <CardHeader>
                        <CardTitle className="text-emerald-700">المستخدمين حسب الدور</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2 md:grid-cols-3 lg:grid-cols-6">
                          {stats.usersByRole.map((item) => (
                            <div key={item.role} className="flex flex-col items-center p-3 bg-gray-50 rounded-lg">
                              <span className="text-sm font-medium">{ROLE_LABELS[item.role as Role]}</span>
                              <Badge variant="secondary" className="mt-1">{item.count}</Badge>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </>
                )}
              </TabsContent>
            )}
          </Tabs>
        )}
      </main>

      {/* Request Details Dialog */}
      <Dialog open={showRequestDetails} onOpenChange={setShowRequestDetails}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {selectedRequest && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-emerald-700">
                  <Building2 className="h-5 w-5" />
                  {selectedRequest.facilityName}
                </DialogTitle>
                <DialogDescription>
                  رقم المعاملة: {selectedRequest.requestNumber}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {/* Status & Progress */}
                <div className="flex items-center justify-between">
                  <Badge className={getStatusColor(selectedRequest.status)}>
                    {STATUS_LABELS[selectedRequest.status]}
                  </Badge>
                  <span className="text-sm text-gray-500">
                    {new Date(selectedRequest.createdAt).toLocaleDateString('ar-SA')}
                  </span>
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium text-emerald-700">تقدم الطلب</p>
                  <Progress value={getProgressPercentage(selectedRequest)} className="h-3" />
                  <div className="flex justify-between text-xs text-gray-500">
                    <span className={selectedRequest.branchApproved ? 'text-green-600 font-medium' : ''}>الفرع</span>
                    <span className={selectedRequest.facilitiesApproved ? 'text-green-600 font-medium' : ''}>المنشآت</span>
                    <span className={selectedRequest.reviewApproved ? 'text-green-600 font-medium' : ''}>المراجعة</span>
                    <span className={selectedRequest.deputyApproved ? 'text-green-600 font-medium' : ''}>الوكيل</span>
                  </div>
                </div>

                {/* Request Details */}
                <Card className="border-emerald-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-emerald-700">بيانات الطلب</CardTitle>
                  </CardHeader>
                  <CardContent className="grid gap-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-500">نوع الطلب:</span>
                        <span className="mr-2 font-medium">{REQUEST_TYPE_LABELS[selectedRequest.type]}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">نوع المنشأة:</span>
                        <span className="mr-2 font-medium">{FACILITY_TYPE_LABELS[selectedRequest.facilityType]}</span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-500">المحافظة:</span>
                        <span className="mr-2">{selectedRequest.province?.name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">الرسوم:</span>
                        <span className="mr-2 font-bold text-blue-600">
                          {calculateFee(selectedRequest.type, selectedRequest.facilityType).toLocaleString()} ريال
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="text-gray-500">اسم المالك:</span>
                        <span className="mr-2">{selectedRequest.ownerName}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">هاتف المالك:</span>
                        <span className="mr-2">{selectedRequest.ownerPhone}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-500">عنوان المنشأة:</span>
                      <span className="mr-2">{selectedRequest.facilityAddress}</span>
                    </div>
                  </CardContent>
                </Card>

                {/* Receipt Info */}
                {selectedRequest.receiptNumber && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-blue-700 flex items-center gap-2">
                        <Receipt className="h-4 w-4" />
                        بيانات الحافظة
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span>رقم الحافظة:</span>
                        <span className="font-bold">{selectedRequest.receiptNumber}</span>
                      </div>
                      {selectedRequest.receiptAmount && (
                        <div className="flex justify-between">
                          <span>المبلغ:</span>
                          <span className="font-bold">{selectedRequest.receiptAmount.toLocaleString()} ريال</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Payment Info */}
                {selectedRequest.paymentVerified && (
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-green-700 flex items-center gap-2">
                        <CheckCircle className="h-4 w-4" />
                        تم التحقق من السداد
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm">
                      <div className="flex justify-between">
                        <span>مرجع الدفع:</span>
                        <span className="font-bold">{selectedRequest.paymentReference}</span>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* License Info */}
                {selectedRequest.licenseNumber && (
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm text-green-700 flex items-center gap-2">
                        <Award className="h-4 w-4" />
                        الترخيص صادر
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid gap-2 text-sm">
                      <div className="flex justify-between">
                        <span>رقم الترخيص:</span>
                        <span className="font-bold">{selectedRequest.licenseNumber}</span>
                      </div>
                      {selectedRequest.licenseExpiryDate && (
                        <div className="flex justify-between">
                          <span>تاريخ الانتهاء:</span>
                          <span>{new Date(selectedRequest.licenseExpiryDate).toLocaleDateString('ar-SA')}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Approval Notes History */}
                <Card className="border-emerald-100">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm text-emerald-700">سجل الموافقات</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {selectedRequest.branchNotes && (
                      <div className="p-2 bg-gray-50 rounded-lg text-sm">
                        <span className="font-medium text-emerald-700">ملاحظات الفرع:</span>
                        <span className="mr-2">{selectedRequest.branchNotes}</span>
                      </div>
                    )}
                    {selectedRequest.facilitiesNotes && (
                      <div className="p-2 bg-gray-50 rounded-lg text-sm">
                        <span className="font-medium text-emerald-700">ملاحظات المنشآت:</span>
                        <span className="mr-2">{selectedRequest.facilitiesNotes}</span>
                      </div>
                    )}
                    {selectedRequest.reviewNotes && (
                      <div className="p-2 bg-gray-50 rounded-lg text-sm">
                        <span className="font-medium text-emerald-700">ملاحظات المراجعة:</span>
                        <span className="mr-2">{selectedRequest.reviewNotes}</span>
                      </div>
                    )}
                    {selectedRequest.deputyNotes && (
                      <div className="p-2 bg-gray-50 rounded-lg text-sm">
                        <span className="font-medium text-emerald-700">ملاحظات الوكيل:</span>
                        <span className="mr-2">{selectedRequest.deputyNotes}</span>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Actions */}
                {user && user.role !== 'CLIENT' && (() => {
                  const canAct = 
                    (user.role === 'BRANCH_MANAGER' && selectedRequest.status === 'PENDING_BRANCH') ||
                    (user.role === 'FACILITIES_MGR' && selectedRequest.status === 'PENDING_FACILITIES') ||
                    (user.role === 'REVIEW_MGR' && selectedRequest.status === 'PENDING_REVIEW') ||
                    (user.role === 'DEPUTY_MINISTER' && selectedRequest.status === 'PENDING_DEPUTY');
                  
                  return canAct ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>ملاحظات (اختياري)</Label>
                        <Textarea
                          value={approvalNotes}
                          onChange={(e) => setApprovalNotes(e.target.value)}
                          placeholder="أضف ملاحظاتك هنا..."
                        />
                      </div>
                      
                      <div className="flex gap-2">
                        <Button 
                          onClick={() => handleApproveRequest(selectedRequest.id, 'approve')}
                          className="flex-1 bg-green-600 hover:bg-green-700">
                          <CheckCircle className="h-4 w-4 ml-2" />
                          موافقة
                        </Button>
                        <Button 
                          onClick={() => handleApproveRequest(selectedRequest.id, 'reject')}
                          variant="destructive"
                          className="flex-1">
                          <XCircle className="h-4 w-4 ml-2" />
                          رفض
                        </Button>
                      </div>
                    </div>
                  ) : null;
                })()}

                {/* Review Manager Actions */}
                {user?.role === 'REVIEW_MGR' && selectedRequest.status === 'PENDING_REVIEW' && !selectedRequest.receiptNumber && (
                  <Button 
                    onClick={() => {
                      setReceiptForm({ 
                        receiptNumber: `HAF-${Date.now()}`, 
        receiptAmount: calculateFee(selectedRequest.type, selectedRequest.facilityType).toString()
                      });
                      setShowReceiptDialog(true);
                    }}
                    className="w-full bg-blue-600 hover:bg-blue-700">
                    <Receipt className="h-4 w-4 ml-2" />
                    قطع الحافظة
                  </Button>
                )}

                {/* Payment Verification */}
                {user?.role === 'REVIEW_MGR' && selectedRequest.status === 'PENDING_PAYMENT' && !selectedRequest.paymentVerified && (
                  <Button 
                    onClick={() => setShowPaymentDialog(true)}
                    className="w-full bg-green-600 hover:bg-green-700">
                    <CreditCard className="h-4 w-4 ml-2" />
                    التحقق من السداد
                  </Button>
                )}

                {/* Issue License */}
                {user?.role === 'REVIEW_MGR' && selectedRequest.paymentVerified && !selectedRequest.licenseNumber && (
                  <Button 
                    onClick={() => {
                      setLicenseForm({ licenseNumber: `LIC-${Date.now()}` });
                      setShowLicenseDialog(true);
                    }}
                    className="w-full bg-amber-600 hover:bg-amber-700">
                    <Award className="h-4 w-4 ml-2" />
                    إصدار الترخيص
                  </Button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Receipt Dialog */}
      <Dialog open={showReceiptDialog} onOpenChange={setShowReceiptDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <Receipt className="h-5 w-5" />
              قطع الحافظة
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>رقم الحافظة</Label>
              <Input
                value={receiptForm.receiptNumber}
                onChange={(e) => setReceiptForm({ ...receiptForm, receiptNumber: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>المبلغ (ريال)</Label>
              <Input
                type="number"
                value={receiptForm.receiptAmount}
                onChange={(e) => setReceiptForm({ ...receiptForm, receiptAmount: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiptDialog(false)}>إلغاء</Button>
            <Button onClick={handleIssueReceipt} className="bg-emerald-600 hover:bg-emerald-700">
              تأكيد قطع الحافظة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <CreditCard className="h-5 w-5" />
              التحقق من السداد
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>مرجع الدفع</Label>
              <Input
                value={paymentForm.paymentReference}
                onChange={(e) => setPaymentForm({ ...paymentForm, paymentReference: e.target.value })}
                placeholder="أدخل مرجع عملية الدفع"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>إلغاء</Button>
            <Button onClick={handleVerifyPayment} className="bg-green-600 hover:bg-green-700">
              تأكيد السداد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* License Dialog */}
      <Dialog open={showLicenseDialog} onOpenChange={setShowLicenseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-emerald-700">
              <Award className="h-5 w-5" />
              إصدار الترخيص
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>رقم الترخيص</Label>
              <Input
                value={licenseForm.licenseNumber}
                onChange={(e) => setLicenseForm({ ...licenseForm, licenseNumber: e.target.value })}
              />
            </div>
            <div className="p-4 bg-green-50 rounded-lg text-sm text-green-700">
              <p>سيكون الترخيص صالحاً لمدة سنة من تاريخ الإصدار</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLicenseDialog(false)}>إلغاء</Button>
            <Button onClick={handleIssueLicense} className="bg-amber-600 hover:bg-amber-700">
              إصدار الترخيص
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Footer */}
      <footer className="bg-white border-t border-emerald-100 py-4 mt-8">
        <div className="container mx-auto px-4 text-center text-sm text-gray-500">
          <p>© {new Date().getFullYear()} وزارة الصحة والبيئة - الإدارة العامة للمنشآت الصحية الخاصة</p>
        </div>
      </footer>
    </div>
  );
}
