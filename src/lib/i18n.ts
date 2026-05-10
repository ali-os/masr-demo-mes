/**
 * BILINGUAL DICTIONARY (AR/EN)
 * Professional MES/OEE terminology for the MASR factory environment.
 */

export const dictionary = {
  en: {
    dashboard: "Dashboard",
    productionEntry: "Production Entry",
    planning: "Monthly Planning",
    workOrders: "Work Orders",
    quality: "Quality Control",
    maintenance: "Maintenance Console",
    availability: "Availability",
    performance: "Performance",
    qualityRate: "Quality",
    status: "Status",
    sku: "SKU / Product",
    line: "Line",
    shift: "Shift",
    operator: "Operator",
    supervisor: "Supervisor",
    submit: "Submit",
    approve: "Approve",
    reject: "Reject",
    completed: "Completed",
    running: "Running",
    stopped: "Stopped",
    mps_target: "MPS Target",
    actual_prod: "Actual Production",
    sl_percent: "Service Level %",
  },
  ar: {
    dashboard: "لوحة التحكم",
    productionEntry: "إدخال الإنتاج",
    planning: "التخطيط الشهري",
    workOrders: "أوامر العمل",
    quality: "رقابة الجودة",
    maintenance: "لوحة الصيانة",
    availability: "التواجدية",
    performance: "الأداء",
    qualityRate: "الجودة",
    status: "الحالة",
    sku: "الصنف / المنتج",
    line: "الخط",
    shift: "الوردية",
    operator: "المشغل",
    supervisor: "المشرف",
    submit: "إرسال",
    approve: "اعتماد",
    reject: "رفض",
    completed: "مكتمل",
    running: "يعمل",
    stopped: "متوقف",
    mps_target: "المستهدف (MPS)",
    actual_prod: "الإنتاج الفعلي",
    sl_percent: "نسبة تحقيق الخطة",
  }
};

export type Language = 'en' | 'ar';

export const useTranslation = (lang: Language = 'en') => {
  return dictionary[lang];
};
