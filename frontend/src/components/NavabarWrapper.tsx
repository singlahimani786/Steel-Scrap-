// components/NavbarWrapper.tsx
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import Navbar from "./navbar";

export default  function NavbarWrapper() {
  // const session = await getServerSession(authOptions);
  // if (!session) {
  //   redirect("/login");
  // }

  return <Navbar/>;
}