import { Link } from "react-router-dom";

import LyraAssistantIcon from "@/components/LyraAssistantIcon";

const ChatHeaderContent: React.FC = () => {
  return (
    <>
      <div className="flex items-center gap-3">
        <div className="hidden sm:block w-10 h-10">
          <LyraAssistantIcon className="w-full h-full" />
        </div>
        <span className="font-semibold text-sm sm:text-lg text-slate-700">Lyra 2 + Gemma 3</span>
      </div>
      <Link 
        to="/"
        className="flex font-semibold text-lg text-slate-700 hover:text-slate-500 duration-400 cursor-pointer"
      >
        <span className="hidden sm:block">Home &nbsp;</span>
        <svg fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="size-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="m15 15 6-6m0 0-6-6m6 6H9a6 6 0 0 0 0 12h3" />
        </svg>
      </Link>
    </>
  );
};

export default ChatHeaderContent;