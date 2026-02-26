import React from "react";
import Navbar from "./Navbar";

const Layout = ({ children, rightContent, onLogoClick }) => {
  return (
    <main className="flex min-h-screen flex-col bg-bg">
      <Navbar rightContent={rightContent} onLogoClick={onLogoClick} />

      <div className="mx-auto flex w-full flex-1 flex-col justify-center px-8 sm:px-16 lg:px-24 xl:px-32">
        {children}
      </div>

      <footer className="mx-auto w-full px-8 py-4 sm:px-16 lg:px-24 xl:px-32">
        <div className="flex items-center justify-between text-xs text-sub">
          <span>
            <kbd className="rounded bg-sub-alt px-1.5 py-0.5 text-[10px] text-sub">
              tab
            </kbd>
            {" + "}
            <kbd className="rounded bg-sub-alt px-1.5 py-0.5 text-[10px] text-sub">
              enter
            </kbd>
            {" — restart test"}
          </span>
        </div>
      </footer>
    </main>
  );
};

export default Layout;
