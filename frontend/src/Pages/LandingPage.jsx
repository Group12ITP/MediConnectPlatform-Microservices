import { Link } from 'react-router-dom';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useState, useEffect } from 'react';
import { 
  ArrowRight, 
  Calendar, 
  Clock, 
  MessageSquare, 
  Phone, 
  Shield, 
  Star, 
  Users, 
  Video,
  ChevronRight,
  Mail,
  MapPin,
  Award,
  Heart,
  Activity,
  Stethoscope,
  Pill,
  UserCircle,
  FileText,
  CheckCircle,
  Sparkles,
  Menu,
  X,
  Zap,
  Bell,
  TrendingUp,
  MessageCircle,
  UserPlus,
  Play,
  Gift,
  Target,
  BarChart3,
  Smartphone,
  Cloud,
  Lock,
  Globe,
  Headphones,
  ThumbsUp,
  Truck,
  CreditCard,
  Moon,
  Sun,
  Search,
  Filter,
  Sliders
} from 'lucide-react';

// Import social icons from react-icons
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaYoutube, FaTiktok } from 'react-icons/fa';

const features = [
  { icon: Calendar, title: 'Easy Scheduling', desc: 'Book appointments with top doctors in just a few clicks.', color: 'from-blue-500 to-blue-600', gradient: 'blue', delay: 0 },
  { icon: Video, title: 'Telemedicine', desc: 'Consult with doctors from the comfort of your home.', color: 'from-teal-500 to-teal-600', gradient: 'teal', delay: 0.1 },
  { icon: FileText, title: 'Medical Records', desc: 'Access your complete medical history from anywhere.', color: 'from-emerald-500 to-emerald-600', gradient: 'emerald', delay: 0.2 },
  { icon: Activity, title: 'Health Tracking', desc: 'Monitor vitals with beautiful interactive charts.', color: 'from-violet-500 to-violet-600', gradient: 'violet', delay: 0.3 },
  { icon: Shield, title: 'Secure & Private', desc: 'Enterprise-grade encryption for your health data.', color: 'from-rose-500 to-rose-600', gradient: 'rose', delay: 0.4 },
  { icon: Pill, title: 'Medicine Reminders', desc: 'Never miss your medications with smart alerts.', color: 'from-amber-500 to-amber-600', gradient: 'amber', delay: 0.5 },
];

const steps = [
  { num: '01', title: 'Create Account', desc: 'Register in seconds with your email and basic info.', icon: UserPlus, color: 'from-blue-500 to-cyan-500' },
  { num: '02', title: 'Book Appointment', desc: 'Browse doctors by specialty and pick a convenient slot.', icon: Calendar, color: 'from-teal-500 to-emerald-500' },
  { num: '03', title: 'Get Care', desc: 'Visit your doctor and manage everything from your dashboard.', icon: Heart, color: 'from-rose-500 to-pink-500' },
];

const testimonials = [
  {
    name: 'Dr. Sarah Johnson',
    role: 'Cardiologist',
    content: 'The platform has revolutionized how I manage my patients. The interface is intuitive and the features are comprehensive.',
    rating: 5,
    image: 'https://randomuser.me/api/portraits/women/68.jpg',
    location: 'New York, USA'
  },
  {
    name: 'Michael Chen',
    role: 'Patient',
    content: 'Managing my appointments and health records has never been easier. Highly recommended for anyone serious about their health.',
    rating: 5,
    image: 'https://randomuser.me/api/portraits/men/32.jpg',
    location: 'California, USA'
  },
  {
    name: 'Dr. Emily Rodriguez',
    role: 'Pediatrician',
    content: 'Excellent platform for both doctors and patients. The telemedicine feature is a game-changer for remote consultations.',
    rating: 5,
    image: 'https://randomuser.me/api/portraits/women/45.jpg',
    location: 'Texas, USA'
  },
];

const stats = [
  { value: '10K+', label: 'Patients', icon: Users, trend: '+25%', color: 'text-blue-600' },
  { value: '200+', label: 'Doctors', icon: Stethoscope, trend: '+15%', color: 'text-teal-600' },
  { value: '50K+', label: 'Appointments', icon: Calendar, trend: '+40%', color: 'text-emerald-600' },
  { value: '99.9%', label: 'Uptime', icon: Zap, trend: '99.9%', color: 'text-violet-600' },
];

const partners = [
  'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg',
  'https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg',
  'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
  'https://upload.wikimedia.org/wikipedia/commons/2/24/Amazon_Web_Services_Logo.svg',
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
  }),
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const LandingPage = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { scrollYProgress } = useScroll();
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div className="overflow-hidden">
      {/* Navigation Bar */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-lg shadow-lg' : 'bg-white/90 backdrop-blur-lg'
      } border-b border-gray-100`}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
          <div className="flex justify-between items-center h-16">
            <motion.div 
              className="flex items-center gap-2 cursor-pointer"
              whileHover={{ scale: 1.05 }}
              onClick={() => scrollToSection('home')}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg">
                <Heart className="w-5 h-5 text-white fill-white/20" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">
                MediConnect
              </span>
            </motion.div>
            
            {/* Desktop Menu */}
            <div className="hidden md:flex items-center gap-8">
              {['home', 'features', 'how-it-works', 'testimonials'].map((section) => (
                <button
                  key={section}
                  onClick={() => scrollToSection(section)}
                  className="text-gray-600 hover:text-teal-600 transition-colors capitalize font-medium"
                >
                  {section === 'how-it-works' ? 'How It Works' : section}
                </button>
              ))}
            </div>
            
            <div className="flex items-center gap-3">
              <Link
                to="/select-role"
                className="hidden md:inline-flex px-5 py-2 text-gray-700 hover:text-teal-600 transition-colors font-medium"
              >
                Sign In
              </Link>
              <Link
                to="/select-role"
                className="inline-flex items-center gap-2 px-5 py-2 bg-gradient-to-r from-teal-500 to-teal-600 text-white rounded-xl font-medium hover:from-teal-600 hover:to-teal-700 transition-all shadow-md hover:shadow-lg"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </Link>
              
              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-white border-t border-gray-100 py-4"
          >
            <div className="flex flex-col gap-3 px-5">
              {['home', 'features', 'how-it-works', 'testimonials'].map((section) => (
                <button
                  key={section}
                  onClick={() => scrollToSection(section)}
                  className="text-gray-600 hover:text-teal-600 transition-colors py-2 text-left capitalize font-medium"
                >
                  {section === 'how-it-works' ? 'How It Works' : section}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </nav>

      {/* ───── Hero ───── */}
      <section id="home" className="relative min-h-screen flex items-center bg-gradient-to-br from-white via-blue-50/30 to-teal-50/30 pt-16">
        {/* Animated Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div 
            className="absolute -top-32 -right-32 w-[600px] h-[600px] bg-gradient-to-br from-blue-200/40 to-teal-200/40 rounded-full blur-[120px]"
            animate={{ 
              x: [0, 100, 0],
              y: [0, 50, 0],
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="absolute top-1/2 -left-48 w-[500px] h-[500px] bg-gradient-to-tr from-teal-200/30 to-emerald-200/30 rounded-full blur-[100px]"
            animate={{ 
              x: [0, -80, 0],
              y: [0, 60, 0],
            }}
            transition={{ duration: 25, repeat: Infinity, ease: "linear", delay: 2 }}
          />
          <motion.div 
            className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-gradient-to-bl from-violet-200/30 to-purple-200/30 rounded-full blur-[100px]"
            animate={{ 
              x: [0, 60, 0],
              y: [0, -40, 0],
            }}
            transition={{ duration: 18, repeat: Infinity, ease: "linear", delay: 4 }}
          />
        </div>

        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10 py-20 relative z-10 w-full">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Text Column */}
            <motion.div initial="hidden" animate="visible" variants={staggerContainer}>
              <motion.div
                variants={fadeUp}
                custom={0}
                className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-200 text-teal-600 text-sm font-bold mb-8 shadow-sm"
              >
                <Sparkles className="w-4 h-4" />
                Trusted by 10,000+ patients
                <span className="w-1.5 h-1.5 bg-teal-400 rounded-full"></span>
                <span className="text-teal-500">✨ AI-Powered</span>
              </motion.div>

              <motion.h1
                variants={fadeUp}
                custom={1}
                className="text-5xl sm:text-6xl lg:text-7xl font-black text-gray-900 leading-[1.08] tracking-tight"
              >
                Your Health,{' '}
                <span className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                  Revolutionized
                </span>
              </motion.h1>

              <motion.p
                variants={fadeUp}
                custom={2}
                className="mt-7 text-lg sm:text-xl text-gray-500 max-w-xl leading-relaxed"
              >
                Experience the future of healthcare management. AI-powered insights, seamless appointments, 
                and comprehensive health tracking — all in one intelligent platform.
              </motion.p>

              <motion.div variants={fadeUp} custom={3} className="mt-10 flex flex-wrap gap-4">
                <Link
                  to="/select-role"
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-gradient-to-r from-teal-500 to-teal-600 text-white text-base font-bold shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-300 group"
                >
                  Start Your Journey
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <button
                  onClick={() => scrollToSection('features')}
                  className="inline-flex items-center gap-2.5 px-8 py-4 rounded-2xl bg-white text-gray-700 text-base font-bold border-2 border-gray-200 hover:border-teal-300 hover:text-teal-600 shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <Play className="w-5 h-5" />
                  Watch Demo
                </button>
              </motion.div>

              <motion.div variants={fadeUp} custom={4} className="mt-10 flex items-center gap-6">
                <div className="flex -space-x-2.5">
                  {[1,2,3,4].map((i) => (
                    <motion.div 
                      key={i} 
                      className="w-10 h-10 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 border-[3px] border-white flex items-center justify-center text-gray-600 text-xs font-bold shadow-md"
                      whileHover={{ scale: 1.1, zIndex: 10 }}
                    >
                      {String.fromCharCode(64 + i)}
                    </motion.div>
                  ))}
                  <div className="w-10 h-10 rounded-full bg-teal-500 border-[3px] border-white flex items-center justify-center text-white text-xs font-bold shadow-md">
                    +
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 font-medium">
                    <span className="font-bold text-gray-800">4.9/5</span> from 2,000+ reviews
                  </p>
                </div>
              </motion.div>
            </motion.div>

            {/* Hero Visual */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="relative hidden lg:block"
              style={{ opacity, scale }}
            >
              <div className="relative w-full aspect-square max-w-[550px] mx-auto">
                {/* Main Dashboard Card */}
                <motion.div 
                  className="absolute inset-0 bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="bg-gradient-to-r from-teal-500 to-cyan-600 px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                          <Heart className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-white font-semibold">Health Dashboard</span>
                      </div>
                      <Bell className="w-5 h-5 text-white/80" />
                    </div>
                  </div>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div>
                        <p className="text-sm text-gray-500">Hello</p>
                        <p className="text-xl font-bold text-gray-900">Welcome Back!</p>
                      </div>
                      <motion.div 
                        className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-bold"
                        whileHover={{ scale: 1.1 }}
                      >
                        JA
                      </motion.div>
                    </div>
                    
                    <motion.div 
                      className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4 mb-6"
                      whileHover={{ scale: 1.02 }}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-gray-600">Health Score</p>
                          <p className="text-3xl font-bold text-teal-600">92</p>
                        </div>
                        <TrendingUp className="w-8 h-8 text-teal-500" />
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <ArrowRight className="w-4 h-4 text-emerald-500 rotate-[-45deg]" />
                        <span className="text-sm text-emerald-600 font-semibold">5% improvement</span>
                      </div>
                    </motion.div>

                    <div className="space-y-3">
                      {[
                        { label: 'Blood Pressure', value: '118/72', status: 'normal' },
                        { label: 'Heart Rate', value: '72 bpm', status: 'good' },
                        { label: 'Sleep Quality', value: '7h 32m', status: 'excellent' }
                      ].map((metric, idx) => (
                        <motion.div 
                          key={metric.label} 
                          className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                          whileHover={{ x: 5 }}
                        >
                          <span className="text-sm text-gray-600">{metric.label}</span>
                          <span className="font-semibold text-gray-900">{metric.value}</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>

                {/* Floating Cards */}
                <motion.div 
                  className="absolute -top-6 -right-6 bg-white rounded-2xl shadow-xl p-4 border border-gray-100"
                  animate={{ y: [0, -10, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-emerald-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">Appointment</p>
                      <p className="text-xs text-emerald-500 font-semibold">Confirmed ✓</p>
                      <p className="text-xs text-gray-400 mt-1">Today, 3:00 PM</p>
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 border border-gray-100"
                  animate={{ y: [0, 10, 0] }}
                  transition={{ duration: 3.5, repeat: Infinity, delay: 0.5 }}
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center">
                      <MessageCircle className="w-6 h-6 text-blue-500" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-800">New Message</p>
                      <p className="text-xs text-blue-500 font-semibold">Dr. Sarah replied</p>
                      <p className="text-xs text-gray-400 mt-1">2 min ago</p>
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      

      {/* ───── Stats ───── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="text-center group cursor-pointer"
                whileHover={{ scale: 1.05 }}
              >
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-50 to-cyan-50 group-hover:from-teal-100 group-hover:to-cyan-100 transition-all flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <s.icon className={`w-7 h-7 ${s.color}`} />
                </div>
                <p className="text-4xl font-black bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">{s.value}</p>
                <p className="text-sm text-gray-500 font-semibold mt-1">{s.label}</p>
                <p className="text-xs text-teal-600 mt-1 font-medium">{s.trend} growth</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Features ───── */}
      <section id="features" className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-600 text-sm font-semibold mb-4">
              <Zap className="w-4 h-4" />
              Powerful Features
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
              Everything You Need for{' '}
              <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">Better Health</span>
            </h2>
            <p className="mt-5 text-lg text-gray-500 max-w-2xl mx-auto">
              A comprehensive platform designed to simplify your healthcare journey with cutting-edge technology.
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="group bg-white rounded-2xl p-8 border border-gray-100 hover:border-teal-200 shadow-sm hover:shadow-xl transition-all duration-300 cursor-pointer relative overflow-hidden"
                whileHover={{ y: -5 }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-teal-50/50 to-cyan-50/50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-500"></div>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-r ${f.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300 relative z-10`}>
                  <f.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 relative z-10">{f.title}</h3>
                <p className="text-gray-500 leading-relaxed relative z-10">{f.desc}</p>
                <div className="mt-4 flex items-center gap-1 text-teal-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  <span className="text-sm font-medium">Learn more</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── How It Works ───── */}
      <section id="how-it-works" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-600 text-sm font-semibold mb-4">
              <Clock className="w-4 h-4" />
              Simple Process
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
              Get Started in{' '}
              <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">3 Simple Steps</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-24 left-[15%] right-[15%] h-[3px] bg-gradient-to-r from-teal-200 via-cyan-200 to-blue-200 rounded-full" />

            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="relative text-center group cursor-pointer"
                whileHover={{ scale: 1.05 }}
              >
                <div className={`w-24 h-24 rounded-2xl bg-gradient-to-br ${s.color} flex items-center justify-center mx-auto text-white font-black text-3xl shadow-xl relative z-10 group-hover:scale-110 transition-transform duration-300`}>
                  {s.num}
                </div>
                <div className="mt-6">
                  <div className="w-14 h-14 rounded-xl bg-teal-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-teal-100 transition-colors">
                    <s.icon className="w-7 h-7 text-teal-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">{s.title}</h3>
                  <p className="text-gray-500 max-w-xs mx-auto leading-relaxed">{s.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Testimonials ───── */}
      <section id="testimonials" className="py-24 bg-gradient-to-br from-gray-50 to-white">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-teal-50 text-teal-600 text-sm font-semibold mb-4">
              <Users className="w-4 h-4" />
              Testimonials
            </div>
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 tracking-tight">
              What Our{' '}
              <span className="bg-gradient-to-r from-teal-600 to-cyan-600 bg-clip-text text-transparent">Users Say</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={fadeUp}
                custom={i}
                className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 cursor-pointer"
                whileHover={{ y: -5 }}
              >
                <div className="flex items-center gap-4 mb-4">
                  <motion.img 
                    src={t.image} 
                    alt={t.name} 
                    className="w-14 h-14 rounded-full object-cover"
                    whileHover={{ scale: 1.1 }}
                  />
                  <div>
                    <h4 className="font-bold text-gray-900">{t.name}</h4>
                    <p className="text-sm text-gray-500">{t.role}</p>
                    <p className="text-xs text-gray-400 mt-1">{t.location}</p>
                  </div>
                </div>
                <div className="flex gap-1 mb-3">
                  {[...Array(t.rating)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-gray-600 leading-relaxed">"{t.content}"</p>
                <div className="mt-4 flex items-center gap-1 text-teal-600">
                  <ThumbsUp className="w-4 h-4" />
                  <span className="text-sm">Verified User</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA ───── */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600"></div>
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-64 h-64 rounded-full border-4 border-white/30 animate-pulse" />
          <div className="absolute bottom-10 right-10 w-96 h-96 rounded-full border-4 border-white/30 animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border-4 border-white/20 animate-pulse delay-2000" />
        </div>

        <div className="max-w-4xl mx-auto px-5 sm:px-8 lg:px-10 text-center relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={staggerContainer}>
            <motion.h2 variants={fadeUp} custom={0} className="text-4xl sm:text-5xl font-black text-white leading-tight">
              Ready to Transform Your Healthcare Experience?
            </motion.h2>
            <motion.p variants={fadeUp} custom={1} className="mt-5 text-lg text-teal-100 max-w-2xl mx-auto">
              Join thousands of satisfied users who have already made the switch to smarter health management.
            </motion.p>
            <motion.div variants={fadeUp} custom={2} className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                to="/select-role"
                className="inline-flex items-center gap-2.5 px-9 py-4 rounded-2xl bg-white text-teal-600 text-base font-bold shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 group"
              >
                Get Started Free
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/select-role"
                className="inline-flex items-center gap-2.5 px-9 py-4 rounded-2xl bg-white/10 backdrop-blur-sm text-white text-base font-bold border-2 border-white/30 hover:bg-white/20 transition-all duration-300"
              >
                Sign In
                <UserPlus className="w-5 h-5" />
              </Link>
            </motion.div>
            <motion.p variants={fadeUp} custom={3} className="mt-8 text-sm text-teal-200">
              No credit card required • Free forever • Cancel anytime
            </motion.p>
          </motion.div>
        </div>
      </section>

      {/* ───── Footer ───── */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 lg:px-10">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">MediConnect</span>
              </div>
              <p className="text-gray-400 text-sm">Revolutionizing healthcare management with AI-powered solutions.</p>
              <div className="flex gap-3 mt-4">
                <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-teal-600 transition-colors">
                  <FaTwitter className="w-4 h-4" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-teal-600 transition-colors">
                  <FaFacebook className="w-4 h-4" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-teal-600 transition-colors">
                  <FaInstagram className="w-4 h-4" />
                </a>
                <a href="#" className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center hover:bg-teal-600 transition-colors">
                  <FaLinkedin className="w-4 h-4" />
                </a>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Quick Links</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><button onClick={() => scrollToSection('home')} className="hover:text-white transition-colors">Home</button></li>
                <li><button onClick={() => scrollToSection('features')} className="hover:text-white transition-colors">Features</button></li>
                <li><button onClick={() => scrollToSection('how-it-works')} className="hover:text-white transition-colors">How It Works</button></li>
                <li><button onClick={() => scrollToSection('testimonials')} className="hover:text-white transition-colors">Testimonials</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contact</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li className="flex items-center gap-2"><Mail className="w-4 h-4" /> support@mediconnect.com</li>
                <li className="flex items-center gap-2"><Phone className="w-4 h-4" /> +1 (555) 123-4567</li>
                <li className="flex items-center gap-2"><MapPin className="w-4 h-4" /> 123 Health St, Medical City</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400 text-sm">
            <p>&copy; 2026 MediConnect. All rights reserved. | Made with <Heart className="w-4 h-4 inline text-red-500" /> for better healthcare</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;