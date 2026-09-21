import NavMenu from "./Menu/NavMenu"
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import Offcanvas from "./Menu/Offcanvas";
import Sidebar from "./Menu/Sidebar";
import UseSticky from "../../hooks/UseSticky";
import PhoneIcon from "../../svg/PhoneIcon";
import UserIcon from "../../svg/UserIcon";
import { useGetSiteSettingsQuery } from "../../redux/api/siteApi";
import { telLink } from "../../utils/contact";
import { useAuth } from "../../contexts/AuthContext";

const HeaderThree = () => {
   const { data: siteSettings } = useGetSiteSettingsQuery();
   const headerPhone = siteSettings?.data?.phones?.[0];

   const { sticky } = UseSticky();
   const [offCanvas, setOffCanvas] = useState<boolean>(false);
   const [sidebar, setSidebar] = useState<boolean>(false);
   const { isAuthenticated, isAdmin, isAgent, user, logout } = useAuth();
   const [navClick, setNavClick] = useState<boolean>(false);
   const userMenuRef = useRef<HTMLDivElement>(null);

   const handleLogout = async () => {
      try {
         await logout();
         setNavClick(false);
      } catch (error) {
         console.error('Logout error:', error);
      }
   };

   // Close dropdown when clicking outside
   useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
         if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
            setNavClick(false);
         }
      };

      if (navClick) {
         document.addEventListener('mousedown', handleClickOutside);
      }

      return () => {
         document.removeEventListener('mousedown', handleClickOutside);
      };
   }, [navClick]);

   return (
      <>
         <header className="tg-header-height">
            <div className={`tg-header__area tg-header-lg-space z-index-999 tg-transparent ${sticky ? "header-sticky" : ""}`} id="header-sticky">
               <div className="container-fluid container-1860">
                  <div className="row align-items-center">
                     <div className="col-lg-7 col-5">
                        <div className="tgmenu__wrap d-flex align-items-center justify-space-between" style={{ justifyContent: "space-between" }}>
                           <div className="logo">
                              <Link className="logo-1" to="/"><img style={{ height: "80px" }} src="/assets/img/logo/logo-white1.png" alt="Logo" /></Link>
                              <Link className="logo-2 d-none" to="/"><img style={{ height: "70px" }} src="/assets/img/logo/logo-white1.png" alt="Logo" /></Link>
                           </div>
                           <nav className="tgmenu__nav tgmenu-1-space ml-180">
                              <div className="tgmenu__navbar-wrap tgmenu__main-menu d-none d-xl-flex">
                                 <NavMenu />
                              </div>
                           </nav>
                        </div>
                     </div>
                     <div className="col-lg-5 col-7">
                        <div className="tg-menu-right-action d-flex align-items-center justify-content-end">
                           {/* The number comes from the admin-controlled site
                               settings, on the same cached query the footer and
                               contact page use. Hidden entirely when no phone
                               is configured, rather than showing "Call Us:"
                               with nothing after it. */}
                           {headerPhone && (
                              <div className="tg-header-contact-info d-flex align-items-center">
                                 <span className="tg-header-contact-icon mr-5 d-none d-xl-block">
                                    <PhoneIcon />
                                 </span>
                                 <div className="tg-header-contact-number d-none d-xl-block">
                                    <span>Call Us:</span>
                                    <a href={telLink(headerPhone) || undefined}>{headerPhone}</a>
                                 </div>
                              </div>
                           )}
                           {isAuthenticated ?
                              <div className="tg-header-btn ml-20 d-none d-sm-block">
                                 <div className="tg-user-menu" ref={userMenuRef} style={{ position: 'relative' }}>
                                    <button
                                       className="tg-btn-header user-menu-trigger"
                                       onClick={() => setNavClick(!navClick)}
                                       style={{
                                          background: 'none',
                                          border: 'none',
                                          cursor: 'pointer',
                                          display: 'flex',
                                          alignItems: 'center',
                                          gap: '8px',
                                          color: 'inherit',
                                          fontSize: 'inherit'
                                       }}
                                    >
                                       <span className="text-white">
                                          <UserIcon />
                                       </span>
                                       <span className="text-white">{user?.fullName || 'User'}</span>
                                    </button>
                                    {navClick && (
                                       <ul className="user-dropdown-menu" style={{
                                          position: 'absolute',
                                          top: '100%',
                                          right: '0',
                                          background: '#fff',
                                          border: '1px solid #ddd',
                                          borderRadius: '4px',
                                          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
                                          minWidth: '150px',
                                          zIndex: 1000,
                                          marginTop: '5px',
                                          listStyle: 'none',
                                          padding: '0',
                                          margin: '5px 0 0 0'
                                       }}>
                                          {isAdmin && (
                                             <li>
                                                <Link
                                                   to="/dashboard"
                                                   onClick={() => setNavClick(false)}
                                                   style={{
                                                      display: 'block',
                                                      padding: '10px 15px',
                                                      color: '#333',
                                                      textDecoration: 'none',
                                                      borderBottom: '1px solid #eee',
                                                      transition: 'background-color 0.2s'
                                                   }}
                                                   onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                                   onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                   Dashboard
                                                </Link>
                                             </li>
                                          )}
                                          {isAgent && (
                                             <li>
                                                <Link
                                                   to="/agent-dashboard"
                                                   onClick={() => setNavClick(false)}
                                                   style={{
                                                      display: 'block',
                                                      padding: '10px 15px',
                                                      color: '#333',
                                                      textDecoration: 'none',
                                                      borderBottom: '1px solid #eee',
                                                      transition: 'background-color 0.2s'
                                                   }}
                                                   onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                                   onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                   Dashboard
                                                </Link>
                                             </li>
                                          )}
                                          <li>
                                             <button
                                                onClick={handleLogout}
                                                style={{
                                                   background: 'none',
                                                   border: 'none',
                                                   color: '#333',
                                                   cursor: 'pointer',
                                                   width: '100%',
                                                   textAlign: 'left',
                                                   padding: '10px 15px',
                                                   fontSize: '14px',
                                                   transition: 'background-color 0.2s'
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f5f5f5'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                             >
                                                Logout
                                             </button>
                                          </li>
                                       </ul>
                                    )}
                                 </div>
                              </div>
                              : <div className="tg-header-btn ml-20 d-none d-sm-block">
                                 <Link className="tg-btn-header" to="/login">
                                    <span>
                                       <UserIcon />
                                    </span>
                                    Login
                                 </Link>
                              </div>}
                           <div className="tg-header-menu-bar lh-1 p-relative ml-20 pl-20">
                              <span className="tg-header-border d-none d-xl-block"></span>
                              <button onClick={() => setSidebar(true)} style={{ cursor: "pointer" }} className="tgmenu-offcanvas-open-btn menu-tigger d-none d-xl-block">
                                 <span></span>
                                 <span></span>
                                 <span></span>
                              </button>
                              <button onClick={() => setOffCanvas(true)} style={{ cursor: "pointer" }} className="tgmenu-offcanvas-open-btn mobile-nav-toggler d-block d-xl-none">
                                 <span></span>
                                 <span></span>
                                 <span></span>
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>
               </div>
            </div>
         </header>
         <Offcanvas offCanvas={offCanvas} setOffCanvas={setOffCanvas} />
         <Sidebar sidebar={sidebar} setSidebar={setSidebar} />
      </>
   )
}

export default HeaderThree
