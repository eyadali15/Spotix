/**
 * Spotix i18n — English + Arabic translations
 * With RTL support
 */

import { I18nManager } from 'react-native';

const translations = {
  en: {
    // Onboarding
    welcome: 'Welcome to Spotix',
    welcomeTitle: 'Smart Parking\nin Egypt 🇪🇬',
    welcomeSubtitle: 'Find, reserve, and park — all from your phone.',
    selectClient: 'I need parking',
    selectOwner: 'I own parking',
    haveAccount: 'Already have an account?',
    tagline: 'Smart Parking in Egypt',
    subtitle: 'Find, book, and park — all from your phone',
    iHaveACar: 'I have a car',
    iHaveAParking: 'I have a parking',

    // Auth
    signUp: 'Sign Up',
    login: 'Log In',
    logIn: 'Log In',
    loginShort: 'Log in',
    welcomeBack: 'Welcome Back 👋',
    loginSubtitle: 'Sign in to continue',
    fullName: 'Full Name',
    name: 'Full Name',
    email: 'Email Address',
    phone: 'Phone Number',
    password: 'Password',
    confirmPassword: 'Confirm Password',
    forgotPassword: 'Forgot password?',
    createAccount: 'Create Account',
    orContinueWith: 'or continue with',
    alreadyHaveAccount: 'Already have an account?',
    dontHaveAccount: "Don't have an account?",

    // Validation
    required: 'This field is required',
    invalidEmail: 'Please enter a valid email',
    passwordTooShort: 'Password must be at least 8 characters',

    // OTP
    verification: 'Verification',
    verifyPhone: 'Verify Your Account',
    enterOtp: 'Enter the 4-digit code sent to your email',
    enterOTP: 'Enter the 4-digit code sent to your phone',
    verified: 'Verified!',
    accountReady: 'Your account is ready to go.',
    verify: 'Verify',
    resendOtp: 'Resend Code',
    resendCode: 'Resend Code',
    resendIn: 'Resend in',

    // Password strength
    weak: 'Weak',
    fair: 'Fair',
    good: 'Good',
    strong: 'Strong',

    // Client - Map
    home: 'Home',
    findParking: 'Find Parking',
    searchParking: 'Search for parking...',
    nearYou: 'Near you',
    available: 'Available',
    limited: 'Limited',
    full: 'Full',
    spotsAvailable: 'spots available',
    perHour: '/hr',
    reserve: 'Book Now',
    egp: 'EGP',

    // Reservations
    myReservations: 'My Bookings',
    active: 'Active',
    used: 'Used',
    cancelled: 'Cancelled',
    noReservations: 'No bookings yet',
    viewTicket: 'View Ticket',
    cancelReservation: 'Cancel Booking',

    // Ticket
    yourTicket: 'Your Ticket',
    scanAtEntry: 'Show this QR code at the parking entrance',
    reservationId: 'Booking ID',
    parkingLot: 'Parking Lot',
    startTime: 'Start Time',
    price: 'Price',
    status: 'Status',

    // Owner Dashboard
    dashboard: 'Dashboard',
    totalSpots: 'Total Spots',
    activeReservations: 'Active',
    occupiedSpots: 'Occupied',
    recentActivity: 'Recent Activity',
    revenue: 'Revenue',

    // Owner Parking
    myParkings: 'My Parkings',
    addParking: 'Add Parking',
    editParking: 'Edit Parking',
    parkingName: 'Parking Name',
    address: 'Address',
    totalSpotsCount: 'Total Spots',
    pricePerHour: 'Price per Hour (EGP)',
    latitude: 'Latitude',
    longitude: 'Longitude',
    save: 'Save',
    delete: 'Delete',
    confirmDelete: 'Are you sure you want to delete this parking lot?',

    // Scanner
    scanner: 'Scanner',
    scanTicket: 'Scan Ticket',
    pointCamera: 'Point camera at the QR code',
    manualEntry: 'Manual Entry',
    enterCode: 'Enter ticket code manually',
    ticketCode: 'Ticket Code',
    validate: 'Validate',
    validTicket: 'Valid Ticket ✓',
    invalidTicket: 'Invalid Ticket ✗',
    ticketUsed: 'Ticket Already Used',
    scanAnother: 'Scan Another',

    // Profile
    profile: 'Profile',
    language: 'Language',
    english: 'English',
    arabic: 'Arabic',
    logout: 'Log Out',
    logoutConfirm: 'Are you sure you want to log out?',
    version: 'Version',

    // General
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    cancel: 'Cancel',
    confirm: 'Confirm',
    ok: 'OK',
    retry: 'Retry',
    noData: 'No data available',
    spots: 'spots',
    from: 'From',
    to: 'To',
    duration: 'Duration',
    total: 'Total',
    rate: 'Rate',
    change: 'Change',
    selectTime: 'Select Time',
    optional: 'optional',
    spotReserved: 'Your spot has been booked!',
    hour: 'hour',
    hours: 'hours',

    // Tabs
    tabHome: 'Home',
    tabTickets: 'Tickets',
    tabProfile: 'Profile',
    tabDashboard: 'Dashboard',
    tabParkings: 'Parkings',
    tabScanner: 'Scanner',

    // Calendar & Revenue
    revenueCalendar: 'Revenue Calendar',
    totalRevenue: 'Total Revenue',
    spotixFee: 'Spotix Fee (20%)',
    netRevenue: 'Net Revenue',
    sun: 'Sun', mon: 'Mon', tue: 'Tue', wed: 'Wed', thu: 'Thu', fri: 'Fri', sat: 'Sat',

    // Activity Detail
    reservationDetails: 'Booking Details',
    clientInfo: 'Client Information',
    reservationInfo: 'Booking Info',
    financial: 'Financial',
    clientName: 'Name',
    clientEmail: 'Email',
    clientPhone: 'Phone',
    bookedAt: 'Booked At',
    endsAt: 'Ends At',
    amountPaid: 'Amount Paid',
    yourEarnings: 'Your Earnings',
    close: 'Close',
    guest: 'Guest',
    parking: 'Parking',
    lots: 'lots',
    noActivityYet: 'No activity yet',

    // Parking management
    getDirections: 'Get Directions',
    noParkingsYet: 'No parking lots yet',
    addFirstParking: 'Add your first parking lot to start accepting bookings',
    tapToScan: 'Tap to open camera',
    settings: 'Settings',
    driver: 'Driver',
    owner: 'Owner',
    free: 'Free',
    taken: 'Taken',
    occupied: 'Occupied',
    parkingLayout: 'Parking Layout',
    showing: 'Showing',
    of: 'of',


    // Dual mode
    parkingMode: 'Parking',
    washingMode: 'Washing',
    findWashing: 'Find Car Wash',
    locations: 'locations',
    services: 'Services',
    reviews: 'Reviews',
    addReview: 'Add Review',
    writeReview: 'Write a review...',
    submitReview: 'Submit',
    noReviews: 'No reviews yet',
    bookService: 'Book',
    tabWash: 'Wash',
    washManagement: 'Wash Management',
    manageStatus: 'Manage your wash stations',

    // Pricing
    withoutSpotix: 'Without Spotix',
    withSpotix: 'With Spotix',
    savePercent: 'Save',

    // Parking type
    covered: 'Covered',
    uncovered: 'Uncovered',
    parkingTypeLabel: 'Parking Type',

    // Extend time
    extendTime: 'Extend Time',
    extendBooking: 'Extend Booking',
    newEndTime: 'New End Time',

    // Forgot password
    forgotPasswordTitle: 'Forgot Password',
    sendResetCode: 'Send Reset Code',
    verifyCode: 'Verify Code',
    newPassword: 'New Password',
    resetPassword: 'Reset Password',
    passwordResetSuccess: 'Password reset successfully',

    // Setup
    setupParking: 'Setup Your Parking',
    setupWash: 'Setup Your Wash Store',
    skipForNow: 'Skip for now',
    createParkingLot: 'Create Parking Lot',
    createWashStore: 'Create Wash Store',

    // Bookings tab
    tabBookings: 'Bookings',
    bookings: 'Bookings',
  },

  ar: {
    // Onboarding
    welcome: 'مرحباً بك في سبوتكس',
    welcomeTitle: 'مواقف ذكية\nفي مصر 🇪🇬',
    welcomeSubtitle: 'ابحث، احجز، واركن — كل ذلك من هاتفك.',
    selectClient: 'أحتاج موقف',
    selectOwner: 'أملك موقف',
    haveAccount: 'لديك حساب بالفعل؟',
    tagline: 'مواقف ذكية في مصر',
    subtitle: 'ابحث، احجز، واركن — كل ذلك من هاتفك',
    iHaveACar: 'لدي سيارة',
    iHaveAParking: 'لدي موقف',

    // Auth
    signUp: 'إنشاء حساب',
    login: 'تسجيل الدخول',
    logIn: 'تسجيل الدخول',
    loginShort: 'تسجيل الدخول',
    welcomeBack: 'مرحباً بعودتك 👋',
    loginSubtitle: 'سجل الدخول للمتابعة',
    fullName: 'الاسم الكامل',
    name: 'الاسم الكامل',
    email: 'البريد الإلكتروني',
    phone: 'رقم الهاتف',
    password: 'كلمة المرور',
    confirmPassword: 'تأكيد كلمة المرور',
    forgotPassword: 'نسيت كلمة المرور؟',
    createAccount: 'إنشاء حساب',
    orContinueWith: 'أو المتابعة عبر',
    alreadyHaveAccount: 'لديك حساب بالفعل؟',
    dontHaveAccount: 'ليس لديك حساب؟',

    // Validation
    required: 'هذا الحقل مطلوب',
    invalidEmail: 'يرجى إدخال بريد إلكتروني صحيح',
    passwordTooShort: 'يجب أن تكون كلمة المرور 8 أحرف على الأقل',

    // OTP
    verification: 'التحقق',
    verifyPhone: 'تحقق من حسابك',
    enterOtp: 'أدخل الرمز المكون من 4 أرقام',
    enterOTP: 'أدخل الرمز المكون من 4 أرقام',
    verified: 'تم التحقق!',
    accountReady: 'حسابك جاهز.',
    verify: 'تحقق',
    resendOtp: 'إعادة إرسال',
    resendCode: 'إعادة إرسال',
    resendIn: 'إعادة الإرسال خلال',

    // Password strength
    weak: 'ضعيفة',
    fair: 'مقبولة',
    good: 'جيدة',
    strong: 'قوية',

    // Client - Map
    home: 'الرئيسية',
    findParking: 'ابحث عن موقف',
    searchParking: 'ابحث عن موقف...',
    nearYou: 'بالقرب منك',
    available: 'متاح',
    limited: 'محدود',
    full: 'ممتلئ',
    spotsAvailable: 'أماكن متاحة',
    perHour: '/ساعة',
    reserve: 'احجز الآن',
    egp: 'ج.م',

    // Reservations
    myReservations: 'حجوزاتي',
    active: 'نشط',
    used: 'مستخدم',
    cancelled: 'ملغي',
    noReservations: 'لا توجد حجوزات',
    viewTicket: 'عرض التذكرة',
    cancelReservation: 'إلغاء الحجز',

    // Ticket
    yourTicket: 'تذكرتك',
    scanAtEntry: 'أظهر رمز QR عند مدخل الموقف',
    reservationId: 'رقم الحجز',
    parkingLot: 'موقف السيارات',
    startTime: 'وقت البدء',
    price: 'السعر',
    status: 'الحالة',

    // Owner Dashboard
    dashboard: 'لوحة التحكم',
    totalSpots: 'إجمالي الأماكن',
    activeReservations: 'نشط',
    occupiedSpots: 'مشغول',
    recentActivity: 'النشاط الأخير',
    revenue: 'الإيرادات',

    // Owner Parking
    myParkings: 'مواقفي',
    addParking: 'إضافة موقف',
    editParking: 'تعديل الموقف',
    parkingName: 'اسم الموقف',
    address: 'العنوان',
    totalSpotsCount: 'عدد الأماكن',
    pricePerHour: 'السعر بالساعة (ج.م)',
    latitude: 'خط العرض',
    longitude: 'خط الطول',
    save: 'حفظ',
    delete: 'حذف',
    confirmDelete: 'هل أنت متأكد من حذف هذا الموقف؟',

    // Scanner
    scanner: 'الماسح',
    scanTicket: 'مسح التذكرة',
    pointCamera: 'وجه الكاميرا نحو رمز QR',
    manualEntry: 'إدخال يدوي',
    enterCode: 'أدخل رمز التذكرة يدوياً',
    ticketCode: 'رمز التذكرة',
    validate: 'تحقق',
    validTicket: 'تذكرة صالحة ✓',
    invalidTicket: 'تذكرة غير صالحة ✗',
    ticketUsed: 'التذكرة مستخدمة',
    scanAnother: 'مسح تذكرة أخرى',

    // Profile
    profile: 'الملف الشخصي',
    language: 'اللغة',
    english: 'الإنجليزية',
    arabic: 'العربية',
    logout: 'تسجيل الخروج',
    logoutConfirm: 'هل أنت متأكد من تسجيل الخروج؟',
    version: 'الإصدار',

    // General
    loading: 'جارٍ التحميل...',
    error: 'خطأ',
    success: 'نجاح',
    cancel: 'إلغاء',
    confirm: 'تأكيد',
    ok: 'موافق',
    retry: 'إعادة المحاولة',
    noData: 'لا توجد بيانات',
    spots: 'أماكن',
    from: 'من',
    to: 'إلى',
    duration: 'المدة',
    total: 'الإجمالي',
    rate: 'السعر',
    change: 'تغيير',
    selectTime: 'اختر الوقت',
    optional: 'اختياري',
    spotReserved: 'تم حجز مكانك بنجاح!',
    hour: 'ساعة',
    hours: 'ساعات',

    // Tabs
    tabHome: 'الرئيسية',
    tabTickets: 'التذاكر',
    tabProfile: 'الملف',
    tabDashboard: 'لوحة التحكم',
    tabParkings: 'المواقف',
    tabScanner: 'الماسح',

    // Calendar & Revenue
    revenueCalendar: 'تقويم الإيرادات',
    totalRevenue: 'إجمالي الإيرادات',
    spotixFee: 'عمولة سبوتكس (٢٠٪)',
    netRevenue: 'صافي الإيرادات',
    sun: 'أحد', mon: 'إثن', tue: 'ثلا', wed: 'أرب', thu: 'خمي', fri: 'جمع', sat: 'سبت',

    // Activity Detail
    reservationDetails: 'تفاصيل الحجز',
    clientInfo: 'معلومات العميل',
    reservationInfo: 'معلومات الحجز',
    financial: 'المالية',
    clientName: 'الاسم',
    clientEmail: 'البريد الإلكتروني',
    clientPhone: 'رقم الهاتف',
    bookedAt: 'تاريخ الحجز',
    endsAt: 'ينتهي في',
    amountPaid: 'المبلغ المدفوع',
    yourEarnings: 'أرباحك',
    close: 'إغلاق',
    guest: 'الضيف',
    parking: 'الموقف',
    lots: 'مواقف',
    noActivityYet: 'لا يوجد نشاط بعد',

    // Parking management
    getDirections: 'الاتجاهات',
    noParkingsYet: 'لا توجد مواقف بعد',
    addFirstParking: 'أضف أول موقف لبدء استقبال الحجوزات',
    tapToScan: 'اضغط لفتح الكاميرا',
    settings: 'الإعدادات',
    driver: 'سائق',
    owner: 'مالك',
    free: 'متاح',
    taken: 'مشغول',
    occupied: 'مشغول',
    parkingLayout: 'مخطط الموقف',
    showing: 'عرض',
    of: 'من',

    // Dual mode
    parkingMode: 'مواقف',
    washingMode: 'غسيل',
    findWashing: 'ابحث عن غسيل سيارات',
    locations: 'مواقع',
    services: 'الخدمات',
    reviews: 'التقييمات',
    addReview: 'إضافة تقييم',
    writeReview: 'اكتب تقييمك...',
    submitReview: 'إرسال',
    noReviews: 'لا توجد تقييمات بعد',
    bookService: 'حجز',
    tabWash: 'غسيل',
    washManagement: 'إدارة الغسيل',
    manageStatus: 'إدارة محطات الغسيل الخاصة بك',

    // Pricing
    withoutSpotix: 'بدون سبوتكس',
    withSpotix: 'مع سبوتكس',
    savePercent: 'وفر',

    // Parking type
    covered: 'مغطى',
    uncovered: 'مكشوف',
    parkingTypeLabel: 'نوع الموقف',

    // Extend time
    extendTime: 'تمديد الوقت',
    extendBooking: 'تمديد الحجز',
    newEndTime: 'وقت الانتهاء الجديد',

    // Forgot password
    forgotPasswordTitle: 'نسيت كلمة المرور',
    sendResetCode: 'إرسال رمز التحقق',
    verifyCode: 'تأكيد الرمز',
    newPassword: 'كلمة المرور الجديدة',
    resetPassword: 'إعادة تعيين كلمة المرور',
    passwordResetSuccess: 'تم إعادة تعيين كلمة المرور بنجاح',

    // Setup
    setupParking: 'إعداد موقفك',
    setupWash: 'إعداد متجر الغسيل',
    skipForNow: 'تخطي الآن',
    createParkingLot: 'إنشاء موقف',
    createWashStore: 'إنشاء متجر غسيل',

    // Bookings tab
    tabBookings: 'الحجوزات',
    bookings: 'الحجوزات',
  },
};

let currentLanguage = 'en';

export function setLanguage(lang) {
  currentLanguage = lang;
  const isRTL = lang === 'ar';
  if (I18nManager.isRTL !== isRTL) {
    I18nManager.allowRTL(isRTL);
    I18nManager.forceRTL(isRTL);
  }
}

export function getLanguage() {
  return currentLanguage;
}

export function t(key) {
  return translations[currentLanguage]?.[key] || translations.en[key] || key;
}

export function isRTL() {
  return currentLanguage === 'ar';
}

export default { t, setLanguage, getLanguage, isRTL };
