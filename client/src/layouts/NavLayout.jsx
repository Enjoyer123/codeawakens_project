import { Outlet } from "react-router";
import NavbarWrapper from "./NavbarWrapper";
import AdminSidebar from "../components/admin/AdminSidebar";
import useUserStore from "../store/useUserStore";

const NavLayout = () => {
  const { role } = useUserStore();
  const isAdmin = role === 'admin';

  return (
    <div>
      <NavbarWrapper />
      <div className="flex">
        {isAdmin && <AdminSidebar />}
        <div className={isAdmin ? "flex-1" : "w-full"}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default NavLayout;
