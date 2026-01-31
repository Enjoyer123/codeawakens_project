import { useState, useEffect } from 'react';
import { Play, ShoppingCart, ChevronRight, Twitter, Github, ZoomIn, Image as ImageIcon, Train, Users } from 'lucide-react';
import { Button } from "@/components/ui/button";
import Navbar from '../components/shared/navbar/Navbar';

const Landing = () => {
  const [activeTab, setActiveTab] = useState('ALL');

  const navItems = [
    { label: 'Home', path: '/' },
    { label: 'Contact', path: '#' },
    { label: 'Play', path: '/user/mapselect' },
    { label: 'Profile', path: '/user/profile' },
    { label: 'Dashboard', path: '/admin' },
  ];

  const features = [
    {
      title: "SWITCHABLE DUO",
      desc: "Switch between John and Sam to solve environmental puzzles and fight your way through formidable dungeons. John uses his trusty frying pan, while Sam uses her mystical kinetic blasts.",
      img: "https://eastwardgame.com/wp-content/uploads/2019/08/eastward_screenshot_04.jpg",
      icon: <Users size={24} className="text-[#a855f7]" />
    },
    {
      title: "A WORLD BY RAIL",
      desc: "Travel across a vast, decaying continent by the miraculous cross-country railway. Stop off at bustling towns, curious campsites, and shady forests in a world full of secrets.",
      img: "https://eastwardgame.com/wp-content/uploads/2019/08/eastward_screenshot_05.jpg",
      icon: <Train size={24} className="text-[#a855f7]" />
    },
    {
      title: "PIXEL PERFECTION",
      desc: "Experience a beautifully detailed pixel art world, combining modern 3D lighting techniques and retro-style aesthetic to create a unique and immersive visual experience.",
      img: "https://eastwardgame.com/wp-content/uploads/2019/08/eastward_screenshot_02.jpg",
      icon: <ImageIcon size={24} className="text-[#a855f7]" />
    }
  ];

  const galleryImages = [
    {
      title: "Potcrock Isle",
      tag: "ENVIRONMENT",
      img: "https://eastwardgame.com/wp-content/uploads/2019/08/eastward_screenshot_02.jpg"
    },
    {
      title: "Combat Action",
      tag: "GAMEPLAY",
      img: "https://eastwardgame.com/wp-content/uploads/2019/08/eastward_screenshot_04.jpg"
    },
    {
      title: "New Dam City",
      tag: "ENVIRONMENT",
      img: "https://eastwardgame.com/wp-content/uploads/2019/08/eastward_screenshot_05.jpg"
    },
    {
      title: "Octopia Life",
      tag: "DLC",
      img: "https://eastwardgame.com/wp-content/uploads/2023/09/Octopia_Banner.jpg"
    },
    {
      title: "Mysterious Forest",
      tag: "ENVIRONMENT",
      img: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/973810/ss_e64307a5f6e890c2f82987a0f607d730623d5378.1920x1080.jpg?t=1706698642"
    },
    {
      title: "Cooking Time",
      tag: "GAMEPLAY",
      img: "https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/973810/ss_8e11be249f0561e7930799752538965768e16952.1920x1080.jpg?t=1706698642"
    }
  ];

  return (
    <div className="min-h-screen bg-[#120a1f] text-white font-sans selection:bg-[#c084fc] selection:text-black overflow-x-hidden">
      {/* Scanline Overlay Effect */}
      <div className="fixed inset-0 pointer-events-none z-[100] opacity-[0.03] bg-[linear-gradient(rgba(18,10,31,0)_50%,rgba(0,0,0,0.5)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%]"></div>

      {/* Navigation */}
      <Navbar navItems={navItems} isTransparent={true} />

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
          <img
            src="https://eastwardgame.com/wp-content/themes/eastward/assets/images/logo-eastward.png"
            alt="Logo Big"
            className="mx-auto w-full max-w-xl drop-shadow-[8px_8px_0px_rgba(0,0,0,0.5)] brightness-0 invert hue-rotate-[280deg]"
          />
          <p className="mt-8 text-lg md:text-xl pixel-font leading-relaxed text-purple-200">
            A journey through a world <br className="hidden md:block" /> falling into ruin.
          </p>
          <div className="mt-12 flex flex-wrap justify-center gap-8">
            <Button className="pixel-btn-white flex items-center gap-3 rounded-none h-auto">
              <Play fill="black" size={18} />
              WATCH TRAILER
            </Button>
            <Button className="pixel-btn-purple flex items-center gap-3 rounded-none h-auto">
              <ShoppingCart size={18} />
              BUY THE GAME
            </Button>
          </div>
        </div>
      </section>

      {/* Dither Divider */}
      <div className="h-14 w-full bg-[#a855f7] dither-pattern"></div>

      {/* Story Section */}
      <section className="py-24 bg-[#a855f7] text-white relative">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
          <div className="space-y-8">
            <h2 className="pixel-font text-3xl md:text-5xl leading-tight">
              POST-APOCALYPTIC <br />PIXEL ADVENTURE
            </h2>
            <div className="w-32 h-4 bg-white shadow-[4px_4px_0px_rgba(0,0,0,0.2)]"></div>
            <p className="text-xl md:text-2xl font-bold leading-relaxed text-purple-100">
              Escape a subterranean society and discover the surface!
            </p>
            <p className="text-lg leading-relaxed opacity-90 border-l-8 border-purple-900/30 pl-6">
              In the near-future, society is on the brink of collapse. Join John and Sam on an emotional journey across a decaying continent by rail.
            </p>
            <Button className="pixel-btn-black rounded-none h-auto">
              LEARN MORE
            </Button>
          </div>
          <div className="relative group p-4 bg-white/20 border-4 border-white shadow-[12px_12px_0px_rgba(0,0,0,0.3)]">
            <img
              src="https://shared.fastly.steamstatic.com/store_item_assets/steam/apps/973810/ss_e64307a5f6e890c2f82987a0f607d730623d5378.1920x1080.jpg?t=1706698642"
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

                  <div className="overflow-hidden border-4 border-white shadow-[20px_20px_0px_rgba(0,0,0,0.5)]">
                    <img
                      src={feature.img}
                      alt={feature.title}
                      className="w-full aspect-video object-cover transition-transform duration-700 group-hover:scale-110"
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
        <div className="absolute top-0 right-0 p-10 opacity-10">
          <ImageIcon size={200} className="text-[#a855f7]" />
        </div>

        <div className="max-w-7xl mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <h2 className="pixel-font text-3xl md:text-5xl text-[#c084fc] mb-6">SCREENSHOTS</h2>
            <div className="w-24 h-2 bg-[#a855f7] mx-auto shadow-[0_4px_0px_#6b21a8] mb-10"></div>

            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {['ALL', 'ENVIRONMENT', 'GAMEPLAY', 'DLC'].map((tab) => (
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

                  <div className="absolute inset-0 bg-gradient-to-t from-[#120a1f] via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                    <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                      <span className="inline-block px-2 py-1 bg-[#a855f7] text-[8px] pixel-font mb-2">{item.tag}</span>
                      <h3 className="pixel-font text-sm text-white">{item.title}</h3>
                    </div>
                    <div className="absolute top-4 right-4 bg-white/20 p-2 backdrop-blur-sm rounded-sm">
                      <ZoomIn size={16} className="text-white" />
                    </div>
                  </div>

                  <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-white/30"></div>
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-white/30"></div>
                </div>
              ))}
          </div>

          <div className="mt-16 text-center">
            <Button className="pixel-btn-white inline-flex items-center gap-3 rounded-none h-auto">
              VIEW ALL MEDIA <ChevronRight size={18} />
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 bg-[#0a0511] border-t-8 border-[#a855f7]/20 relative">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-12">
          <div className="text-center md:text-left">
            <img
              src="https://eastwardgame.com/wp-content/themes/eastward/assets/images/logo-eastward.png"
              className="h-10 opacity-40 mb-6 brightness-0 invert hue-rotate-[280deg] mx-auto md:mx-0"
              alt="Logo Gray"
            />
            <p className="pixel-font text-[10px] text-purple-100/30">
              © 2024 Pixpil. <br />All Pixel Rights Reserved.
            </p>
          </div>

          <div className="flex gap-4">
            <a href="#" className="w-12 h-12 flex items-center justify-center bg-white/5 border-2 border-white/10 hover:border-[#a855f7] hover:bg-[#a855f7] transition-all">
              <Twitter size={20} />
            </a>
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