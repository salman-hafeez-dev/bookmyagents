import { useEffect, useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, EffectFade, Autoplay } from "swiper/modules";
import { Link } from "react-router-dom";
import Button from '../../common/Button';
import { useCurrency } from '../../../hooks/useCurrency';

// WebP, and roughly a third smaller than the JPEGs they replace. The .jpg
// originals are kept in the repo but nothing references them.
const banner_thumb: string[] = [
   "/assets/img/hero/hero-1.webp",
   "/assets/img/hero/hero-2.webp",
   "/assets/img/hero/hero-3.webp",
   "/assets/img/hero/hero-4.webp",
   "/assets/img/hero/hero-5.webp",
]

const setting = {
   slidesPerView: 1,
   loop: true,
   spaceBetween: 0,
   speed: 2000,
   effect: 'fade',
   navigation: {
      prevEl: '.tg-hero-prev',
      nextEl: '.tg-hero-next',
   },
   autoplay: {
      delay: 3500,
      disableOnInteraction: false
   },
};

const Banner = () => {
  const currency = useCurrency();
   // Only the first slide is visible on load; the other four used to download
   // immediately anyway, costing well over a megabyte before anyone saw
   // anything. They are fetched once the page is idle instead — the carousel
   // does not advance for 3.5s, so they are always in place in time.
   const [loadRemainingSlides, setLoadRemainingSlides] = useState(false);

   useEffect(() => {
      const start = () => setLoadRemainingSlides(true);

      if (typeof window.requestIdleCallback === 'function') {
         const handle = window.requestIdleCallback(start, { timeout: 2000 });
         return () => window.cancelIdleCallback?.(handle);
      }

      // Safari has no requestIdleCallback — a timer is close enough here.
      const timer = setTimeout(start, 1200);
      return () => clearTimeout(timer);
   }, []);

   return (
      <div className="tg-hero-area fix p-relative">
         <div className="tg-hero-top-shadow"></div>
         <div className="shop-slider-wrapper">
            <Swiper {...setting} modules={[Navigation, EffectFade, Autoplay]} className="swiper-container tg-hero-slider-active">
               {banner_thumb.map((thumb, i) => (
                  <SwiperSlide key={i} className="swiper-slide">
                     <div className="tg-hero-bg">
                        <div
                           className="tg-hero-thumb"
                           style={{
                              backgroundImage: i === 0 || loadRemainingSlides ? `url(${thumb})` : undefined,
                           }}
                        ></div>
                     </div>
                  </SwiperSlide>
               ))}
            </Swiper>
         </div>

         <div className="tg-hero-content-area">
            <div className="container">
               <div className="p-relative">
                  <div className="row justify-content-center">
                     <div className="col-xl-10">
                        <div className="tg-hero-content text-center">
                           <div className="tg-hero-title-box mb-10">
                              {/* <h5 className="tg-hero-subtitle mb-5 wow fadeInUp" data-wow-delay=".3s" data-wow-duration=".7s">* This offer valid till 22 August</h5> */}
                              <h2 className="tg-hero-title wow fadeInUp" data-wow-delay=".4s" data-wow-duration=".9s">Welcome to BookMyTravelAgents
                              </h2>
                              <p className="tg-hero-para mb-0  wow fadeInUp" data-wow-delay=".6s" data-wow-duration="1.1s">A smarter way to book — compare travel agents, explore destinations, and travel confidently.</p>
                           </div>
                           <div className="tg-hero-price-wrap mb-35 d-flex align-items-center justify-content-center  wow fadeInUp" data-wow-delay=".7s" data-wow-duration="1.3s">
                              <p className="mr-15">Booking Start From</p>
                              <div className="tg-hero-price d-flex">
                                 <span className="hero-dolar">{currency.code}</span>
                                 <span className="hero-price">5000</span>
                                 {/* <span className="night">/night</span> */}
                              </div>
                           </div>
                           <div className="tg-hero-btn-box  wow fadeInUp" data-wow-delay=".8s" data-wow-duration="1.5s">
                              <Link to="/contact" className="tg-btn tg-btn-switch-animation">
                                 <Button text="Take a Tour" />
                              </Link>
                           </div>
                        </div>
                     </div>
                  </div>
                  <div className="tg-hero-arrow-box d-none d-sm-block">
                     <button className="tg-hero-next">
                        <svg width="19" height="15" viewBox="0 0 19 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                           <path d="M18.0274 7.5H0.972625M0.972625 7.5L7.25 1.22263M0.972625 7.5L7.25 13.7774" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                     </button>
                     <button className="tg-hero-prev">
                        <svg width="20" height="15" viewBox="0 0 20 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                           <path d="M1.47263 7.5H18.5274M18.5274 7.5L12.25 1.22263M18.5274 7.5L12.25 13.7774" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                     </button>
                  </div>
               </div>
            </div>
         </div>
         <div className="tg-hero-bottom-shape d-none d-md-block">
            <span>
               <svg width="432" height="298" viewBox="0 0 432 298" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path className="line-1" opacity="0.4" d="M39.6062 428.345C4.4143 355.065 -24.2999 203.867 142.379 185.309C350.726 162.111 488.895 393.541 289.171 313.515C129.391 249.494 458.204 85.4772 642.582 11.4713" stroke="white" strokeWidth="24" />
               </svg>
            </span>
         </div>
         <div className="tg-hero-bottom-shape-2 d-none d-md-block">
            <span>
               <svg width="154" height="321" viewBox="0 0 154 321" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path className="line-1" opacity="0.4" d="M144.616 328.905C116.117 300.508 62.5986 230.961 76.5162 179.949C93.9132 116.184 275.231 7.44493 -65.0181 12.8762" stroke="white" strokeWidth="24" />
               </svg>
            </span>
         </div>
      </div>
   )
}

export default Banner
