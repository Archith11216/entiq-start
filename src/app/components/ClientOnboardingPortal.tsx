import React, { useState, useEffect, useRef } from 'react';
import {
  CheckCircle2,
  Shield,
  FileText,
  User,
  Building2,
  Lock,
  ArrowRight,
  ArrowLeft,
  PenTool,
  Download,
  Printer,
  Check,
  Clock,
  Sparkles,
  Phone,
  Mail,
  AlertCircle,
  HelpCircle,
  RotateCcw
} from 'lucide-react';
import { invitations as invitationsApi } from '../../lib/api';
import type { Invitation } from '../../types/api';

interface ClientOnboardingPortalProps {
  invitationId?: string;
}

export function ClientOnboardingPortal({ invitationId }: ClientOnboardingPortalProps) {
  const [invId, setInvId] = useState<string>(() => {
    if (invitationId) return invitationId;
    const params = new URLSearchParams(window.location.search);
    return params.get('id') || params.get('onboarding') || 'INV-2024-0120';
  });

  const [invitation, setInvitation] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Client Details form state
  const [phone, setPhone] = useState('0412 345 678');
  const [entityType, setEntityType] = useState('Company');
  const [abn, setAbn] = useState('51 824 753 556');
  const [isTaxResident, setIsTaxResident] = useState(true);
  const [consentAto, setConsentAto] = useState(true);

  // Signature state
  const [signatoryName, setSignatoryName] = useState('');
  const [signatureMode, setSignatureMode] = useState<'type' | 'draw'>('draw');
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [acceptedDate, setAcceptedDate] = useState<string>('');

  // Canvas ref for drawing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const isDrawing = useRef(false);

  useEffect(() => {
    async function fetchInvitation() {
      setLoading(true);
      setError(null);
      try {
        const data = await invitationsApi.getPublic(invId);
        setInvitation(data);
        setSignatoryName(data.client || '');
        if (data.status === 'Completed') {
          setStep(4);
          setAcceptedDate('Today');
        }
      } catch (err: any) {
        console.error('Failed to load invitation:', err);
        setError(err.message || 'Invitation not found or link has expired.');
      } finally {
        setLoading(false);
      }
    }

    if (invId) {
      fetchInvitation();
    }
  }, [invId]);

  // Canvas drawing handlers
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    isDrawing.current = true;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (!isDrawing.current) return;
    isDrawing.current = false;
    const canvas = canvasRef.current;
    if (canvas) {
      setDrawnSignature(canvas.toDataURL());
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setDrawnSignature(null);
  };

  const handleCompleteAcceptance = async () => {
    if (!agreedTerms) return;
    setSubmitting(true);
    try {
      await invitationsApi.acceptPublic(invId);
      setAcceptedDate(new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }));
      setStep(4);
    } catch (err: any) {
      alert('Error submitting acceptance: ' + (err.message || 'Please try again.'));
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 font-sans">
        <div className="w-12 h-12 rounded-xl bg-[#2855A6] flex items-center justify-center text-white font-bold text-lg mb-4 shadow-md">
          EN
        </div>
        <div className="w-7 h-7 border-3 border-[#2855A6]/20 border-t-[#2855A6] rounded-full animate-spin mb-3" />
        <p className="text-slate-600 text-sm font-medium">Loading your client onboarding portal…</p>
      </div>
    );
  }

  if (error || !invitation) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={24} />
          </div>
          <h2 className="text-lg font-bold text-slate-900 mb-2">Invitation Unavailable</h2>
          <p className="text-sm text-slate-600 mb-6">
            {error || 'This onboarding invitation link has expired or is invalid. Please contact your advisory team for a new invitation.'}
          </p>
          <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs text-slate-500 mb-6 text-left space-y-1">
            <div><strong>Firm:</strong> Grow Advisory Group</div>
            <div><strong>Support:</strong> andrew@growadvisorygroup.com.au</div>
            <div><strong>Reference ID:</strong> {invId}</div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="w-full py-2.5 px-4 bg-[#2855A6] text-white text-sm font-medium rounded-lg hover:bg-[#1E448A] transition-colors shadow-sm"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col">
      {/* Top Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-4xl mx-auto px-4 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-[#2855A6] flex items-center justify-center text-white font-bold text-sm shadow-sm">
              EN
            </div>
            <div>
              <div className="text-xs font-semibold text-[#2855A6] uppercase tracking-wider">EnTIQ Client Portal</div>
              <div className="text-sm font-bold text-slate-900">Grow Advisory Group</div>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs font-medium text-slate-500 bg-slate-100 px-3 py-1.5 rounded-full">
            <Shield size={13} className="text-emerald-600" />
            <span>256-bit Bank Grade Security</span>
          </div>
        </div>
      </header>

      {/* Progress Stepper (Steps 1 to 3) */}
      {step < 4 && (
        <div className="bg-white border-b border-slate-200">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 1 ? 'text-[#2855A6]' : 'text-slate-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step > 1 ? 'bg-emerald-500 text-white' : step === 1 ? 'bg-[#2855A6] text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {step > 1 ? <Check size={13} /> : '1'}
                </div>
                <span>Services & Scope</span>
              </div>

              <div className="flex-1 h-0.5 bg-slate-200 mx-3 max-w-[80px] sm:max-w-[140px]" />

              <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 2 ? 'text-[#2855A6]' : 'text-slate-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step > 2 ? 'bg-emerald-500 text-white' : step === 2 ? 'bg-[#2855A6] text-white' : 'bg-slate-200 text-slate-600'}`}>
                  {step > 2 ? <Check size={13} /> : '2'}
                </div>
                <span>Entity Details</span>
              </div>

              <div className="flex-1 h-0.5 bg-slate-200 mx-3 max-w-[80px] sm:max-w-[140px]" />

              <div className={`flex items-center gap-2 text-xs font-semibold ${step >= 3 ? 'text-[#2855A6]' : 'text-slate-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${step === 3 ? 'bg-[#2855A6] text-white' : 'bg-slate-200 text-slate-600'}`}>
                  3
                </div>
                <span>Sign Engagement</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Container */}
      <main className="flex-1 max-w-3xl w-full mx-auto p-4 sm:p-6 my-4">
        {/* STEP 1: WELCOME & SERVICE SCOPE */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-[#2855A6] text-xs font-semibold mb-3">
                <Sparkles size={13} /> Welcome to Digital Onboarding
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
                Hello, {invitation.client}
              </h1>
              <p className="text-slate-600 text-sm leading-relaxed mb-6">
                Grow Advisory Group has invited you to finalize your client engagement. Please review your service details and confirm your information below.
              </p>

              <div className="bg-gradient-to-br from-[#2855A6]/5 to-[#2855A6]/10 border border-[#2855A6]/20 rounded-xl p-5 mb-6">
                <div className="text-xs uppercase font-bold text-[#2855A6] tracking-wider mb-1">
                  Primary Engagement Scope
                </div>
                <div className="text-xl font-bold text-slate-900 mb-2">
                  {invitation.service}
                </div>
                <div className="text-xs text-slate-600 flex items-center gap-4 flex-wrap">
                  <span><strong>Adviser:</strong> {invitation.owner || 'J. Okafor'}</span>
                  <span><strong>Reference:</strong> {invitation.id}</span>
                  <span><strong>Valid Until:</strong> {invitation.expires || '14 days'}</span>
                </div>
              </div>

              <h3 className="text-sm font-bold text-slate-900 mb-3">Included in your engagement:</h3>
              <div className="grid sm:grid-cols-2 gap-3 mb-8">
                <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-lg">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Annual Compliance & Lodgement</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Statutory financial reports and ATO tax return preparation.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-lg">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Quarterly BAS & GST Review</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Reconciliation and electronic lodgement via ATO portal.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-lg">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Tax Advisory & Planning</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Year-round proactive structuring advice and consultation.</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3.5 bg-slate-50 border border-slate-100 rounded-lg">
                  <CheckCircle2 size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">Cloud Document Portal</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">Encrypted 24/7 file sharing and secure record archiving.</div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-[#2855A6] text-white text-sm font-semibold rounded-lg hover:bg-[#1E448A] transition-colors shadow-sm flex items-center gap-2"
                >
                  Verify Information <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: ENTITY DETAILS */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Confirm Your Entity & Contact Details</h2>
              <p className="text-slate-600 text-xs mb-6">
                Please ensure your contact details match statutory records for accurate ATO authorization.
              </p>

              <div className="space-y-4 mb-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Entity / Client Name</label>
                    <input
                      type="text"
                      readOnly
                      value={invitation.client}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Email</label>
                    <input
                      type="email"
                      readOnly
                      value={invitation.email}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-800 font-medium cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Mobile Phone</label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="0400 000 000"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Entity Structure</label>
                    <select
                      value={entityType}
                      onChange={(e) => setEntityType(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
                    >
                      <option value="Company">Company (Pty Ltd)</option>
                      <option value="Trust">Discretionary / Unit Trust</option>
                      <option value="Individual">Individual / Sole Trader</option>
                      <option value="Partnership">Partnership</option>
                      <option value="SMSF">Self-Managed Super Fund (SMSF)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Australian Business Number (ABN / ACN)</label>
                  <input
                    type="text"
                    value={abn}
                    onChange={(e) => setAbn(e.target.value)}
                    placeholder="e.g. 51 824 753 556"
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6]"
                  />
                </div>

                <div className="pt-2 space-y-3">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={isTaxResident}
                      onChange={(e) => setIsTaxResident(e.target.checked)}
                      className="rounded border-slate-300 text-[#2855A6] focus:ring-[#2855A6] mt-0.5"
                    />
                    <span>
                      <strong>Australian Tax Residency:</strong> I confirm that this entity is an Australian resident for statutory tax purposes.
                    </span>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-700 select-none">
                    <input
                      type="checkbox"
                      checked={consentAto}
                      onChange={(e) => setConsentAto(e.target.checked)}
                      className="rounded border-slate-300 text-[#2855A6] focus:ring-[#2855A6] mt-0.5"
                    />
                    <span>
                      <strong>ATO Tax Agent Authority:</strong> I authorize Grow Advisory Group (Registered Tax Agent) to link with the ATO Client Agent Portal on our behalf.
                    </span>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 text-sm font-medium flex items-center gap-1.5"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-6 py-2.5 bg-[#2855A6] text-white text-sm font-semibold rounded-lg hover:bg-[#1E448A] transition-colors shadow-sm flex items-center gap-2"
                >
                  Review Agreement <ArrowRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: REVIEW & DIGITAL SIGNATURE */}
        {step === 3 && (
          <div className="space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm">
              <h2 className="text-xl font-bold text-slate-900 mb-1">Review & Sign Engagement Agreement</h2>
              <p className="text-slate-600 text-xs mb-4">
                Please review the terms of engagement below and provide your digital signature to execute the agreement.
              </p>

              {/* Document Preview Box */}
              <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 text-xs text-slate-700 h-64 overflow-y-auto space-y-4 mb-6 leading-relaxed font-serif shadow-inner">
                <div className="text-center pb-3 border-b border-slate-200">
                  <div className="font-bold text-sm text-slate-900">STANDARD LETTER OF ENGAGEMENT</div>
                  <div className="text-[11px] text-slate-500">Grow Advisory Group &bull; Level 12, 101 Collins St, Melbourne VIC 3000</div>
                </div>

                <p>
                  <strong>1. Purpose and Scope of Engagement:</strong> This document sets out the terms on which Grow Advisory Group ('the Practice') will provide professional accounting, taxation, and advisory services to <strong>{invitation.client}</strong> ('the Client'). The scope includes: {invitation.service}.
                </p>
                <p>
                  <strong>2. Standards and Code of Ethics:</strong> Our engagement will be conducted in accordance with APES 110 (Code of Ethics for Professional Accountants) and APES 305 (Terms of Engagement) issued by Accounting Professional & Ethical Standards Board (APESB).
                </p>
                <p>
                  <strong>3. Client Responsibilities:</strong> The Client is responsible for the accuracy and completeness of all financial records, source receipts, and statutory declarations provided to the Practice.
                </p>
                <p>
                  <strong>4. Privacy and Confidentiality:</strong> All client information is stored strictly within Australian data centers in accordance with the Privacy Act 1988 and Australian Privacy Principles (APPs).
                </p>
                <p>
                  <strong>5. Electronic Execution:</strong> The parties consent to this document being signed electronically in accordance with the Electronic Transactions Act 1999 (Cth).
                </p>
              </div>

              {/* Digital Signature Section */}
              <div className="p-5 bg-blue-50/50 border border-blue-100 rounded-xl space-y-4 mb-6">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Digital Signature
                  </label>
                  <div className="flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setSignatureMode('draw')}
                      className={`px-3 py-1 rounded font-medium ${signatureMode === 'draw' ? 'bg-[#2855A6] text-white' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Draw
                    </button>
                    <button
                      type="button"
                      onClick={() => setSignatureMode('type')}
                      className={`px-3 py-1 rounded font-medium ${signatureMode === 'type' ? 'bg-[#2855A6] text-white' : 'text-slate-600 hover:text-slate-900'}`}
                    >
                      Type
                    </button>
                  </div>
                </div>

                {signatureMode === 'draw' ? (
                  <div>
                    <div className="relative border-2 border-dashed border-blue-200 rounded-xl bg-white overflow-hidden shadow-sm">
                      <canvas
                        ref={canvasRef}
                        width={600}
                        height={140}
                        onMouseDown={startDrawing}
                        onMouseMove={draw}
                        onMouseUp={stopDrawing}
                        onMouseLeave={stopDrawing}
                        onTouchStart={startDrawing}
                        onTouchMove={draw}
                        onTouchEnd={stopDrawing}
                        className="w-full h-36 cursor-crosshair touch-none"
                      />
                      <button
                        type="button"
                        onClick={clearCanvas}
                        className="absolute top-2 right-2 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs rounded font-medium flex items-center gap-1 shadow-sm"
                      >
                        <RotateCcw size={12} /> Clear
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5">Sign above using your finger, mouse, or stylus.</p>
                  </div>
                ) : (
                  <div>
                    <input
                      type="text"
                      value={signatoryName}
                      onChange={(e) => setSignatoryName(e.target.value)}
                      placeholder="Type your full legal name to sign"
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-lg font-serif italic text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#2855A6]/20 focus:border-[#2855A6] shadow-sm"
                    />
                    <p className="text-[11px] text-slate-400 mt-1.5">Typing your name acts as your legally binding digital signature.</p>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Authorized Signatory</label>
                    <input
                      type="text"
                      value={signatoryName}
                      onChange={(e) => setSignatoryName(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded text-xs text-slate-800"
                      placeholder="Full legal name"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Date of Execution</label>
                    <input
                      type="text"
                      readOnly
                      value={new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'long', year: 'numeric' })}
                      className="w-full px-3 py-1.5 bg-slate-100 border border-slate-200 rounded text-xs text-slate-600 cursor-not-allowed"
                    />
                  </div>
                </div>

                <label className="flex items-start gap-2.5 cursor-pointer text-xs text-slate-800 select-none pt-2">
                  <input
                    type="checkbox"
                    checked={agreedTerms}
                    onChange={(e) => setAgreedTerms(e.target.checked)}
                    className="rounded border-slate-300 text-[#2855A6] focus:ring-[#2855A6] mt-0.5"
                  />
                  <span>
                    I confirm that I am an authorized officer/representative with legal authority to enter into this agreement, and I accept the terms of this Letter of Engagement.
                  </span>
                </label>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="px-4 py-2 text-slate-600 hover:text-slate-900 text-sm font-medium flex items-center gap-1.5"
                >
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="button"
                  disabled={!agreedTerms || submitting || !signatoryName.trim()}
                  onClick={handleCompleteAcceptance}
                  className="px-6 py-2.5 bg-emerald-600 text-white text-sm font-semibold rounded-lg hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-40 flex items-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  {submitting ? 'Executing Engagement…' : 'Sign & Complete Onboarding'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* STEP 4: SUCCESS & CONFIRMATION */}
        {step === 4 && (
          <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm text-center max-w-xl mx-auto space-y-6 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <div className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-semibold rounded-full mb-2">
                Engagement Executed Successfully
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Welcome to Grow Advisory Group</h2>
              <p className="text-sm text-slate-600 mt-2">
                Your digital onboarding has been completed. A formal copy of your signed engagement letter has been archived and sent to your email.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-left text-xs space-y-2.5">
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Client Entity</span>
                <span className="font-bold text-slate-800">{invitation.client}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Engagement Reference</span>
                <span className="font-mono font-bold text-[#2855A6]">{invitation.id}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Primary Service</span>
                <span className="font-medium text-slate-800">{invitation.service}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-200/60">
                <span className="text-slate-500">Assigned Adviser</span>
                <span className="font-medium text-slate-800">{invitation.owner || 'J. Okafor'}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500">Status</span>
                <span className="font-semibold text-emerald-600 flex items-center gap-1">
                  <Check size={12} /> Active & Verified
                </span>
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-5 py-2.5 border border-slate-200 bg-white text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer size={14} /> Print / Save PDF Copy
              </button>
              <button
                type="button"
                onClick={() => window.location.href = '/'}
                className="px-5 py-2.5 bg-[#2855A6] text-white text-xs font-semibold rounded-lg hover:bg-[#1E448A] transition-colors flex items-center justify-center gap-1.5 shadow-sm"
              >
                Return to Home
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-400 mt-auto">
        <div className="max-w-4xl mx-auto px-4">
          <p className="mb-1">
            Grow Advisory Group &bull; Level 12, 101 Collins Street, Melbourne VIC 3000
          </p>
          <p className="text-[11px] text-slate-400">
            Powered by EnTIQ Start &bull; Australian Professional Standards Legislation
          </p>
        </div>
      </footer>
    </div>
  );
}
