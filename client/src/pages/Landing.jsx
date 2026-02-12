import { useState, useEffect } from 'react';
import { Play, ShoppingCart, ChevronRight, Twitter, Github, ZoomIn, Image as ImageIcon, Train, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import NavbarWrapper from '@/layouts/NavbarWrapper';

const Landing = () => {
  const [activeTab, setActiveTab] = useState('ALL');



  const features = [
    {
      title: "PLACING BLOCK",
      desc: "user can place block to create a algorithm for the player to follow",
      img: "/feature/feature1.png",

    },
    {
      title: "PLAYING",
      desc: "user can play the game by following the algorithm created by the player",
      img: "/screenshot/screenshot3.png",

    },
    {
      title: "PATTERN CHECKING",
      desc: "if the pattern is correct, the player will get effects",
      img: "/feature/feature3.png",

    }
  ];

  const galleryImages = [
    {
      title: "Game Screenshot 1",
      tag: "ALL",
      img: "/screenshot/screenshot1.png"
    },
    {
      title: "Game Screenshot 2",
      tag: "ALL",
      img: "/screenshot/screenshot2.png"
    },
    {
      title: "Game Screenshot 3",
      tag: "ALL",
      img: "/screenshot/screenshot3.png"
    }
  ];

  return (
    <div className="min-h-screen bg-[#120a1f] text-white font-sans selection:bg-[#c084fc] selection:text-black overflow-x-hidden">
      {/* Scanline Overlay Effect */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] bg-[linear-gradient(rgba(18,10,31,0)_50%,rgba(0,0,0,0.5)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>

      {/* Navigation */}
      <NavbarWrapper isTransparent={true} />

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/pixel-weave.png')] opacity-20 z-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#120a1f] via-transparent to-purple-900/20 z-10"></div>
          <img
            src="https://images.squarespace-cdn.com/content/v1/5a0c0062f43b552277884803/1557833075249-1K0K3Z8B5S9Z9Z9Z9Z9Z/Eastward_KeyArt_01.jpg"
            alt="Eastward Hero"
            className="w-full h-full object-cover scale-110 opacity-70 hue-rotate-[20deg] blur-[1px]"
          />
        </div>

        <div className="relative z-20 text-center px-4 max-w-4xl">
          <h1 className="text-6xl font-bold text-yellow-500">CODE AWAKENS</h1>


        </div>
      </section>

      {/* Dither Divider */}
      <div className="h-14 w-full bg-[#a855f7] dither-pattern"></div>

      {/* Story Section */}
      <section className="py-24 bg-[#a855f7] text-white relative">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="pixel-font text-3xl md:text-5xl leading-tight">
              GAMEPLAY
            </h2>
            <div className="w-32 h-4 bg-white shadow-[4px_4px_0px_rgba(0,0,0,0.2)]"></div>
            <p className="text-xl md:text-2xl font-bold leading-relaxed text-purple-100">
              Placing Block to create a Algorithm for the player to follow
            </p>

          </div>
          <div className="relative group p-4 bg-white/20 border-4 border-white shadow-[12px_12px_0px_rgba(0,0,0,0.3)]">
            <img
              src="/feature/gameplay.png"
              alt="Gameplay"
              className="w-full grayscale-[20%] group-hover:grayscale-0 transition-all duration-500"
            />
          </div>
        </div>
      </section>

      {/* Game Features Section */}
      <section className="py-24 bg-[#1e1430] border-y-8 border-[#a855f7]/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-24">
            <h2 className="pixel-font text-3xl md:text-5xl text-white mb-6 underline decoration-[#a855f7] decoration-8 underline-offset-8">GAME FEATURES</h2>
          </div>

          <div className="space-y-32">
            {features.map((feature, idx) => (
              <div key={idx} className={`flex flex-col ${idx % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} items-center gap-12 md:gap-20`}>
                <div className="w-full md:w-1/2 relative group">
                  {/* Decorative Frame */}
                  <div className="absolute -inset-4 border-2 border-[#a855f7]/30 pointer-events-none group-hover:border-[#a855f7] transition-colors"></div>
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-[#a855f7]"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-[#a855f7]"></div>

                  <div className="overflow-hidden border-4 border-white group-hover:border-[#a855f7] transition-all duration-300 shadow-[20px_20px_0px_rgba(0,0,0,0.5)] active:translate-x-1 active:translate-y-1 active:shadow-[16px_16px_0px_rgba(0,0,0,0.5)]">
                    <img
                      src={feature.img}
                      alt={feature.title}
                      className="w-full aspect-video object-cover"
                    />
                  </div>
                </div>

                <div className="w-full md:w-1/2 space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-white/5 border-2 border-[#a855f7] shadow-[4px_4px_0px_#a855f7]">
                      {feature.icon}
                    </div>
                    <h3 className="pixel-font text-xl md:text-2xl text-[#c084fc]">{feature.title}</h3>
                  </div>
                  <p className="text-xl text-purple-100/80 leading-relaxed font-medium">
                    {feature.desc}
                  </p>
                  <div className="flex gap-2">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="w-2 h-2 bg-[#a855f7]"></div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section className="py-24 bg-[#120a1f] relative overflow-hidden">


        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="pixel-font text-3xl md:text-5xl text-[#c084fc] mb-6">SCREENSHOTS</h2>
            <div className="w-24 h-2 bg-[#a855f7] mx-auto shadow-[0_4px_0px_#6b21a8] mb-10"></div>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {['ALL'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`pixel-font text-[10px] px-6 py-2 border-2 transition-all ${activeTab === tab ? 'bg-[#a855f7] border-white text-white' : 'bg-transparent border-white/20 text-white/40 hover:border-white/60'}`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {galleryImages
              .filter(img => activeTab === 'ALL' || img.tag === activeTab)
              .map((item, idx) => (
                <div
                  key={idx}
                  className="group relative bg-[#1e1430] border-4 border-white/10 overflow-hidden shadow-[8px_8px_0px_rgba(0,0,0,0.3)] hover:shadow-[12px_12px_0px_rgba(168,85,247,0.3)] hover:border-[#a855f7] transition-all duration-300"
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={item.img}
                      alt={item.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 group-hover:rotate-1"
                    />
                  </div>
                  <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white/30"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white/30"></div>
                </div>
              ))}
          </div>

        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-[#0a0511] border-t-8 border-[#a855f7]/20 relative">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="text-center md:text-left">
            <p className="pixel-font text-[10px] text-purple-100/30">
              © 2026 Code Awakens.
            </p>
          </div>

          <div className="flex gap-4">
            <a href="#" className="w-12 h-12 flex items-center justify-center bg-white/5 border-2 border-white/10 hover:border-[#a855f7] hover:bg-[#a855f7] transition-all">
              <Github size={20} />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;