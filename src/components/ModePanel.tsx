import { useEffect, useState } from "react";

import CancelBtn from "./CancelBtn";

interface Props {
  isModePanelOpen: boolean;
  setisModePanelOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsDefaultMode: React.Dispatch<React.SetStateAction<boolean>>;
  setIsCircularMode: React.Dispatch<React.SetStateAction<boolean>>;
  setIsClipMode: React.Dispatch<React.SetStateAction<boolean>>;
}

const ModePanel: React.FC<Props> = ({
  isModePanelOpen,
  setisModePanelOpen,
  setIsDefaultMode,
  setIsCircularMode,
  setIsClipMode,
}) => {
  const [visible, setVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isModePanelOpen) {
      setVisible(true);
      const raf1 = requestAnimationFrame(() => {
        const raf2 = requestAnimationFrame(() => setMounted(true));
        return () => cancelAnimationFrame(raf2);
      });
      return () => cancelAnimationFrame(raf1);
    } else {
      setMounted(false);
      const timer = setTimeout(() => setVisible(false), 600);
      return () => clearTimeout(timer);
    }
  }, [isModePanelOpen]);

  if (!visible) return null;

  return (
    <div
      className={`
        z-50 fixed top-0 left-0 flex justify-center items-center w-screen h-screen
        bg-white/50 transition-opacity duration-600
        ${mounted ? "opacity-100" : "opacity-0"}
      `}
    >
      <div
        className={`
          h-2/3 max-h-200 w-full max-w-320 max-lg:px-6 flex justify-center items-center
          transition-all duration-600 ease-in-out
          ${mounted ? "opacity-100 scale-100 translate-y-0" : "opacity-0 scale-95 translate-y-3"}
        `}
      >
        <div className="relative h-full w-full pt-30 px-8 bg-white/70 shadow-mode-panel rounded-mode-panel font-prosto-one">
          <CancelBtn
            cancelAction={() => setisModePanelOpen(false)}
            customClasses="absolute top-8 right-8"
          />

          <div className="h-9/10 mb-10 space-y-6 overflow-y-auto">
            <div
              className="mode-panel-btn"
              onClick={() => {
                setIsDefaultMode(true);
                setIsCircularMode(false);
                setIsClipMode(false);

                setisModePanelOpen(false)
              }}
            >
              Lyra Default Mode <br className="md:hidden" />( OKLAB )
            </div>

            <div
              className="mode-panel-btn"
              onClick={() => {
                setIsDefaultMode(false);
                setIsCircularMode(true);
                setIsClipMode(false);
                
                setisModePanelOpen(false)
              }}
            >
              Circular Mode <br className="md:hidden" />( OKLAB )
            </div>

            <div
              className="mode-panel-btn"
              onClick={() => {
                setIsDefaultMode(false);
                setIsCircularMode(false);
                setIsClipMode(true);
                
                setisModePanelOpen(false)
              }}
            >
              Icon Clip Mode <br className="md:hidden" />( sRGB )
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ModePanel;
