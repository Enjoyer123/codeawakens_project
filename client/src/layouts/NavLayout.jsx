import { Outlet, useLocation } from "react-router-dom";
import NavbarWrapper from "./NavbarWrapper";
import AdminSidebar from "../components/admin/sidebar/AdminSidebar";
import useUserStore from "../store/useUserStore";

const NavLayout = () => {
  const { role } = useUserStore();
  const isAdmin = role === 'admin';
  const location = useLocation();
  // Hide navbar on game page (starts with /user/mapselection/)
  const isGamePage = location.pathname.startsWith('/user/mapselection/');

  return (
    <div className={isGamePage ? "h-screen flex flex-col overflow-hidden" : "min-h-screen flex flex-col"}>
      {!isGamePage && <NavbarWrapper />}
      <div className={isGamePage ? "flex flex-1 overflow-hidden relative" : "flex flex-1 relative"}>
        {isAdmin && <AdminSidebar />}
        <div className={isAdmin ? (isGamePage ? "flex-1 h-full overflow-hidden relative" : "flex-1 overflow-auto relative") : (isGamePage ? "w-full h-full overflow-hidden relative" : "w-full overflow-auto relative")}>
          <Outlet key={location.pathname} />
        </div>
      </div>
    </div>
  );
};

export default NavLayout;
