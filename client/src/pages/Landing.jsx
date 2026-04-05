import { useState, useRef } from 'react';
import { Github } from 'lucide-react';
import { motion, useScroll, useTransform } from 'framer-motion';
import NavbarWrapper from '@/layouts/NavbarWrapper';

const Landing = () => {
  const [activeTab, setActiveTab] = useState('ALL');
  
  // Scroll Hooks
  const { scrollY, scrollYProgress } = useScroll();

  // ─── Hero Section Parallax Values ──────────────────────────────
  const heroBgY = useTransform(scrollY, [0, 1000], ["0%", "40%"]);
  const heroTextY = useTransform(scrollY, [0, 800], ["0%", "-80%"]);
  const heroTextOpacity = useTransform(scrollY, [0, 600], [1, 0]);

  // ─── Data ──────────────────────────────────────────────────────
  const features = [
    {
      title: "PLACING BLOCK",
      desc: "ผู้เล่นสามารถต่อบล็อกคำสั่งแบบลากวาง เพื่อสร้างอัลกอริทึมให้ตัวละครทำงานตามที่ออกแบบไว้",
      img: "/feature/feature1.png",
    },
    {
      title: "PLAYING",
      desc: "สนุกไปกับการเล่นเกมเพื่อไขปริศนา ด้วยการประยุกต์ใช้อัลกอริทึมที่คุณเขียนขึ้นเอง",
      img: "/screenshot/screenshot3.png",
    },
    {
      title: "PATTERN CHECKING",
      desc: "ระบบตรวจคำตอบอัจฉริยะ หากรูปแบบอัลกอริทึมเขียนถูกต้อง ผู้เล่นจะผ่านด่านและได้รับเอฟเฟกต์",
      img: "/feature/feature3.png",
    }
  ];

  const galleryImages = [
    { title: "Game Screenshot 1", tag: "ALL", img: "/screenshot/screenshot1.png" },
    { title: "Game Screenshot 2", tag: "ALL", img: "/screenshot/screenshot2.png" },
    { title: "Game Screenshot 3", tag: "ALL", img: "/screenshot/screenshot3.png" }
  ];

  // Animation Variants for Reveal
  const fadeInUp = {
    hidden: { opacity: 0, y: 80 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
  };
  
  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.2 } }
  };

  return (
    <div className="min-h-screen bg-[#120a1f] text-white font-sans selection:bg-[#c084fc] selection:text-black overflow-x-hidden">
      
      {/* ─── Global Scanline Overlay ─── */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] bg-[linear-gradient(rgba(18,10,31,0)_50%,rgba(0,0,0,0.5)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>

      {/* ─── Navigation ─── */}
      <NavbarWrapper isTransparent={true} />

      {/* ─── Hero Section (Full Parallax Layers) ─── */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden bg-black">
        <motion.div 
          className="absolute inset-0 z-0 origin-top"
          style={{ y: heroBgY }}
        >
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] opacity-20 z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#120a1f] via-transparent to-purple-900/20 z-10"></div>
          <img
            src="https://images.unsplash.com/photo-1618083707368-b3823daa2726?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0"
            alt="Hero BG"
            className="w-full h-full object-cover scale-125 opacity-70 hue-rotate-[20deg] blur-[1px]"
          />
        </motion.div>

        {/* Floating Particles (Mid-layer) */}
        <motion.div 
          className="absolute inset-0 z-10 opacity-30"
          style={{ y: useTransform(scrollY, [0, 1000], ["0%", "15%"]) }}
        >
           <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-purple-500 rounded-full blur-[100px]" />
           <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-500 rounded-full blur-[150px]" />
        </motion.div>

        <motion.div 
          className="relative z-20 text-center px-4 max-w-4xl"
          style={{ y: heroTextY, opacity: heroTextOpacity }}
        >
          <motion.h1 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="text-6xl md:text-8xl font-bold text-yellow-500 drop-shadow-[0_4px_10px_rgba(0,0,0,0.5)]"
          >
            CODE AWAKENS
          </motion.h1>
          <motion.p 
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 1, delay: 0.5 }}
            className="mt-6 text-xl md:text-2xl text-purple-200 font-medium tracking-wide"
          >
            Master Algorithm, Save the Virtual World.
          </motion.p>
        </motion.div>
      </section>

      {/* ─── Dither Divider ─── */}
      <div className="h-14 w-full bg-[#a855f7] dither-pattern relative z-30"></div>

      {/* ─── Story Section (Scroll Reveal + Parallax Shift) ─── */}
      <section className="py-32 bg-[#a855f7] text-white relative z-30 overflow-hidden">
        {/* Floating background shape */}
        <motion.div 
          className="absolute top-0 right-[-10%] w-96 h-96 bg-white/10 rounded-full mix-blend-overlay blur-[2px]"
          style={{ y: useTransform(scrollYProgress, [0, 1], ["-50%", "150%"]) }}
        />

        <motion.div 
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={staggerContainer}
          className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center"
        >
          <motion.div variants={fadeInUp} className="space-y-8 z-10">
            <h2 className="pixel-font text-4xl md:text-6xl leading-tight drop-shadow-md">
              GAMEPLAY
            </h2>
            <div className="w-32 h-4 bg-white shadow-[4px_4px_0px_rgba(0,0,0,0.2)]"></div>
            <p className="text-2xl md:text-3xl font-bold leading-relaxed text-purple-50">
              ลากวางบล็อกเพื่อสร้างอัลกอริทึมให้ตัวละครทำงานตามที่คุณเขียน!
            </p>
          </motion.div>
          
          <motion.div 
            variants={fadeInUp}
            className="relative group p-4 bg-white/20 border-4 border-white shadow-[12px_12px_0px_rgba(0,0,0,0.3)] z-10"
            style={{ y: useTransform(scrollYProgress, [0, 1], ["5%", "-5%"]) }}
          >
            <img
              src="/feature/gameplay.png"
              alt="Gameplay"
              className="w-full grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
            />
          </motion.div>
        </motion.div>
      </section>

      {/* ─── Game Features Section (Intersection Parallax) ─── */}
      <section className="py-32 bg-[#1e1430] border-y-8 border-[#a855f7]/10 relative z-30">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            className="text-center mb-24"
          >
            <h2 className="pixel-font text-4xl md:text-5xl text-white mb-6 underline decoration-[#a855f7] decoration-8 underline-offset-8">
              GAME FEATURES
            </h2>
          </motion.div>

          <div className="space-y-40">
            {features.map((feature, idx) => (
              <motion.div 
                key={idx} 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
                className={`flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 md:gap-24`}
              >
                {/* Image side - moves slightly faster */}
                <motion.div 
                  variants={fadeInUp}
                  className="w-full md:w-1/2 relative group"
                  whileHover={{ scale: 1.02 }}
                >
                  <div className="absolute -inset-4 border-2 border-[#a855f7]/30 pointer-events-none group-hover:border-[#a855f7] transition-colors duration-500"></div>
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#a855f7]"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#a855f7]"></div>

                  <div className="relative overflow-hidden border-4 border-white group-hover:border-[#a855f7] transition-all duration-500 shadow-[20px_20px_0px_rgba(0,0,0,0.5)]">
                    <motion.img
                      src={feature.img}
                      alt={feature.title}
                      className="w-full aspect-video object-cover"
                      whileHover={{ scale: 1.1 }}
                      transition={{ duration: 0.6 }}
                    />
                  </div>
                </motion.div>

                {/* Text side - moves slightly slower */}
                <motion.div variants={fadeInUp} className="w-full md:w-1/2 space-y-6">
                  <div className="flex items-center gap-4">
                    <h3 className="pixel-font text-2xl md:text-3xl text-[#c084fc] drop-shadow-sm">{feature.title}</h3>
                  </div>
                  <p className="text-xl text-purple-100/90 leading-relaxed font-medium">
                    {feature.desc}
                  </p>
                  <div className="flex gap-3 pt-4">
                    {[1, 2, 3].map(i => (
                      <motion.div 
                        key={i} 
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.15 }}
                        className="w-3 h-3 bg-[#a855f7]"
                      />
                    ))}
                  </div>
                </motion.div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Gallery Section (Staggered Parallax Grid) ─── */}
      <section className="py-32 bg-[#120a1f] relative overflow-hidden z-30">
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <motion.div 
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}
            className="text-center mb-16"
          >
            <h2 className="pixel-font text-4xl md:text-5xl text-[#c084fc] mb-6">SCREENSHOTS</h2>
            <div className="w-24 h-2 bg-[#a855f7] mx-auto shadow-[0_4px_0px_#6b21a8] mb-10"></div>
          </motion.div>

          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {galleryImages
              .filter(img => activeTab === 'ALL' || img.tag === activeTab)
              .map((item, idx) => (
                <motion.div
                  key={idx}
                  variants={fadeInUp}
                  // สร้างเอฟเฟกต์ไม่เท่ากัน (Staggered Scrolling) ให้แต่ละแถบลอยไม่พร้อมกัน
                  style={{ y: useTransform(scrollYProgress, [0.5, 1], [(idx % 2 === 0 ? "50px" : "-50px"), "0px"]) }}
                  className="group relative bg-[#1e1430] border-4 border-white/10 overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,0.3)] hover:shadow-[16px_16px_0px_rgba(168,85,247,0.4)] hover:border-[#a855f7] hover:-translate-y-2 transition-all duration-300 cursor-pointer"
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={item.img}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  </div>
                  <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-white/40"></div>
                  <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-white/40"></div>
                </motion.div>
              ))}
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer id="contact" className="py-20 bg-[#0a0511] border-t-8 border-[#a855f7]/20 relative z-30">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="text-center md:text-left">
            <p className="pixel-font text-sm text-purple-100/40">
              © 2026 Code Awakens. The Algorithm is Yours.
            </p>
          </div>
          <div className="flex gap-4">
            <motion.a 
              whileHover={{ y: -5, scale: 1.1 }}
              href="#" 
              className="w-14 h-14 flex items-center justify-center bg-white/5 border-2 border-white/10 hover:border-[#a855f7] hover:bg-[#a855f7] text-white transition-colors"
            >
              <Github size={24} />
            </motion.a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;