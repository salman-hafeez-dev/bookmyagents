import NavMenu from "./Menu/NavMenu"
import { Link } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import Offcanvas from "./Menu/Offcanvas";
import Sidebar from "./Menu/Sidebar";
import HeaderSearch from "./Menu/HeaderSearch";
import UseSticky from "../../hooks/UseSticky";
import SearchIcon from "../../svg/SearchIcon";
import UserIcon from "../../svg/UserIcon";
import { useAuth } from "../../contexts/AuthContext";

const InnerHeader = () => {

   const { sticky } = UseSticky();
   const [offCanvas, setOffCanvas] = useState<boolean>(false);
   const [sidebar, setSidebar] = useState<boolean>(false);
   const [isSearch, setIsSearch] = useState<boolean>(false);
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
            <div className="tg-header__area">
               <div className={`tg-header-4-bootom tg-header-lg-space ${sticky ? "header-sticky" : ""}`} id="header-sticky">
                  <div className="container">
                     <div className="row align-items-center">
                        <div className="col-lg-8 col-5">
                           <div className="tgmenu__wrap d-flex align-items-center">
                              <div className="logo flex-auto">
                                 <Link to="/"><img src="/assets/img/logo/logo-green.png" alt="Logo" /></Link>
                              </div>
                              <nav className="tgmenu__nav  ml-90 d-none d-xl-block">
                                 <div className="tgmenu__navbar-wrap tgmenu__main-menu tgmenu__navbar-wrap-4 d-none d-xl-flex">
                                    <NavMenu />
                                 </div>
                              </nav>
                           </div>
                        </div>
                        <div className="col-lg-4 col-7">
                           <div className="tg-menu-right-action tg-menu-right-action-3 tg-menu-4-right-action d-flex align-items-center justify-content-end">
                              <button onClick={() => setIsSearch(true)} className="search-button search-open-btn">
                                 <SearchIcon />
                              </button>
                              {isAuthenticated ?
                                 <div className="tg-header-btn ml-10 d-none d-sm-block">
                                    <div className="tg-header-user-menu" ref={userMenuRef}>
                                       <button
                                          className="tg-header-user-button"
                                          onClick={() => setNavClick(!navClick)}
                                       >
                                          {/* <span className="tg-header-user-name">{user?.fullName || 'User'}</span> */}
                                          <span className="tg-header-user-icon">
                                             <UserIcon />
                                          </span>
                                       </button>
                                       {navClick && (
                                          <ul className="tg-header-user-dropdown">
                                             <li className="tg-header-user-profile">
                                                <div className="tg-header-user-avatar">
                                                   {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'U'}
                                                </div>
                                                <div className="tg-header-user-info">
                                                   <div className="tg-header-user-fullname">
                                                      {user?.fullName || 'User'}
                                                   </div>
                                                   <div className="tg-header-user-email">
                                                      {user?.email || 'user@example.com'}
                                                   </div>
                                                </div>
                                             </li>
                                             <li className="tg-header-user-dropdown-item">
                                                <Link
                                                   to="/"
                                                   onClick={() => setNavClick(false)}
                                                >
                                                   Home
                                                </Link>
                                             </li>
                                             {isAdmin && (
                                                <li className="tg-header-user-dropdown-item">
                                                   <Link
                                                      to="/dashboard"
                                                      onClick={() => setNavClick(false)}
                                                   >
                                                      Admin Dashboard
                                                   </Link>
                                                </li>
                                             )}
                                             {isAgent && (
                                                <li className="tg-header-user-dropdown-item">
                                                   <Link
                                                      to="/agent-dashboard"
                                                      onClick={() => setNavClick(false)}
                                                   >
                                                      Agent Dashboard
                                                   </Link>
                                                </li>
                                             )}
                                             <li className="tg-header-user-dropdown-item">
                                                <Link
                                                   to="/profile"
                                                   onClick={() => setNavClick(false)}
                                                >
                                                   Profile
                                                </Link>
                                             </li>
                                             <li className="tg-header-user-dropdown-item">
                                                <button onClick={handleLogout}>
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
                              <div className="tg-header-menu-bar lh-1 p-relative ml-10">
                                 <button onClick={() => setSidebar(true)} className="tgmenu-offcanvas-open-btn menu-tigger d-none d-xl-block">
                                    <span></span>
                                    <span></span>
                                    <span></span>
                                 </button>
                                 <button onClick={() => setOffCanvas(true)} className="tgmenu-offcanvas-open-btn mobile-nav-toggler d-block d-xl-none">
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
            </div>
         </header>
         <Offcanvas offCanvas={offCanvas} setOffCanvas={setOffCanvas} />
         <Sidebar sidebar={sidebar} setSidebar={setSidebar} />
         <HeaderSearch isSearch={isSearch} setIsSearch={setIsSearch} />
      </>
   )
}

export default InnerHeader
