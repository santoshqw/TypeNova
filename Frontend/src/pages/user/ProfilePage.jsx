import React from "react";
import Layout from "../../components/Layout";
import { User } from "lucide-react";

const ProfilePage = () => {
  return (
    <Layout>
      <div className="flex flex-1 flex-col items-center justify-center">
        <div className="card w-full max-w-md p-8 text-center">
          {/* Avatar placeholder */}
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-sub-alt">
            <User className="h-10 w-10 text-sub" />
          </div>

          <h2 className="mb-1 text-xl font-bold text-text">Guest User</h2>
          <p className="mb-6 text-sm text-sub">No account connected</p>

          <div className="mb-6 flex justify-center gap-8">
            <div>
              <p className="text-2xl font-bold tabular-nums text-main">–</p>
              <p className="text-[11px] uppercase tracking-widest text-sub">
                tests
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-main">–</p>
              <p className="text-[11px] uppercase tracking-widest text-sub">
                avg wpm
              </p>
            </div>
            <div>
              <p className="text-2xl font-bold tabular-nums text-main">–</p>
              <p className="text-[11px] uppercase tracking-widest text-sub">
                best wpm
              </p>
            </div>
          </div>

          <p className="text-xs text-sub">
            Sign in to save your stats and track your progress.
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;